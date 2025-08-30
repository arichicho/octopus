#!/bin/bash

echo "🚀 Iniciando emuladores de Firebase..."

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

echo "✅ Iniciando emuladores..."
echo "📊 UI del emulador: http://localhost:4000"
echo "🔐 Auth emulator: localhost:9099"
echo "🗄️  Firestore emulator: localhost:8080"
echo "⚡ Functions emulator: localhost:5001"
echo ""
echo "Presiona Ctrl+C para detener los emuladores"
echo ""

# Iniciar emuladores
firebase emulators:start --only auth,firestore,functions
