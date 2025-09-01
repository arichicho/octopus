import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

function getServiceAccountFromEnv(): admin.ServiceAccount | null {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      // private_key may contain escaped newlines
      if (json.private_key && typeof json.private_key === 'string') {
        json.private_key = json.private_key.replace(/\\n/g, '\n');
      }
      return json as admin.ServiceAccount;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');
    if (projectId && clientEmail && privateKey) {
      return {
        projectId,
        clientEmail,
        privateKey,
      } as admin.ServiceAccount;
    }
  } catch (e) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', e);
  }
  return null;
}

export function getAdminApp(): admin.app.App | null {
  if (app) return app;
  try {
    const sa = getServiceAccountFromEnv();
    if (!sa) return null;
    app = admin.initializeApp({
      credential: admin.credential.cert(sa),
    });
    return app;
  } catch (e) {
    console.error('Failed to initialize firebase-admin:', e);
    return null;
  }
}

export function getAuth() {
  const a = getAdminApp();
  if (!a) return null;
  return admin.auth();
}

export function getFirestore() {
  const a = getAdminApp();
  if (!a) return null;
  return admin.firestore();
}
