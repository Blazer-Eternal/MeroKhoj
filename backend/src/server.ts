import { createApp } from './app';
import { env, connection, closeConnection } from './config';
import { initializeModels } from './models';
import { reportCorsAllowList } from './config/cors';

/**
 * Server bootstrap.
 *
 * Order: connect DB → initialize models/associations → report CORS allow-list
 * → listen. Fails fast if the database is unreachable.
 */
const boot = async (): Promise<void> => {
  try {
    // 1. Connect to PostgreSQL.
    await connection();
    console.log('✔ Database connected');

    // 2. Initialize Sequelize models + associations.
    initializeModels();
    console.log('✔ Models initialized');

    // 3. Report the CORS allow-list so misconfiguration is visible at boot.
    console.log(`✔ CORS allow-list: ${reportCorsAllowList().join(', ')}`);

    // 4. Start listening.
    const app = createApp();
    app.listen(env.app.port, () => {
      console.log(
        `✔ ${env.app.name} API listening on http://localhost:${env.app.port} (${env.nodeEnv})`,
      );
      console.log(`  Docs: http://localhost:${env.app.port}/api/docs`);
    });
  } catch (error) {
    console.error('✖ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown on SIGINT/SIGTERM.
const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  await closeConnection();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

// Surface unhandled rejections instead of silently continuing.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

void boot();
