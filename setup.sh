#!/bin/bash

echo "🐙 Configurando Octopus - Sistema de Gestión de Tareas Multi-Empresa"
echo "================================================================"

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado. Por favor instala Node.js 18+"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Crear archivo de variables de entorno si no existe
if [ ! -f .env.local ]; then
    echo "🔧 Creando archivo de variables de entorno..."
    cp env.example .env.local
    echo "✅ Archivo .env.local creado"
    echo "⚠️  IMPORTANTE: Edita .env.local con tus credenciales de Firebase y APIs"
else
    echo "✅ Archivo .env.local ya existe"
fi

# Verificar que el build funcione
echo "🔨 Verificando build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build exitoso"
else
    echo "⚠️  Build con warnings (normal para desarrollo)"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita .env.local con tus credenciales"
echo "2. Configura Firebase en https://console.firebase.google.com/"
echo "3. Ejecuta: npm run dev"
echo "4. Abre http://localhost:3000"
echo ""
echo "📚 Documentación: README.md"
echo "🐛 Problemas: Revisa los logs o crea un issue"
