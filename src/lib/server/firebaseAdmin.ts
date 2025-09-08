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

    let projectId = process.env.FIREBASE_PROJECT_ID || undefined;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');
    // Derive projectId from client email if not present or conflicting
    const derivedFromEmail = (() => {
      if (!clientEmail) return undefined;
      const m = clientEmail.match(/@([^.]+)\.iam\.gserviceaccount\.com$/);
      return m ? m[1] : undefined;
    })();
    if (clientEmail && derivedFromEmail && projectId && projectId !== derivedFromEmail) {
      console.warn(
        `FIREBASE_PROJECT_ID (${projectId}) differs from client email project (${derivedFromEmail}); using derived value.`
      );
      projectId = derivedFromEmail;
    }
    if (!projectId && derivedFromEmail) projectId = derivedFromEmail;

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

function ensureEmulatorEnv() {
  const inDev = process.env.NODE_ENV !== 'production';
  const useEmu = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true';

  if (inDev && useEmu) {
    // Bridge client env to server env for Admin SDK
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST =
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
    }
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      // Admin SDK expects host:port
      const host = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080';
      process.env.FIRESTORE_EMULATOR_HOST = host;
    }
  }
}

export function getAdminApp(): admin.app.App | null {
  if (app) return app;
  try {
    ensureEmulatorEnv();

    const sa = getServiceAccountFromEnv();

    // Build init options.
    const options: admin.AppOptions = {} as any;
    if (sa) {
      options.credential = admin.credential.cert(sa);
      if (!options.projectId) {
        options.projectId = sa.projectId;
      }
    } else {
      // Allow initialization without explicit credentials (ADC or emulator)
      const pid =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (pid) (options as any).projectId = pid;
    }

    app = admin.initializeApp(options);
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
