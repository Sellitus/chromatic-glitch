import Particle from './Particle.js';

/**
 * Emits particles based on configured properties.
 * Manages a pool of Particle objects for efficiency.
 */
export default class ParticleEmitter {
  /**
   * Creates a ParticleEmitter instance.
   * @param {object} [options={}] - Configuration options for the emitter.
   * @param {number} [options.maxParticles=100] - Maximum number of particles this emitter can manage.
   * @param {number} [options.emissionRate=10] - Particles emitted per second. 0 for manual emission.
   * @param {number} [options.emissionDuration=Infinity] - Duration the emitter runs (in seconds). Infinity for continuous.
   * @param {number} [options.burst=0] - Number of particles to emit instantly on start/trigger.
   * @param {boolean} [options.loop=false] - Whether the emitter should restart after its duration.
   * @param {object} [options.particleOptions={}] - Default options passed to each particle's init method.
   *   @param {number|{min: number, max: number}} [options.particleOptions.maxLife=1] - Particle lifetime (seconds).
   *   @param {{x: number, y: number, z?: number}|{minX: number, maxX: number, minY: number, maxY: number, minZ?: number, maxZ?: number}} [options.particleOptions.position={x:0, y:0}] - Emitter position or area.
   *   @param {{vx: number, vy: number, vz?: number}|{minVx: number, maxVx: number, minY: number, maxY: number, minVz?: number, maxVz?: number}} [options.particleOptions.velocity={vx:0, vy:0}] - Initial velocity or range.
   *   @param {number|{min: number, max: number}} [options.particleOptions.startSize=1] - Initial particle size or range.
   *   @param {number|{min: number, max: number}} [options.particleOptions.endSize] - Final particle size or range (defaults to startSize).
   *   @param {{r,g,b,a}|{minR, maxR, ...}} [options.particleOptions.startColor={r:1,g:1,b:1,a:1}] - Initial color or range.
   *   @param {{r,g,b,a}|{minR, maxR, ...}} [options.particleOptions.endColor] - Final color or range (defaults to startColor).
   *   @param {number|{min: number, max: number}} [options.particleOptions.rotation=0] - Initial rotation (radians) or range.
   *   @param {number|{min: number, max: number}} [options.particleOptions.angularVelocity=0] - Angular velocity (radians/sec) or range.
   * @param {boolean} [options.autoStart=true] - Whether the emitter should start automatically.
   */
  constructor(options = {}) {
    this.maxParticles = options.maxParticles ?? 100;
    this.emissionRate = options.emissionRate ?? 10; // Particles per second
    this.emissionDuration = options.emissionDuration ?? Infinity;
    this.burst = options.burst ?? 0;
    this.loop = options.loop ?? false;
    this.particleOptions = options.particleOptions ?? {};

    this.particles = [];
    this.particlePool = []; // Pool of inactive particles
    this.activeParticles = 0;

    this.isPlaying = false;
    this.elapsedTime = 0;
    this.emissionCounter = 0; // Accumulator for fractional emissions

    this.position = { x: 0, y: 0, z: 0 }; // Emitter's base position

    // Initialize particle pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push(new Particle());
    }

