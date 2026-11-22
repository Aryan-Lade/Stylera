import * as THREE from 'three';
import { LandmarkSmoother2D } from '../vision/oneEuroFilter';
import { CATEGORY_ANCHORS } from '../garments/categoryAnchors';
import { GarmentItem } from '../../shared/types';
import { VisionDetectionResults } from '../vision/visionManager';
import { computeFaceItemTransform } from '../vision/faceTransforms';
import { computeLowerBodyTransform, computeFootwearPair } from '../vision/lowerBodyTransforms';
import {
  computeWristTransform,
  computeNecklaceTransform,
  computeEarringsTransform,
} from '../vision/handAndJewelryTransforms';
import { LightingEstimator } from './lightingMatch';
import { OcclusionManager } from './occlusionMask';

export interface OverlayTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotationZ: number;
  visible: boolean;
  opacity: number;
}

export class OverlayRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private smoother = new LandmarkSmoother2D();
  private textureLoader = new THREE.TextureLoader();
  private garmentMeshes = new Map<string, THREE.Mesh>();
  private garmentTextures = new Map<string, THREE.Texture>();
  private lightingEstimator = new LightingEstimator();
  private occlusionManager: OcclusionManager;
  private lastPoseTime = 0;
  private viewportWidth = 640;
  private viewportHeight = 480;

  constructor(canvas: HTMLCanvasElement) {
    this.viewportWidth = canvas.clientWidth || 640;
    this.viewportHeight = canvas.clientHeight || 480;

    // Set up transparent overlay scene
    this.scene = new THREE.Scene();
    this.occlusionManager = new OcclusionManager(this.scene);

    // Orthographic camera for pixel-perfect 2D/2.5D screen coordinates
    this.camera = new THREE.OrthographicCamera(
      0,
      this.viewportWidth,
      0,
      -this.viewportHeight,
      -1000,
      1000
    );
    this.camera.position.z = 100;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(this.viewportWidth, this.viewportHeight, false);
    this.renderer.setClearColor(0x000000, 0);
  }

  public resize(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.camera.right = width;
    this.camera.bottom = -height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public render(
    detection: VisionDetectionResults,
    items: GarmentItem[],
    _isMirrored: boolean,
    videoElement?: HTMLVideoElement
  ) {
    const { poseResult, faceResult, timestamp } = detection;
    const poseLandmarks = poseResult?.landmarks?.[0] || null;
    const faceLandmarks = faceResult?.faceLandmarks?.[0] || null;
    const faceMatrix = (faceResult as any)?.facialTransformationMatrixes?.[0]?.data || null;

    // Estimate ambient lighting from video
    let lighting = { color: new THREE.Color(1, 1, 1), brightness: 1.0 };
    if (videoElement) {
      lighting = this.lightingEstimator.estimateFromVideo(videoElement, timestamp);
    }

    // Update hand occluders
    this.occlusionManager.updateHandOcclusion(poseLandmarks, this.viewportWidth, this.viewportHeight);

    // Track active item IDs to clean up removed items
    const activeIds = new Set(items.map((i) => i.id));
    for (const [id, mesh] of this.garmentMeshes.entries()) {
      if (!activeIds.has(id) && !id.includes('-left') && !id.includes('-right') && !id.includes('-ear-')) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
        this.garmentMeshes.delete(id);
        const tex = this.garmentTextures.get(id);
        if (tex) {
          tex.dispose();
          this.garmentTextures.delete(id);
        }
      }
    }

    if (poseLandmarks && poseLandmarks.length >= 25) {
      this.lastPoseTime = timestamp;
    }

    // Process each active garment
    for (const item of items) {
      if (!item.visible) {
        const mesh = this.garmentMeshes.get(item.id);
        if (mesh) mesh.visible = false;
        continue;
      }

      // Apply ambient lighting color tint
      const mesh = this.garmentMeshes.get(item.id);
      if (mesh && mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.color.copy(lighting.color).multiplyScalar(lighting.brightness);
      }

      const anchorConfig = CATEGORY_ANCHORS[item.category] || CATEGORY_ANCHORS['t-shirt'];

      if (item.category === 'earrings') {
        this.updateEarringsMesh(item, faceLandmarks, timestamp);
      } else if (anchorConfig.bodyType === 'face' || anchorConfig.bodyType === 'head') {
        this.updateFaceMesh(item, anchorConfig.bodyType, faceLandmarks, faceMatrix, timestamp, _isMirrored);
      } else if (anchorConfig.bodyType === 'lower_body') {
        this.updateLowerBodyMesh(item, poseLandmarks, timestamp);
      } else if (anchorConfig.bodyType === 'footwear') {
        this.updateFootwearMesh(item, poseLandmarks, timestamp);
      } else if (anchorConfig.bodyType === 'wrist' || anchorConfig.bodyType === 'ring') {
        this.updateWristMesh(item, poseLandmarks, timestamp);
      } else if (anchorConfig.bodyType === 'neck') {
        this.updateNeckMesh(item, poseLandmarks, faceLandmarks, timestamp);
      } else {
        this.updateGarmentMesh(item, poseLandmarks, timestamp, _isMirrored);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  private updateFaceMesh(
    item: GarmentItem,
    bodyType: 'face' | 'head',
    faceLandmarks: Array<{ x: number; y: number; z: number }> | null,
    faceMatrix: number[] | Float32Array | null,
    timestamp: number,
    isMirrored = true
  ) {
    let mesh = this.garmentMeshes.get(item.id);
    const anchorConfig = CATEGORY_ANCHORS[item.category];

    if (!mesh) {
      // 3D Curved Wearable Geometry for Eyewear & Headwear
      const segmentsX = 16;
      const segmentsY = 8;
      const geometry = new THREE.PlaneGeometry(1, 1, segmentsX, segmentsY);
      const pos = geometry.attributes.position;
      // Curve backward around the face/temples: z = - (x^2) * 0.42
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const zCurvature = -Math.pow(x, 2) * 0.42;
        pos.setZ(i, zCurvature);
      }
      geometry.computeVertexNormals();

      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = anchorConfig.zLayer;
      this.scene.add(mesh);
      this.garmentMeshes.set(item.id, mesh);

      const imageUrl = item.processedImageUrl || item.sourceUrl;
      this.textureLoader.load(imageUrl, (texture) => {
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        (mesh!.material as THREE.MeshBasicMaterial).map = texture;
        (mesh!.material as THREE.MeshBasicMaterial).needsUpdate = true;
        this.garmentTextures.set(item.id, texture);
      });
    }

    if (!faceLandmarks) {
      mesh.visible = false;
      return;
    }

    const faceTransform = computeFaceItemTransform(
      faceLandmarks,
      faceMatrix,
      bodyType,
      this.viewportWidth,
      this.viewportHeight
    );

    if (!faceTransform) {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;

    // Smooth center coordinates via 1-Euro filter (using synthetic IDs 900+ for face)
    const [smX, smY] = this.smoother.smooth(
      901,
      faceTransform.centerX + item.offsetX,
      faceTransform.centerY + item.offsetY,
      timestamp
    );

    mesh.position.set(smX, -smY, 50);

    // 3D head pose perspective rotation:
    mesh.rotation.x = faceTransform.rotationX;
    mesh.rotation.y = isMirrored ? faceTransform.rotationY : -faceTransform.rotationY;
    mesh.rotation.z = isMirrored
      ? faceTransform.rotationZ + (item.rotation * Math.PI) / 180
      : -faceTransform.rotationZ + (item.rotation * Math.PI) / 180;

    const finalWidth = faceTransform.width * anchorConfig.widthScale * item.scale;
    const finalHeight = faceTransform.height * anchorConfig.heightScale * item.scale;
    mesh.scale.set(finalWidth, finalHeight, finalWidth * 0.4);
  }

  private updateLowerBodyMesh(
    item: GarmentItem,
    poseLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }> | null,
    timestamp: number
  ) {
    let mesh = this.garmentMeshes.get(item.id);
    const anchorConfig = CATEGORY_ANCHORS[item.category];

    if (!mesh) {
      const geometry = new THREE.PlaneGeometry(1, 1, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = anchorConfig.zLayer;
      this.scene.add(mesh);
      this.garmentMeshes.set(item.id, mesh);

      const imageUrl = item.processedImageUrl || item.sourceUrl;
      this.textureLoader.load(imageUrl, (texture) => {
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        (mesh!.material as THREE.MeshBasicMaterial).map = texture;
        (mesh!.material as THREE.MeshBasicMaterial).needsUpdate = true;
        this.garmentTextures.set(item.id, texture);
      });
    }

    if (!poseLandmarks) {
      mesh.visible = false;
      return;
    }

    const lowerTransform = computeLowerBodyTransform(poseLandmarks, this.viewportWidth, this.viewportHeight);
    if (!lowerTransform) {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;
    const [smX, smY] = this.smoother.smooth(
      2324,
      lowerTransform.hipCenterX + item.offsetX,
      lowerTransform.hipCenterY + (lowerTransform.height * anchorConfig.yOffsetRatio) + item.offsetY,
      timestamp
    );

    mesh.position.set(smX, -smY, 0);
    mesh.rotation.z = lowerTransform.rotationZ + (item.rotation * Math.PI) / 180;
    mesh.scale.set(
      lowerTransform.width * anchorConfig.widthScale * item.scale,
      lowerTransform.height * anchorConfig.heightScale * item.scale,
      1
    );
  }

  private updateFootwearMesh(
    item: GarmentItem,
    poseLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }> | null,
    timestamp: number
  ) {
    const leftId = `${item.id}-left`;
    const rightId = `${item.id}-right`;
    let leftMesh = this.garmentMeshes.get(leftId);
    let rightMesh = this.garmentMeshes.get(rightId);
    const anchorConfig = CATEGORY_ANCHORS[item.category];

    if (!leftMesh || !rightMesh) {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      leftMesh = new THREE.Mesh(geometry, material.clone());
      rightMesh = new THREE.Mesh(geometry, material.clone());
      leftMesh.renderOrder = anchorConfig.zLayer;
      rightMesh.renderOrder = anchorConfig.zLayer;

      this.scene.add(leftMesh);
      this.scene.add(rightMesh);
      this.garmentMeshes.set(leftId, leftMesh);
      this.garmentMeshes.set(rightId, rightMesh);

      const imageUrl = item.processedImageUrl || item.sourceUrl;
      this.textureLoader.load(imageUrl, (texture) => {
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        (leftMesh!.material as THREE.MeshBasicMaterial).map = texture;
        (rightMesh!.material as THREE.MeshBasicMaterial).map = texture;
        (leftMesh!.material as THREE.MeshBasicMaterial).needsUpdate = true;
        (rightMesh!.material as THREE.MeshBasicMaterial).needsUpdate = true;
        this.garmentTextures.set(item.id, texture);
      });
    }

    if (!poseLandmarks) {
      leftMesh.visible = false;
      rightMesh.visible = false;
      return;
    }

    const pair = computeFootwearPair(poseLandmarks, this.viewportWidth, this.viewportHeight);
    if (!pair) {
      leftMesh.visible = false;
      rightMesh.visible = false;
      return;
    }

    leftMesh.visible = pair.leftShoe.visible;
    rightMesh.visible = pair.rightShoe.visible;

    if (pair.leftShoe.visible) {
      const [smX, smY] = this.smoother.smooth(27, pair.leftShoe.x + item.offsetX, pair.leftShoe.y + item.offsetY, timestamp);
      leftMesh.position.set(smX, -smY, 20);
      leftMesh.rotation.z = pair.leftShoe.rotationZ + (item.rotation * Math.PI) / 180;
      leftMesh.scale.set(pair.leftShoe.scale * item.scale, pair.leftShoe.scale * 0.75 * item.scale, 1);
    }

    if (pair.rightShoe.visible) {
      const [smX, smY] = this.smoother.smooth(28, pair.rightShoe.x + item.offsetX, pair.rightShoe.y + item.offsetY, timestamp);
      rightMesh.position.set(smX, -smY, 20);
      rightMesh.rotation.z = pair.rightShoe.rotationZ + (item.rotation * Math.PI) / 180;
      // Mirror right shoe on X axis
      rightMesh.scale.set(-pair.rightShoe.scale * item.scale, pair.rightShoe.scale * 0.75 * item.scale, 1);
    }
  }

  private updateWristMesh(
    item: GarmentItem,
    poseLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }> | null,
    timestamp: number
  ) {
    let mesh = this.garmentMeshes.get(item.id);
    const anchorConfig = CATEGORY_ANCHORS[item.category];

    if (!mesh) {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = anchorConfig.zLayer;
      this.scene.add(mesh);
      this.garmentMeshes.set(item.id, mesh);

      const imageUrl = item.processedImageUrl || item.sourceUrl;
      this.textureLoader.load(imageUrl, (texture) => {
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        (mesh!.material as THREE.MeshBasicMaterial).map = texture;
        (mesh!.material as THREE.MeshBasicMaterial).needsUpdate = true;
        this.garmentTextures.set(item.id, texture);
      });
    }

    if (!poseLandmarks) {
      mesh.visible = false;
      return;
    }

    const wrist = computeWristTransform(poseLandmarks, this.viewportWidth, this.viewportHeight);
    if (!wrist || !wrist.visible) {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;
    const [smX, smY] = this.smoother.smooth(1516, wrist.x + item.offsetX, wrist.y + item.offsetY, timestamp);
    mesh.position.set(smX, -smY, 35);
    mesh.rotation.z = wrist.rotationZ + (item.rotation * Math.PI) / 180;
    mesh.scale.set(
      wrist.scale * anchorConfig.widthScale * item.scale,
      wrist.scale * anchorConfig.heightScale * item.scale,
      1
    );
  }

  private updateNeckMesh(
    item: GarmentItem,
    poseLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }> | null,
    faceLandmarks: Array<{ x: number; y: number; z: number }> | null,
    timestamp: number
  ) {
    let mesh = this.garmentMeshes.get(item.id);
    const anchorConfig = CATEGORY_ANCHORS[item.category];

    if (!mesh) {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = anchorConfig.zLayer;
      this.scene.add(mesh);
      this.garmentMeshes.set(item.id, mesh);

      const imageUrl = item.processedImageUrl || item.sourceUrl;
      this.textureLoader.load(imageUrl, (texture) => {
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        (mesh!.material as THREE.MeshBasicMaterial).map = texture;
        (mesh!.material as THREE.MeshBasicMaterial).needsUpdate = true;
        this.garmentTextures.set(item.id, texture);
      });
    }

    if (!poseLandmarks) {
      mesh.visible = false;
      return;
    }

    const neck = computeNecklaceTransform(poseLandmarks, faceLandmarks, this.viewportWidth, this.viewportHeight);
    if (!neck || !neck.visible) {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;
    const [smX, smY] = this.smoother.smooth(1112, neck.centerX + item.offsetX, neck.centerY + item.offsetY, timestamp);
    mesh.position.set(smX, -smY, 30);
    mesh.rotation.z = neck.rotationZ + (item.rotation * Math.PI) / 180;
    mesh.scale.set(
      neck.width * anchorConfig.widthScale * item.scale,
      neck.height * anchorConfig.heightScale * item.scale,
      1
    );
  }

  private updateEarringsMesh(
    item: GarmentItem,
    faceLandmarks: Array<{ x: number; y: number; z: number }> | null,
    timestamp: number
  ) {
    const leftId = `${item.id}-ear-l`;
    const rightId = `${item.id}-ear-r`;
    let leftMesh = this.garmentMeshes.get(leftId);
    let rightMesh = this.garmentMeshes.get(rightId);
    const anchorConfig = CATEGORY_ANCHORS['earrings'];

    if (!leftMesh || !rightMesh) {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      leftMesh = new THREE.Mesh(geometry, material.clone());
      rightMesh = new THREE.Mesh(geometry, material.clone());
      leftMesh.renderOrder = anchorConfig.zLayer;
      rightMesh.renderOrder = anchorConfig.zLayer;

      this.scene.add(leftMesh);
      this.scene.add(rightMesh);
      this.garmentMeshes.set(leftId, leftMesh);
      this.garmentMeshes.set(rightId, rightMesh);

      const imageUrl = item.processedImageUrl || item.sourceUrl;
      this.textureLoader.load(imageUrl, (texture) => {
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        (leftMesh!.material as THREE.MeshBasicMaterial).map = texture;
        (rightMesh!.material as THREE.MeshBasicMaterial).map = texture;
        (leftMesh!.material as THREE.MeshBasicMaterial).needsUpdate = true;
        (rightMesh!.material as THREE.MeshBasicMaterial).needsUpdate = true;
        this.garmentTextures.set(item.id, texture);
      });
    }

    if (!faceLandmarks) {
      leftMesh.visible = false;
      rightMesh.visible = false;
      return;
    }

    const earrings = computeEarringsTransform(faceLandmarks, this.viewportWidth, this.viewportHeight);
    if (!earrings) {
      leftMesh.visible = false;
      rightMesh.visible = false;
      return;
    }

    leftMesh.visible = earrings.leftEar.visible;
    rightMesh.visible = earrings.rightEar.visible;

    if (earrings.leftEar.visible) {
      const [smX, smY] = this.smoother.smooth(234, earrings.leftEar.x + item.offsetX, earrings.leftEar.y + item.offsetY, timestamp);
      leftMesh.position.set(smX, -smY, 48);
      leftMesh.scale.set(earrings.leftEar.scale * item.scale, earrings.leftEar.scale * 1.5 * item.scale, 1);
    }

    if (earrings.rightEar.visible) {
      const [smX, smY] = this.smoother.smooth(454, earrings.rightEar.x + item.offsetX, earrings.rightEar.y + item.offsetY, timestamp);
      rightMesh.position.set(smX, -smY, 48);
      rightMesh.scale.set(-earrings.rightEar.scale * item.scale, earrings.rightEar.scale * 1.5 * item.scale, 1);
    }
  }

  private updateGarmentMesh(
    item: GarmentItem,
    poseLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }> | null,
    timestamp: number,
    isMirrored = true
  ) {
    const anchorConfig = CATEGORY_ANCHORS[item.category] || CATEGORY_ANCHORS['t-shirt'];
    let mesh = this.garmentMeshes.get(item.id);

    // Create 3D curved torso mesh if it doesn't exist
    if (!mesh) {
      const segmentsX = 16;
      const segmentsY = 16;
      const geometry = new THREE.PlaneGeometry(1, 1, segmentsX, segmentsY);
      const pos = geometry.attributes.position;
      // 3D barrel depth curvature around torso
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const zCurvature = (0.25 - Math.pow(x, 2)) * 0.35;
        pos.setZ(i, zCurvature);
      }
      geometry.computeVertexNormals();

      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = anchorConfig.zLayer;
      this.scene.add(mesh);
      this.garmentMeshes.set(item.id, mesh);

      // Load texture
      const imageUrl = item.processedImageUrl || item.sourceUrl;
      this.textureLoader.load(imageUrl, (texture) => {
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        (mesh!.material as THREE.MeshBasicMaterial).map = texture;
        (mesh!.material as THREE.MeshBasicMaterial).needsUpdate = true;
        this.garmentTextures.set(item.id, texture);
      });
    }

    // If pose is not tracked, handle graceful fade or static center fallback
    if (!poseLandmarks) {
      const timeSincePose = timestamp - this.lastPoseTime;
      if (timeSincePose > 1200) {
        mesh.visible = false;
      }
      return;
    }

    mesh.visible = true;

    // Compute upper body landmarks (Shoulders: 11, 12; Hips: 23, 24)
    const rawLeftShoulder = poseLandmarks[11];
    const rawRightShoulder = poseLandmarks[12];
    const rawLeftHip = poseLandmarks[23] || rawLeftShoulder;
    const rawRightHip = poseLandmarks[24] || rawRightShoulder;

    if (!rawLeftShoulder || !rawRightShoulder) return;

    // Smooth landmarks via 1-Euro Filter
    const [lsX, lsY] = this.smoother.smooth(
      11,
      rawLeftShoulder.x * this.viewportWidth,
      rawLeftShoulder.y * this.viewportHeight,
      timestamp
    );
    const [rsX, rsY] = this.smoother.smooth(
      12,
      rawRightShoulder.x * this.viewportWidth,
      rawRightShoulder.y * this.viewportHeight,
      timestamp
    );
    const [lhX, lhY] = this.smoother.smooth(
      23,
      rawLeftHip.x * this.viewportWidth,
      rawLeftHip.y * this.viewportHeight,
      timestamp
    );
    const [rhX, rhY] = this.smoother.smooth(
      24,
      rawRightHip.x * this.viewportWidth,
      rawRightHip.y * this.viewportHeight,
      timestamp
    );

    // Compute shoulder midpoint & hip midpoint
    const midShoulderX = (lsX + rsX) / 2;
    const midShoulderY = (lsY + rsY) / 2;
    const midHipX = (lhX + rhX) / 2;
    const midHipY = (lhY + rhY) / 2;

    // Distance metrics
    const shoulderSpan = Math.hypot(rsX - lsX, rsY - lsY);
    const torsoHeight = Math.hypot(midHipX - midShoulderX, midHipY - midShoulderY) || shoulderSpan * 1.3;

    // Shoulder angle / rotation
    const angle = Math.atan2(rsY - lsY, rsX - lsX);

    // Calculate dimensions based on category anchor multipliers and user fine-tuning scale
    const garmentWidth = shoulderSpan * anchorConfig.widthScale * item.scale;
    const garmentHeight = torsoHeight * anchorConfig.heightScale * item.scale;

    // Center position offset
    const centerX = midShoulderX + (midHipX - midShoulderX) * anchorConfig.yOffsetRatio + item.offsetX;
    const centerY = midShoulderY + (midHipY - midShoulderY) * anchorConfig.yOffsetRatio + item.offsetY;

    // Update 3D mesh transform with mirror alignment
    mesh.position.set(centerX, -centerY, 0);
    mesh.rotation.z = isMirrored
      ? angle + (item.rotation * Math.PI) / 180
      : -angle + (item.rotation * Math.PI) / 180;
    mesh.scale.set(garmentWidth, garmentHeight, garmentWidth * 0.35);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public dispose() {
    for (const [, mesh] of this.garmentMeshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    for (const [, tex] of this.garmentTextures) {
      tex.dispose();
    }
    this.garmentMeshes.clear();
    this.garmentTextures.clear();
    this.renderer.dispose();
    this.smoother.reset();
  }
}
