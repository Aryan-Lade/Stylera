import { FilesetResolver, PoseLandmarker, FaceLandmarker, PoseLandmarkerResult, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

export interface VisionDetectionResults {
  poseResult: PoseLandmarkerResult | null;
  faceResult: FaceLandmarkerResult | null;
  timestamp: number;
}

class VisionManager {
  private poseLandmarker: PoseLandmarker | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private isInitializing = false;
  private isReady = false;
  private initError: string | null = null;
  private lastTimestamp = 0;
  private lastSuccessfulDetectionTime = 0;

  public async initialize(): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    this.initError = null;

    // 1. Determine local extension URLs (offline, bypasses CSP restrictions)
    let wasmLocation = '/wasm';
    let poseModelPath = '/models/pose_landmarker_lite.task';
    let faceModelPath = '/models/face_landmarker.task';

    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      try {
        wasmLocation = chrome.runtime.getURL('wasm');
        poseModelPath = chrome.runtime.getURL('models/pose_landmarker_lite.task');
        faceModelPath = chrome.runtime.getURL('models/face_landmarker.task');
      } catch {
        // fallback
      }
    }

    try {
      console.log('[Stylera Vision] Initializing WASM from:', wasmLocation);
      const vision = await FilesetResolver.forVisionTasks(wasmLocation);

      // Initialize Face Landmarker first (Head, Eyes, Nose, 3D Matrix)
      try {
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: faceModelPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.45,
          minFacePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true,
        });
      } catch (faceGpuErr) {
        console.warn('[Stylera Vision] Face GPU init failed, trying CPU:', faceGpuErr);
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: faceModelPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
        });
      }

      // Initialize Pose Landmarker (Upper + Lower Body)
      try {
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: poseModelPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
          outputSegmentationMasks: true,
        });
      } catch (poseGpuErr) {
        console.warn('[Stylera Vision] Pose GPU init failed, trying CPU:', poseGpuErr);
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: poseModelPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
      }

      this.isReady = true;
      this.isInitializing = false;
      console.log('[Stylera Vision] MediaPipe Vision Models (Face + Pose) successfully initialized on-device!');
      return true;
    } catch (err: any) {
      console.warn('[Stylera Vision] Local initialization error, attempting CDN fallback:', err);
      try {
        const cdnVision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        this.faceLandmarker = await FaceLandmarker.createFromOptions(cdnVision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
        });

        this.poseLandmarker = await PoseLandmarker.createFromOptions(cdnVision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        this.isReady = true;
        this.isInitializing = false;
        console.log('[Stylera Vision] CDN fallback initialized successfully');
        return true;
      } catch (fallbackErr: any) {
        console.error('[Stylera Vision] Vision initialization completely failed:', fallbackErr);
        this.initError = fallbackErr.message || 'Failed to initialize vision models';
        this.isInitializing = false;
        return false;
      }
    }
  }

  public detect(
    videoElement: HTMLVideoElement,
    timestamp: number,
    options?: { needFace?: boolean; needPose?: boolean }
  ): VisionDetectionResults {
    if (!this.isReady || videoElement.readyState < 2) {
      return { poseResult: null, faceResult: null, timestamp };
    }

    const needFace = options?.needFace ?? true;
    const needPose = options?.needPose ?? true;

    // MediaPipe requires strictly monotonically increasing timestamp
    let safeTimestamp = Math.floor(timestamp);
    if (safeTimestamp <= this.lastTimestamp) {
      safeTimestamp = this.lastTimestamp + 1;
    }
    this.lastTimestamp = safeTimestamp;

    let poseResult: PoseLandmarkerResult | null = null;
    let faceResult: FaceLandmarkerResult | null = null;

    if (needFace && this.faceLandmarker) {
      try {
        faceResult = this.faceLandmarker.detectForVideo(videoElement, safeTimestamp);
      } catch {
        // frame skip
      }
    }

    if (needPose && this.poseLandmarker) {
      try {
        poseResult = this.poseLandmarker.detectForVideo(videoElement, safeTimestamp);
      } catch {
        // frame skip
      }
    }

    if (
      (faceResult?.faceLandmarks && faceResult.faceLandmarks.length > 0) ||
      (poseResult?.landmarks && poseResult.landmarks.length > 0)
    ) {
      this.lastSuccessfulDetectionTime = performance.now();
    }

    return { poseResult, faceResult, timestamp: safeTimestamp };
  }

  /**
   * Runs face landmark detection on a static image or canvas
   * Used to automatically isolate glasses/headwear from images of models wearing them
   */
  public async detectFaceOnStaticImage(
    imageSource: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageBitmap
  ): Promise<Array<{ x: number; y: number; z: number }> | null> {
    if (!this.isReady) {
      await this.initialize();
    }
    if (!this.faceLandmarker) return null;

    try {
      this.lastTimestamp = Math.max(this.lastTimestamp + 1, Math.floor(performance.now()));
      const res = this.faceLandmarker.detectForVideo(imageSource, this.lastTimestamp);
      return res.faceLandmarks?.[0] || null;
    } catch (err) {
      console.warn('[Stylera Vision] Static face detection on image failed:', err);
      return null;
    }
  }

  public hasRecentDetection(): boolean {
    return performance.now() - this.lastSuccessfulDetectionTime < 1000;
  }

  public getStatus() {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      error: this.initError,
    };
  }

  public close() {
    this.poseLandmarker?.close();
    this.faceLandmarker?.close();
    this.poseLandmarker = null;
    this.faceLandmarker = null;
    this.isReady = false;
  }
}

export const visionManager = new VisionManager();
