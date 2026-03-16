import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: (process.env.JWT_SECRET || 'default-secret-change-this') as string,
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};
