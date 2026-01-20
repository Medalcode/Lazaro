#!/data/data/com.termux/files/usr/bin/bash

# Lazaro Backup Utility
# Guarda copias de seguridad de las configuraciones y bases de datos

BACKUP_DIR="$HOME/Lazaro/backups"
DATE=$(date +%Y-%m-%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando respaldo de Lazaro..."

# 1. Respaldar MariaDB (si existe)
if command -v mysqldump &> /dev/null; then
    mysqldump lazaro_db > "$BACKUP_DIR/db_backup_$DATE.sql"
    echo "✔ Base de datos MariaDB respaldada."
fi

# 2. Respaldar variables de entorno y configs
cp "$HOME/Lazaro/ecosystem.config.js" "$BACKUP_DIR/config_$DATE.js"

# 3. Limpieza (mantener solo los últimos 7 días)
find "$BACKUP_DIR" -type f -mtime +7 -delete

echo "✔ Respaldo completado en $BACKUP_DIR"
