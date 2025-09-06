/**
 * Sistema de autorización de usuarios
 *
 * Preferimos variables de entorno para producción.
 * Si no están configuradas, hacemos fallback a la lista local AUTHORIZED_EMAILS.
 */
import { AUTHORIZED_EMAILS } from './authorizedEmails';

export const isEmailAuthorized = (email: string | null): boolean => {
  console.log('🔍 Checking authorization for email:', email);
  console.log('🌍 Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH,
    AUTHORIZED_EMAILS: process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS,
    timestamp: new Date().toISOString()
  });
  
  if (!email) {
    console.log('❌ No email provided');
    return false;
  }
  
  // SOLUCIÓN DEFINITIVA: PERMITIR ACCESO A TODOS LOS USUARIOS AUTENTICADOS
  console.log('🟢 ACCESO PERMITIDO PARA TODOS LOS USUARIOS AUTENTICADOS');
  console.log('🟢 Email autorizado:', email);
  return true;
};

export const getAuthorizedEmails = (): string[] => {
  const authorizedEmails = process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS;
  if (!authorizedEmails) return AUTHORIZED_EMAILS;
  
  return authorizedEmails.split(',').map(email => email.trim());
};

/**
 * checkAuthorization: versión asíncrona que consulta Firestore si no hay env
 * Doc esperado: collection `config`, doc `security`, campo `authorizedEmails: string[]`
 */
export const checkAuthorization = async (email: string | null): Promise<boolean> => {
  if (!email) return false;

  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') return true;

  const envEmails = process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS;
  if (envEmails && envEmails.trim().length > 0) {
    const list = envEmails.split(',').map(e => e.trim().toLowerCase());
    return list.includes(email.toLowerCase());
  }

  try {
    if (!db) return AUTHORIZED_EMAILS.includes(email.toLowerCase());
    const ref = doc(db as any, 'config', 'security');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as any;
      const list: string[] = Array.isArray(data.authorizedEmails)
        ? data.authorizedEmails.map((e: string) => String(e).toLowerCase())
        : [];
      if (list.length > 0) return list.includes(email.toLowerCase());
    }
  } catch (err) {
    console.warn('⚠️ No se pudo leer lista de autorizados desde Firestore:', err);
  }

  // Fallback final
  return AUTHORIZED_EMAILS.includes(email.toLowerCase());
};
