import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'liquid_flow_monitor',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:8080',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Email
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'console',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@tankcontrol.local',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'TankControl',
  EMAIL_ALERT_RECIPIENTS: process.env.EMAIL_ALERT_RECIPIENTS || '',
  APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:5173',
};

export function validateEnv(): void {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

  if (env.NODE_ENV === 'production') {
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    if (env.EMAIL_PROVIDER === 'sendgrid') {
      const emailRequired = ['SENDGRID_API_KEY', 'EMAIL_FROM'];
      for (const key of emailRequired) {
        if (!process.env[key]) {
          throw new Error(`Missing required environment variable: ${key}`);
        }
      }
    }
  }
}
