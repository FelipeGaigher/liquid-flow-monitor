import express from 'express';
import cors from 'cors';
import { env, validateEnv } from './config/env.js';
import { logger } from './utils/logger.js';
import { testConnection } from './config/database.js';

const app = express();

// Middlewares
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      code: 'INTERNAL_ERROR',
    },
  });
});

// Start server
async function start() {
  try {
    validateEnv();

    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('Database connection failed, starting without database');
    } else {
      logger.info('Database connected');
    }

    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export { app };
