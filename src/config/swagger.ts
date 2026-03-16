import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ultimate Frisbee API',
      version: '1.0.0',
      description: 'API REST pour la gestion d\'un club d\'Ultimate Frisbee',
      contact: {
        name: 'M2 IL - ISTIC Université de Rennes',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /api/auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'COACH', 'ATHLETE'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Athlete: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            category: { type: 'string', enum: ['JUNIOR', 'SENIOR', 'VETERAN'] },
            level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Coach: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Session: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            type: { type: 'string', enum: ['TRAINING', 'MATCH', 'OTHER'] },
            coachId: { type: 'string', format: 'uuid' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            description: { type: 'string' },
            isRecurrent: { type: 'boolean' },
            recurrence: { type: 'string', enum: ['daily', 'weekly', 'monthly'], nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Activity: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sessionId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            theme: { 
              type: 'string', 
              enum: ['WARM_UP', 'TECHNIQUE', 'THROWING', 'CATCHING', 'DEFENSE', 'OFFENSE', 'STRATEGY', 'PHYSICAL', 'COMPETITION', 'COOL_DOWN', 'OTHER'] 
            },
            description: { type: 'string' },
            duration: { type: 'integer', description: 'Durée en minutes' },
            order: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Group: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['COMPETITION', 'TRAINING', 'LEISURE'] },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
