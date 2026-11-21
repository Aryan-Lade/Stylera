# Stylera Privacy & Security Architecture

**Commitment**: Stylera is designed with zero-telemetry and a 100% on-device execution guarantee.

---

## 1. Zero Video/Audio Exfiltration
- The live webcam video stream (`navigator.mediaDevices.getUserMedia()`) is rendered directly into local HTML5 video and WebGL elements.
- **Under no circumstances is any webcam frame or user face data uploaded to any remote server.**
- All computer vision pipelines:
  - MediaPipe Pose Landmarker (33 body keypoints)
  - MediaPipe Face Landmarker (478 face points & facial transform matrix)
  - Landmark smoothing (1-Euro Filter)
  - Three.js overlay rendering
  are executed entirely on the user's client hardware (CPU/WebGL/WebGPU).

---

## 2. Minimal Permissions
Stylera uses strictly necessary Chrome Manifest V3 permissions:
- `storage`: Preserves user preferences (mirror state, resolution, performance tier) locally in Chrome storage.
- `contextMenus`: Adds the optional right-click "Try on with Stylera" shortcut on e-commerce images.
- `activeTab`: Permits launching the try-on window on the shopping page currently opened by the shopper.
- `sidePanel`: Permits side-by-side try-on mode.
- `host_permissions`: Bypasses cross-origin CORS canvas taints when fetching product photos from shopping sites (Myntra, Ajio, Amazon, Zara, Flipkart).

---

## 3. Sandboxed Extension-Origin Execution
- The Try-On portal is mounted inside an iframe isolated under the extension origin (`chrome-extension://<id>/src/tryon-app/index.html`).
- The host shopping website cannot access, inspect, or modify the webcam stream or internal Try-On state.
- Strict Content Security Policy (CSP):
  `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'`
- No remote script execution is permitted.

---

## 4. Local Image Processing & Cache
- Garment cutouts are cached locally in the browser's `IndexedDB` storage using image URL hashing.
- Snapshots are created and saved only upon explicit user button click ("Save Image" or "Copy to Clipboard").
