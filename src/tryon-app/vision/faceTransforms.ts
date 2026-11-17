import * as THREE from 'three';

export interface FaceTransformResult {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotationX: number; // Pitch
  rotationY: number; // Yaw
  rotationZ: number; // Roll
  quaternion: THREE.Quaternion;
}

export function computeFaceItemTransform(
  landmarks: Array<{ x: number; y: number; z: number }>,
  matrixData: number[] | Float32Array | null,
  bodyType: 'face' | 'head',
  viewportWidth: number,
  viewportHeight: number
): FaceTransformResult | null {
  if (!landmarks || landmarks.length < 468) return null;

  // Extract key landmarks
  // 33: Left eye outer, 263: Right eye outer
  // 168: Nose bridge, 10: Forehead top, 152: Chin, 234: Left temple, 454: Right temple
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const noseBridge = landmarks[168] || landmarks[6];
  const forehead = landmarks[10];
  const chin = landmarks[152];
  const leftTemple = landmarks[234];
  const rightTemple = landmarks[454];

  if (!leftEye || !rightEye || !noseBridge) return null;

  // Convert to screen pixels
  const lx = leftEye.x * viewportWidth;
  const ly = leftEye.y * viewportHeight;
  const rx = rightEye.x * viewportWidth;
  const ry = rightEye.y * viewportHeight;

  const nx = noseBridge.x * viewportWidth;
  const ny = noseBridge.y * viewportHeight;

  const eyeSpan = Math.hypot(rx - lx, ry - ly);
  const headWidth = Math.hypot(
    (rightTemple.x - leftTemple.x) * viewportWidth,
    (rightTemple.y - leftTemple.y) * viewportHeight
  ) || eyeSpan * 1.8;

  const headHeight = Math.hypot(
    (chin.x - forehead.x) * viewportWidth,
    (chin.y - forehead.y) * viewportHeight
  ) || eyeSpan * 2.2;

  let centerX = nx;
  let centerY = ny;
  let width = eyeSpan * 2.3;
  let height = eyeSpan * 1.1;

  if (bodyType === 'head') {
    // For cap/hat/beanie: placed on top of forehead
    const fx = forehead.x * viewportWidth;
    const fy = forehead.y * viewportHeight;
    centerX = fx;
    centerY = fy - headHeight * 0.25;
    width = headWidth * 1.35;
    height = headHeight * 0.9;
  }

  // 3D Rotation extraction
  const quaternion = new THREE.Quaternion();
  let rotX = 0;
  let rotY = 0;
  let rotZ = Math.atan2(ry - ly, rx - lx);

  if (matrixData && matrixData.length === 16) {
    const mat4 = new THREE.Matrix4().fromArray(matrixData);
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    mat4.decompose(position, quaternion, scale);

    const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ');
    rotY = euler.y;
    rotX = euler.x;
    rotZ = euler.z;
  }

  return {
    centerX,
    centerY,
    width,
    height,
    rotationX: rotX,
    rotationY: rotY,
    rotationZ: rotZ,
    quaternion,
  };
}
