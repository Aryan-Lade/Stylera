import { Router, Request, Response } from 'express';
import { decartBridge } from '../services/decartBridge.js';

export const sessionRouter = Router();

/**
 * POST /api/v1/session/start
 * Initiate a live WebRTC Lucy V-TON streaming session
 */
sessionRouter.post('/start', async (req: Request, res: Response) => {
  try {
    const { garment } = req.body;
    const session = await decartBridge.createSession(garment);
    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start V-TON session',
    });
  }
});

/**
 * POST /api/v1/session/:id/condition
 * Dynamically change the garment / visual prompt mid-stream
 */
sessionRouter.post('/:id/condition', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { garment } = req.body;
    if (!garment) {
      return res.status(400).json({ success: false, error: 'Garment data required' });
    }

    const result = await decartBridge.updateConditioning(id, garment);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update conditioning',
    });
  }
});

/**
 * POST /api/v1/session/:id/stop
 * Terminate session
 */
sessionRouter.post('/:id/stop', (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const closed = decartBridge.closeSession(id);
  res.json({
    success: true,
    closed,
  });
});
