#!/bin/bash

# 🚀 Script de Deploy Automatizado - Octopus App
# Deploy a Firebase Hosting en theceo.web.app

set -e  # Exit on any error

echo "🐙 Iniciando deploy de Octopus App..."
echo "📍 Destino: https://theceo.web.app"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Verificar que Firebase CLI esté instalado
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI no está instalado. Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Verificar que estemos logueados en Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "No estás logueado en Firebase. Ejecuta: firebase login"
    exit 1
fi

print_status "Limpiando builds anteriores..."
rm -rf out .next
print_success "Limpieza completada"

print_status "Instalando dependencias..."
npm install
print_success "Dependencias instaladas"

print_status "Construyendo aplicación..."
npm run build:static
print_success "Build completado"

print_status "Verificando archivos generados..."
if [ ! -d "out" ]; then
    print_error "No se generó la carpeta 'out'. El build falló."
    exit 1
fi

file_count=$(find out -type f | wc -l)
print_success "Se generaron $file_count archivos"

print_status "Desplegando a Firebase Hosting..."
firebase deploy --only hosting:theceo
print_success "Deploy completado"

print_status "Verificando que la aplicación esté funcionando..."
if curl -s -o /dev/null -w "%{http_code}" https://theceo.web.app | grep -q "200"; then
    print_success "Aplicación funcionando correctamente"
else
    print_warning "La aplicación puede no estar funcionando correctamente"
fi

echo ""
print_success "🎉 Deploy completado exitosamente!"
echo ""
echo "🌐 URL de la aplicación: https://theceo.web.app"
echo "📊 Console de Firebase: https://console.firebase.google.com/project/iamtheoceo/overview"
echo ""
echo "📝 Para futuros deploys, simplemente ejecuta: ./deploy.sh"
echo ""
