// PM2 ecosystem config for Pilgrim's Path on Hostinger VPS
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name:         'pilgrimspath',
      script:       'server.js',
      cwd:          '/var/www/pilgrimspath',
      instances:    1,         // increase to 'max' once RAM allows
      exec_mode:    'fork',
      watch:        false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV:   'production',
        PORT:       '3000',
      },
      // env vars are loaded from .env via dotenv in server.js
      // Log files
      out_file:   '/var/www/pilgrimspath/logs/out.log',
      error_file: '/var/www/pilgrimspath/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
