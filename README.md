# Lazaro

**Event-driven microservices platform for Debian-based userland (systemd).**

Run Lazaro on a small Debian-based environment (Debian, Ubuntu, or UserLAnd Debian). Lazaro provides a lightweight backend with a Redis-based event bus, system monitoring, and Telegram alerts.

---

## What Problem Does This Solve?

You have:

- An old Android device collecting dust
- Need for a 24/7 personal server (home automation, monitoring, bots)
- Limited budget for cloud hosting
- Desire to learn event-driven architecture

- Lazaro provides:

- **Microservices orchestration** via `systemd` units (recommended) or PM2 (optional)
- **Event bus** using Redis Pub/Sub for service communication
- **System monitoring** (CPU, RAM, battery, temperature)
- **Telegram alerts** for critical events
- **Extensibility** for custom services

---

## What This Is NOT

❌ **Not a production-grade server replacement**  
This runs on a phone. Expect thermal throttling, Doze Mode, and occasional OOM kills.

❌ **Not for mission-critical workloads**  
If downtime costs money, use a real server. This is for personal projects and learning.

❌ **Not a high-performance system**  
Android throttles background processes. Expect 10-100 events/second, not thousands.

❌ **Not plug-and-play**  
Requires Termux knowledge, manual Android configuration (battery optimization, wake locks), and debugging skills.

❌ **Not secure for public internet exposure**  
No authentication, no TLS, no hardening. LAN-only or VPN access recommended.

---

## What Makes This Different

### 1. **Event-Driven by Design**

Services communicate via Redis Pub/Sub, not HTTP polling. Loose coupling, low latency.

```javascript
// Publish event
publisher.publish("alerts:critical", JSON.stringify({ msg: "Battery at 5%" }));

// Subscribe to events
subscriber.on("message", (channel, message) => {
  if (channel === "alerts:critical") {
    bot.telegram.sendMessage(chatId, message);
  }
});
```

### 2. **Android-Aware**

Built-in monitoring for Android-specific issues:

- Doze Mode detection
- Thermal throttling adaptation
- Battery-based service degradation
- OOM prevention

### 3. **Telegram as UI**

No web dashboard required. Control and monitor via Telegram bot:

- `/status` → System metrics
````markdown
# Lazaro

**Plataforma de microservicios event-driven para userland Debian (systemd).**

Ejecuta Lazaro en un entorno Debian ligero (Debian, Ubuntu o UserLAnd Debian). Provee un backend ligero con event bus basado en Redis, monitoreo y alertas por Telegram.

[English version](README.md)

---

## ¿Qué Problema Resuelve?

Tienes:

- Un dispositivo Android viejo juntando polvo
- Necesidad de un servidor 24/7 personal (domótica, monitoreo, bots)
- Presupuesto limitado para hosting en la nube
- Ganas de aprender arquitectura event-driven

Lazaro provee:

- **Orquestación de microservicios** vía unidades `systemd` (recomendado) o PM2 (opcional)
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

### Prerrequisitos

- Entorno Debian/Ubuntu o UserLAnd Debian
- Acceso `sudo` para instalar paquetes y habilitar servicios
- Conexión de red estable

### Instalación (Debian/Ubuntu)

```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

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

# 5. Habilitar y arrancar servicios systemd (ejemplo)
# Después de crear el usuario 'lazaro' y copiar las unidades a /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now lazaro-api-node.service lazaro-api-python.service lazaro-telegram-bot.service

# 6. Verificar
sudo systemctl status lazaro-api-node.service
curl http://localhost:3000/api/stats
```

Notas:
- `systemd` es el gestor de procesos recomendado en Debian. PM2 es opcional.
- Si prefiere PM2, instale con `sudo npm install -g pm2` y ejecute `pm2 start ecosystem.config.js`.

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

````
### Android-Specific

| Issue                  | Impact                                 | Mitigation                       |
| ---------------------- | -------------------------------------- | -------------------------------- |
| **Doze Mode**          | Network blocked after 30min screen-off | Use `termux-wake-lock`           |
| **Thermal Throttling** | CPU reduced to 40% when hot (>42°C)    | Monitor temp, reduce load        |
| **OOM Killer**         | Android kills Termux when RAM is low   | Set `max_memory_restart` in PM2  |
| **Process Kill**       | Termux dies when swiped from recents   | Use Termux:Boot for auto-restart |

