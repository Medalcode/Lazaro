# Lazaro Project

Este proyecto convierte un dispositivo Android (vía Termux) en un servidor backend versátil corriendo múltiples servicios.

## Estructura del Proyecto

- **/api-node**: Servicio en Node.js (Puerto 3000) - Ideal para chat, sockets, I/O asíncrono.
- **/api-python**: Servicio en Python/Flask (Puerto 5000) - Ideal para procesamiento de datos, scripts complejos.
- **ecosystem.config.js**: Configuración para gestionar ambos procesos con PM2.

## Instalación en Termux (Android)

1. **Instalar Dependencias Base**

   ```bash
   pkg update && pkg upgrade
   pkg install nodejs python git
   ```

2. **Instalar Dependencias Globales**

   ```bash
   npm install -g pm2
   ```

3. **Configurar Servicios**

   _Node.js:_

   ```bash
   cd api-node
   npm install
   cd ..
   ```

   _Python:_

   ```bash
   pip install flask
   # Nota: En Termux a veces es recomendable usar un venv,
   # pero para algo sencillo la instalación global funciona.
   ```

4. **Arrancar Todo**

   ```bash
   pm2 start ecosystem.config.js
   ```

5. **Monitorizar**

   ```bash
   pm2 list
   pm2 monit
   ```

6. **Verificar**
   Desde tu PC o Navegador en el teléfono:
   - Node: `http://<IP-TELEFONO>:3000`
   - Python: `http://<IP-TELEFONO>:5000`

## Base de Datos (MariaDB)

La base de datos `lazaro_db` ha sido creada automáticamente.
Puedes conectarte localmente en el teléfono:

```bash
mysql -u root lazaro_db
```

O configurar tus aplicaciones Node/Python para conectar a `localhost:3306`.

## Base de Datos (PostgreSQL - SQL)

Un motor de base de datos relacional potente.

- **Puerto:** 5432
- **Conectar:** `psql postgres`

## Base de Datos (Redis - NoSQL)

Base de datos en memoria ultrarrápida (Key-Value).

- **Puerto:** 6379
- **Conectar:** `redis-cli`
