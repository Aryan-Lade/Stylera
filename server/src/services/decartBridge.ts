import crypto from 'crypto';

export interface VtonSessionConfig {
  sessionId: string;
  model: 'lucy-vton-3.6' | 'lucy-vton-3.5';
  speed: 'fast' | 'quality';
  resolution: { width: number; height: number; fps: number };
  roomName: string;
  livekitUrl: string;
  token: string;
  initialPrompt?: string;
  garmentImageUrl?: string;
  isSimulated: boolean;
  createdAt: number;
}

export interface GarmentPromptInput {
  title: string;
  category: 'sunglasses' | 'top' | 'pants' | 'dress' | 'shoes' | 'jewelry' | 'hat';
  brand?: string;
  color?: string;
  fit?: string;
  material?: string;
  imageUrl?: string;
}

export class DecartBridgeService {
  private apiKey: string;
  private apiEndpoint: string;
  private livekitHost: string;
  private activeSessions: Map<string, VtonSessionConfig> = new Map();

  constructor() {
    this.apiKey = process.env.DECART_API_KEY || '';
    this.apiEndpoint = process.env.DECART_API_ENDPOINT || 'https://api.platform.decart.ai/v1';
    this.livekitHost = process.env.LIVEKIT_URL || 'wss://streaming.platform.decart.ai';
  }

  /**
   * Synthesize a highly optimized prompt for Lucy V-TON real-time generative diffusion
   */
  public generateVtonPrompt(input: GarmentPromptInput): string {
    const { title, category, brand, color, fit, material } = input;
    const brandStr = brand ? `by ${brand}` : '';
    const colorStr = color ? `${color} ` : '';
    const materialStr = material ? `${material} ` : '';
    const fitStr = fit ? `with ${fit} drape` : 'with natural drape and realistic fabric folds';

    switch (category) {
      case 'sunglasses':
        return `Equip real-time eyewear: ${colorStr}${title} ${brandStr}. Preserve accurate facial anatomy, match ambient specular reflections on lenses, and cast realistic soft shadows onto temples and nose bridge.`;
      case 'top':
        return `Substitute upper body garment with ${colorStr}${materialStr}${title} ${brandStr}, ${fitStr}. Preserve body contours, shoulder movement, dynamic creasing, and live environmental lighting.`;
      case 'dress':
        return `Substitute outfit with ${colorStr}${materialStr}full dress ${brandStr}, flowing naturally with body posture and realistic cloth simulation under live camera lighting.`;
      case 'pants':
        return `Substitute lower body clothing with ${colorStr}${materialStr}${title} ${brandStr}, ${fitStr}. Preserve leg articulation and seam geometry.`;
      case 'shoes':
        return `Substitute footwear with ${colorStr}${title} ${brandStr}. Fasten securely to foot keypoints with realistic contact shadows on the ground plane.`;
      case 'jewelry':
        return `Drape fine jewelry piece: ${title} ${brandStr}. Calculate accurate metallic subsurface shine and specular highlights matching live camera illumination.`;
      case 'hat':
        return `Equip headwear: ${colorStr}${title} ${brandStr}. Position securely around forehead circumference with dynamic brim shadow on face.`;
      default:
        return `Wear ${title} ${brandStr} with photorealistic fabric physics, natural cloth folds, and real-time lighting integration.`;
    }
  }

  /**
   * Initialize a real-time WebRTC V-TON session
   */
  public async createSession(garment?: GarmentPromptInput): Promise<VtonSessionConfig> {
    const sessionId = `vton_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const roomName = `room_${sessionId}`;
    const initialPrompt = garment ? this.generateVtonPrompt(garment) : undefined;
    const isSimulated = !this.apiKey;

    let token = '';

    if (this.apiKey) {
      try {
        // Production call to Decart Realtime API
        const response = await fetch(`${this.apiEndpoint}/realtime/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'lucy-vton-3.6',
            room: roomName,
            prompt: initialPrompt,
            garment_image_url: garment?.imageUrl,
            fps: 30,
            width: 1280,
            height: 720,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { token: string; livekit_url?: string };
          token = data.token;
          if (data.livekit_url) {
            this.livekitHost = data.livekit_url;
          }
        } else {
          console.warn('[DecartBridge] Decart API returned non-200. Falling back to local WebRTC gateway.');
          token = this.generateEphemeralToken(sessionId, roomName);
        }
      } catch (err) {
        console.warn('[DecartBridge] Network error communicating with Decart API:', err);
        token = this.generateEphemeralToken(sessionId, roomName);
      }
    } else {
      // Local development or merchant sandbox mode (no Decart API key required)
      token = this.generateEphemeralToken(sessionId, roomName);
    }

    const sessionConfig: VtonSessionConfig = {
      sessionId,
      model: 'lucy-vton-3.6',
      speed: 'fast',
      resolution: { width: 1280, height: 720, fps: 30 },
      roomName,
      livekitUrl: this.livekitHost,
      token,
      initialPrompt,
      garmentImageUrl: garment?.imageUrl,
      isSimulated,
      createdAt: Date.now(),
    };

    this.activeSessions.set(sessionId, sessionConfig);
    return sessionConfig;
  }

  /**
   * Dynamically update prompt/garment conditioning mid-session without reconnecting
   */
  public async updateConditioning(sessionId: string, garment: GarmentPromptInput): Promise<{ success: boolean; prompt: string }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found.`);
    }

    const newPrompt = this.generateVtonPrompt(garment);
    session.initialPrompt = newPrompt;
    session.garmentImageUrl = garment.imageUrl;

    if (this.apiKey && !session.isSimulated) {
      try {
        await fetch(`${this.apiEndpoint}/realtime/session/${sessionId}/set`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            prompt: newPrompt,
            garment_image_url: garment.imageUrl,
          }),
        });
      } catch (err) {
        console.warn(`[DecartBridge] Failed to dispatch conditioning update for ${sessionId}:`, err);
      }
    }

    return { success: true, prompt: newPrompt };
  }

  /**
   * Terminate a V-TON streaming session
   */
  public closeSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }

  /**
   * Generate an ephemeral token for client WebRTC authorization
   */
  private generateEphemeralToken(sessionId: string, roomName: string): string {
    const payload = {
      sub: sessionId,
      room: roomName,
      exp: Math.floor(Date.now() / 1000) + 3600 * 2, // 2 hour validity
      iss: 'stylera-decart-bridge',
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }
}

export const decartBridge = new DecartBridgeService();
