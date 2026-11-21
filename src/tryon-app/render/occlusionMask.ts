import * as THREE from 'three';

/**
 * Occlusion manager using hand positions and person segmentation boundaries
 * to prevent garments from drawing on top of crossed arms or hands
 */
export class OcclusionManager {
  private handOccluders: THREE.Mesh[] = [];

  constructor(private scene: THREE.Scene) {}

  public updateHandOcclusion(
    poseLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }> | null,
    viewportWidth: number,
    viewportHeight: number
  ) {
    if (!poseLandmarks) {
      this.hideOccluders();
      return;
    }

    // 15: Left wrist, 16: Right wrist, 19: Left index, 20: Right index
    const leftWrist = poseLandmarks[15];
    const rightWrist = poseLandmarks[16];

    // If wrist is positioned in front of the torso (z < hip z and inside torso bbox)
    const hipZ = (poseLandmarks[23]?.z || 0) + (poseLandmarks[24]?.z || 0) / 2;

    this.updateSingleHand(0, leftWrist, hipZ, viewportWidth, viewportHeight);
    this.updateSingleHand(1, rightWrist, hipZ, viewportWidth, viewportHeight);
  }

  private updateSingleHand(
    index: number,
    wrist: { x: number; y: number; z: number; visibility?: number } | undefined,
    torsoZ: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    if (!this.handOccluders[index]) {
      // Create depth occluder (renders to color/depth buffer above shirt)
      const geo = new THREE.CircleGeometry(25, 16);
      const mat = new THREE.MeshBasicMaterial({
        colorWrite: false, // In WebGL depth buffer, or invisible stencil
        depthWrite: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 40; // above shirts and jackets
      this.scene.add(mesh);
      this.handOccluders[index] = mesh;
    }

    const occluder = this.handOccluders[index];

    if (!wrist || (wrist.visibility ?? 0.5) < 0.4 || wrist.z > torsoZ) {
      occluder.visible = false;
      return;
    }

    occluder.visible = true;
    occluder.position.set(wrist.x * viewportWidth, -wrist.y * viewportHeight, 28);
  }

  public hideOccluders() {
    for (const mesh of this.handOccluders) {
      mesh.visible = false;
    }
  }

  public dispose() {
    for (const mesh of this.handOccluders) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.handOccluders = [];
  }
}
