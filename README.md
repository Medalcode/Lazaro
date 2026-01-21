# Lazaro: Universal Android Backend Engine 📱🚀

**Lazaro** transforma cualquier dispositivo Android en un servidor backend de grado profesional. Diseñado para ejecutarse sobre **Termux**, permite desplegar microservicios, bases de datos y herramientas de automatización en hardware móvil.

---

## 🔥 Novedades Recientes

- **📊 Premium Dashboard:** Panel visual con estética Glassmorphism para monitorear CPU, RAM y Batería en tiempo real (`http://localhost:3000`).
- **🤖 Telegram Guardian:** Bot integrado (`@Argos_medalcode_bot`) con alertas proactivas de energía y salud de servicios.
- **🛡️ Backup System:** Scripts automáticos para respaldo de bases de datos y configuraciones.
- **📈 ARGOS Orchestration:** Gestión y ejecución nativa del bot de trading ARGOS vía PM2.

---

## ⚡ Instalación Rápida

Para convertir tu equipo en un servidor en minutos, abre Termux y pega este comando:

```bash
chmod +x install.sh && ./install.sh
```

---

## 🏗️ Arquitectura del Sistema

El proyecto actúa como un sistema operativo de servicios para tu Android:

- **🟢 Node.js Core (`:3000`):** Motor principal, Dashboard y API de Telemetría.
- **🐍 Python Data (`:5000`):** Procesamiento de datos y scripts de análisis.
- **🤖 Telegram Bridge:** Alertas al celular sobre el estado del hardware y ARGOS.
- **⚙️ PM2 Orchestrator:** Mantiene vivos a Lazaro y a ARGOS simultáneamente.

---

## 📂 Servicios Incluidos

| Servicio           | Puerto | Descripción                  |
| :----------------- | :----- | :--------------------------- |
| **Dashboard**      | 3000   | Interfaz web de monitoreo    |
| **Python Service** | 5000   | API de procesamiento         |
| **ARGOS Bot**      | -      | Proceso de trading (Backend) |
| **ARGOS Dash**     | 8000   | Interfaz visual de trading   |
| **Telegram Bot**   | -      | Alertas proactivas al móvil  |

---

## 🔄 Automatización e Integración

### Alertas de Telegram

El bot integrado te avisará si:

1. La batería baja del **15%**.
2. El bot **ARGOS** se detiene o su API deja de responder.
3. El servidor sufre una caída de servicios.

### Sistema de Backups

Ejecuta manualmente o vía cron:

```bash
./scripts/backup.sh
```

---

## 🛠️ Comandos de Gestión

- **Iniciar todo:** `pm2 start ecosystem.config.js`
- **Ver estado:** `pm2 status`
- **Logs en tiempo real:** `pm2 logs`

---

> **Nota:** Diseñado para Android 7.0+ con Termux.
