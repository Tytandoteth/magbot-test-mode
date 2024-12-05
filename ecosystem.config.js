module.exports = {
  apps: [{
    name: 'magnifycash-bot',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/magnifycash-bot/error.log',
    out_file: '/var/log/magnifycash-bot/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_restarts: 10,
    restart_delay: 4000,
    wait_ready: true
  }]
};