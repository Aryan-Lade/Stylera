import { test, expect, chromium } from '@playwright/test';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

test.describe('Stylera Extension E2E Smoke & Real-Time Try-On Flow', () => {
  let server: http.Server;
  const PORT = 4567;

  test.beforeAll(async () => {
    const mockPagePath = resolve(__dirname, 'mock-shopping-site.html');
    server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(mockPagePath));
    });
    await new Promise<void>((res) => server.listen(PORT, res));
  });

  test.afterAll(async () => {
    if (server) {
      server.closeAllConnections?.();
      await new Promise<void>((res) => server.close(() => res()));
    }
  });

  test('should load extension, inject floating launcher on shopping page, open camera and ingest product', async () => {
    const pathToExtension = resolve(__dirname, '../../dist');

    // Launch Chromium with extension and fake media stream flags
    const browserContext = await chromium.launchPersistentContext('', {
      headless: false,
      permissions: ['camera'],
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    try {
      // 1. Get the Extension ID from the background service worker
      let [background] = browserContext.serviceWorkers();
      if (!background) {
        background = await browserContext.waitForEvent('serviceworker', { timeout: 10000 });
      }
      const extensionId = background.url().split('/')[2];
      console.log(`[E2E Test] Extension loaded with ID: ${extensionId}`);

      // 2. Test Content Script on Shopping Website
      const shopPage = await browserContext.newPage();
      await shopPage.goto(`http://localhost:${PORT}`);

      // Verify floating launcher button is injected on the shopping page
      const launcherBtn = shopPage.locator('#stylera-floating-trigger');
      await expect(launcherBtn).toBeVisible({ timeout: 10000 });
      console.log('[E2E Test] Floating Try-On launcher successfully injected on shopping page');

      // Click launcher button to mount Try-On window
      await launcherBtn.click();
      const tryonContainer = shopPage.locator('#stylera-root-container');
      await expect(tryonContainer).toBeVisible();
      const tryonIframe = shopPage.locator('#stylera-tryon-iframe');
      await expect(tryonIframe).toBeVisible();
      console.log('[E2E Test] Stylera floating window & iframe mounted on shopping site');

      // 3. Test Direct Try-On App Experience (Extension Origin)
      const tryonPage = await browserContext.newPage();
      await tryonPage.goto(`chrome-extension://${extensionId}/src/tryon-app/index.html`);

      // Verify branding and privacy badge
      const titleLocator = tryonPage.locator('text=Stylera');
      await expect(titleLocator.first()).toBeVisible({ timeout: 5000 });
      const privacyBadge = tryonPage.locator('text=On-Device');
      await expect(privacyBadge.first()).toBeVisible();
      console.log('[E2E Test] Stylera extension-origin app rendered with privacy guarantee');

      // Dismiss onboarding tutorial if visible
      const skipTutorialBtn = tryonPage.locator('button:has-text("Skip Tutorial")');
      try {
        if (await skipTutorialBtn.isVisible({ timeout: 2000 })) {
          await skipTutorialBtn.click();
          console.log('[E2E Test] Dismissed onboarding modal');
        }
      } catch {
        // Modal already dismissed
      }

      // 4. Test "Enable Camera" with automated fake media stream
      const enableCameraBtn = tryonPage.locator('button:has-text("Enable Camera")');
      await expect(enableCameraBtn).toBeVisible({ timeout: 5000 });
      await enableCameraBtn.click();

      // Verify video stream becomes LIVE
      const liveIndicator = tryonPage.getByText('LIVE', { exact: true });
      await expect(liveIndicator).toBeVisible({ timeout: 10000 });
      console.log('[E2E Test] Camera active with live video stream and FPS counter');

      // 5. Ingest a product garment into the try-on app
      await tryonPage.evaluate(() => {
        window.postMessage(
          {
            type: 'INGEST_IMAGE_URL',
            payload: {
              imageUrl:
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23ec4899'/%3E%3C/svg%3E",
              title: 'Roadster Solid Crew Neck Cotton T-shirt',
              brand: 'Roadster',
              price: 'Rs. 499',
              category: 't-shirt',
            },
          },
          '*'
        );
      });

      // Verify garment appears in Outfit Tray
      const outfitItem = tryonPage.locator('text=t-shirt');
      await expect(outfitItem.first()).toBeVisible({ timeout: 8000 });
      console.log('[E2E Test] Garment successfully ingested and rendered in outfit tray');

      // 6. Test Snapshot button
      const snapshotBtn = tryonPage.locator('button[title="Take Snapshot"]');
      await expect(snapshotBtn).toBeVisible();
      await snapshotBtn.click();

      // Verify Snapshot preview modal opens
      const snapshotModalTitle = tryonPage.locator('text=Outfit Snapshot');
      await expect(snapshotModalTitle).toBeVisible();
      console.log('[E2E Test] Snapshot compositing and preview modal verified');

      console.log('\n======================================================');
      console.log('[E2E Test] All Stylera Extension End-to-End Tests PASSED! 🎉');
      console.log('======================================================\n');
    } finally {
      await browserContext.close();
    }
  });
});
