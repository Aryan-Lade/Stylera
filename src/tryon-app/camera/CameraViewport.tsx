import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCameraStore } from './cameraStore';
import { useGarmentStore } from '../garments/garmentStore';
import { visionManager } from '../vision/visionManager';
import { OverlayRenderer } from '../render/overlayRenderer';
import { FlipHorizontal, Settings2, Activity, Camera, Crosshair } from 'lucide-react';
import { SnapshotPreviewModal } from '../ui/SnapshotPreviewModal';

interface CameraViewportProps {
  children?: React.ReactNode;
}

export const CameraViewport: React.FC<CameraViewportProps> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<OverlayRenderer | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const {
    stream,
    isMirrored,
    toggleMirror,
    isAutoFraming,
    toggleAutoFraming,
    setVideoElement,
    resolution,
    availableDevices,
    selectedDeviceId,
    setSelectedDevice,
  } = useCameraStore();

  const { items } = useGarmentStore();

  const [showSettings, setShowSettings] = useState(false);
  const [modelStatus, setModelStatus] = useState<string>('Initializing AI...');
  const [isTracking, setIsTracking] = useState(false);
  const isTrackingRef = useRef(false);
  const [currentFps, setCurrentFps] = useState<number>(30);
  const [perfTier, setPerfTier] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [snapshotResult, setSnapshotResult] = useState<{ snapshot: string; rawVideo: string } | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  const lastFaceDetectionTimeRef = useRef(performance.now());

  // Auto-framing smooth state
  const targetViewportRef = useRef({ scale: 1, translateX: 0, translateY: 0 });
  const currentViewportRef = useRef({ scale: 1, translateX: 0, translateY: 0 });
  const [viewportTransform, setViewportTransform] = useState({ scale: 1, translateX: 0, translateY: 0 });

  const handleTakeSnapshot = () => {
    const video = videoRef.current;
    const renderer = rendererRef.current;
    if (!video || !renderer) return;

    try {
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;

      // 1. Capture raw video
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = w;
      rawCanvas.height = h;
      const rawCtx = rawCanvas.getContext('2d');
      if (rawCtx) {
        if (isMirrored) {
          rawCtx.translate(w, 0);
          rawCtx.scale(-1, 1);
        }
        rawCtx.drawImage(video, 0, 0, w, h);
      }
      const rawVideoDataUrl = rawCanvas.toDataURL('image/png');

      // 2. Capture composite (video + Three.js overlay with auto-framing crop)
      const compCanvas = document.createElement('canvas');
      compCanvas.width = w;
      compCanvas.height = h;
      const compCtx = compCanvas.getContext('2d');
      if (compCtx) {
        if (isMirrored) {
          compCtx.translate(w, 0);
          compCtx.scale(-1, 1);
        }
        compCtx.drawImage(video, 0, 0, w, h);
        compCtx.drawImage(renderer.getCanvas(), 0, 0, w, h);
      }

      // If auto-framing was active, apply the same framed crop to snapshot
      if (isAutoFraming && currentViewportRef.current.scale > 1.02) {
        const framedCanvas = document.createElement('canvas');
        framedCanvas.width = w;
        framedCanvas.height = h;
        const fCtx = framedCanvas.getContext('2d');
        if (fCtx) {
          const s = currentViewportRef.current.scale;
          const tx = (currentViewportRef.current.translateX / 100) * w;
          const ty = (currentViewportRef.current.translateY / 100) * h;
          fCtx.translate(w / 2, h / 2);
          fCtx.scale(s, s);
          fCtx.translate(tx, ty);
          fCtx.translate(-w / 2, -h / 2);
          fCtx.drawImage(compCanvas, 0, 0);
          setSnapshotResult({ snapshot: framedCanvas.toDataURL('image/png'), rawVideo: rawVideoDataUrl });
          return;
        }
      }

      const snapshotDataUrl = compCanvas.toDataURL('image/png');
      setSnapshotResult({ snapshot: snapshotDataUrl, rawVideo: rawVideoDataUrl });
    } catch (err) {
      console.warn('Snapshot error:', err);
    }
  };

  // Initialize MediaPipe Vision models
  useEffect(() => {
    let isMounted = true;
    visionManager
      .initialize()
      .then((ok) => {
        if (isMounted) {
          setModelStatus(ok ? 'Ready' : 'Vision Offline (2D Preview Mode)');
        }
      })
      .catch(() => {
        if (isMounted) {
          setModelStatus('Vision Offline');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize OverlayRenderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new OverlayRenderer(canvasRef.current);
    }
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Video Frame Loop callback
  const runFrameLoop = useCallback(() => {
    const video = videoRef.current;
    const renderer = rendererRef.current;

    if (!video || video.paused || video.ended || !renderer) {
      animationFrameId.current = requestAnimationFrame(runFrameLoop);
      return;
    }

    const now = performance.now();

    // Calculate FPS
    frameCountRef.current++;
    if (now - lastFpsUpdateRef.current >= 1000) {
      setCurrentFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)));
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }

    // Sync canvas resolution with video dimensions
    if (video.videoWidth && video.videoHeight) {
      const canvas = renderer.getCanvas();
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        renderer.resize(video.videoWidth, video.videoHeight);
      }
    }

    // Run MediaPipe detection
    const detection = visionManager.detect(video, now);

    const hasFace = Boolean(detection.faceResult?.faceLandmarks && detection.faceResult.faceLandmarks.length > 0);
    const hasPose = Boolean(detection.poseResult?.landmarks && detection.poseResult.landmarks.length > 0);
    const hasActiveTracking = hasFace || hasPose;

    if (hasActiveTracking !== isTrackingRef.current) {
      isTrackingRef.current = hasActiveTracking;
      setIsTracking(hasActiveTracking);
    }

    // Auto-Framing / Face Center Tracking calculation
    if (hasFace && detection.faceResult?.faceLandmarks?.[0]) {
      lastFaceDetectionTimeRef.current = now;
      const face = detection.faceResult.faceLandmarks[0];
      const nose = face[168] || face[1] || face[4];
      const forehead = face[10];
      const chin = face[152];
      const leftCheek = face[234];
      const rightCheek = face[454];

      if (nose && forehead && chin) {
        const faceCenterX = nose.x;
        const faceCenterY = (forehead.y + chin.y) / 2;
        const faceSpanX = Math.abs((rightCheek?.x ?? faceCenterX) - (leftCheek?.x ?? faceCenterX));
        const faceSpanY = Math.abs(chin.y - forehead.y);
        const faceSize = Math.max(faceSpanX, faceSpanY, 0.12);

        // Optimal zoom: scale up when user is far away to focus on face & wearables
        const targetZoom = Math.max(1.05, Math.min(1.48, 0.32 / faceSize));

        // Pan to keep face centered horizontally and with pleasing 12% headroom
        const maxPan = ((targetZoom - 1) / targetZoom) * 40;
        const rawPanX = (faceCenterX - 0.5) * 100 * (isMirrored ? 1 : -1);
        const rawPanY = (0.42 - faceCenterY) * 100;

        const panX = Math.max(-maxPan, Math.min(maxPan, rawPanX));
        const panY = Math.max(-maxPan, Math.min(maxPan, rawPanY));

        targetViewportRef.current = {
          scale: targetZoom,
          translateX: panX,
          translateY: panY,
        };
      }
    } else if (hasPose && detection.poseResult?.landmarks?.[0]) {
      const pose = detection.poseResult.landmarks[0];
      const nose = pose[0];
      if (nose) {
        const panX = (nose.x - 0.5) * 100 * (isMirrored ? 1 : -1);
        const panY = (0.42 - nose.y) * 100;
        targetViewportRef.current = {
          scale: 1.15,
          translateX: Math.max(-18, Math.min(18, panX)),
          translateY: Math.max(-18, Math.min(18, panY)),
        };
      }
    } else if (now - lastFaceDetectionTimeRef.current > 1200) {
      // Graceful return to normal 1x wide view
      targetViewportRef.current = { scale: 1, translateX: 0, translateY: 0 };
    }

    // Smooth cinema-like viewport lerp
    const cur = currentViewportRef.current;
    const tgt = isAutoFraming ? targetViewportRef.current : { scale: 1, translateX: 0, translateY: 0 };
    const LERP = 0.08;
    cur.scale += (tgt.scale - cur.scale) * LERP;
    cur.translateX += (tgt.translateX - cur.translateX) * LERP;
    cur.translateY += (tgt.translateY - cur.translateY) * LERP;

    setViewportTransform({
      scale: Number(cur.scale.toFixed(3)),
      translateX: Number(cur.translateX.toFixed(2)),
      translateY: Number(cur.translateY.toFixed(2)),
    });

    // Render overlay scene
    renderer.render(detection, items, isMirrored, video);

    // Schedule next frame
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && (video as any).requestVideoFrameCallback) {
      (video as any).requestVideoFrameCallback(runFrameLoop);
    } else {
      animationFrameId.current = requestAnimationFrame(runFrameLoop);
    }
  }, [items, isMirrored, isAutoFraming]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      setVideoElement(videoRef.current);
    }
  }, [stream, setVideoElement]);

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => {
          runFrameLoop();
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center select-none">
      {/* Dynamic Auto-Framing / Center Stage Viewport Container */}
      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none overflow-hidden"
        style={{
          transform: isAutoFraming
            ? `scale(${viewportTransform.scale}) translate(${viewportTransform.translateX}%, ${viewportTransform.translateY}%)`
            : 'none',
          transformOrigin: 'center center',
          transition: 'transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Underlying Webcam Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          onLoadedMetadata={handleVideoLoadedMetadata}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-auto transition-transform duration-150 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          }`}
        />

        {/* Render Canvas (Three.js overlay stacked directly above video) */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-150 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          }`}
        />
      </div>

      {/* Additional Overlays / Children (drop zones, static preview, outfit tray) */}
      <div className="absolute inset-0 pointer-events-auto">{children}</div>

      {/* 3D Tracking Guidance Prompt */}
      {items.length > 0 && !isTracking && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300">
          <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[11px] px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
            <span>✨</span>
            <span>Face the camera to wear your {items[items.length - 1]?.category || 'garment'} live</span>
          </div>
        </div>
      )}

      {/* Quick Controls Bar (Top Floating) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-20">
        <div className="flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800/80 shadow-md">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium text-slate-200">LIVE</span>
          <span className="text-[10px] text-slate-400 border-l border-slate-700/80 pl-1.5">
            {resolution}
          </span>
          <span className="text-[10px] text-pink-400 border-l border-slate-700/80 pl-1.5 font-mono flex items-center gap-1">
            <Activity className="w-2.5 h-2.5" />
            {currentFps} FPS
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md p-1 rounded-lg border border-slate-800/80 shadow-md">
          {isTracking ? (
            <span className="text-[10px] text-emerald-400 font-medium px-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isAutoFraming ? '3D Center Stage' : '3D Live Wear'}
            </span>
          ) : items.length > 0 ? (
            <span className="text-[10px] text-amber-400 font-medium px-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Look at Camera
            </span>
          ) : (
            <span className="text-[9px] text-slate-400 px-1.5 font-medium hidden sm:inline">
              {modelStatus}
            </span>
          )}

          <button
            onClick={toggleAutoFraming}
            title={isAutoFraming ? 'Disable Smart Auto-Framing' : 'Enable Smart Auto-Framing (Face Focus)'}
            className={`p-1.5 rounded-md transition-colors ${
              isAutoFraming
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleTakeSnapshot}
            title="Take Snapshot"
            className="p-1.5 rounded-md bg-pink-600 hover:bg-pink-500 text-white shadow-sm transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleMirror}
            title={isMirrored ? 'Disable Mirror' : 'Enable Mirror'}
            className={`p-1.5 rounded-md transition-colors ${
              isMirrored
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Camera Settings"
            className={`p-1.5 rounded-md transition-colors ${
              showSettings
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dropdown Camera Settings Flyout */}
      {showSettings && (
        <div className="absolute top-14 right-3 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-3 shadow-2xl z-30 text-xs space-y-3 pointer-events-auto">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Camera Device
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-200 text-xs focus:outline-none focus:border-pink-500"
            >
              {availableDevices.map((dev) => (
                <option key={dev.deviceId} value={dev.deviceId}>
                  {dev.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Smart Auto-Framing (Center Stage)
            </label>
            <button
              onClick={toggleAutoFraming}
              className={`w-full py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-2 ${
                isAutoFraming
                  ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Crosshair className="w-3 h-3" />
              <span>{isAutoFraming ? 'Enabled (Auto Pan & Zoom)' : 'Disabled (Full Frame)'}</span>
            </button>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Performance Mode
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['low', 'balanced', 'high'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setPerfTier(tier)}
                  className={`py-1 text-[11px] rounded font-medium capitalize transition-all ${
                    perfTier === tier
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {snapshotResult && (
        <SnapshotPreviewModal
          snapshotDataUrl={snapshotResult.snapshot}
          rawVideoDataUrl={snapshotResult.rawVideo}
          onClose={() => setSnapshotResult(null)}
        />
      )}
    </div>
  );
};
