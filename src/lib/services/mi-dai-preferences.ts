import { auth } from '@/lib/firebase/config';
import type { MiDAIPreferences } from '@/types/midai';

async function authHeader() {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class MiDAIPreferencesService {
  static async get(): Promise<MiDAIPreferences> {
    const res = await fetch('/api/mi-dai/preferences', { headers: await authHeader() });
    if (!res.ok) throw new Error('No se pudieron cargar preferencias');
    return res.json();
  }
  static async save(updates: Partial<MiDAIPreferences>): Promise<MiDAIPreferences> {
    const res = await fetch('/api/mi-dai/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('No se pudieron guardar preferencias');
    return res.json();
  }
  static async sendFeedback(payload: {
    itemType: 'task' | 'email' | 'doc';
    action: 'up' | 'down' | 'pin' | 'unpin';
    meetingId?: string;
    item?: Record<string, any>;
  }): Promise<{ ok: boolean }> {
    const res = await fetch('/api/mi-dai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('No se pudo enviar feedback');
    return res.json();
  }
}
