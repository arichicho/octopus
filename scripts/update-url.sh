#!/bin/bash

# Script para actualizar la URL de Vercel en Firebase Hosting automáticamente

echo "🚀 Desplegando a Vercel..."
VERCEL_URL=$(vercel --prod --json | jq -r '.url')

if [ "$VERCEL_URL" = "null" ] || [ -z "$VERCEL_URL" ]; then
    echo "❌ Error: No se pudo obtener la URL de Vercel"
    exit 1
fi

echo "✅ URL de Vercel obtenida: $VERCEL_URL"

# Actualizar firebase.json
echo "📝 Actualizando firebase.json..."
sed -i.bak "s|https://octopus-[a-zA-Z0-9-]*\.vercel\.app|$VERCEL_URL|g" firebase.json

# Actualizar public/index.html
echo "📝 Actualizando public/index.html..."
sed -i.bak "s|https://octopus-[a-zA-Z0-9-]*\.vercel\.app|$VERCEL_URL|g" public/index.html

# Desplegar Firebase Hosting
echo "🔥 Desplegando Firebase Hosting..."
firebase deploy --only hosting

echo "✅ ¡Actualización completa!"
echo "🌐 URL estable: https://iamtheoceo.web.app"
echo "🔗 URL de Vercel: $VERCEL_URL"
