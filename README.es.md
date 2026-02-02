# Lazaro

**Plataforma de microservicios event-driven corriendo sobre Android vía Termux.**

Convierte un teléfono Android viejo en un servidor backend ligero con event bus basado en Redis, monitoreo de sistema y alertas por Telegram.

[English version](README.md)

---

## ¿Qué Problema Resuelve?

Tienes:

- Un dispositivo Android viejo juntando polvo
- Necesidad de un servidor 24/7 personal (domótica, monitoreo, bots)
- Presupuesto limitado para hosting en la nube
- Ganas de aprender arquitectura event-driven

Lazaro provee:

- **Orquestación de microservicios** vía PM2 en Android
- **Event bus** usando Redis Pub/Sub para comunicación entre servicios
- **Monitoreo de sistema** (CPU, RAM, batería, temperatura)
- **Alertas por Telegram** para eventos críticos
- **Extensibilidad** para servicios personalizados

---

## Qué NO Es Esto

❌ **No es un reemplazo de servidor de producción**  
Esto corre en un teléfono. Espera thermal throttling, Doze Mode y OOM kills ocasionales.

❌ **No es para workloads críticos**  
Si el downtime cuesta dinero, usa un servidor real. Esto es para proyectos personales y aprendizaje.

❌ **No es un sistema de alto rendimiento**  
Android throttlea procesos en background. Espera 10-100 eventos/segundo, no miles.

❌ **No es plug-and-play**  
Requiere conocimiento de Termux, configuración manual de Android (optimización de batería, wake locks) y habilidades de debugging.

❌ **No es seguro para exposición a Internet público**  
Sin autenticación, sin TLS, sin hardening. Solo LAN o acceso vía VPN.

---

## Qué Lo Hace Diferente

### 1. **Event-Driven por Diseño**

Los servicios se comunican vía Redis Pub/Sub, no HTTP polling. Bajo acoplamiento, baja latencia.

```javascript
// Publicar evento
publisher.publish("alerts:critical", JSON.stringify({ msg: "Batería al 5%" }));

// Suscribirse a eventos
subscriber.on("message", (channel, message) => {
  if (channel === "alerts:critical") {
    bot.telegram.sendMessage(chatId, message);
  }
});
```

### 2. **Consciente de Android**

Monitoreo integrado para problemas específicos de Android:

- Detección de Doze Mode
- Adaptación a thermal throttling
- Degradación de servicios según batería
- Prevención de OOM

### 3. **Telegram como UI**

No se requiere dashboard web. Control y monitoreo vía bot de Telegram:

- `/status` → Métricas del sistema
- `/logs` → Errores recientes
- Alertas automáticas para eventos críticos

### 4. **Modelo de Servicios Extensible**

Agrega servicios personalizados dejando un script en `services/` y registrándolo en `ecosystem.config.js`. Sin lock-in de frameworks.

---

## Arquitectura

```
┌─────────────────────────────────────┐
│  Dispositivo Android (Termux)       │
│  ┌───────────────────────────────┐  │
│  │  Gestor de Procesos PM2       │  │
│  │  ├─ api-node (:3000)          │  │  ← Telemetría del sistema
│  │  ├─ telegram-bot              │  │  ← Alertas y control
│  │  └─ [tu-servicio]             │  │  ← Servicios personalizados
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Redis Event Bus (:6379)      │  │  ← Mensajería Pub/Sub
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Flujo de Eventos**:

1. `api-node` detecta batería baja → publica `alerts:critical`
2. Redis difunde a todos los suscriptores
3. `telegram-bot` recibe evento → envía mensaje a Telegram
4. Tiempo de respuesta: <500ms (vs 60s con polling)

---

## Inicio Rápido

### Prerequisitos

- Dispositivo Android 7.0+
- [Termux](https://f-droid.org/en/packages/com.termux/) instalado
- Conexión WiFi estable
- Dispositivo conectado a cargador (recomendado)

### Instalación

```bash
# 1. Actualizar Termux
pkg update && pkg upgrade -y

# 2. Clonar repositorio
git clone https://github.com/tuusuario/Lazaro.git
cd Lazaro

# 3. Ejecutar instalador
chmod +x install.sh
./install.sh

# 4. Configurar bot de Telegram
cp services/telegram-bot/.env.example services/telegram-bot/.env
nano services/telegram-bot/.env
# Agregar tu TELEGRAM_BOT_TOKEN de @BotFather