    if (options.autoStart !== false) {
      this.start();
    }
  }

  /** Starts the emitter. */
  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.elapsedTime = 0;
    this.emissionCounter = 0;

    // Initial burst
    if (this.burst > 0) {
      this.emit(this.burst);
    }
  }

  /** Stops the emitter. Does not clear existing particles immediately. */
  stop() {
    this.isPlaying = false;
  }

  /** Resets the emitter and clears all active particles. */
  reset() {
    this.stop();
    this.elapsedTime = 0;
    this.emissionCounter = 0;
    this.particles.forEach(p => {
      if (p.active) {
        p.reset();
        this.particlePool.push(p);
      }
    });
    this.particles = [];
    this.activeParticles = 0;
  }

  /**
   * Updates the emitter and its active particles.
   * @param {number} deltaTime - Time elapsed since the last update (in seconds).
   * @param {object} [emitterPosition] - Optional current position of the emitter (e.g., attached entity's position).
   *   @param {number} emitterPosition.x
   *   @param {number} emitterPosition.y
   *   @param {number} [emitterPosition.z=0]
   */
  update(deltaTime, emitterPosition) {
    if (emitterPosition) {
        this.position.x = emitterPosition.x;
        this.position.y = emitterPosition.y;
        this.position.z = emitterPosition.z ?? 0;
    }

    // Update existing particles
    const stillActiveParticles = [];
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (particle.update(deltaTime)) {
        stillActiveParticles.push(particle);
      } else {
        // Return dead particle to the pool
        this.particlePool.push(particle);
        this.activeParticles--;
      }
    }
    this.particles = stillActiveParticles;

    // Handle emission logic (do this *before* checking duration/stop)
    if (this.isPlaying && this.emissionRate > 0) {
        this.emissionCounter += this.emissionRate * deltaTime;
        const particlesToEmit = Math.floor(this.emissionCounter);
        if (particlesToEmit > 0) {
          this.emit(particlesToEmit);
          this.emissionCounter -= particlesToEmit;
        }
    }

    // Handle duration and looping
    if (this.isPlaying) { // Check isPlaying again in case emit() filled max particles
      this.elapsedTime += deltaTime;

      if (this.elapsedTime >= this.emissionDuration) {
        if (this.loop) {
          this.elapsedTime = this.elapsedTime % this.emissionDuration; // Wrap time
          // Handle potential burst on loop restart if needed (e.g., this.emit(this.burst);)
        } else {
          this.stop(); // Stop if duration reached and not looping
        }
      }
    }
  }

  /**
   * Emits a specified number of particles immediately.
   * @param {number} count - Number of particles to emit.
   */
  emit(count) {
    const numToEmit = Math.min(count, this.maxParticles - this.activeParticles, this.particlePool.length);

    for (let i = 0; i < numToEmit; i++) {
      const particle = this.particlePool.pop();
      if (particle) {
        const options = this._generateParticleOptions();
        particle.init(options);
        this.particles.push(particle);
        this.activeParticles++;
      } else {
        console.warn("Particle pool empty, cannot emit more particles.");
        break; // Pool is empty
      }
    }
  }

  /**
   * Generates randomized options for a single particle based on emitter settings.
   * @returns {object} Options object for Particle.init().
   * @private
   */
  _generateParticleOptions() {
    const opts = { ...this.particleOptions }; // Start with defaults

    // Helper to get random value from number or range object
    const getRandom = (value, defaultValue = 0) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'object' && value !== null && typeof value.min === 'number' && typeof value.max === 'number') {
        return value.min + Math.random() * (value.max - value.min);
      }
      return defaultValue;
    };

    // --- Position ---
    const pos = opts.position ?? { x: 0, y: 0 };
    if (typeof pos.minX === 'number') { // Area emitter
        opts.x = this.position.x + getRandom(pos, 0); // Use getRandom for area offset
        opts.y = this.position.y + getRandom({ min: pos.minY, max: pos.maxY }, 0);
        opts.z = this.position.z + getRandom({ min: pos.minZ ?? 0, max: pos.maxZ ?? 0 }, 0);
    } else { // Point emitter
        opts.x = this.position.x + (pos.x ?? 0);
        opts.y = this.position.y + (pos.y ?? 0);
        opts.z = this.position.z + (pos.z ?? 0);
    }
    delete opts.position; // Remove original position config

    // --- Velocity ---
    const vel = opts.velocity ?? { vx: 0, vy: 0 };
     if (typeof vel.minVx === 'number') { // Velocity range
        opts.vx = getRandom({ min: vel.minVx, max: vel.maxVx });
        opts.vy = getRandom({ min: vel.minVy, max: vel.maxVy });
        opts.vz = getRandom({ min: vel.minVz ?? 0, max: vel.maxVz ?? 0 });
    } else { // Fixed velocity
        opts.vx = vel.vx ?? 0;
        opts.vy = vel.vy ?? 0;
        opts.vz = vel.vz ?? 0;
    }
    delete opts.velocity;

    // --- Lifetime ---
    opts.maxLife = getRandom(opts.maxLife, 1);

    // --- Size ---
    opts.startSize = getRandom(opts.startSize, 1);
    opts.endSize = getRandom(opts.endSize ?? opts.startSize, opts.startSize); // Default endSize to startSize if not specified

    // --- Rotation ---
    opts.rotation = getRandom(opts.rotation, 0);
    opts.angularVelocity = getRandom(opts.angularVelocity, 0);

    // --- Color ---
    const startCol = opts.startColor ?? { r: 1, g: 1, b: 1, a: 1 };
    opts.startColor = {
        r: getRandom(startCol.r ?? { min: startCol.minR, max: startCol.maxR }, 1),
        g: getRandom(startCol.g ?? { min: startCol.minG, max: startCol.maxG }, 1),
        b: getRandom(startCol.b ?? { min: startCol.minB, max: startCol.maxB }, 1),
        a: getRandom(startCol.a ?? { min: startCol.minA, max: startCol.maxA }, 1),
    };

    const endCol = opts.endColor ?? startCol; // Default endColor to startColor
     opts.endColor = {
        r: getRandom(endCol.r ?? { min: endCol.minR, max: endCol.maxR }, opts.startColor.r),
        g: getRandom(endCol.g ?? { min: endCol.minG, max: endCol.maxG }, opts.startColor.g),
        b: getRandom(endCol.b ?? { min: endCol.minB, max: endCol.maxB }, opts.startColor.b),
        a: getRandom(endCol.a ?? { min: endCol.minA, max: endCol.maxA }, opts.startColor.a),
    };

    // Clamp colors just in case random generation goes slightly out of 0-1
    Object.keys(opts.startColor).forEach(k => opts.startColor[k] = Math.max(0, Math.min(1, opts.startColor[k])));
    Object.keys(opts.endColor).forEach(k => opts.endColor[k] = Math.max(0, Math.min(1, opts.endColor[k])));


    return opts;
  }

  /**
   * Gets the list of currently active particles.
   * @returns {Particle[]} Array of active particles.
   */
  getActiveParticles() {
    return this.particles;
  }
}
