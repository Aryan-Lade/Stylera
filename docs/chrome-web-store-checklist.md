# Chrome Web Store Publication Checklist: Stylera

## 1. Extension Manifest & Architecture Compliance
- [x] **Manifest V3 Only**: Verified MV3 service worker background and declarative permissions.
- [x] **Single Purpose Description**: "Real-time virtual try-on browser extension for apparel, sunglasses, hats, shoes & jewelry on e-commerce shopping sites."
- [x] **Strict Content Security Policy (CSP)**: Extension pages use `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'`.
- [x] **Zero Remote Code Execution (RCE)**: All code, libraries (Three.js, MediaPipe WASM), and UI are bundled or securely referenced.

---

## 2. Permissions Justification Audit
| Permission | Justification |
|---|---|
| `storage` | Preserves local user settings (mirror toggle, camera device preference, resolution, performance tier). |
| `contextMenus` | Provides optional right-click "Try on with Stylera" shortcut on product photos. |
| `activeTab` | Allows the user to launch the virtual try-on floating overlay on the active shopping tab. |
| `sidePanel` | Allows viewing products and camera try-on simultaneously in Chrome's side panel. |
| `host_permissions` | Required to fetch cross-origin product photos from supported shopping sites (Myntra, Ajio, Amazon, Zara, etc.) to prevent WebGL canvas taint. |

---

## 3. Privacy & User Data Disclosures
- **Single Question**: Does Stylera collect or transmit any user data?
  - **Answer**: NO. Stylera runs 100% on-device.
- **Webcam Frames**: Zero camera data or photos are transmitted to any remote server or third party.
- **Privacy Policy**: Maintained in [`PRIVACY.md`](../PRIVACY.md).

---

## 4. Visual Store Assets Required
- **Icon**: 128x128 PNG (`icons/icon.svg` / `icons/icon128.png`).
- **Small Tile Promo**: 440x280 pixels.
- **Marquee Promo**: 1400x560 pixels.
- **Store Screenshots** (min 1280x800 or 640x400):
  1. Live real-time try-on on Myntra product page.
  2. Multi-garment outfit layering (T-shirt + Sunglasses + Watch).
  3. Drag & drop interaction from product grid.
  4. Compare mode before/after split screen.
  5. Privacy badge guarantee & on-device security.

---

## 5. Submission Workflow
1. Run production build: `npm run build`
2. Archive the `dist/` directory into a zip file (`stylera-v0.1.0.zip`).
3. Open [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
4. Upload `stylera-v0.1.0.zip`.
5. Fill in description, privacy justification, upload promo screenshots, and submit for review.
