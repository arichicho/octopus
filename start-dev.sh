#!/bin/bash

echo "🚀 Iniciando entorno de desarrollo Octopus..."
echo ""

# Verificar si Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no está instalado. Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Verificar si el proyecto está inicializado
if [ ! -f "firebase.json" ]; then
    echo "❌ Firebase no está inicializado. Ejecuta: firebase init"
    exit 1
fi

echo "✅ Configuración verificada"
echo ""

# Función para limpiar al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo emuladores..."
    pkill -f "firebase emulators"
    echo "✅ Emuladores detenidos"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

echo "🔥 Iniciando emuladores de Firebase..."
echo "📊 UI del emulador: http://localhost:4000"
echo "🔐 Auth emulator: localhost:9099"
echo "🗄️  Firestore emulator: localhost:8080"
echo "⚡ Functions emulator: localhost:5001"
echo ""

# Iniciar emuladores en background
firebase emulators:start --only auth,firestore,functions &
EMULATOR_PID=$!

# Esperar a que los emuladores estén listos
echo "⏳ Esperando a que los emuladores estén listos..."
sleep 10

# Verificar que los emuladores estén ejecutándose
if ! lsof -i :9099 > /dev/null 2>&1; then
    echo "❌ Error: Los emuladores no se iniciaron correctamente"
    exit 1
fi

echo "✅ Emuladores iniciados correctamente"
echo ""

echo "🌐 Iniciando servidor de desarrollo..."
echo "📱 Aplicación: http://localhost:3001"
echo ""

# Iniciar servidor de desarrollo
npm run dev
