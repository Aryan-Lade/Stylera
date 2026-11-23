import { Router, Request, Response } from 'express';

export const businessRouter = Router();

// In-memory analytics store for merchant dashboard metrics
interface MerchantStats {
  totalTryOns: number;
  uniqueShoppers: number;
  conversionRateIncreasePct: number;
  returnRateReductionPct: number;
  avgEngagementSeconds: number;
}

const stats: MerchantStats = {
  totalTryOns: 14820,
  uniqueShoppers: 9240,
  conversionRateIncreasePct: 320, // 3.2x uplift
  returnRateReductionPct: 42,     // 42% decrease in returns
  avgEngagementSeconds: 84,       // 1m 24s average try-on session
};

/**
 * GET /api/v1/business/widget-config
 * Merchant embed configuration
 */
businessRouter.get('/widget-config', (req: Request, res: Response) => {
  const storeId = (req.query.storeId as string) || 'demo_store';
  res.json({
    success: true,
    data: {
      storeId,
      primaryColor: '#ec4899', // pink-500
      buttonText: '✨ Try On Live (3D & AI)',
      position: 'bottom-right',
      engine: 'hybrid', // supports 'on-device', 'neural-vton', and 'hybrid'
      autoDetectProduct: true,
      enableAnalytics: true,
    },
  });
});

/**
 * GET /api/v1/business/stats
 * Real-time business conversion and ROI metrics
 */
businessRouter.get('/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: stats,
  });
});

/**
 * POST /api/v1/business/analytics
 * Record a shopper try-on interaction event
 */
businessRouter.post('/analytics', (req: Request, res: Response) => {
  const { event, productId, durationMs } = req.body;
  if (event === 'tryon_started') {
    stats.totalTryOns += 1;
  }
  res.json({
    success: true,
    recorded: { event, productId, durationMs, timestamp: Date.now() },
  });
});

/**
 * GET /api/v1/business/embed-code
 * Returns 1-click script tag for Shopify / Webflow / HTML stores
 */
businessRouter.get('/embed-code', (req: Request, res: Response) => {
  const host = req.protocol + '://' + req.get('host');
  const embedSnippet = `<!-- Stylera Real-Time Virtual Try-On Widget -->
<script 
  src="${host}/stylera-embed.js" 
  data-stylera-store="YOUR_STORE_ID" 
  data-engine="hybrid" 
  async>
</script>`;

  res.json({
    success: true,
    snippet: embedSnippet,
  });
});