### System Limits

- **Max throughput**: ~100 events/second (thermal throttling)
- **Max services**: 5-10 (RAM constraints on 2GB devices)
- **Network**: LAN only (no public IP without port forwarding)
- **Storage**: Limited by device (recommend 2GB+ free)

### Security

- ❌ No authentication on APIs
- ❌ No TLS/HTTPS
- ❌ Redis without password
- ❌ Logs may contain sensitive data
- ✅ Designed for LAN-only use

**Do NOT expose to public internet without VPN/reverse proxy.**

---

## Monitoring

### Telegram Commands

```
/start   - Activate bot and configure alerts
/status  - System metrics (CPU, RAM, battery, uptime)
/logs    - Recent errors
```

### Dashboard

Access at `http://[device-ip]:3000`

- Real-time CPU/RAM graphs
- Service status
- Battery level
- Recent alerts

### PM2 Commands

```bash
pm2 status          # List all services
pm2 logs            # Tail all logs
pm2 logs api-node   # Tail specific service
pm2 restart all     # Restart all services
pm2 stop all        # Stop all services
pm2 delete all      # Remove all services
```

---

## Troubleshooting

### Services not starting

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs --lines 50

# Restart PM2 daemon
pm2 kill
pm2 start ecosystem.config.js
```

### Redis connection errors

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis manually
redis-server --daemonize yes

# Check binding (should be 127.0.0.1)
redis-cli CONFIG GET bind
```

### Telegram bot not responding

```bash
# Check bot token
echo $TELEGRAM_BOT_TOKEN

# Check bot logs
pm2 logs telegram-bot

# Test bot manually
curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe
```

### High battery drain

```bash
# Check CPU usage
top

# Reduce monitoring frequency in config
# Edit ecosystem.config.js and increase intervals

# Disable non-essential services
pm2 stop api-python
```

---

## Performance Tuning

### For Low-End Devices (1-2GB RAM)

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

### For Battery Life

```javascript
// Reduce monitoring frequency
const MONITOR_INTERVAL = 120000; // 2 min instead of 60s
const HEARTBEAT_INTERVAL = 60000; // 1 min instead of 30s
```

### For Performance

```javascript
// Increase if device is powerful and plugged in
const MONITOR_INTERVAL = 10000; // 10s
const HEARTBEAT_INTERVAL = 5000; // 5s
```

---

## Contributing

This is a personal project, but contributions are welcome if they:

1. **Solve real problems** (not theoretical edge cases)
2. **Keep it simple** (no enterprise frameworks)
3. **Work on Android** (tested in Termux)
4. **Don't break existing services**

### Areas for Contribution

- [ ] Additional service examples (weather, RSS, etc.)
- [ ] Better Doze Mode handling
- [ ] Improved thermal throttling adaptation
- [ ] Web dashboard enhancements
- [ ] Documentation improvements

---

## FAQ

**Q: Can I use this for production?**  
A: No. Use a real server (VPS, Raspberry Pi, cloud). This is for learning and personal projects.

**Q: Why not use Docker?**  
A: Docker on Android is complex and resource-heavy. PM2 is simpler and works well in Termux.

**Q: Why Redis instead of RabbitMQ/Kafka?**  
A: Redis uses ~10MB RAM. RabbitMQ uses ~200MB. Kafka uses ~500MB. On a 2GB phone, Redis is the only viable option.

**Q: Can I run this on iOS?**  
A: No. iOS doesn't allow background processes like Termux.

**Q: How much battery does this consume?**  
A: ~5-15% per hour depending on workload. Keep device plugged in for 24/7 operation.

**Q: Is this safe?**  
A: For LAN use, yes. For internet exposure, no. See Security section.

---

## License

MIT License - Use at your own risk.

**Disclaimer**: This project runs on a phone. Expect thermal throttling, battery drain, and occasional crashes. Not suitable for critical workloads.

---

## Acknowledgments

- **Termux** - For making Linux on Android possible
- **PM2** - For process management
- **Redis** - For lightweight pub/sub
- **Telegraf** - For Telegram bot framework

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/Lazaro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/Lazaro/discussions)
- **Documentation**: [ARCHITECTURE.md](ARCHITECTURE.md)

**No commercial support available.** This is a hobby project.
