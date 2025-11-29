import { Router } from 'express';
import auditRoutes from './routes/audit.routes';

export function setupRoutes(): Router {
  const router = Router();
  
  // Health check
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'LokaAudit Backend API',
      timestamp: new Date().toISOString()
    });
  });
  
  // Audit routes
  router.use('/audit', auditRoutes);
  
  // Status endpoint
  router.get('/status', (req, res) => {
    res.json({
      status: 'operational',
      service: 'LokaAudit Backend',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  });
  
  return router;
}
