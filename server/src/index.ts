import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import fs from 'node:fs';
import { initDatabase } from './db/database.js';
import { authRouter } from './routes/auth.js';
import { sheltersRouter } from './routes/shelters.js';
import { alertsRouter } from './routes/alerts.js';
import { notificationsRouter } from './routes/notifications.js';
import { incidentsRouter } from './routes/incidents.js';
import { analyticsRouter } from './routes/analytics.js';
import { auditLogsRouter } from './routes/audit_logs.js';
import { dataSourcesRouter } from './routes/data_sources.js';
import { legacyRouter } from './routes/legacy.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allows tile layers & leaflet icons
}));
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize SQLite database and seed real Chennai data
initDatabase();

// Backwards-Compatible API Routes (Ensures 100% preservation of existing frontend)
app.use('/api', legacyRouter);

// Version 1 Modern REST API
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/shelters', sheltersRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/incidents', incidentsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/audit-logs', auditLogsRouter);
app.use('/api/v1/data-sources', dataSourcesRouter);

// Health Endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'SYSTEM_OPERATIONAL',
      platform: 'HAZARDIQ',
      edition: 'Government Production Master',
      timestamp: new Date().toISOString()
    }
  });
});

// Production Static Serving for Compiled Frontend SPA
const distPath = path.resolve(process.cwd(), '../frontend/dist');
if (fs.existsSync(distPath)) {
  console.log(`Serving static production frontend from ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('Frontend dist folder not found yet; run "npm run build" in frontend directory to bundle UI.');
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred.'
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`HAZARDIQ Server active on http://localhost:${PORT}`);
  console.log(`API v1 Endpoints available at http://localhost:${PORT}/api/v1`);
  console.log(`Preserved Endpoints available at http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});

export default app;
