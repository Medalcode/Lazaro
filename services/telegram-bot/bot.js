const { Telegraf } = require('telegraf');
const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('❌ ERROR: TELEGRAM_BOT_TOKEN no definido en .env');
    process.exit(1);
}

const bot = new Telegraf(token);

// Configuración de alertas
const ALERT_CONFIG = {
    batteryThreshold: 15,
    checkInterval: 60000, 
    chatId: null 
};

// Comando de inicio
bot.start((ctx) => {
    ALERT_CONFIG.chatId = ctx.chat.id;
    ctx.reply('🚀 Lazaro & Argos Bridge Activo\n\nLas alertas de sistema están configuradas:\n- Batería < 15%\n- Caída de Servicios\n\nComandos:\n/status - Estado del Servidor\n/argos - Resumen de Trading');
});

// Función para obtener info de batería en Termux
function getBatteryInfo() {
    return new Promise((resolve) => {
        exec('termux-battery-status', (error, stdout) => {
            if (error) {
                resolve(null);
                return;
            }
            try {
                resolve(JSON.parse(stdout));
            } catch (e) {
                resolve(null);
            }
        });
    });
}

// Sistema de Alertas Proactivas
async function checkSystemHealth() {
    if (!ALERT_CONFIG.chatId) return;

    try {
        // 1. Check Batería
        const bat = await getBatteryInfo();
        if (bat && bat.percentage < ALERT_CONFIG.batteryThreshold && bat.status !== 'CHARGING') {
            bot.telegram.sendMessage(ALERT_CONFIG.chatId, `⚠️ *ALERTA DE ENERGÍA*\nBatería crítica: ${bat.percentage}%\nEl servidor podría apagarse pronto.`);
        }

        // 2. Check ARGOS (Puerto 8000)
        try {
            await axios.get('http://localhost:8000/api/history', { timeout: 2000 });
        } catch (e) {
            bot.telegram.sendMessage(ALERT_CONFIG.chatId, `🚨 *ALERTA CRÍTICA*\nEl bot de trading ARGOS no responde en el puerto 8000.\nRevisa PM2 inmediatamente.`);
        }

    } catch (err) {
        console.error('Error en health check:', err.message);
    }
}

// Iniciar monitoreo cada minuto
setInterval(checkSystemHealth, ALERT_CONFIG.checkInterval);

// --- COMANDOS ---

bot.command('status', async (ctx) => {
    try {
        const res = await axios.get('http://localhost:3000/api/stats');
        const { cpu, ram, uptime } = res.data;
        const bat = await getBatteryInfo();
        
        const hours = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);

        let message = `📱 *Estado del Servidor*\n\n` +
            `⚡ *CPU:* ${cpu.usage}%\n` +
            `🧠 *RAM:* ${ram.percent}% (${ram.used}MB / ${ram.total}MB)\n` +
            `⏱️ *Uptime:* ${hours}h ${mins}m\n`;
        
        if (bat) {
            message += `🔋 *Batería:* ${bat.percentage}% (${bat.status})\n`;
        }
        
        message += `🟢 *Lazaro:* Online`;
        
        ctx.replyWithMarkdown(message);
    } catch (error) {
        ctx.reply('⚠️ Error conectando con Lazaro Core API.');
    }
});

bot.command('argos', async (ctx) => {
    try {
        // Usamos el endpoint de history de Argos como check de vida
        await axios.get('http://localhost:8000/api/history');
        ctx.replyWithMarkdown(`📊 *Resumen ARGOS*\n\n*Status:* Online 🟢\n*Dashboard:* http://localhost:8000\n\n_Usa /status para ver el hardware._`);
    } catch (error) {
        ctx.reply('⚠️ ARGOS Offline o Dashboard no activo en el puerto 8000.');
    }
});

bot.launch()
    .then(() => console.log('🤖 Guardián de Lazaro conectado exitosamente'))
    .catch(err => console.error('Error al lanzar bot:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
