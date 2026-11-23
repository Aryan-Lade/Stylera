import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sessionRouter } from './routes/sessionRoutes.js';
import { catalogRouter } from './routes/catalogRoutes.js';
import { businessRouter } from './routes/businessRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Stylera V-TON & Business Gateway',
    timestamp: new Date().toISOString(),
    decartApiKeyConfigured: !!process.env.DECART_API_KEY,
  });
});

// Mount Routes
app.use('/api/v1/session', sessionRouter);
app.use('/api/v1/catalog', catalogRouter);
app.use('/api/v1/business', businessRouter);

// Start server
app.listen(PORT, () => {
  console.log(`[Stylera Server] Real-time V-TON & Business API running at http://localhost:${PORT}`);
  console.log(`[Stylera Server] Endpoints:`);
  console.log(`  - POST /api/v1/session/start (LiveKit / Decart WebRTC session)`);
  console.log(`  - POST /api/v1/catalog/extract (E-commerce URL scraper & V-TON prompt builder)`);
  console.log(`  - GET  /api/v1/business/stats (Merchant ROI analytics)`);
});
