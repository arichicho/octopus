#!/bin/bash

# Script de despliegue para Firebase App Hosting
# Octopus App - Integraciones

set -e

echo "🚀 Iniciando despliegue de Octopus App..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Firebase CLI esté instalado
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI no está instalado. Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Verificar que estés logueado en Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "No estás logueado en Firebase. Ejecuta: firebase login"
    exit 1
fi

# Verificar variables de entorno
print_status "Verificando configuración..."

if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    print_warning "No se encontró archivo .env.local o .env"
    print_warning "Asegúrate de configurar las variables de entorno necesarias"
fi

# Limpiar builds anteriores
print_status "Limpiando builds anteriores..."
npm run clean

# Instalar dependencias
print_status "Instalando dependencias..."
npm install

# Ejecutar linting
print_status "Ejecutando linting..."
npm run lint || print_warning "Linting falló, continuando..."

# Construir la aplicación
print_status "Construyendo la aplicación..."
npm run build

# Verificar que el build fue exitoso
if [ ! -d ".next" ]; then
    print_error "El build falló. Revisa los errores arriba."
    exit 1
fi

print_success "Build completado exitosamente"

# Desplegar a Firebase
print_status "Desplegando a Firebase App Hosting..."

# Verificar el proyecto actual
CURRENT_PROJECT=$(firebase use --json | grep -o '"current":"[^"]*"' | cut -d'"' -f4)
print_status "Proyecto actual: $CURRENT_PROJECT"

# Desplegar
firebase deploy --only apphosting:theceo

print_success "¡Despliegue completado exitosamente! 🎉"

# Mostrar información del sitio
print_status "Información del sitio:"
firebase hosting:sites:list

print_status "Para ver el sitio desplegado, visita:"
echo "https://$CURRENT_PROJECT.web.app"

print_status "Para configurar variables de entorno en producción:"
echo "1. Ve a Firebase Console > App Hosting > Settings"
echo "2. Configura las variables de entorno necesarias"
echo "3. Reinicia el servicio"

print_success "¡Octopus App está ahora en producción! 🐙"
