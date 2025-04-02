export const LightType = {
  DIRECTIONAL: 0,
  POINT: 1,
  SPOT: 2,
};

/**
 * Represents a light source in the scene.
 */
export default class Light {
  /**
   * Creates a Light instance.
   * @param {object} [options={}] - Configuration options for the light.
   * @param {LightType} [options.type=LightType.POINT] - Type of light source.
   * @param {number[]} [options.position=[0, 0, 1]] - Position (for Point/Spot) or Direction (for Directional, usually normalized).
   * @param {number[]} [options.color=[1, 1, 1]] - RGB color of the light (0-1 range).
   * @param {number} [options.intensity=1] - Brightness of the light.
   * @param {number} [options.range=10] - Range of the light (for Point/Spot). Affects attenuation.
   * @param {number} [options.innerConeAngle=0] - Inner angle for spotlights (radians).
   * @param {number} [options.outerConeAngle=Math.PI / 4] - Outer angle for spotlights (radians).
   * @param {boolean} [options.enabled=true] - Whether the light is active.
   */
  constructor(options = {}) {
    this.type = options.type ?? LightType.POINT;
    this.position = new Float32Array(options.position ?? [0, 0, 1]); // Use Float32Array for potential direct uniform upload
    this.color = new Float32Array(options.color ?? [1, 1, 1]);
    this.intensity = options.intensity ?? 1.0;
    this.range = options.range ?? 10.0; // Used for attenuation calculation
    this.innerConeAngle = options.innerConeAngle ?? 0.0; // Cosine of the angle often stored for efficiency
    this.outerConeAngle = options.outerConeAngle ?? Math.PI / 4.0; // Cosine of the angle often stored
    this.enabled = options.enabled ?? true;

    // If directional, normalize initial position and use it for direction too
    if (this.type === LightType.DIRECTIONAL) {
        const [x, y, z] = this.position;
        const len = Math.sqrt(x*x + y*y + z*z);
        if (len > 0.00001) {
            this.position[0] /= len;
            this.position[1] /= len;
            this.position[2] /= len;
        } else {
            // Default direction if position is zero vector
            this.position[0] = 0;
            this.position[1] = 0;
            this.position[2] = -1;
        }
    }

    // Pre-calculate cosine of cone angles for shader efficiency if needed
    this.cosInnerConeAngle = Math.cos(this.innerConeAngle);
    this.cosOuterConeAngle = Math.cos(this.outerConeAngle);

    // Direction for spotlights and directional lights
    this.direction = new Float32Array([0, 0, -1]); // Default direction
    if (this.type === LightType.DIRECTIONAL) {
        // Directional light's direction IS its (normalized) position vector
        this.direction[0] = this.position[0];
        this.direction[1] = this.position[1];
        this.direction[2] = this.position[2];
    } else if (options.direction) {
        // Set explicit direction for Spot lights if provided
        this.setDirection(options.direction);
    }
  }

  /**
   * Sets the light's position (Point/Spot) or direction (Directional).
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  setPosition(x, y, z) {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    // If directional, normalize
    if (this.type === LightType.DIRECTIONAL) {
        const len = Math.sqrt(x*x + y*y + z*z);
        if (len > 0.00001) {
            this.position[0] /= len;
            this.position[1] /= len;
            this.position[2] /= len;
        }
        // Also update direction to match normalized position
        this.direction[0] = this.position[0];
        this.direction[1] = this.position[1];
        this.direction[2] = this.position[2];
    }
  }

   /**
   * Sets the light's direction (Spot/Directional). Normalizes the input vector.
   * @param {number[]} dir - Array or Float32Array [x, y, z].
   */
  setDirection(dir) {
    const len = Math.sqrt(dir[0]*dir[0] + dir[1]*dir[1] + dir[2]*dir[2]);
    if (len > 0.00001) {
        this.direction[0] = dir[0] / len;
        this.direction[1] = dir[1] / len;
        this.direction[2] = dir[2] / len;
    } else {
        this.direction[0] = 0;
        this.direction[1] = 0;
        this.direction[2] = -1; // Default if zero vector provided
    }
     // For directional lights, position often represents direction
     if (this.type === LightType.DIRECTIONAL) {
         this.setPosition(this.direction[0], this.direction[1], this.direction[2]);
     }
  }

  /**
   * Sets the light's color.
   * @param {number} r - Red component (0-1).
   * @param {number} g - Green component (0-1).
   * @param {number} b - Blue component (0-1).
   */
  setColor(r, g, b) {
    this.color[0] = r;
    this.color[1] = g;
    this.color[2] = b;
  }

  /**
   * Sets the light's intensity.
   * @param {number} intensity - New intensity value.
   */
  setIntensity(intensity) {
    this.intensity = Math.max(0, intensity);
  }

   /**
   * Sets the light's range (Point/Spot).
   * @param {number} range - New range value.
   */
  setRange(range) {
    this.range = Math.max(0, range);
  }

  /**
   * Sets the spotlight cone angles.
   * @param {number} innerRadians - Inner cone angle in radians.
   * @param {number} outerRadians - Outer cone angle in radians.
   */
  setConeAngles(innerRadians, outerRadians) {
      this.innerConeAngle = Math.max(0, innerRadians);
      this.outerConeAngle = Math.max(this.innerConeAngle, outerRadians);
      this.cosInnerConeAngle = Math.cos(this.innerConeAngle);
      this.cosOuterConeAngle = Math.cos(this.outerConeAngle);
  }

  /**
   * Enables or disables the light.
   * @param {boolean} enabled - True to enable, false to disable.
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
  }
}
