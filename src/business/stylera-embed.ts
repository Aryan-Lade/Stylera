/**
 * Stylera Embeddable Storefront Widget (Decart Anywear-style integration)
 * Enables any e-commerce storefront (Shopify, WooCommerce, custom) to offer
 * 1-click real-time virtual try-on directly on their product pages.
 */

(function () {
  interface StyleraConfig {
    storeId?: string;
    engine?: 'on-device' | 'neural-vton' | 'hybrid';
    buttonColor?: string;
    backendUrl?: string;
  }

  const scriptTag = document.currentScript as HTMLScriptElement;
  const storeId = scriptTag?.getAttribute('data-stylera-store') || 'demo';
  const engine = (scriptTag?.getAttribute('data-engine') as StyleraConfig['engine']) || 'hybrid';
  const backendUrl = scriptTag?.getAttribute('data-backend') || 'http://localhost:3001';

  function detectProductFromPage() {
    // 1. Try OpenGraph / Schema.org
    const title =
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      document.title ||
      'Featured Product';

    const image =
      document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      document.querySelector('img[src*="product"]')?.getAttribute('src') ||
      '';

    const price =
      document.querySelector('meta[property="product:price:amount"]')?.getAttribute('content') ||
      document.querySelector('.price, .product-price, [data-price]')?.textContent?.trim() ||
      '';

    return { title, image, price, storeId, engine, backendUrl };
  }

  function injectTryOnButton() {
    const product = detectProductFromPage();

    // Look for target container or inject floating button
    const existing = document.getElementById('stylera-embed-btn');
    if (existing) return;

    const btn = document.createElement('button');
    btn.id = 'stylera-embed-btn';
    btn.innerHTML = `
      <span style="display:flex;align-items:center;gap:6px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        </svg>
        Try On Live
      </span>
    `;

    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '2147483640',
      background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '9999px',
      padding: '12px 20px',
      boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.5), 0 8px 10px -6px rgba(168, 85, 247, 0.4)',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px) scale(1.04)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0) scale(1)';
    });

    btn.addEventListener('click', () => {
      openModal(product);
    });

    document.body.appendChild(btn);
  }

  function openModal(product: any) {
    const overlay = document.createElement('div');
    overlay.id = 'stylera-tryon-modal';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });

    const container = document.createElement('div');
    Object.assign(container.style, {
      width: '420px',
      height: '680px',
      maxHeight: '92vh',
      backgroundColor: '#0f172a',
      borderRadius: '24px',
      border: '1px solid #334155',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    });

    container.innerHTML = `
      <div style="padding:16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1e293b;background:#0f172a;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#ec4899,#a855f7);display:flex;align-items:center;justify-content:center;">
            <span style="color:#fff;font-size:14px;font-weight:bold;">S</span>
          </div>
          <div>
            <div style="color:#fff;font-size:13px;font-weight:600;">Stylera Live V-TON</div>
            <div style="color:#94a3b8;font-size:10px;">${product.title.slice(0, 32)}</div>
          </div>
        </div>
        <button id="stylera-close-modal" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:6px;font-size:18px;">&times;</button>
      </div>
      <iframe src="${product.backendUrl}/business.html?embed=1&productUrl=${encodeURIComponent(window.location.href)}" style="flex:1;border:none;width:100%;height:100%;"></iframe>
    `;

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    overlay.querySelector('#stylera-close-modal')?.addEventListener('click', () => {
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTryOnButton);
  } else {
    injectTryOnButton();
  }
})();
