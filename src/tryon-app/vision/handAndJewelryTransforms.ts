export interface WristItemTransform {
  x: number;
  y: number;
  scale: number;
  rotationZ: number;
  visible: boolean;
}

export interface NecklaceTransform {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotationZ: number;
  visible: boolean;
}

export interface EarringsPairTransform {
  leftEar: { x: number; y: number; scale: number; visible: boolean };
  rightEar: { x: number; y: number; scale: number; visible: boolean };
}

export function computeWristTransform(
  poseLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
  viewportWidth: number,
  viewportHeight: number
): WristItemTransform | null {
  if (!poseLandmarks || poseLandmarks.length < 17) return null;

  // 13: Left elbow, 15: Left wrist
  // 14: Right elbow, 16: Right wrist
  const leftWrist = poseLandmarks[15];
  const rightWrist = poseLandmarks[16];
  const leftElbow = poseLandmarks[13];
  const rightElbow = poseLandmarks[14];

  // Pick the wrist with higher confidence/visibility
  const leftVis = leftWrist?.visibility ?? 0.5;
  const rightVis = rightWrist?.visibility ?? 0.5;

  const useLeft = leftVis >= rightVis;
  const targetWrist = useLeft ? leftWrist : rightWrist;
  const targetElbow = useLeft ? leftElbow : rightElbow;

  if (!targetWrist || (targetWrist.visibility ?? 0.5) < 0.35) {
    return null;
  }

  const wx = targetWrist.x * viewportWidth;
  const wy = targetWrist.y * viewportHeight;

  let angle = 0;
  let scale = 40;

  if (targetElbow) {
    const ex = targetElbow.x * viewportWidth;
    const ey = targetElbow.y * viewportHeight;
    angle = Math.atan2(wy - ey, wx - ex);
    const forearmLen = Math.hypot(wx - ex, wy - ey);
    scale = Math.max(30, forearmLen * 0.28);
  }

  return {
    x: wx,
    y: wy,
    scale,
    rotationZ: angle,
    visible: true,
  };
}

export function computeNecklaceTransform(
  poseLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
  faceLandmarks: Array<{ x: number; y: number; z: number }> | null,
  viewportWidth: number,
  viewportHeight: number
): NecklaceTransform | null {
  if (!poseLandmarks || poseLandmarks.length < 13) return null;

  const leftShoulder = poseLandmarks[11];
  const rightShoulder = poseLandmarks[12];
  if (!leftShoulder || !rightShoulder) return null;

  const lsX = leftShoulder.x * viewportWidth;
  const lsY = leftShoulder.y * viewportHeight;
  const rsX = rightShoulder.x * viewportWidth;
  const rsY = rightShoulder.y * viewportHeight;

  const shoulderSpan = Math.hypot(rsX - lsX, rsY - lsY);
  const midShoulderX = (lsX + rsX) / 2;
  const midShoulderY = (lsY + rsY) / 2;

  let chinY = midShoulderY - shoulderSpan * 0.35;
  if (faceLandmarks && faceLandmarks[152]) {
    chinY = faceLandmarks[152].y * viewportHeight;
  }

  // Position between chin and shoulders
  const neckY = (chinY + midShoulderY * 2) / 3;
  const angle = Math.atan2(rsY - lsY, rsX - lsX);

  return {
    centerX: midShoulderX,
    centerY: neckY,
    width: shoulderSpan * 0.7,
    height: shoulderSpan * 0.65,
    rotationZ: -angle,
    visible: true,
  };
}

export function computeEarringsTransform(
  faceLandmarks: Array<{ x: number; y: number; z: number }>,
  viewportWidth: number,
  viewportHeight: number
): EarringsPairTransform | null {
  if (!faceLandmarks || faceLandmarks.length < 455) return null;

  // 234: Left tragus / ear area
  // 454: Right tragus / ear area
  const leftEar = faceLandmarks[234];
  const rightEar = faceLandmarks[454];

  if (!leftEar || !rightEar) return null;

  const leX = leftEar.x * viewportWidth;
  const leY = leftEar.y * viewportHeight;
  const reX = rightEar.x * viewportWidth;
  const reY = rightEar.y * viewportHeight;

  const earSpan = Math.hypot(reX - leX, reY - leY);
  const scale = Math.max(20, earSpan * 0.22);

  return {
    leftEar: {
      x: leX,
      y: leY + scale * 0.5, // Drapes below earlobe
      scale,
      visible: true,
    },
    rightEar: {
      x: reX,
      y: reY + scale * 0.5,
      scale,
      visible: true,
    },
  };
}
