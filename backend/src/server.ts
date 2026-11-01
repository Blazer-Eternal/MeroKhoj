import { createApp } from './app';
import { env, connection, closeConnection } from './config';
import { initializeModels } from './models';
import { reportCorsAllowList } from './config/cors';
import { jobAlertServices } from './services';

/**
 * Server bootstrap.
 *
 * Order: connect DB → initialize models/associations → report CORS allow-list
 * → start background workers → listen. Fails fast if the database is
 * unreachable.
 */

/** Interval handle for the job-alert dispatch worker. */
let jobAlertTimer: NodeJS.Timeout | null = null;

/**
 * Start the in-process job-alert worker. Every ALERT_DISPATCH_INTERVAL_MINUTES
 * it evaluates active alerts and notifies owners of newly-published matches.
 * Errors are swallowed per-alert inside the service so one bad alert can't
 * kill the loop.
 */
const startJobAlertWorker = (): void => {
  const intervalMs = env.app.alertDispatchIntervalMinutes * 60 * 1000;
  jobAlertTimer = setInterval(() => {
    void jobAlertServices
      .dispatchDueAlerts()
      .then((dispatched) => {
        if (dispatched > 0) {
          console.log(`[job-alerts] dispatched ${dispatched} alert(s)`);
        }
      })
      .catch((error) => console.error('[job-alerts] dispatch run failed:', error));
  }, intervalMs);
  // Don't let the worker keep the process alive on its own.
  jobAlertTimer.unref?.();
  console.log(`✔ Job-alert worker scheduled every ${env.app.alertDispatchIntervalMinutes}m`);
};

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

    // 4. Start background workers.
    startJobAlertWorker();

    // 5. Start listening.
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
  if (jobAlertTimer) clearInterval(jobAlertTimer);
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
