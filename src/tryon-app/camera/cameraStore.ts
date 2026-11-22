import { create } from 'zustand';

export type CameraPermissionState = 'prompt' | 'requesting' | 'granted' | 'denied' | 'error';
export type CameraResolution = '480p' | '720p' | '1080p';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

interface CameraStoreState {
  stream: MediaStream | null;
  videoElement: HTMLVideoElement | null;
  permissionStatus: CameraPermissionState;
  errorMessage: string | null;
  isMirrored: boolean;
  isAutoFraming: boolean;
  selectedDeviceId: string;
  availableDevices: CameraDevice[];
  resolution: CameraResolution;
  fps: number;
  isVideoReady: boolean;

  // Actions
  setVideoElement: (el: HTMLVideoElement | null) => void;
  setMirrored: (mirrored: boolean) => void;
  toggleMirror: () => void;
  setAutoFraming: (enabled: boolean) => void;
  toggleAutoFraming: () => void;
  setResolution: (res: CameraResolution) => void;
  setSelectedDevice: (deviceId: string) => void;
  startCamera: (deviceId?: string, resolution?: CameraResolution) => Promise<boolean>;
  stopCamera: () => void;
  refreshDevices: () => Promise<void>;
}

const RESOLUTION_CONSTRAINTS: Record<CameraResolution, { width: number; height: number }> = {
  '480p': { width: 640, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
};

export const useCameraStore = create<CameraStoreState>((set, get) => ({
  stream: null,
  videoElement: null,
  permissionStatus: 'prompt',
  errorMessage: null,
  isMirrored: true,
  isAutoFraming: true,
  selectedDeviceId: '',
  availableDevices: [],
  resolution: '720p',
  fps: 0,
  isVideoReady: false,

  setVideoElement: (el) => set({ videoElement: el }),
  setMirrored: (isMirrored) => set({ isMirrored }),
  toggleMirror: () => set((state) => ({ isMirrored: !state.isMirrored })),
  setAutoFraming: (isAutoFraming) => set({ isAutoFraming }),
  toggleAutoFraming: () => set((state) => ({ isAutoFraming: !state.isAutoFraming })),
  setResolution: (resolution) => {
    set({ resolution });
    const { stream, selectedDeviceId } = get();
    if (stream) {
      get().startCamera(selectedDeviceId, resolution);
    }
  },
  setSelectedDevice: (selectedDeviceId) => {
    set({ selectedDeviceId });
    get().startCamera(selectedDeviceId, get().resolution);
  },

  refreshDevices: async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
      set({ availableDevices: videoDevices });
    } catch (err) {
      console.warn('[Stylera Camera] Error enumerating devices:', err);
    }
  },

  startCamera: async (deviceId?: string, resolution?: CameraResolution) => {
    const state = get();
    const targetResolution = resolution || state.resolution;
    const targetDeviceId = deviceId !== undefined ? deviceId : state.selectedDeviceId;

    // Stop current stream if running
    state.stopCamera();

    set({ permissionStatus: 'requesting', errorMessage: null, isVideoReady: false });

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined,
          width: { ideal: RESOLUTION_CONSTRAINTS[targetResolution].width },
          height: { ideal: RESOLUTION_CONSTRAINTS[targetResolution].height },
          facingMode: targetDeviceId ? undefined : 'user',
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      set({
        stream: mediaStream,
        permissionStatus: 'granted',
        errorMessage: null,
      });

      // Update available devices with proper labels once permission is granted
      await get().refreshDevices();

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.deviceId) {
          set({ selectedDeviceId: settings.deviceId });
        }
      }

      return true;
    } catch (error: any) {
      console.error('[Stylera Camera] getUserMedia error:', error);
      let errorMsg = 'Failed to access camera.';
      let permStatus: CameraPermissionState = 'error';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please allow camera access in Chrome settings.';
        permStatus = 'denied';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMsg = 'Camera is already in use by another application.';
      }

      set({
        stream: null,
        permissionStatus: permStatus,
        errorMessage: errorMsg,
        isVideoReady: false,
      });
      return false;
    }
  },

  stopCamera: () => {
    const { stream } = get();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      set({ stream: null, isVideoReady: false });
    }
  },
}));
