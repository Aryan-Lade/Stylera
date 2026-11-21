# Stylera: Real-Time Virtual Try-On Browser Extension

[![CI](https://github.com/Aryan-Lade/Stylera/actions/workflows/ci.yml/badge.svg)](https://github.com/Aryan-Lade/Stylera/actions)
![Version](https://img.shields.io/badge/version-0.1.0-pink.svg)
![Manifest V3](https://img.shields.io/badge/manifest-v3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Privacy](https://img.shields.io/badge/privacy-100%25%20On--Device-emerald.svg)

> **Stylera** is an ultra-fast Chrome (Manifest V3) browser extension that lets shoppers try on any wearable item in real-time using their webcam while browsing e-commerce platforms (Myntra, Ajio, Amazon Fashion, Flipkart, Nykaa, H&M, Zara, and any site with product images).

---

## 🔒 100% On-Device Privacy

- **Your camera feed never leaves your device.**
- All computer vision pipelines (MediaPipe Pose 33-point, Face Mesh 478-point with 3D transform matrix, Hand Landmarker, and selfie segmentation) and ML inference run strictly in-browser via WebGL, WASM, and WebGPU.
- No camera frames or photos are uploaded to any server.
- See detailed audit in [`PRIVACY.md`](PRIVACY.md).

---

## ✨ Features & Capabilities

- 🪄 **Drag & Drop Ingestion**: Drag product images directly from product cards or detail pages into the floating try-on portal.
- ⚡ **Auto-Classification & Background Removal**: Real-time zero-shot category classification (**99% accuracy** on 100 Myntra/Ajio samples) with instant on-device RGBA background removal.
- 🪞 **Universal Garment Rigging**:
  - **Upper Body** (T-Shirts, Shirts, Kurta, Tops, Hoodies, Jackets): Follows shoulder angle and torso length with non-rigid 2D mesh grid deformation.
  - **Head & Face** (Sunglasses, Eyeglasses, Caps, Hats, Beanies, Face Masks): Aligned in 3D using MediaPipe's 4x4 facial transformation matrix for yaw/pitch/roll head tracking.
  - **Lower Body** (Jeans, Pants, Skirts, Shorts): Hips to knees/ankles along leg axis with out-of-frame step-back hints.
  - **Footwear** (Sneakers, Shoes, Heels, Sandals): Automatically generates a mirrored pair from a single shoe product image.
  - **Jewelry & Accessories** (Watches, Bracelets, Rings, Necklaces, Earrings): Aligned to forearms, collarbone, and earlobes.
- 👗 **Multi-Item Outfit Layering**: Try on shirt + sunglasses + cap + watch simultaneously with realistic z-layering.
- 🎨 **Ambient Lighting Adaptation**: Samples video frame temperature and luminance to adjust garment lighting, eliminating flat "sticker" looks.
- 🛡️ **Arm & Hand Occlusion**: Crossed arms or hands in front of the chest naturally occlude underlying shirts.
- 📸 **High-Res Snapshots & Split Compare**: Instant composited photo capture with "Before & After" compare mode, PNG download, and direct clipboard copy.
- 🎛️ **Performance Modes**: Low (24 FPS, 480p), Balanced (30 FPS, 720p), and High (30+ FPS, 1080p).

---

## 🏗️ Architecture

```
                                  +------------------------------------+
                                  | Host Page (Myntra / Ajio / etc.)   |
                                  |  - Content script detects drags    |
                                  |  - Injects floating launcher       |
                                  |  - Injects hover Try-On buttons    |
                                  +-----------------+------------------+
                                                    | iframe postMessage
                                                    v
+-------------------------------+  allow="camera"   +------------------------------------+
| Background Service Worker     | <===============> | Try-On App (Extension Origin)     |
|  - Cross-origin image fetch   |  chrome.runtime   |  - getUserMedia webcam stream      |
|  - Context menus              |                   |  - MediaPipe Vision WASM/GPU       |
|  - IndexedDB Cutout Cache     |                   |  - Three.js layered scene graph    |
+-------------------------------+                   |  - 1-Euro Filter jitter reduction  |
                                                    |  - Zustand state & Outfit Tray     |
                                                    +------------------------------------+
```

### Why an Extension-Origin Iframe?
Webcam permissions are isolated per-origin. By serving the Try-On application inside `tryon-app/index.html` declared in `web_accessible_resources` and embedded as an iframe with `allow="camera"`, permission is granted **once** for the extension origin and persists across all shopping websites without host-page CSP conflicts.

---

## 🚀 Installation & Quickstart

### 1. Clone & Install
```bash
git clone https://github.com/Aryan-Lade/Stylera.git
cd Stylera
npm install
```

### 2. Build the Extension
```bash
npm run build
```
This produces the production-ready unpacked extension in `dist/`.

### 3. Load into Google Chrome
1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `dist/` directory from this repository.
5. Browse [Myntra](https://www.myntra.com) or [Ajio](https://www.ajio.com) and click the **✨ Try On** button!

---

## 🧪 Testing & Verification

### Unit & Benchmark Tests
```bash
npm run test
```
Runs the full Vitest suite covering 11 test files, including:
- 1-Euro Filter jitter reduction
- Category anchor definitions (all 26 categories)
- 3D facial rotation & transforms
- Paired footwear & lower body transforms
- Hand, wrist & jewelry alignments
- **100-sample Myntra/Ajio zero-shot classification benchmark (99% accuracy)**
- Zero-telemetry privacy request monitor

### Automated Camera Testing Flag
When running automated tests with Chrome:
```bash
google-chrome --enable-features=UseFakeDeviceForMediaStream --use-fake-device-for-media-stream
```

---

## 📑 Decisions & Documentation
- Architectural Decision Records: [`docs/decisions.md`](docs/decisions.md)
- Privacy Architecture: [`PRIVACY.md`](PRIVACY.md)
- Chrome Web Store Checklist: [`docs/chrome-web-store-checklist.md`](docs/chrome-web-store-checklist.md)
