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
- `/logs` → Recent errors
- Automatic alerts for critical events

### 4. **Extensible Service Model**

Add custom services by dropping a script in `services/` and registering in `ecosystem.config.js`. No framework lock-in.

---

## Architecture

```
┌─────────────────────────────────────┐
│  Android Device (Termux)            │
│  ┌───────────────────────────────┐  │
│  │  PM2 Process Manager          │  │
│  │  ├─ api-node (:3000)          │  │  ← System telemetry
│  │  ├─ telegram-bot              │  │  ← Alerts & control
│  │  └─ [your-service]            │  │  ← Custom services
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Redis Event Bus (:6379)      │  │  ← Pub/Sub messaging
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Event Flow**:

1. `api-node` detects low battery → publishes `alerts:critical`
2. Redis broadcasts to all subscribers
3. `telegram-bot` receives event → sends Telegram message
4. Response time: <500ms (vs 60s with polling)

---

## Quick Start

### Prerequisites

- Debian/Ubuntu or UserLAnd Debian environment
- `sudo` access to install packages and enable services
- Stable network connection

### Installation (Debian/Ubuntu)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Clone repository
git clone https://github.com/yourusername/Lazaro.git
cd Lazaro

# 3. Run installer
chmod +x install.sh
./install.sh

# 4. Configure Telegram bot
cp services/telegram-bot/.env.example services/telegram-bot/.env
nano services/telegram-bot/.env
# Add your TELEGRAM_BOT_TOKEN from @BotFather

# 5. Enable and start systemd services (example)
# After creating user 'lazaro' and copying unit files to /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now lazaro-api-node.service lazaro-api-python.service lazaro-telegram-bot.service

# 6. Verify
sudo systemctl status lazaro-api-node.service
curl http://localhost:3000/api/stats
```

Notes:
- `systemd` is the recommended process manager on Debian. PM2 is supported optionally but not required.
- If you prefer PM2, install it with `sudo npm install -g pm2` and run `pm2 start ecosystem.config.js`.

---

## Services

| Service        | Port | Purpose                                  |
| -------------- | ---- | ---------------------------------------- |
| `api-node`     | 3000 | System telemetry, dashboard, metrics API |
| `telegram-bot` | -    | Telegram alerts and control interface    |
| `redis`        | 6379 | Event bus (localhost only)               |

### Adding a Custom Service

1. Create service directory:

```bash
mkdir services/my-service
cd services/my-service
npm init -y
```

2. Create service script:

```javascript
// services/my-service/index.js
const { createService } = require("../../shared");

const service = createService({ name: "my-service" });

// Subscribe to events
service.on("system:metrics", (event) => {
  console.log("Received metrics:", event.data);
});

// Publish events
setInterval(() => {
  service.publish("my-service:heartbeat", { status: "alive" });
}, 30000);

service.start();
```

3. Register in PM2:

```javascript
// ecosystem.config.js
{
  name: 'my-service',
  script: './services/my-service/index.js'
}
```

4. Start:

```bash
pm2 start ecosystem.config.js --only my-service
```

---

## Event Channels

### Standard Events

```javascript
// System events
"system:heartbeat"; // Service health checks (every 30s)
"system:metrics"; // CPU, RAM, battery metrics (every 60s)
"system:error"; // Service errors

// Alerts (routed to Telegram)
"alerts:critical"; // Battery <10%, service down, OOM
"alerts:warning"; // Battery <20%, RAM >80%, high temp
"alerts:info"; // Backup completed, service restarted

// Hardware
"hardware:battery"; // Battery status updates
"hardware:thermal"; // Temperature monitoring

// Commands
"commands:service"; // start, stop, restart services
"commands:system"; // backup, cleanup, shutdown
```

### Event Format

```javascript
{
  "v": "1.0",                    // Schema version
  "src": "api-node",             // Source service
  "type": "alerts:critical",     // Event type
  "ts": 1738512045123,           // Unix timestamp (ms)
  "id": "a1b2c3d4",              // Unique ID (8 chars)
  "data": {                      // Event payload
    "severity": "critical",
    "msg": "Battery at 5%"
  }
}
```

---

## Known Limitations

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
