import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY || '';
  if (!key) return null;
  // Accept base64 or hex or raw string (padded/truncated)
  try {
    if (/^[A-Fa-f0-9]{64}$/.test(key)) return Buffer.from(key, 'hex');
    const b = Buffer.from(key, 'base64');
    if (b.length === 32) return b;
  } catch {}
  const buf = Buffer.alloc(32);
  Buffer.from(key).copy(buf);
  return buf;
}

export function encrypt(plain: string): string {
  const key = getKey();
  if (!key) throw new Error('ENCRYPTION_KEY not configured');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(token: string): string {
  const key = getKey();
  if (!key) throw new Error('ENCRYPTION_KEY not configured');
  const data = Buffer.from(token, 'base64');
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const enc = data.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

