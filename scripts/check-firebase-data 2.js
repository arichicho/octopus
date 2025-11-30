// Script para verificar datos en Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

async function checkFirebaseData() {
  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('🔍 Verificando datos en Firebase...');
    console.log('📧 Usuario:', 'ariel.chicho@daleplayrecords.com');
    
    // Verificar todas las empresas
    console.log('\n🏢 Verificando empresas...');
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    console.log(`📊 Total empresas en la base de datos: ${companiesSnapshot.size}`);
    
    companiesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.name} (ownerId: ${data.ownerId})`);
    });
    
    // Verificar empresas del usuario específico
    const userCompaniesQuery = query(
      collection(db, 'companies'),
      where('ownerId', '==', 'ariel.chicho@daleplayrecords.com')
    );
    const userCompaniesSnapshot = await getDocs(userCompaniesQuery);
    console.log(`📊 Empresas del usuario: ${userCompaniesSnapshot.size}`);
    
    // Verificar todas las tareas
    console.log('\n📋 Verificando tareas...');
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    console.log(`📊 Total tareas en la base de datos: ${tasksSnapshot.size}`);
    
    tasksSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.title} (createdBy: ${data.createdBy}, companyId: ${data.companyId})`);
    });
    
    // Verificar tareas del usuario específico
    const userTasksQuery = query(
      collection(db, 'tasks'),
      where('createdBy', '==', 'ariel.chicho@daleplayrecords.com')
    );
    const userTasksSnapshot = await getDocs(userTasksQuery);
    console.log(`📊 Tareas del usuario: ${userTasksSnapshot.size}`);
    
    // Verificar usuarios
    console.log('\n👤 Verificando usuarios...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 Total usuarios en la base de datos: ${usersSnapshot.size}`);
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.email} (displayName: ${data.displayName})`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
  }
}

checkFirebaseData();
