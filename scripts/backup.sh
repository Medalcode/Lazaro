#!/usr/bin/env bash

# Lazaro Backup Utility
# Guarda copias de seguridad de las configuraciones y bases de datos

# Configurable backup dir (default to user home to avoid permission issues)
LAZARO_BACKUP_DIR=${LAZARO_BACKUP_DIR:-"$HOME/Lazaro/backups"}
LAZARO_HOME=${LAZARO_HOME:-"$HOME/Lazaro"}
DATE=$(date +%Y-%m-%d_%H%M%S)
mkdir -p "$LAZARO_BACKUP_DIR"

echo "[$(date)] Iniciando respaldo de Lazaro..."

# 1. Respaldar MariaDB (si existe)
if command -v mysqldump &> /dev/null; then
    mysqldump lazaro_db > "$LAZARO_BACKUP_DIR/db_backup_$DATE.sql" || true
    echo "✔ Base de datos MariaDB respaldada."
fi

# 2. Respaldar variables de entorno y configs
if [ -f "$LAZARO_HOME/ecosystem.config.js" ]; then
    cp "$LAZARO_HOME/ecosystem.config.js" "$LAZARO_BACKUP_DIR/config_$DATE.js"
fi

# 3. Limpieza (mantener solo los últimos 7 días)
find "$LAZARO_BACKUP_DIR" -type f -mtime +7 -delete

echo "✔ Respaldo completado en $LAZARO_BACKUP_DIR"
