import express from 'express';
import cors from 'cors';
import { env, validateEnv } from './config/env.js';
import { logger } from './utils/logger.js';
import { testConnection } from './config/database.js';
import { authService } from './services/auth.service.js';
import { auditLogsService } from './services/audit-logs.service.js';

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

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: { message: 'Token ausente', code: 'UNAUTHORIZED' } });
  }

  const token = header.replace('Bearer ', '');
  try {
    const payload = authService.verifyAccessToken(token);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Acesso negado', code: 'FORBIDDEN' } });
    }
    return next();
  } catch (error) {
    return res.status(401).json({ error: { message: 'Token invalido', code: 'UNAUTHORIZED' } });
  }
};

app.get('/api/audit-logs', requireAdmin, async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const startDate = req.query.start_date ? new Date(String(req.query.start_date)) : undefined;
    const endDate = req.query.end_date ? new Date(String(req.query.end_date)) : undefined;

    const result = await auditLogsService.findAll(
      {
        user_id: req.query.user_id ? String(req.query.user_id) : undefined,
        action: req.query.action ? String(req.query.action) as any : undefined,
        entity: req.query.entity ? String(req.query.entity) : undefined,
        entity_id: req.query.entity_id ? String(req.query.entity_id) : undefined,
        start_date: startDate,
        end_date: endDate,
      },
      page,
      limit
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
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
