# Lazaro: Universal Android Backend Engine 📱🚀

**Lazaro** transforma cualquier dispositivo Android en un servidor backend de grado profesional. Diseñado para ejecutarse sobre **Termux**, permite desplegar microservicios, bases de datos y herramientas de automatización en hardware móvil.

---

## 🔥 Novedades Recientes

- **📊 Premium Dashboard:** Panel visual con estética Glassmorphism para monitorear CPU, RAM y Batería en tiempo real (`http://localhost:3000`).
- **🤖 Telegram Guardian:** Bot integrado (`@Argos_medalcode_bot`) con alertas proactivas de energía y salud de servicios.
- **🛡️ Backup System:** Scripts automáticos para respaldo de bases de datos y configuraciones.
- **📈 ARGOS Integration:** Monitoreo nativo para el bot de trading ARGOS.

---

## ⚡ Instalación Rápida

Para convertir tu equipo en un servidor en minutos, abre Termux y pega este comando:

```bash
chmod +x install.sh && ./install.sh
```

---

## 🏗️ Arquitectura del Sistema

El proyecto es modular y convive perfectamente con otros proyectos como ARGOS:

- **🟢 Node.js Core (`:3000`):** Motor principal, Dashboard y API de Telemetría.
- **🐍 Python Data (`:5000`):** Procesamiento de datos y scripts de análisis.
- **🤖 Telegram Bridge:** Alertas al celular sobre el estado del hardware y ARGOS.
- **⚙️ PM2 Orchestrator:** Gestión inteligente de procesos y auto-reinicio.

---

## 📂 Servicios Incluidos

| Servicio           | Puerto | Descripción                   |
| :----------------- | :----- | :---------------------------- |
| **Dashboard**      | 3000   | Interfaz web de monitoreo     |
| **Python Service** | 5000   | API de procesamiento          |
| **ARGOS Bot**      | 8000   | Integración visual de trading |
| **Telegram Bot**   | -      | Alertas proactivas al móvil   |

---

## 🔄 Automatización e Integración

### Alertas de Telegram

El bot integrado te avisará si:

1. La batería baja del **15%**.
2. El bot **ARGOS** se detiene.
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

> **Nota:** Diseñado para Android 7.0+ con Termux. No interfiere con el uso normal del dispositivo.
