# Stylera Decisions & Architecture Log

## ADR-001: Manifest V3 & Vite Multi-Entry Build Architecture
- **Date**: 2026-11-22
- **Status**: Accepted
- **Context**: Stylera requires a Chrome Manifest V3 browser extension containing:
  1. A Background Service Worker (`background.js`) handling cross-origin image retrieval, context menus, and storage management.
  2. A Content Script (`content.js` + `content.css`) injected on e-commerce shopping pages to detect drag events, mount floating triggers, and handle drop targets.
  3. A Try-On App (`tryon-app/`) embedded in an extension-origin iframe (`chrome-extension://<id>/tryon-app/index.html`) with `allow="camera"` so camera permissions persist across all websites.
  4. Offscreen/Worker threads for ML inference.
- **Decision**: Rather than relying on rigid community Chrome extension Vite plugins that can break across major Vite/Node updates, we adopt a clean multi-entry Vite build pipeline with custom rollup inputs and automated asset handling.
- **Consequences**: Deterministic builds, fast HMR in development, clear separation of extension contexts, strict TypeScript validation across all entries.

## ADR-002: Camera Permissions via Extension-Origin Iframe
- **Date**: 2026-11-22
- **Status**: Accepted
- **Context**: Browsers isolate camera permissions per origin. If a content script attempts to invoke `navigator.mediaDevices.getUserMedia()` directly inside the host page, it asks permission for `https://www.myntra.com` and must be re-granted for each individual shopping site. Furthermore, strict site CSPs may disallow webcam access entirely.
- **Decision**: The entire Try-On application is hosted inside `tryon-app/index.html` declared in `web_accessible_resources`. The content script creates an `<iframe>` pointing to this extension-origin URL with attribute `allow="camera; microphone"`.
- **Consequences**:
  - The user grants camera permission once for the extension origin.
  - The permission persists seamlessly across Myntra, Ajio, Amazon, Zara, and any shopping domain.
  - No host page CSP interference.
