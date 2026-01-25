# Arquitectura Escalable: Red Lazaro (Lazaro Network)

## Visión General

Para transformar Lazaro de un servidor monolítico local en una arquitectura altamente escalable, implementaremos un diseño basado en **Microservicios Orientados a Eventos (Event-Driven Microservices)** utilizando Redis como bus de mensajería central.

Esta arquitectura permite:

1. **Desacoplamiento:** Los servicios no necesitan conocer la existencia de otros (IPs/Puertos), solo publican/escuchan eventos.
2. **Escalabilidad Horizontal:** Puedes añadir múltiples instancias de "procesadores" de datos sin detener el sistema.
3. **Resiliencia:** Si un servicio cae, el bus de mensajes retiene la información o alerta inmediatamente.

---

## Componentes del Core (Nuevos)

### 1. 🧠 Service Bus (Redis)

El sistema nervioso central.

- **Canales (Pub/Sub):**
  - `system:heartbeat`: Latidos de vida de cada servicio.
  - `system:metrics`: Datos brutos de CPU/RAM.
  - `alerts:critical`: Eventos que requieren notificación inmediata (Telegram).
  - `commands:argos`: Comandos directos al bot de trading.

### 2. 🚪 API Gateway (Unified Access)

Un único punto de entrada (Puerto 3000) que enruta tráfico hacia los microservicios correspondientes.

- `/api/stats` -> Lazaro Telemetry
- `/api/argos` -> Argos Controller
- `/webhooks` -> External hooks

### 3. 🛡️ Shared Utils (Librería Compartida)

Código común para evitar duplicidad:

- Cliente Redis estandarizado.
- Logger centralizado.
- Configuraciones de entorno (.env loader).

---

## Estructura de Directorios Propuesta

```
Lazaro/
├── config/             # Configuraciones globales
├── shared/             # Módulos compartidos (Redis client, Utils)
├── gateway/            # API Gateway (Express/Fastify)
├── services/           # Microservicios Independientes
│   ├── telemetry/      # (Antes api-node) Recolección de métricas
│   ├── telegram-bot/   # Worker de notificaciones (No pollea, escucha)
│   ├── argos-bridge/   # (Antes api-python) Conector con Argos Trading
│   └── cron-jobs/      # Tareas programadas (Backups)
├── scripts/            # Scripts de despliegue y mantenimiento
└── ecosystem.config.js # Orquestación PM2 actualizada
```

## Flujo de Datos (Ejemplo: Alerta de Batería)

1. **Telemetry Service:** Detecta batería baja -> Publica evento en `alerts:critical` { "msg": "Battery level 10%" }.
2. **Redis Bus:** Distribuye el mensaje.
3. **Telegram Bot:** (Suscrito a `alerts:critical`) Recibe evento -> Envía mensaje al usuario.
   _Nota: El Bot ya no consulta cada minuto. Reacciona en milisegundos._

---

## Plan de Migración

1. Crear módulo `shared` para comunicación.
2. Refactorizar `api-node` para ser `services/telemetry`.
3. Refactorizar `telegram-bot` para eliminar polling y usar suscripción Redis.
4. Implementar API Gateway básico.
