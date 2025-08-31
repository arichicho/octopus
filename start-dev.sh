#!/bin/bash

echo "🚀 Iniciando Octopus en modo desarrollo..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

# Verificar si Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI no está instalado. Instalando..."
    npm install -g firebase-tools
fi

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Verificar si existe el archivo .env
if [ ! -f ".env.local" ]; then
    echo "⚠️  Archivo .env.local no encontrado. Copiando desde .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "✅ Archivo .env.local creado. Por favor configura las variables de entorno."
    else
        echo "❌ Archivo .env.example no encontrado."
        exit 1
    fi
fi

echo "🔥 Iniciando emuladores de Firebase..."
# Iniciar emuladores en segundo plano
firebase emulators:start --only auth,firestore,storage --import=./firebase-data --export-on-exit=./firebase-data &
FIREBASE_PID=$!

# Esperar un momento para que los emuladores se inicien
echo "⏳ Esperando que los emuladores se inicien..."
sleep 5

echo "🌐 Iniciando servidor de desarrollo de Next.js..."
# Iniciar Next.js en modo desarrollo
npm run dev &
NEXT_PID=$!

echo "✅ Octopus iniciado correctamente!"
echo ""
echo "📱 Aplicación: http://localhost:3000"
echo "🔥 Emuladores Firebase: http://localhost:4000"
echo "📊 Firestore UI: http://localhost:4000/firestore"
echo "🔐 Auth UI: http://localhost:4000/auth"
echo ""
echo "💡 Para detener los servidores, presiona Ctrl+C"

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $FIREBASE_PID 2>/dev/null
    kill $NEXT_PID 2>/dev/null
    echo "✅ Servidores detenidos."
    exit 0
}

# Capturar señal de interrupción
trap cleanup SIGINT SIGTERM

# Mantener el script ejecutándose
wait
