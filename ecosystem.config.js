module.exports = {
  apps: [
    {
      name: 'interactive-avatar',
      script: 'npm',
      args: 'start',
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 5000,
      out_file: 'logs/interactive-avatar/normal.log',
      error_file: 'logs/interactive-avatar/error.log',
      combine_logs: true,
    },
  ]
};