#!/bin/bash

# Script para eliminar secretos del historial de git
# ⚠️ ADVERTENCIA: Esto reescribe el historial de git
# ⚠️ Solo ejecutar después de rotar los secretos expuestos

set -e

echo "🚨 ADVERTENCIA: Este script reescribirá el historial de git"
echo "📋 Asegúrate de:"
echo "   1. Rotar todos los secretos expuestos primero"
echo "   2. Hacer backup del repositorio"
echo "   3. Coordinar con tu equipo (force push requerido)"
echo ""
read -p "¿Continuar? (escribe 'yes' para confirmar): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Verificar que git-filter-repo esté instalado
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ git-filter-repo no está instalado"
    echo "Instalando..."
    pip3 install git-filter-repo || {
        echo "❌ Error instalando git-filter-repo"
        echo "Instala manualmente: pip3 install git-filter-repo"
        exit 1
    }
fi

echo ""
echo "📦 Creando backup del repositorio..."
BACKUP_DIR="../octopus-backup-$(date +%Y%m%d-%H%M%S)"
git clone --mirror . "$BACKUP_DIR"
echo "✅ Backup creado en: $BACKUP_DIR"

echo ""
echo "🧹 Limpiando historial de git..."

# Eliminar archivos con secretos del historial
echo "  - Eliminando Firebase Service Account JSONs..."
git filter-repo --path-glob '**/iamtheoceo-firebase-adminsdk*.json' --invert-paths --force

echo "  - Eliminando Google OAuth Client Secrets..."
git filter-repo --path-glob '**/client_secret*.json' --invert-paths --force

echo "  - Limpiando scripts con secretos hardcodeados..."
# Solo eliminar versiones antiguas, mantener la nueva versión limpia
git filter-repo --path 'scripts/setup-vercel-env.sh' --invert-paths --force

echo "  - Limpiando documentación con secretos..."
git filter-repo --path 'docs/vercel-env-variables.md' --invert-paths --force

echo ""
echo "✅ Historial limpiado"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verifica los cambios: git log --all"
echo "   2. Si todo está bien, haz force push:"
echo "      git push origin --force --all"
echo "      git push origin --force --tags"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Todos los colaboradores necesitarán re-clonar el repositorio"
echo "   - Los PRs abiertos necesitarán ser re-creados"
echo "   - Notifica a tu equipo antes de hacer force push"

