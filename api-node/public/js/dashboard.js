async function updateDashboard() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        // Update CPU
        document.getElementById('cpu-val').innerText = `${data.cpu.usage}%`;
        document.getElementById('cpu-bar').style.width = `${data.cpu.usage}%`;

        // Update RAM
        document.getElementById('ram-val').innerText = `${data.ram.percent}%`;
        document.getElementById('ram-bar').style.width = `${data.ram.percent}%`;
        document.getElementById('ram-footer').innerText = `${data.ram.used}MB / ${data.ram.total}MB`;

        // Status Update
        if (data.services.python) {
            document.getElementById('py-status').innerText = 'Activo :5000';
            document.getElementById('py-status').style.color = 'var(--success)';
        } else {
            document.getElementById('py-status').innerText = 'Desconectado';
            document.getElementById('py-status').style.color = '#ff4b2b';
        }

        addLog('Sincronización de datos completada');

    } catch (error) {
        console.error('Error fetching stats:', error);
        addLog('Error: No se pudo conectar con la API de Lazaro');
    }
}

function addLog(msg) {
    const logContainer = document.getElementById('logs');
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.innerHTML = `<span style="color: var(--accent)">[${time}]</span> ${msg}`;
    logContainer.prepend(entry);
    
    // Keep only last 20 logs
    if (logContainer.children.length > 20) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

// Initial update and periodic refresh
updateDashboard();
setInterval(updateDashboard, 5000);
