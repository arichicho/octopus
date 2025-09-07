import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) return null;
  // Allow hex or utf-8; normalize to 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(key)) return Buffer.from(key, 'hex');
  const buf = Buffer.from(key, 'utf8');
  if (buf.length === 32) return buf;
  // Derive a 32-byte key from provided string
  return crypto.createHash('sha256').update(buf).digest();
}

export function encrypt(plain: string): string {
  const key = getKey();
  if (!key) return plain; // fallback to plaintext if not configured
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(payload: string): string {
  const key = getKey();
  if (!key) return payload; // if not configured, treat as plaintext
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

