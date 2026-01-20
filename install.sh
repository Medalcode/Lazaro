#!/data/data/com.termux/files/usr/bin/bash

# Colores para la salida
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}--- Iniciando instalación de Lazaro Project ---${NC}"

# 0. Verificación de seguridad de puertos
check_port() {
    if ss -tunlp | grep -q ":$1 "; then
        echo -e "${RED}[ERROR] El puerto $1 ya está en uso por otro proceso.${NC}"
        return 1
    fi
    return 0
}

RED='\033[0;31m'
echo -e "${BLUE}[CHECK] Verificando disponibilidad de puertos...${NC}"
PUERTOS=(3000 5000 3306 6379 5432)
FORBIDDEN=0

for port in "${PUERTOS[@]}"; do
    if ! check_port $port; then
        FORBIDDEN=1
    fi
done

if [ $FORBIDDEN -eq 1 ]; then
    echo -e "${RED}Conflictos detectados. Por favor, detén los otros servicios o cambia los puertos en la configuración antes de seguir.${NC}"
    # No salimos con exit para permitir al usuario decidir, pero damos advertencia clara.
fi

# 1. Actualizar sistema y paquetes base
echo -e "${GREEN}[1/5] Actualizando paquetes del sistema...${NC}"
pkg update -y && pkg upgrade -y
pkg install -y nodejs python git mariadb postgresql redis

# 2. Instalar gestor de procesos PM2
echo -e "${GREEN}[2/5] Instalando PM2 globalmente...${NC}"
npm install -g pm2

# 3. Configurar servicio Node.js
echo -e "${GREEN}[3/5] Configurando servicio Node.js...${NC}"
if [ -d "api-node" ]; then
    cd api-node
    npm install
    cd ..
fi

# 4. Configurar servicio Python
echo -e "${GREEN}[4/5] Configurando servicio Python...${NC}"
pip install flask

# 5. Configurar base de datos MariaDB (opcional/inicial)
echo -e "${GREEN}[5/5] Inicializando servicios de base de datos...${NC}"
# Iniciar MariaDB si no está corriendo
if ! pgrep -x "mariadbd" > /dev/null
then
    mysql_install_db
    nohup mysqld > /dev/null 2>&1 &
    sleep 2
    mysql -e "CREATE DATABASE IF NOT EXISTS lazaro_db;"
fi

echo -e "${BLUE}--- Instalación Completada ---${NC}"
echo -e "Para iniciar el servidor ejecuta: ${GREEN}pm2 start ecosystem.config.js${NC}"
echo -e "Para ver el estado ejecuta: ${GREEN}pm2 status${NC}"
