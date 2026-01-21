module.exports = {
  apps : [
    // --- SERVICIOS LAZARO ---
    {
      name   : "lazaro-node",
      script : "./api-node/index.js",
      cwd    : "/home/medalcode/Documentos/GitHub/Lazaro",
      log_date_format : "YYYY-MM-DD HH:mm Z",
      error_file : "./logs/node-error.log",
      out_file : "./logs/node-out.log"
    },
    {
      name   : "lazaro-python",
      script : "./api-python/app.py",
      interpreter: "python3",
      cwd    : "/home/medalcode/Documentos/GitHub/Lazaro",
      log_date_format : "YYYY-MM-DD HH:mm Z",
      error_file : "./logs/python-error.log",
      out_file : "./logs/python-out.log"
    },
    // --- ARGOS TRADING BOT ---
    {
      name   : "argos-bot",
      script : "main.py",
      interpreter: "python3",
      cwd    : "/home/medalcode/Documentos/GitHub/Argos",
      restart_delay: 5000,
      log_date_format : "YYYY-MM-DD HH:mm Z",
      error_file : "/home/medalcode/Documentos/GitHub/Lazaro/logs/argos-bot-error.log",
      out_file : "/home/medalcode/Documentos/GitHub/Lazaro/logs/argos-bot-out.log"
    },
    {
      name   : "argos-dashboard",
      script : "./scripts/start_argos_dashboard.sh",
      cwd    : "/home/medalcode/Documentos/GitHub/Lazaro",
      interpreter: "bash",
      log_date_format : "YYYY-MM-DD HH:mm Z",
      error_file : "./logs/argos-dash-error.log",
      out_file : "./logs/argos-dash-out.log"
    },
    // --- TELEGRAM BRIDGE ---
    {
      name   : "lazaro-bot",
      script : "./services/telegram-bot/bot.js",
      cwd    : "/home/medalcode/Documentos/GitHub/Lazaro",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
}
