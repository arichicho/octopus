import { getFirestore } from '@/lib/server/firebaseAdmin';
import { decrypt, encrypt } from '@/lib/server/crypto';
import { getGoogleConfig } from '@/lib/config/integrations';

type GType = 'gmail' | 'calendar' | 'drive';

interface TokenDoc {
  id: string;
  userId: string;
  type: GType;
  status: 'connected' | 'disconnected' | 'error';
  accessToken?: string; // encrypted
  refreshToken?: string; // encrypted
  expiresAt?: FirebaseFirestore.Timestamp | Date | null;
  updatedAt?: FirebaseFirestore.Timestamp | Date;
  createdAt?: FirebaseFirestore.Timestamp | Date;
}

function asDate(input: any): Date | null {
  if (!input) return null;
  if (typeof (input as any).toDate === 'function') return (input as any).toDate();
  try {
    return new Date(input);
  } catch {
    return null;
  }
}

export async function getValidAccessToken(userId: string, type: GType): Promise<string | null> {
  const db = getFirestore();
  if (!db) return null;
  const id = `${userId}_${type}`;
  const snap = await db.collection('integrations_google_tokens').doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as TokenDoc;
  if (!data || data.status !== 'connected') return null;
  const access = data.accessToken ? decrypt(data.accessToken) : '';
  const refresh = data.refreshToken ? decrypt(data.refreshToken) : '';
  const expiresAt = asDate(data.expiresAt);

  // If no expiry or still valid for > 2 minutes, return it
  const now = Date.now();
  const marginMs = 2 * 60 * 1000;
  if (access && expiresAt && expiresAt.getTime() - now > marginMs) {
    return access;
  }

  // Try to refresh
  if (!refresh) return access || null;
  const cfg = getGoogleConfig();
  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: refresh,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!res.ok) {
    // Keep old token if exists
    return access || null;
  }
  const json = await res.json();
  const newAccess = json.access_token as string;
  const expiresIn = json.expires_in as number | undefined;
  const newExpires = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
  await db.collection('integrations_google_tokens').doc(id).set(
    {
      accessToken: newAccess ? encrypt(newAccess) : undefined,
      expiresAt: newExpires || null,
      updatedAt: new Date(),
    },
    { merge: true }
  );
  return newAccess || null;
}

export async function fetchGoogle<T>(userId: string, type: GType, url: string, init?: RequestInit): Promise<T | null> {
  const token = await getValidAccessToken(userId, type);
  if (!token) return null;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