# 5. Iniciar servicios
pm2 start ecosystem.config.js

# 6. Verificar
pm2 status
curl http://localhost:3000/api/stats
```

### Configuración de Android (Crítico)

Para evitar que Android mate los servicios:

1. **Desactivar optimización de batería**:
   - Ajustes → Batería → Optimización de batería
   - Buscar "Termux" → Seleccionar "No optimizar"

2. **Permitir ejecución en segundo plano**:
   - Ajustes → Aplicaciones → Termux → Batería
   - Seleccionar "Sin restricciones"

3. **Habilitar wake lock** (en Termux):

   ```bash
   termux-wake-lock
   ```

4. **Desactivar "Batería adaptable"** (si existe):
   - Ajustes → Batería → Batería adaptable → Desactivar

---

## Servicios

| Servicio       | Puerto | Propósito                                          |
| -------------- | ------ | -------------------------------------------------- |
| `api-node`     | 3000   | Telemetría del sistema, dashboard, API de métricas |
| `telegram-bot` | -      | Alertas de Telegram e interfaz de control          |
| `redis`        | 6379   | Event bus (solo localhost)                         |

### Agregar un Servicio Personalizado

1. Crear directorio del servicio:

```bash
mkdir services/mi-servicio
cd services/mi-servicio
npm init -y
```

2. Crear script del servicio:

```javascript
// services/mi-servicio/index.js
const { createService } = require("../../shared");

const service = createService({ name: "mi-servicio" });

// Suscribirse a eventos
service.on("system:metrics", (event) => {
  console.log("Métricas recibidas:", event.data);
});

// Publicar eventos
setInterval(() => {
  service.publish("mi-servicio:heartbeat", { status: "alive" });
}, 30000);

service.start();
```

3. Registrar en PM2:

```javascript
// ecosystem.config.js
{
  name: 'mi-servicio',
  script: './services/mi-servicio/index.js'
}
```

4. Iniciar:

```bash
pm2 start ecosystem.config.js --only mi-servicio
```

---

## Canales de Eventos

### Eventos Estándar

```javascript
// Eventos del sistema
"system:heartbeat"; // Health checks de servicios (cada 30s)
"system:metrics"; // Métricas de CPU, RAM, batería (cada 60s)
"system:error"; // Errores de servicios

// Alertas (enrutadas a Telegram)
"alerts:critical"; // Batería <10%, servicio caído, OOM
"alerts:warning"; // Batería <20%, RAM >80%, temperatura alta
"alerts:info"; // Backup completado, servicio reiniciado

// Hardware
"hardware:battery"; // Actualizaciones de estado de batería
"hardware:thermal"; // Monitoreo de temperatura

// Comandos
"commands:service"; // start, stop, restart de servicios
"commands:system"; // backup, cleanup, shutdown
```

### Formato de Eventos

```javascript
{
  "v": "1.0",                    // Versión del schema
  "src": "api-node",             // Servicio origen
  "type": "alerts:critical",     // Tipo de evento
  "ts": 1738512045123,           // Unix timestamp (ms)
  "id": "a1b2c3d4",              // ID único (8 chars)
  "data": {                      // Payload del evento
    "severity": "critical",
    "msg": "Batería al 5%"
  }
}
```

---

## Limitaciones Conocidas

### Específicas de Android

| Problema               | Impacto                                                 | Mitigación                             |
| ---------------------- | ------------------------------------------------------- | -------------------------------------- |
| **Doze Mode**          | Network bloqueado después de 30min con pantalla apagada | Usar `termux-wake-lock`                |
| **Thermal Throttling** | CPU reducido al 40% cuando hace calor (>42°C)           | Monitorear temp, reducir carga         |
| **OOM Killer**         | Android mata Termux cuando RAM es escasa                | Configurar `max_memory_restart` en PM2 |
| **Process Kill**       | Termux muere cuando se swipea desde recents             | Usar Termux:Boot para auto-restart     |

### Límites del Sistema

- **Max throughput**: ~100 eventos/segundo (thermal throttling)
- **Max servicios**: 5-10 (restricciones de RAM en dispositivos de 2GB)
- **Network**: Solo LAN (sin IP pública sin port forwarding)
- **Storage**: Limitado por dispositivo (recomendado 2GB+ libres)

### Seguridad

- ❌ Sin autenticación en APIs
- ❌ Sin TLS/HTTPS
- ❌ Redis sin contraseña
- ❌ Los logs pueden contener datos sensibles
- ✅ Diseñado para uso solo en LAN

**NO exponer a Internet público sin VPN/reverse proxy.**

---

## Monitoreo

### Comandos de Telegram

```
/start   - Activar bot y configurar alertas
/status  - Métricas del sistema (CPU, RAM, batería, uptime)
/logs    - Errores recientes
```

### Dashboard

Acceder en `http://[ip-del-dispositivo]:3000`

