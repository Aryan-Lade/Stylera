import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCameraStore } from './cameraStore';
import { useGarmentStore } from '../garments/garmentStore';
import { visionManager } from '../vision/visionManager';
import { OverlayRenderer } from '../render/overlayRenderer';
import { FlipHorizontal, Settings2, Video, VideoOff, Activity, Camera } from 'lucide-react';
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
    setVideoElement,
    resolution,
    setResolution,
    availableDevices,
    selectedDeviceId,
    setSelectedDevice,
    stopCamera,
    startCamera,
  } = useCameraStore();

  const { items } = useGarmentStore();

  const [showSettings, setShowSettings] = useState(false);
  const [modelStatus, setModelStatus] = useState<string>('Initializing AI...');
  const [currentFps, setCurrentFps] = useState<number>(30);
  const [perfTier, setPerfTier] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [snapshotResult, setSnapshotResult] = useState<{ snapshot: string; rawVideo: string } | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());

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

      // 2. Capture composite (video + Three.js overlay)
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

    // Render overlay scene
    renderer.render(detection, items, isMirrored, video);

    // Schedule next frame (using requestVideoFrameCallback if supported, otherwise requestAnimationFrame)
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && (video as any).requestVideoFrameCallback) {
      (video as any).requestVideoFrameCallback(runFrameLoop);
    } else {
      animationFrameId.current = requestAnimationFrame(runFrameLoop);
    }
  }, [items, isMirrored]);

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
      {/* Underlying Webcam Video */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        onLoadedMetadata={handleVideoLoadedMetadata}
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-150 ${
          isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
        }`}
      />

      {/* Render Canvas (Three.js overlay stacked directly above video) */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none transition-transform duration-150 ${
          isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
        }`}
      />

      {/* Additional Overlays / Children (drop zones, static preview, outfit tray) */}
      <div className="absolute inset-0 pointer-events-auto">{children}</div>

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
          <span className="text-[9px] text-slate-400 px-1.5 font-medium hidden sm:inline">
            {modelStatus}
          </span>

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

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Resolution
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['480p', '720p', '1080p'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`py-1 text-[11px] rounded font-medium transition-all ${
                    resolution === res
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between">
            <button
              onClick={() => {
                stopCamera();
                setShowSettings(false);
              }}
              className="flex items-center gap-1.5 text-[11px] text-red-400 hover:text-red-300"
            >
              <VideoOff className="w-3.5 h-3.5" />
              <span>Stop Camera</span>
            </button>
            <button
              onClick={() => startCamera()}
              className="flex items-center gap-1.5 text-[11px] text-pink-400 hover:text-pink-300"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
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
