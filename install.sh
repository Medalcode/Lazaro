#!/usr/bin/env bash

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
echo -e "${GREEN}[1/5] Actualizando paquetes del sistema (Debian/Ubuntu)...${NC}"
if command -v apt >/dev/null 2>&1; then
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y nodejs npm python3 python3-pip git mariadb-server postgresql redis-server
else
    echo -e "${RED}No se encontró 'apt'. Este script está preparado para Debian/Ubuntu. Ejecuta las instalaciones manualmente.${NC}"
fi

# 2. Instalar gestor de procesos PM2
echo -e "${GREEN}[2/5] Instalando PM2 globalmente (opcional)...${NC}"
if command -v npm >/dev/null 2>&1; then
    sudo npm install -g pm2
else
    echo -e "${RED}npm no encontrado; omitiendo instalación de PM2.${NC}"
fi

# 3. Configurar servicio Node.js
echo -e "${GREEN}[3/5] Configurando servicio Node.js...${NC}"
if [ -d "api-node" ]; then
    cd api-node
    npm install
    cd ..
fi

# 4. Configurar servicio Python
echo -e "${GREEN}[4/5] Configurando servicio Python...${NC}"
if command -v pip3 >/dev/null 2>&1; then
    sudo pip3 install -r requirements.txt 2>/dev/null || sudo pip3 install flask
else
    sudo pip install flask || true
fi

# 5. Configurar base de datos MariaDB (opcional/inicial)
echo -e "${GREEN}[5/5] Inicializando servicios de base de datos...${NC}"
# Iniciar MariaDB si no está corriendo
if systemctl >/dev/null 2>&1; then
    sudo systemctl enable --now mariadb || sudo systemctl enable --now mysql || true
    # Crear base de datos si es posible
    if command -v mysql >/dev/null 2>&1; then
        mysql -e "CREATE DATABASE IF NOT EXISTS lazaro_db;" || true
    fi
fi

echo -e "${BLUE}--- Instalación Completada ---${NC}"
echo -e "Para iniciar con PM2 (opcional): ${GREEN}pm2 start ecosystem.config.js${NC}"
echo -e "Para integración con systemd: crear unidades en /etc/systemd/system/ y luego: ${GREEN}sudo systemctl enable --now <servicio>${NC}"
