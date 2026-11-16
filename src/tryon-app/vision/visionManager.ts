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

  public async initialize(): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    this.initError = null;

    try {
      // Load Mediapipe Tasks Vision WASM from Google CDN
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      // Initialize Pose Landmarker (Upper + Lower Body)
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: true,
      });

      // Initialize Face Landmarker (Head, Face Mesh, 3D Transformation Matrix)
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
      });

      this.isReady = true;
      this.isInitializing = false;
      console.log('[Stylera Vision] Vision Models (Pose + Face) successfully loaded with GPU acceleration');
      return true;
    } catch (err: any) {
      console.warn('[Stylera Vision] GPU delegate init error, falling back to CPU:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
        });

        this.isReady = true;
        this.isInitializing = false;
        console.log('[Stylera Vision] Vision Models loaded with CPU fallback');
        return true;
      } catch (fallbackErr: any) {
        console.error('[Stylera Vision] Vision initialization completely failed:', fallbackErr);
        this.initError = fallbackErr.message || 'Failed to load MediaPipe models';
        this.isInitializing = false;
        return false;
      }
    }
  }

  public detect(videoElement: HTMLVideoElement, timestamp: number): VisionDetectionResults {
    if (!this.isReady || videoElement.readyState < 2) {
      return { poseResult: null, faceResult: null, timestamp };
    }

    let poseResult: PoseLandmarkerResult | null = null;
    let faceResult: FaceLandmarkerResult | null = null;

    try {
      if (this.poseLandmarker) {
        poseResult = this.poseLandmarker.detectForVideo(videoElement, timestamp);
      }
    } catch (err) {
      // skip dropped frame
    }

    try {
      if (this.faceLandmarker) {
        faceResult = this.faceLandmarker.detectForVideo(videoElement, timestamp);
      }
    } catch (err) {
      // skip dropped frame
    }

    return { poseResult, faceResult, timestamp };
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
