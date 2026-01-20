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
