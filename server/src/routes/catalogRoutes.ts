import { Router, Request, Response } from 'express';
import { catalogService } from '../services/catalogService.js';

export const catalogRouter = Router();

/**
 * POST /api/v1/catalog/extract
 * Extracts product metadata, images, and category from any online store URL
 */
catalogRouter.post('/extract', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid URL is required' });
    }

    const product = await catalogService.extractFromUrl(url);
    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract product catalog data',
    });
  }
});
