# 📔 Bitácora de Desarrollo - Lazaro Project

## ✅ Tareas Realizadas

### 🚀 Inicialización y Configuración

- [x] Estructura inicial del proyecto.
- [x] Script de instalación automática (`install.sh`).
- [x] Configuración de PM2 (`ecosystem.config.js`) para orquestación de servicios.
- [x] Creación de servicio `api-node` para dashboard y telemetría local.

### 📱 Integraciones y Servicios

- [x] Desarrollo del Dashboard base (HTML/JS/Express).
- [x] Implementación del Bot de Telegram (`services/telegram-bot`).
- [x] Configuración de alertas de batería y estado de servicios.

### 🏗️ Refactorización y Arquitectura (Lazaro Network)

- [x] Diseño de Arquitectura Orientada a Eventos (`ARCHITECTURE.md`).
- [x] Creación de módulo compartido `shared` para utilidades comunes.
- [x] Implementación de cliente Redis (Pub/Sub) en `shared/lib/redisClient.js`.
- [x] Refactorización de `services/telegram-bot` para usar eventos Redis (eliminación de polling).
- [x] Actualización de `api-node` para actuar como monitor de sistema y publicar alertas críticas en Redis.

---

## ⏳ Tareas Pendientes

### 🔧 Servicios y Backend

- [ ] **Python Service**: Desacoplar `api-python` y migrar a comunicación por eventos Redis.
- [ ] **Argos Bridge**: Crear servicio específico de puente para el bot de trading Argos.
- [ ] **API Gateway**: Implementar un Gateway unificado para enrutamiento de peticiones.
- [ ] **Cron Jobs**: Migrar scripts de backup y mantenimiento a un servicio dedicado `services/cron-jobs`.

### 💻 Frontend y Dashboard

- [ ] **Seguridad**: Implementar autenticación para el acceso al Dashboard.
- [ ] **UI/UX**: Mejorar la interfaz visual con componentes reactivos en tiempo real (WebSockets).
- [ ] **Histórico**: Añadir gráficos históricos de métricas (CPU/RAM/Batería).

### 🧪 DevOps y Calidad

- [ ] Añadir tests unitarios para el módulo `shared`.
- [ ] Configurar CI/CD básico.
- [ ] Documentación detallada de la API de eventos.
