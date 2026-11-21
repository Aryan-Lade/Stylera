export interface LowerBodyTransformResult {
  hipCenterX: number;
  hipCenterY: number;
  width: number;
  height: number;
  rotationZ: number;
  isLegsVisible: boolean;
}

export interface FootwearPairResult {
  leftShoe: {
    x: number;
    y: number;
    scale: number;
    rotationZ: number;
    visible: boolean;
  };
  rightShoe: {
    x: number;
    y: number;
    scale: number;
    rotationZ: number;
    visible: boolean;
  };
}

export function computeLowerBodyTransform(
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
  viewportWidth: number,
  viewportHeight: number
): LowerBodyTransformResult | null {
  if (!landmarks || landmarks.length < 29) return null;

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  if (!leftHip || !rightHip) return null;

  const lhX = leftHip.x * viewportWidth;
  const lhY = leftHip.y * viewportHeight;
  const rhX = rightHip.x * viewportWidth;
  const rhY = rightHip.y * viewportHeight;

  const hipWidth = Math.hypot(rhX - lhX, rhY - lhY);
  const hipCenterX = (lhX + rhX) / 2;
  const hipCenterY = (lhY + rhY) / 2;

  // Check if knees and ankles are in frame
  const isKneesVisible =
    (leftKnee?.visibility ?? 0.5) > 0.4 &&
    (rightKnee?.visibility ?? 0.5) > 0.4 &&
    (leftKnee?.y ?? 1) < 0.98;

  const isAnklesVisible =
    (leftAnkle?.visibility ?? 0.5) > 0.4 &&
    (rightAnkle?.visibility ?? 0.5) > 0.4 &&
    (leftAnkle?.y ?? 1) < 0.98;

  const isLegsVisible = isKneesVisible && isAnklesVisible;

  let legLength = hipWidth * 2.8;
  let angle = Math.atan2(rhY - lhY, rhX - lhX);

  if (leftAnkle && rightAnkle && isAnklesVisible) {
    const laY = leftAnkle.y * viewportHeight;
    const raY = rightAnkle.y * viewportHeight;
    const ankleCenterY = (laY + raY) / 2;
    legLength = Math.max(hipWidth * 1.5, ankleCenterY - hipCenterY);
  }

  return {
    hipCenterX,
    hipCenterY,
    width: hipWidth * 1.8,
    height: legLength,
    rotationZ: -angle,
    isLegsVisible,
  };
}

export function computeFootwearPair(
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
  viewportWidth: number,
  viewportHeight: number
): FootwearPairResult | null {
  if (!landmarks || landmarks.length < 33) return null;

  // 27: Left ankle, 29: Left heel, 31: Left foot index
  // 28: Right ankle, 30: Right heel, 32: Right foot index
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftFoot = landmarks[31] || landmarks[29] || leftAnkle;
  const rightFoot = landmarks[32] || landmarks[30] || rightAnkle;

  if (!leftAnkle || !rightAnkle) return null;

  const leftVisible = (leftAnkle.visibility ?? 0.5) > 0.35 && leftAnkle.y < 0.99;
  const rightVisible = (rightAnkle.visibility ?? 0.5) > 0.35 && rightAnkle.y < 0.99;

  // Left shoe
  const laX = leftAnkle.x * viewportWidth;
  const laY = leftAnkle.y * viewportHeight;
  const lfX = leftFoot.x * viewportWidth;
  const lfY = leftFoot.y * viewportHeight;
  const leftAngle = Math.atan2(lfY - laY, lfX - laX);
  const leftScale = Math.max(40, Math.hypot(lfX - laX, lfY - laY) * 1.8);

  // Right shoe
  const raX = rightAnkle.x * viewportWidth;
  const raY = rightAnkle.y * viewportHeight;
  const rfX = rightFoot.x * viewportWidth;
  const rfY = rightFoot.y * viewportHeight;
  const rightAngle = Math.atan2(rfY - raY, rfX - raX);
  const rightScale = Math.max(40, Math.hypot(rfX - raX, rfY - raY) * 1.8);

  return {
    leftShoe: {
      x: laX,
      y: laY,
      scale: leftScale,
      rotationZ: leftAngle,
      visible: leftVisible,
    },
    rightShoe: {
      x: raX,
      y: raY,
      scale: rightScale,
      rotationZ: rightAngle,
      visible: rightVisible,
    },
  };
}
