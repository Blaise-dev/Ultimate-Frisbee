import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { config } from './config/config';
import { swaggerSpec } from './config/swagger';

// Import routes
import authRoutes from './routes/auth.routes';
import athleteRoutes from './routes/athlete.routes';
import coachRoutes from './routes/coach.routes';
import sessionRoutes from './routes/session.routes';
import activityRoutes from './routes/activity.routes';
import groupRoutes from './routes/group.routes';
import sportRoutes from './routes/sport.routes';
import trainingLoadRoutes from './routes/trainingLoad.routes';
import matchStatsRoutes from './routes/matchStats.routes';
import profileRoutes from './routes/profileRoutes';

const app: Application = express();

// Middleware
app.use(cors({ origin: config.cors.origins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers uploads statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ultimate Frisbee API Documentation',
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/training-load', trainingLoadRoutes);
app.use('/api/match-stats', matchStatsRoutes);
app.use('/api', profileRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API Ultimate Frisbee - En ligne' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 Environnement: ${config.nodeEnv}`);
  console.log(`📚 Documentation Swagger: http://localhost:${PORT}/api-docs`);
});

export default app;
