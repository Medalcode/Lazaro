const express = require('express');
const os = require('os');
const osUtils = require('os-utils');
const axios = require('axios');
const path = require('path');
const { redisClient } = require('../shared');

const app = express();
const port = 3000;

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// --- MONITOR SYSTEM (NEW) ---
const publisher = redisClient.getPublisher();
const MONITOR_INTERVAL = 60000;
let argosPreviouslyDown = false;

setInterval(async () => {
    try {
        await axios.get('http://localhost:8000/api/history', { timeout: 2000 });
        if (argosPreviouslyDown) {
            publisher.publish('alerts:critical', JSON.stringify({ msg: 'ARGOS Service Restored ✅' }));
            argosPreviouslyDown = false;
        }
    } catch (e) {
        if (!argosPreviouslyDown) { // Only alert once per downtime
            console.error('Monitor: Argos is down');
            publisher.publish('alerts:critical', JSON.stringify({ msg: 'ARGOS Service Unreachable ❌\nCheck PM2 logs.' }));
            argosPreviouslyDown = true;
        }
    }
}, MONITOR_INTERVAL);

// API for Dashboard Stats
app.get('/api/stats', (req, res) => {
    osUtils.cpuUsage(async (v) => {
        const cpuUsage = (v * 100).toFixed(1);
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
        const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
        const usedMem = (totalMem - freeMem).toFixed(0);
        const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

        // Check Python Service Status
        let pythonActive = false;
        try {
            const pyRes = await axios.get('http://localhost:5000/', { timeout: 1000 });
            if (pyRes.status === 200) pythonActive = true;
        } catch (e) {
            pythonActive = false;
        }

        res.json({
            cpu: { usage: cpuUsage },
            ram: { 
                total: totalMem, 
                used: usedMem, 
                percent: memPercent 
            },
            services: {
                node: true,
                python: pythonActive
            },
            uptime: os.uptime(),
            timestamp: new Date().toISOString()
        });
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', service: 'Lazaro Node Core' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Lazaro Dashboard active at http://localhost:${port}`);
});
