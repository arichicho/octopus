// Firebase imports
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
// Import de analytics removido en server; se cargará dinámicamente en navegador

// Extender Window interface para evitar errores de TypeScript
declare global {
  interface Window {
    firebaseInitialized?: boolean;
  }
}

// Configuración de Firebase (tomada exclusivamente de variables de entorno)
const firebaseConfig = {
  apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '').replace(/\n/g, '').trim(),
  authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '').replace(/\n/g, '').trim(),
  projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').replace(/\n/g, '').trim(),
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '').replace(/\n/g, '').trim(),
  messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '').replace(/\n/g, '').trim(),
  appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '').replace(/\n/g, '').trim(),
  measurementId: (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '').replace(/\n/g, '').trim()
};

// Configuración de la aplicación
const appConfig = {
  // Configuración de emuladores
  useEmulator: process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true',
  authEmulatorHost: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9098',
  firestoreEmulatorHost: process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8081',
  functionsEmulatorHost: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST || 'localhost:5001',
  
  // Configuración de la aplicación
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  debugMode: process.env.DEBUG_MODE === 'true',
  
  // Configuración de notificaciones
  notificationBriefingHour: parseInt(process.env.NOTIFICATION_BRIEFING_HOUR || '8'),
  notificationTimezone: process.env.NOTIFICATION_BRIEFING_TIMEZONE || 'America/Mexico_City',
  notificationPreMeetingMinutes: parseInt(process.env.NOTIFICATION_PRE_MEETING_MINUTES || '15'),
  notificationEmailEnabled: process.env.NOTIFICATION_EMAIL_ENABLED === 'true',
  notificationPushEnabled: process.env.NOTIFICATION_PUSH_ENABLED === 'true',
  
  // Configuración de API
  apiRateLimitRequests: parseInt(process.env.API_RATE_LIMIT_REQUESTS || '100'),
  apiRateLimitWindowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000'),
  apiKeySecret: process.env.API_KEY_SECRET || 'demo-api-key-secret',
  
  // Configuración de webhooks
  webhookSecret: process.env.WEBHOOK_SECRET || 'demo-webhook-secret',
  webhookTimeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000'),
  
  // Preferencias por defecto
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'America/Mexico_City',
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'es',
  defaultTheme: process.env.DEFAULT_THEME || 'light',
  // Analytics
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
};

// Inicializar Firebase - Solo una vez
let app: any;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Inicializar servicios de Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Configurar persistencia de autenticación (ya está habilitada por defecto en Firebase v9+)
if (typeof window !== 'undefined') {
  // Firebase v9+ mantiene la persistencia local por defecto
  console.log('🔐 Persistencia de autenticación configurada');
}

// Configurar emuladores SOLO para desarrollo
if (appConfig.useEmulator && typeof window !== 'undefined' && appConfig.nodeEnv === 'development') {
  try {
    connectAuthEmulator(auth, `http://${appConfig.authEmulatorHost}`, { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8081);
    console.log('🔧 Firebase emuladores conectados (DESARROLLO)');
  } catch (error) {
    console.log('⚠️  Error conectando emuladores (puede estar ya conectado)', error);
  }
}

// Inicializar Analytics (solo navegador, import dinámico)
let analytics = null as any;
if (typeof window !== 'undefined' && appConfig.nodeEnv === 'production') {
  const hasAppId = !!firebaseConfig.appId;
  const hasMeasurement = !!firebaseConfig.measurementId;
  if (appConfig.enableAnalytics === true && hasAppId && hasMeasurement) {
    import('firebase/analytics')
      .then(({ getAnalytics, isSupported }) =>
        isSupported().then((supported) => {
          if (!supported) return;
          try {
            analytics = getAnalytics(app);
            console.log('📊 Analytics inicializado para producción');
          } catch (error) {
            console.warn('Analytics no pudo ser inicializado:', error);
          }
        })
      )
      .catch(() => {
        console.log('📊 Analytics no soportado en este entorno');
      });
  } else {
    console.log(
      '📊 Analytics deshabilitado - enableAnalytics:',
      appConfig.enableAnalytics,
      'AppId:',
      !!firebaseConfig.appId,
      'MeasurementId:',
      !!firebaseConfig.measurementId
    );
  }
}

const functions = {}; // Se puede agregar getFunctions(app) si se necesita

// Log de configuración - Solo una vez
if (typeof window !== 'undefined' && !window.firebaseInitialized) {
  window.firebaseInitialized = true;
  
  // Verificar configuración de Firebase
  console.log('🔍 Firebase Config Check:', {
    apiKey: firebaseConfig.apiKey ? '✅' : '❌',
    authDomain: firebaseConfig.authDomain ? '✅' : '❌',
    projectId: firebaseConfig.projectId ? '✅' : '❌',
    storageBucket: firebaseConfig.storageBucket ? '✅' : '❌',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✅' : '❌',
    appId: firebaseConfig.appId ? '✅' : '❌',
    measurementId: firebaseConfig.measurementId ? '✅' : '❌'
  });
  
  if (appConfig.useEmulator && appConfig.nodeEnv === 'development') {
    console.log('🔧 Firebase configurado con emuladores para desarrollo');
  } else {
    console.log('🔥 Firebase configurado para producción');
  }
}

export { auth, db, functions, analytics, appConfig };
export default app;
