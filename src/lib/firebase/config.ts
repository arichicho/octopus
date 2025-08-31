// Firebase imports
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Configuración de Firebase para producción
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyButtaDMIheklUExNySlL9HCNaVUW-8UFY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "iamtheoceo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "iamtheoceo",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "iamtheoceo.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "511546212594",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:511546212594:web:08397e8ff7f942a34a906b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-KEKWYZY33Y"
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
};

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

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

// Inicializar Analytics (solo en producción y en el navegador)
let analytics = null;
if (typeof window !== 'undefined' && appConfig.nodeEnv === 'production') {
  try {
    analytics = getAnalytics(app);
    console.log('📊 Analytics inicializado para producción');
  } catch (error) {
    console.warn('Analytics no pudo ser inicializado:', error);
  }
}

const functions = {}; // Se puede agregar getFunctions(app) si se necesita

// Log de configuración
if (typeof window !== 'undefined') {
  console.log('🌍 Environment:', {
    nodeEnv: appConfig.nodeEnv,
    useEmulator: appConfig.useEmulator,
    domain: window.location.hostname,
    url: window.location.href
  });
  
  if (appConfig.useEmulator && appConfig.nodeEnv === 'development') {
    console.log('🔧 Firebase configurado con emuladores para desarrollo');
  } else {
    console.log('🔥 Firebase configurado para producción');
    console.log('🔑 Firebase config:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    });
  }
}

export { auth, db, functions, analytics, appConfig };
export default app;
