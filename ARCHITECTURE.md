# Architecture Documentation

**Lazaro: Event-Driven Microservices on Android**

This document explains the architectural decisions, trade-offs, and design patterns used in Lazaro. Written for engineers who need to understand, maintain, or extend the system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [Event Flow](#event-flow)
4. [Key Architectural Decisions](#key-architectural-decisions)
5. [Trade-offs and Constraints](#trade-offs-and-constraints)
6. [Failure Modes](#failure-modes)
7. [Extension Points](#extension-points)
8. [Future Considerations](#future-considerations)

---

## System Overview

### Design Philosophy

Lazaro is built on three principles:

1. **Event-driven over request-response**: Services communicate via Redis Pub/Sub, not HTTP. This reduces coupling and latency.
2. **Android-aware**: The system adapts to Android constraints (Doze Mode, thermal throttling, OOM).
3. **Simplicity over features**: 300 lines of custom code beats 3 dependencies. No frameworks unless absolutely necessary.

### Deployment Context

```
Environment:  Debian-based userland (Debian/Ubuntu, UserLAnd)
Resources:    1-4GB RAM, 1-4 CPU cores (resource-constrained)
Network:      LAN only (no public exposure)
Uptime:       Best-effort (not 99.9%)
```

This is **not** a traditional server. Android will:

- Kill processes when RAM is low
- Throttle CPU when temperature >40°C
- Block network when in Doze Mode (screen off >30min)
- Restart Termux on app swipe

The architecture accounts for these constraints.

---

## Core Components

### 1. Redis Event Bus

**Purpose**: Central nervous system for inter-service communication.

**Technology**: Redis 7.x in Pub/Sub mode (not Streams, not Lists).

**Why Redis**:

- **Lightweight**: 10-15MB RAM footprint (vs RabbitMQ 200MB, Kafka 500MB)
- **Simple**: No configuration, no partitions, no consumer groups
- **Fast**: <1ms publish latency on localhost
- **Multipurpose**: Can also be used for caching, state storage, DLQ

**Configuration**:

```bash
# Binds to localhost only (security)
bind 127.0.0.1

# No password (acceptable for localhost-only)
requirepass ""

# No persistence (events are ephemeral)
save ""
appendonly no
```

**Trade-off**: Pub/Sub is **fire-and-forget**. If a subscriber is down, events are lost. This is acceptable because:

- Events are mostly informational (metrics, alerts)
- Critical state is persisted elsewhere (PM2 config, filesystem)
- Subscribers restart quickly (<5s)

---

### 2. PM2 Process Manager

**Purpose**: Orchestrate heterogeneous services (Node.js, Python, Bash).

**Why PM2**:

- **Polyglot**: Runs Node, Python, shell scripts without containers
- **Auto-restart**: Handles crashes gracefully
- **Logging**: Separate stdout/stderr per service
- **Lightweight**: ~20MB RAM overhead

**Configuration Pattern**:

```javascript
{
  name: "service-name",
  script: "./path/to/script.js",
  interpreter: "node",              // or "python3", "bash"
  max_memory_restart: "150M",       // Prevent OOM
  min_uptime: 10000,                // Avoid crash loops
  max_restarts: 10,                 // Circuit breaker
  restart_delay: 5000,              // Backoff
  error_file: "./logs/error.log",
  out_file: "./logs/out.log"
}
```

**Trade-off**: PM2 is not Kubernetes. No service discovery, no health checks, no rolling deploys. On Debian `systemd` is the preferred supervisor; PM2 remains an optional, polyglot process manager for environments where `systemd` is not available.

---

### 3. Shared Library (`shared/`)

**Purpose**: DRY for common functionality across services.

**Structure**:

```
shared/
├── index.js              # Entry point
├── lib/
│   ├── redisClient.js    # Singleton Redis connections
│   ├── metrics.js        # Instrumentation
│   ├── logger.js         # Structured logging
│   ├── sanitizer.js      # Data sanitization
│   └── eventValidator.js # Event schema validation
└── package.json
```

**Design Pattern**: Singleton for Redis connections to avoid connection exhaustion.

```javascript
// shared/lib/redisClient.js
let publisher = null;
let subscriber = null;

function getPublisher() {
  if (!publisher) {
    publisher = new Redis(redisConfig);
  }
  return publisher;
}
```

**Trade-off**: Global singletons make testing harder, but reduce memory footprint (1 connection vs N connections per service).

---

### 4. Services

#### `api-node` (System Telemetry)

**Responsibilities**:

- Collect system metrics (CPU, RAM, battery, temperature)
- Publish metrics to Redis (`system:metrics`)
- Expose HTTP API for dashboard (`/api/stats`)
- Monitor external services (currently disabled for ARGOS)

**Tech Stack**: Express.js, os-utils, axios

**Event Flow**:

```
Every 60s:
  1. Read CPU/RAM/battery from OS
  2. Publish to 'system:metrics'
  3. Check thresholds (battery <10%, RAM >90%)
  4. If critical → publish to 'alerts:critical'
```

**Key Decision**: Metrics are **pushed** to Redis, not pulled. This allows any service to consume them without HTTP coupling.

---

#### `telegram-bot` (Alerting & Control)

**Responsibilities**:

- Subscribe to `alerts:critical`, `alerts:warning`
- Send Telegram messages to configured chat
- Handle commands (`/status`, `/logs`)
- Publish heartbeat (`system:heartbeat`)

**Tech Stack**: Telegraf (Telegram bot framework)

**Event Flow**:

```
On 'alerts:critical':
  1. Validate event structure
  2. Sanitize message (remove tokens, IPs)
  3. Send to Telegram
  4. Log to file

On '/status' command:
  1. Fetch from 'http://localhost:3000/api/stats'
  2. Format as Markdown
  3. Reply to user
```

**Key Decision**: Bot uses **both** events (for alerts) and HTTP (for commands). This is pragmatic:

- Events: Low-latency, decoupled (for alerts)
- HTTP: Synchronous, simple (for user commands)

**Trade-off**: Mixing paradigms is not pure, but it works. HTTP for request-response, events for fire-and-forget.

---

#### `api-python` (Data Processing)

**Status**: Currently a placeholder (returns static JSON).

**Intended Purpose**: Heavy data processing (ML inference, data analysis) that's better suited for Python than Node.js.

**Tech Stack**: Flask

**Trade-off**: Keeping this service running consumes ~50MB RAM for no benefit. Should be removed or implemented.

---

### 5. Dashboard (Static HTML)

**Purpose**: Visual monitoring without SSH.

**Tech Stack**: Vanilla HTML/CSS/JS (no React, no build step).

**Endpoints**:

- `/` → Dashboard UI
- `/api/stats` → System metrics (JSON)
- `/api/health` → Health check

**Key Decision**: No framework. A 200-line HTML file is easier to maintain than a React app in this context.

---

## Event Flow

### Example: Battery Critical Alert

```
┌─────────────┐
│  api-node   │
│ (telemetry) │
└──────┬──────┘
       │ 1. Detect battery <10%
       │
       ▼
┌─────────────────────────────────┐
│ publisher.publish(              │
│   'alerts:critical',            │
│   { msg: 'Battery at 5%' }      │
│ )                               │
└──────┬──────────────────────────┘
       │ 2. Publish to Redis
       ▼
┌─────────────┐
│    Redis    │  ← Event Bus
│  (Pub/Sub)  │
└──────┬──────┘
       │ 3. Broadcast to subscribers
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ telegram-bot│   │ logger      │
└──────┬──────┘   └──────┬──────┘
       │                 │
       │ 4. Send msg     │ 5. Write to file
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Telegram   │   │ logs/*.jsonl│
│     API     │   │             │
└─────────────┘   └─────────────┘
```

**Latency Breakdown**:

- Detect → Publish: <1ms
- Publish → Receive: <5ms
- Receive → Telegram: 100-500ms (network)
- **Total: <500ms** (vs 60s with polling)

---

### Event Schema

**Envelope** (mandatory fields):

```javascript
{
  "v": "1.0",              // Schema version (semver)
  "src": "api-node",       // Source service
  "type": "alerts:critical", // Event type (channel)
  "ts": 1738512045123,     // Unix timestamp (ms)
  "id": "a1b2c3d4",        // Unique ID (8 chars hex)
  "data": { ... }          // Event-specific payload
}
```

**Naming Convention**:

```
{domain}:{severity}[:{entity}]

Examples:
- system:heartbeat
- alerts:critical
- hardware:battery
- commands:service
```

**Validation**: Events are validated on receipt using `shared/lib/eventValidator.js`. Invalid events are logged and discarded.

**Versioning**: `v` field allows schema evolution. Handlers can support multiple versions:

```javascript
switch (event.v) {
  case "1.0":
    return handleV1(event);
  case "2.0":
    return handleV2(event);
  default:
    throw new Error("Unsupported version");
}
```

---

## Key Architectural Decisions

### Decision 1: Redis Pub/Sub over HTTP Polling

**Context**: Services need to communicate. Options:

1. HTTP polling (every 60s)
2. WebSockets
3. Redis Pub/Sub
4. Message queue (RabbitMQ, Kafka)

**Decision**: Redis Pub/Sub

**Rationale**:

- **Latency**: <5ms vs 60s (polling) or 100ms (HTTP request)
- **Coupling**: Services don't know each other's IPs/ports
- **Resource usage**: 10MB RAM (Redis) vs 200MB (RabbitMQ) vs 500MB (Kafka)
- **Simplicity**: 0 configuration, no partitions, no consumer groups

**Trade-off**: No delivery guarantees. Events can be lost if subscriber is down. Acceptable for non-critical alerts.

**When to reconsider**: If you need guaranteed delivery, migrate to Redis Streams (same Redis, different primitive).

---

### Decision 2: No Authentication on Local APIs

**Context**: `api-node` exposes `/api/stats` without auth.

**Decision**: No authentication

**Rationale**:

- **Threat model**: LAN-only deployment, single-user device
- **Complexity**: Auth adds overhead (JWT, sessions, API keys)
- **Data sensitivity**: CPU/RAM metrics are not secrets

**Trade-off**: Anyone on LAN can access metrics. Acceptable for home network.

**When to reconsider**: If exposing to Internet or multi-user environment.

---

### Decision 3: Logs as JSON Lines (not structured logging library)

**Context**: Need parseable logs for debugging.

**Decision**: Custom logger writing JSON to `.jsonl` files.

**Rationale**:

- **Simplicity**: 60 lines of code vs Pino (5MB) or Winston (10MB)
- **Parseability**: `grep` works on JSON lines
- **Performance**: No serialization overhead

**Trade-off**: No log levels filtering, no transports (file only). Acceptable for this scale.

**When to reconsider**: If you need centralized logging (ELK, Splunk), use a library.

---

### Decision 4: PM2 over Docker

**Context**: Need process orchestration.

**Decision**: PM2

**Rationale**:

- **Termux compatibility**: Docker on Android is complex/broken
- **Resource usage**: PM2 ~20MB vs Docker ~100MB+
- **Polyglot**: PM2 runs Node, Python, Bash natively
- **Simplicity**: No Dockerfiles, no image builds

**Trade-off**: No isolation, no resource limits (cgroups). Acceptable for trusted code.

**When to reconsider**: Never. Docker is not viable on Android.

---

### Decision 5: Telegram as Primary UI

**Context**: Need monitoring/control interface.

**Decision**: Telegram bot over web dashboard.

**Rationale**:

- **Accessibility**: Works from anywhere (no VPN needed)
- **Push notifications**: Telegram delivers alerts instantly
- **No frontend**: No React, no build step, no state management
- **Mobile-first**: Better UX on phone than web UI

**Trade-off**: Requires internet connection. Dashboard still exists for LAN-only scenarios.

---

## Trade-offs and Constraints

### 1. Event Loss is Acceptable

**Trade-off**: Redis Pub/Sub is fire-and-forget. If a subscriber is down, events are lost.

**Why acceptable**:

- Most events are informational (metrics, logs)
- Critical state is persisted (PM2 config, filesystem)
- Subscribers restart quickly (<5s)

**Mitigation**:

- Heartbeat events detect missing subscribers
- DLQ (Dead Letter Queue) for failed event processing
- Logs capture all published events

**When to reconsider**: If events represent transactions (payments, orders), migrate to Redis Streams or a proper queue.

---

### 2. No Distributed Tracing

**Trade-off**: No Jaeger, Zipkin, or OpenTelemetry.

**Why acceptable**:

- Only 3-5 services (not 50)
- Event IDs allow manual tracing via logs
- Overhead (50-100MB RAM) is too high for Android

**Mitigation**:

- Structured logging with event IDs
- Correlation via `grep "eventId:a1b2c3d4" logs/*.jsonl`

**When to reconsider**: Never on Android. If you need tracing, move to a real server.

---

### 3. Single Point of Failure (Redis)

**Trade-off**: If Redis dies, the entire event system collapses.

**Why acceptable**:

- Redis is stable (rarely crashes)
- Restart is fast (<2s)
- Watchdog script auto-restarts Redis

**Mitigation**:

- Health check monitors Redis (`redis-cli ping`)
- Fallback: Direct Telegram send (bypass Redis)
- PM2 auto-restarts services on Redis recovery

**When to reconsider**: If uptime SLA >99%, use Redis Sentinel (but not viable on Android).

---

### 4. No Encryption (HTTP, Redis)

**Trade-off**: All communication is plaintext.

**Why acceptable**:

- LAN-only deployment (trusted network)
- Overhead: TLS adds latency and CPU usage
- Complexity: Self-signed certs are painful

**Mitigation**:

- Bind services to `127.0.0.1` or LAN IP only
- Use VPN if accessing from outside LAN

**When to reconsider**: If exposing to Internet, add reverse proxy with TLS (nginx, Caddy).

---

### 5. No Horizontal Scaling

**Trade-off**: Can't run multiple instances of a service for load balancing.

**Why acceptable**:

- Single Android device (no cluster)
- Throughput is limited by hardware (~100 events/s)
- Pub/Sub broadcasts to all instances (no load distribution)

**Mitigation**:

- Use Redis Streams with consumer groups if you need scaling
- Or migrate to a real server

**When to reconsider**: If you need >1000 events/s, Android is not the right platform.

---

## Failure Modes

### 1. Doze Mode (Network Blocked)

**Symptom**: Services stop receiving events after 30min screen-off.

**Root Cause**: Android blocks network in Doze Mode.

**Detection**:

```javascript
// DozeDetector monitors network latency
if (latency > 5000ms) {
  console.warn('Possible Doze Mode');
}
```

**Mitigation**:

- `termux-wake-lock` (prevents Doze)
- Whitelist Termux in battery settings
- Keep screen on (brillo mínimo)

**Recovery**: Automatic when screen turns on or device moves.

---

### 2. OOM Kill (Out of Memory)

**Symptom**: PM2 shows `exit code null` (killed by OS).

**Root Cause**: Android kills Termux when RAM is low.

**Detection**:

```javascript
// MemoryMonitor checks RAM usage
if (usedPercent > 90%) {
  console.warn('OOM kill imminent');
}
```

**Mitigation**:

- `max_memory_restart` in PM2 config
- `--max-old-space-size` for Node.js
- Garbage collection triggers

**Recovery**: PM2 auto-restarts killed processes.

---

### 3. Thermal Throttling (CPU Reduced)

**Symptom**: Event processing slows from 50ms to 500ms.

**Root Cause**: Android reduces CPU frequency when temp >40°C.

**Detection**:

```javascript
// ThermalMonitor reads battery temperature
if (temperature > 42) {
  console.warn("Thermal throttling likely");
}
```

**Mitigation**:

- Reduce monitoring frequency
- Disable non-essential services
- Improve physical ventilation

**Recovery**: Automatic when device cools.

---

### 4. Redis Crash

**Symptom**: All services log "Redis connection refused".

**Root Cause**: Redis process died (OOM, crash, manual kill).

**Detection**:

```javascript
// HealthChecker pings Redis
await redis.ping(); // Throws if down
```

**Mitigation**:

- Watchdog script restarts Redis
- PM2 restarts services after Redis recovers

**Recovery**: Automatic via watchdog (5min max downtime).

---

### 5. Process Kill (Termux Swiped)

**Symptom**: All services stop, PM2 daemon not running.

**Root Cause**: User swiped Termux from recents.

**Detection**: External monitoring (cron, Termux:Boot).

**Mitigation**:

- Termux:Boot auto-starts on device boot
- Cron watchdog checks every 5min

**Recovery**: Manual (reopen Termux) or automatic (Termux:Boot).

---

## Extension Points

### Adding a New Service

1. **Create service directory**:

```bash
mkdir services/my-service
cd services/my-service
npm init -y
```

2. **Implement service**:

```javascript
const { createService } = require("../../shared");

const service = createService({ name: "my-service" });

service.on("system:metrics", (event) => {
  // React to events
});

service.publish("my-service:status", { status: "ok" });

service.start();
```

3. **Register in PM2**:

```javascript
// ecosystem.config.js
{
  name: 'my-service',
  script: './services/my-service/index.js'
}
```

4. **Start**:

```bash
pm2 start ecosystem.config.js --only my-service
```

---

### Adding a New Event Type

1. **Define event schema**:

```javascript
// In service
publisher.publish('my-domain:action', JSON.stringify({
  v: '1.0',
  src: 'my-service',
  type: 'my-domain:action',
  ts: Date.now(),
  id: generateId(),
  data: { ... }
}));
```

2. **Document in README**:

```markdown
### Custom Events

- `my-domain:action` - Description of what this event represents
```

3. **Subscribe in other services**:

```javascript
subscriber.subscribe("my-domain:action");
subscriber.on("message", (channel, message) => {
  if (channel === "my-domain:action") {
    handleEvent(JSON.parse(message));
  }
});
```

---

### Adding a New Dashboard Widget

1. **Create API endpoint** (if needed):

```javascript
// api-node/index.js
app.get("/api/my-widget", (req, res) => {
  res.json({ data: getWidgetData() });
});
```

2. **Update HTML**:

```html
<!-- api-node/public/index.html -->
<div id="my-widget"></div>

<script>
  async function loadWidget() {
    const res = await fetch("/api/my-widget");
    const data = await res.json();
    document.getElementById("my-widget").innerHTML = renderWidget(data);
  }

  setInterval(loadWidget, 5000);
</script>
```

---

## Future Considerations

### When to Migrate from Pub/Sub to Streams

**Trigger**: You need one of:

- Event replay (read past events)
- Guaranteed delivery (at-least-once)
- Consumer groups (parallel processing)
- Backpressure (slow consumers)

**Migration Path**:

```javascript
// Pub/Sub (current)
publisher.publish("channel", message);

// Streams (future)
await redis.xadd("channel", "*", "data", message);
await redis.xreadgroup("GROUP", "consumer1", "STREAMS", "channel", ">");
```

**Impact**: Same Redis, minimal code changes, but more memory usage.

---

### When to Add Authentication

**Trigger**: You need one of:

- Multi-user access
- Internet exposure
- Audit trail (who did what)

**Recommendation**: Use API keys (simple) or JWT (standard).

```javascript
// Middleware
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).send("Unauthorized");
  }
  next();
});
```

---

### When to Move Off Android

**Trigger**: You need one of:

- 99.9% uptime SLA
- > 1000 events/second
- Multi-region deployment
- Compliance (GDPR, HIPAA)

**Migration Path**:

1. **Raspberry Pi**: Same architecture, better stability (~$50)
2. **VPS**: Cloud server (DigitalOcean, Linode) (~$5/month)
3. **Kubernetes**: If you really need it (overkill for this)

**Code changes**: Minimal. Remove Android-specific code (Doze detector, thermal monitor).

---

## Conclusion

Lazaro is a pragmatic event-driven system designed for Android's constraints. It prioritizes:

1. **Simplicity** over features
2. **Practicality** over purity
3. **Observability** over performance
4. **Honesty** over marketing

The architecture is **good enough** for personal projects and learning, but **not suitable** for production workloads.

If you need production-grade, move to a real server. If you need to learn event-driven architecture on a budget, this is perfect.

---

## References

- [Redis Pub/Sub Documentation](https://redis.io/docs/manual/pubsub/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Termux Wiki](https://wiki.termux.com/)
- [Android Doze Mode](https://developer.android.com/training/monitoring-device-state/doze-standby)

---

**Last Updated**: 2026-02-02  
**Maintainer**: See README for contact info
