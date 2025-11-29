import { Router, Request, Response } from 'express';
import { AuditService } from '../services/audit';
import { AuditRequest, NetworkType } from '../types/audit.types';
import { logger } from '../utils/logger';

const router = Router();
const auditService = AuditService.getInstance();

/**
 * Start a new audit
 * POST /api/audit/start
 */
router.post('/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectName, network, files } = req.body;

    // Validate required fields
    if (!projectName || !network || !files || !Array.isArray(files)) {
      res.status(400).json({
        error: 'Missing required fields: projectName, network, files'
      });
      return;
    }

    // Generate unique job ID
    const jobId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create audit request
    const auditRequest: AuditRequest = {
      jobId,
      projectName,
      network: network as NetworkType,
      language: getLanguageForNetwork(network),
      files,
      configuration: {
        enabledStages: ['preprocess', 'parser', 'static-analysis', 'semantic-analysis', 'ai-analysis', 'external-tools', 'aggregation'],
        severityThreshold: 'informational',
        confidenceThreshold: 0.5,
        aiAnalysisEnabled: true,
        externalToolsEnabled: true,
        timeoutMs: 30 * 60 * 1000 // 30 minutes
      },
      metadata: {
        uploadedAt: new Date(),
        priority: 1
      }
    };

    const result = await auditService.startAudit(auditRequest);

    res.status(202).json({
      success: true,
      jobId: result.jobId,
      message: result.message,
      status: 'queued'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to start audit', { error: errorMessage, body: req.body });
    
    res.status(500).json({
      error: 'Failed to start audit',
      message: errorMessage
    });
  }
});

/**
 * Get audit job status
 * GET /api/audit/status/:jobId
 */
router.get('/status/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }

    const status = await auditService.getJobStatus(jobId);

    if (!status) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get job status', { error: errorMessage, jobId: req.params.jobId });
    
    res.status(500).json({
      error: 'Failed to get job status',
      message: errorMessage
    });
  }
});

/**
 * Get audit report
 * GET /api/audit/report/:jobId
 */
router.get('/report/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }

    const report = await auditService.getAuditReport(jobId);

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get audit report', { error: errorMessage, jobId: req.params.jobId });
    
    res.status(500).json({
      error: 'Failed to get audit report',
      message: errorMessage
    });
  }
});

/**
 * Cancel audit job
 * POST /api/audit/cancel/:jobId
 */
router.post('/cancel/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }

    const result = await auditService.cancelAudit(jobId);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to cancel audit', { error: errorMessage, jobId: req.params.jobId });
    
    res.status(500).json({
      error: 'Failed to cancel audit',
      message: errorMessage
    });
  }
});

/**
 * Get supported networks
 * GET /api/audit/networks
 */
router.get('/networks', (req: Request, res: Response) => {
  try {
    const networks = auditService.getSupportedNetworks();

    res.json({
      success: true,
      data: networks
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get supported networks', { error: errorMessage });
    
    res.status(500).json({
      error: 'Failed to get supported networks',
      message: errorMessage
    });
  }
});

/**
 * Get audit statistics
 * GET /api/audit/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await auditService.getAuditStatistics();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get audit statistics', { error: errorMessage });
    
    res.status(500).json({
      error: 'Failed to get audit statistics',
      message: errorMessage
    });
  }
});

// Helper function to get language for network
function getLanguageForNetwork(network: NetworkType): 'rust' | 'move' | 'solidity' | 'cairo' {
  const languageMap: Record<NetworkType, 'rust' | 'move' | 'solidity' | 'cairo'> = {
    solana: 'rust',
    near: 'rust',
    aptos: 'move',
    sui: 'move',
    ethereum: 'solidity',
    starknet: 'cairo'
  };

  return languageMap[network];
}

export default router;
