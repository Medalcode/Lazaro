const { Telegraf } = require('telegraf');
const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { redisClient } = require('../../shared');

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

// Función para obtener info de batería: intenta termux, luego acpi, si no disponible devuelve null
function getBatteryInfo() {
    return new Promise((resolve) => {
        // Intentar comando Termux primero (si existe)
        exec('termux-battery-status', (error, stdout) => {
            if (!error && stdout) {
                try {
                    resolve(JSON.parse(stdout));
                    return;
                } catch (e) {
                    // caerá al siguiente intento
                }
            }

            // Intentar comando acpi (común en Linux de escritorio/embedded)
            exec('acpi -b', (err2, out2) => {
                if (err2 || !out2) {
                    resolve(null);
                    return;
                }
                // Ejemplo de salida: "Battery 0: Discharging, 87%, 02:13:44 remaining"
                const m = out2.match(/([0-9]{1,3})%/);
                const status = out2.includes('Charging') ? 'CHARGING' : out2.includes('Discharging') ? 'DISCHARGING' : 'UNKNOWN';
                resolve({ percentage: m ? parseInt(m[1], 10) : null, status });
            });
        });
    });
}

// --- SCALABLE ARCHITECTURE: EVENT DRIVEN ---
const subscriber = redisClient.getSubscriber();

subscriber.subscribe('alerts:critical', (err, count) => {
    if (err) {
        console.error('❌ Redis Subscribe Error:', err);
    } else {
        console.log('✅ Listening to alerts:critical');
    }
});

subscriber.on('message', (channel, message) => {
    if (channel === 'alerts:critical' && ALERT_CONFIG.chatId) {
        try {
            const data = JSON.parse(message);
            const alertText = data.text || data.msg || JSON.stringify(data);
            bot.telegram.sendMessage(ALERT_CONFIG.chatId, `🚨 *ALERTA CRÍTICA*\n\n${alertText}`);
        } catch (e) {
            console.error('Error parsing alert:', e);
            bot.telegram.sendMessage(ALERT_CONFIG.chatId, `🚨 *ALERTA RAW*\n${message}`);
        }
    }
});

// Legacy Local Battery Check (To be moved to Hardware Service)
async function checkLocalBattery() {
    if (!ALERT_CONFIG.chatId) return;
    const bat = await getBatteryInfo();
    if (bat && bat.percentage < ALERT_CONFIG.batteryThreshold && bat.status !== 'CHARGING') {
         // Publish to oneself? Or just send.
         bot.telegram.sendMessage(ALERT_CONFIG.chatId, `⚠️ *ALERTA DE ENERGÍA*\nBatería crítica: ${bat.percentage}%\nEl servidor podría apagarse pronto.`);
    }
}

// Check Battery every minute (Local Worker)
setInterval(checkLocalBattery, ALERT_CONFIG.checkInterval);

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
