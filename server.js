const app = require('./src/app');
const config = require('./src/config');
const db = require('./src/config/database');

const start = async () => {
  await db.connect();

  const server = app.listen(config.port, () => {
    console.log(`
╔════════════════════════════════════════╗
║          AUTH API SERVER               ║
╠════════════════════════════════════════╣
║  Status  : Running                     ║
║  Env     : ${config.env.padEnd(28)}║
║  Port    : ${String(config.port).padEnd(28)}║
║  DB      : PostgreSQL (auth_db)        ║
║  Schemas : primary + secondary         ║
╚════════════════════════════════════════╝
    `);
  });

  const shutdown = async (signal) => {
    console.log(`\n[${signal}] Shutting down gracefully...`);
    server.close(async () => {
      await db.disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    console.error('[unhandledRejection]', err);
    shutdown('unhandledRejection');
  });

  return server;
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

module.exports = { start };
