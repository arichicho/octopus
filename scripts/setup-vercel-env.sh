#!/bin/bash

# Script para configurar variables de entorno en Vercel
# IMPORTANTE: Este script NO debe contener secretos hardcodeados
# Los secretos deben obtenerse de variables de entorno o archivos seguros

echo "🚀 Configurando variables de entorno en Vercel..."
echo "⚠️  Asegúrate de tener las variables de entorno configuradas localmente"
echo ""

# Verificar que las variables estén definidas
if [ -z "$FIREBASE_API_KEY" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Error: Las variables de entorno no están definidas"
    echo "Por favor, configura las variables antes de ejecutar este script"
    echo ""
    echo "Ejemplo:"
    echo "  export FIREBASE_API_KEY='tu_api_key'"
    echo "  export GOOGLE_CLIENT_SECRET='tu_client_secret'"
    echo "  # ... más variables"
    echo "  ./scripts/setup-vercel-env.sh"
    exit 1
fi

# Firebase Cliente Web
echo "📱 Configurando Firebase Cliente Web..."
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production <<< "$FIREBASE_API_KEY"
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production <<< "$FIREBASE_AUTH_DOMAIN"
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production <<< "$FIREBASE_PROJECT_ID"
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production <<< "$FIREBASE_STORAGE_BUCKET"
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production <<< "$FIREBASE_MESSAGING_SENDER_ID"
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production <<< "$FIREBASE_APP_ID"

# Firebase Admin
echo "🔐 Configurando Firebase Admin..."
vercel env add FIREBASE_PROJECT_ID production <<< "$FIREBASE_PROJECT_ID"
vercel env add FIREBASE_CLIENT_EMAIL production <<< "$FIREBASE_CLIENT_EMAIL"
vercel env add FIREBASE_PRIVATE_KEY production <<< "$FIREBASE_PRIVATE_KEY"

# Google OAuth
echo "🔑 Configurando Google OAuth..."
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production <<< "$GOOGLE_CLIENT_ID"
vercel env add GOOGLE_CLIENT_SECRET production <<< "$GOOGLE_CLIENT_SECRET"

# App Configuration
echo "⚙️ Configurando App..."
vercel env add NEXT_PUBLIC_APP_URL production <<< "${NEXT_PUBLIC_APP_URL:-https://octopus-theceo.vercel.app}"
vercel env add NODE_ENV production <<< "production"
vercel env add ENCRYPTION_KEY production <<< "$ENCRYPTION_KEY"

echo "✅ Variables de entorno configuradas!"
echo "🔄 Redesplegando aplicación..."
vercel --prod

echo "🎉 ¡Despliegue completado!"