- Gráficos de CPU/RAM en tiempo real
- Estado de servicios
- Nivel de batería
- Alertas recientes

### Comandos PM2

```bash
pm2 status          # Listar todos los servicios
pm2 logs            # Ver todos los logs
pm2 logs api-node   # Ver log de servicio específico
pm2 restart all     # Reiniciar todos los servicios
pm2 stop all        # Detener todos los servicios
pm2 delete all      # Eliminar todos los servicios
```

---

## Troubleshooting

### Los servicios no inician

```bash
# Verificar estado de PM2
pm2 status

# Ver logs
pm2 logs --lines 50

# Reiniciar daemon de PM2
pm2 kill
pm2 start ecosystem.config.js
```

### Errores de conexión a Redis

```bash
# Verificar si Redis está corriendo
redis-cli ping
# Debería retornar: PONG

# Iniciar Redis manualmente
redis-server --daemonize yes

# Verificar binding (debería ser 127.0.0.1)
redis-cli CONFIG GET bind
```

### El bot de Telegram no responde

```bash
# Verificar token del bot
echo $TELEGRAM_BOT_TOKEN

# Ver logs del bot
pm2 logs telegram-bot

# Probar bot manualmente
curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe
```

### Alto consumo de batería

```bash
# Verificar uso de CPU
top

# Reducir frecuencia de monitoreo en config
# Editar ecosystem.config.js y aumentar intervalos

# Desactivar servicios no esenciales
pm2 stop api-python
```

---

## Ajuste de Rendimiento

### Para Dispositivos de Gama Baja (1-2GB RAM)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "api-node",
      max_memory_restart: "100M",
      node_args: "--max-old-space-size=96",
    },
  ],
};
```

### Para Duración de Batería

```javascript
// Reducir frecuencia de monitoreo
const MONITOR_INTERVAL = 120000; // 2 min en lugar de 60s
const HEARTBEAT_INTERVAL = 60000; // 1 min en lugar de 30s
```

### Para Rendimiento

```javascript
// Aumentar si el dispositivo es potente y está enchufado
const MONITOR_INTERVAL = 10000; // 10s
const HEARTBEAT_INTERVAL = 5000; // 5s
```

---

## FAQ

**P: ¿Puedo usar esto en producción?**  
R: No. Usa un servidor real (VPS, Raspberry Pi, cloud). Esto es para aprendizaje y proyectos personales.

**P: ¿Por qué no usar Docker?**  
R: Docker en Android es complejo y consume muchos recursos. PM2 es más simple y funciona bien en Termux.

**P: ¿Por qué Redis en lugar de RabbitMQ/Kafka?**  
R: Redis usa ~10MB RAM. RabbitMQ usa ~200MB. Kafka usa ~500MB. En un teléfono de 2GB, Redis es la única opción viable.

**P: ¿Puedo ejecutar esto en iOS?**  
R: No. iOS no permite procesos en background como Termux.

**P: ¿Cuánta batería consume esto?**  
R: ~5-15% por hora dependiendo de la carga. Mantén el dispositivo enchufado para operación 24/7.

**P: ¿Es seguro?**  
R: Para uso en LAN, sí. Para exposición a Internet, no. Ver sección de Seguridad.

---

## Licencia

MIT License - Úsalo bajo tu propio riesgo.

**Disclaimer**: Este proyecto corre en un teléfono. Espera thermal throttling, battery drain y crashes ocasionales. No es adecuado para workloads críticos.

---

## Agradecimientos

- **Termux** - Por hacer Linux en Android posible
- **PM2** - Por la gestión de procesos
- **Redis** - Por pub/sub ligero
- **Telegraf** - Por el framework de bots de Telegram

---

## Soporte

- **Issues**: [GitHub Issues](https://github.com/tuusuario/Lazaro/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/tuusuario/Lazaro/discussions)
- **Documentación**: [ARCHITECTURE.md](ARCHITECTURE.md)

**No hay soporte comercial disponible.** Este es un proyecto hobby.
