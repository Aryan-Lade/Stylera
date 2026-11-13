import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCameraStore } from '../../src/tryon-app/camera/cameraStore';

describe('Camera Store Tests', () => {
  beforeEach(() => {
    useCameraStore.setState({
      stream: null,
      permissionStatus: 'prompt',
      isMirrored: true,
      resolution: '720p',
      availableDevices: [],
      selectedDeviceId: '',
      errorMessage: null,
    });
  });

  it('should initialize with expected defaults', () => {
    const state = useCameraStore.getState();
    expect(state.permissionStatus).toBe('prompt');
    expect(state.isMirrored).toBe(true);
    expect(state.resolution).toBe('720p');
    expect(state.stream).toBeNull();
  });

  it('should toggle mirror state correctly', () => {
    expect(useCameraStore.getState().isMirrored).toBe(true);
    useCameraStore.getState().toggleMirror();
    expect(useCameraStore.getState().isMirrored).toBe(false);
    useCameraStore.getState().toggleMirror();
    expect(useCameraStore.getState().isMirrored).toBe(true);
  });

  it('should update resolution constraint', () => {
    useCameraStore.getState().setResolution('1080p');
    expect(useCameraStore.getState().resolution).toBe('1080p');
  });

  it('should handle stopCamera cleanly', () => {
    const stopMock = vi.fn();
    const fakeStream = {
      getTracks: () => [{ stop: stopMock }],
    } as unknown as MediaStream;

    useCameraStore.setState({ stream: fakeStream, isVideoReady: true });
    useCameraStore.getState().stopCamera();

    expect(stopMock).toHaveBeenCalled();
    expect(useCameraStore.getState().stream).toBeNull();
    expect(useCameraStore.getState().isVideoReady).toBe(false);
  });
});
