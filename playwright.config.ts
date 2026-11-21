import { defineConfig } from '@playwright/test';
import { resolve } from 'path';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  use: {
    headless: false, // Chrome extensions are only loaded by Chromium in non-headless or headless=new mode
  },
});
