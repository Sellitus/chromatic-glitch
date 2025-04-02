/**
 * Represents a single particle in a particle system.
 */
export default class Particle {
  constructor() {
    this.active = false;

    // Position
    this.x = 0;
    this.y = 0;
    this.z = 0; // For potential 3D effects or layering

    // Velocity
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;

    // Acceleration (optional, can be added later if needed)
    // this.ax = 0;
    // this.ay = 0;
    // this.az = 0;

    // Lifetime
    this.life = 0; // Current life in seconds
    this.maxLife = 1; // Max life in seconds

    // Visual properties
    this.size = 1;
    this.startSize = 1;
    this.endSize = 1;

    this.rotation = 0; // In radians
    this.angularVelocity = 0;

    // Color RGBA (0-1 range)
    this.color = { r: 1, g: 1, b: 1, a: 1 };
    this.startColor = { r: 1, g: 1, b: 1, a: 1 };
    this.endColor = { r: 1, g: 1, b: 1, a: 1 };

    // Texture/Sprite information (optional, can be added later)
    // this.texture = null;
    // this.frame = 0;

    // Custom data (optional)
    this.data = null;
  }

  /**
   * Initializes the particle with given properties.
   * Called by the ParticleEmitter when a particle is spawned.
   * @param {object} options - Initialization options.
   */
  init(options = {}) {
    this.active = true;

    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.z = options.z ?? 0;

    this.vx = options.vx ?? 0;
    this.vy = options.vy ?? 0;
    this.vz = options.vz ?? 0;

    this.life = 0;
    this.maxLife = options.maxLife ?? 1;

    this.size = options.startSize ?? 1;
    this.startSize = options.startSize ?? 1;
    this.endSize = options.endSize ?? this.startSize;

    this.rotation = options.rotation ?? 0;
    this.angularVelocity = options.angularVelocity ?? 0;

    this.startColor = { ...(options.startColor ?? { r: 1, g: 1, b: 1, a: 1 }) };
    this.endColor = { ...(options.endColor ?? this.startColor) };
    this.color = { ...this.startColor };

    // this.texture = options.texture ?? null;
    // this.frame = options.frame ?? 0;
    this.data = options.data ?? null;
  }

  /**
   * Updates the particle's state.
   * @param {number} deltaTime - Time elapsed since the last update (in seconds).
   * @returns {boolean} True if the particle is still active, false otherwise.
   */
  update(deltaTime) {
    if (!this.active) {
      return false;
    }

    this.life += deltaTime;
    const lifeRatio = Math.min(1.0, this.life / this.maxLife); // Calculate ratio, clamp to 1.0 max

    // Update position
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.z += this.vz * deltaTime;

    // Update rotation
    this.rotation += this.angularVelocity * deltaTime;

    // Interpolate properties based on life ratio
    // Size interpolation (linear)
    this.size = this.startSize + (this.endSize - this.startSize) * lifeRatio;

    // Color interpolation (linear)
    this.color.r = this.startColor.r + (this.endColor.r - this.startColor.r) * lifeRatio;
    this.color.g = this.startColor.g + (this.endColor.g - this.startColor.g) * lifeRatio;
    this.color.b = this.startColor.b + (this.endColor.b - this.startColor.b) * lifeRatio;
    this.color.a = this.startColor.a + (this.endColor.a - this.startColor.a) * lifeRatio;

    // Clamp values
    this.size = Math.max(0, this.size);
    this.color.r = Math.max(0, Math.min(1, this.color.r));
    this.color.g = Math.max(0, Math.min(1, this.color.g));
    this.color.b = Math.max(0, Math.min(1, this.color.b));
    this.color.a = Math.max(0, Math.min(1, this.color.a));

    // Now check for deactivation
    if (this.life >= this.maxLife) {
      this.active = false;
      return false;
    }

    return true;
  }

  /**
   * Resets the particle to its default inactive state.
   */
  reset() {
    this.active = false;
    this.life = 0;
    // Reset other properties if necessary for pooling
  }
}
