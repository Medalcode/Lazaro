module.exports = {
  apps : [{
    name   : "node-chat",
    script : "./api-node/index.js",
    env: {
      NODE_ENV: "production",
    }
  }, {
    name   : "python-data",
    script : "./api-python/app.py",
    interpreter: "python3"
  }]
}
