import ParticleEmitter from '../../../src/js/engine/particles/ParticleEmitter.js';
import Particle from '../../../src/js/engine/particles/Particle.js';

// Mock the Particle class
jest.mock('../../../src/js/engine/particles/Particle.js');

describe('ParticleEmitter', () => {
  let emitter;
  // Remove the global instance tracker

  beforeEach(() => {
    // Reset the mock before each test
    Particle.mockClear();

    // Mock the Particle constructor to return mock instances with tracked methods
    Particle.mockImplementation(() => {
      const mockInstance = {
        init: jest.fn(),
        update: jest.fn(() => true), // Default to staying active
        reset: jest.fn(),
        active: false, // Start inactive
        life: 0,
        maxLife: 1,
        // Add other properties if needed by emitter logic
      };
      // Simulate init setting active state
      mockInstance.init.mockImplementation(function(options) {
          this.active = true;
          this.maxLife = options?.maxLife ?? 1;
          // Simulate setting other properties based on options if necessary for testing
      });
       // Simulate update returning false when life exceeds maxLife
       mockInstance.update.mockImplementation(function(deltaTime) {
           if (!this.active) return false;
           this.life += deltaTime;
           if (this.life >= this.maxLife) {
               this.active = false;
               return false;
           }
           return true;
       });
        // Simulate reset setting active to false
        mockInstance.reset.mockImplementation(function() {
            this.active = false;
            this.life = 0;
        });

      // No longer need to push to a global array
      return mockInstance;
    });

    // Default emitter with autoStart=false for controlled testing
    emitter = new ParticleEmitter({ autoStart: false, maxParticles: 5, emissionRate: 10 });
  });

  it('should initialize with default options', () => {
    const defaultEmitter = new ParticleEmitter({ autoStart: false }); // Use default constructor values
    expect(defaultEmitter.maxParticles).toBe(100);
    expect(defaultEmitter.emissionRate).toBe(10);
    expect(defaultEmitter.emissionDuration).toBe(Infinity);
    expect(defaultEmitter.burst).toBe(0);
    expect(defaultEmitter.loop).toBe(false);
    expect(defaultEmitter.particleOptions).toEqual({});
    expect(defaultEmitter.isPlaying).toBe(false); // Because autoStart is false
    expect(defaultEmitter.particlePool.length).toBe(100); // Pool created
    // Expect calls for default emitter (5) + this emitter (100)
    expect(Particle).toHaveBeenCalledTimes(105);
  });

  it('should initialize with specific options', () => {
    const options = {
      maxParticles: 50,
      emissionRate: 5,
      emissionDuration: 2.0,
      burst: 10,
      loop: true,
      particleOptions: { maxLife: 0.5 },
      autoStart: false,
    };
    const customEmitter = new ParticleEmitter(options);
    expect(customEmitter.maxParticles).toBe(options.maxParticles);
    expect(customEmitter.emissionRate).toBe(options.emissionRate);
    expect(customEmitter.emissionDuration).toBe(options.emissionDuration);
    expect(customEmitter.burst).toBe(options.burst);
    expect(customEmitter.loop).toBe(options.loop);
    expect(customEmitter.particleOptions).toEqual(options.particleOptions);
    expect(customEmitter.isPlaying).toBe(false);
    expect(customEmitter.particlePool.length).toBe(50);
     // Expect calls for default emitter (5) + this emitter (50)
    expect(Particle).toHaveBeenCalledTimes(55);
  });

   it('should autoStart by default', () => {
       // Clear mocks for this specific test run
       Particle.mockClear();
       const autoStartEmitter = new ParticleEmitter({ burst: 2, maxParticles: 10 }); // autoStart defaults to true
       expect(autoStartEmitter.isPlaying).toBe(true);
       expect(autoStartEmitter.activeParticles).toBe(2); // Burst should have emitted
       // Expect calls only for this emitter's pool creation (10)
       expect(Particle).toHaveBeenCalledTimes(10);
       // Get the emitted particles from the emitter itself
       expect(autoStartEmitter.particles.length).toBe(2);
       expect(autoStartEmitter.particles[0].init).toHaveBeenCalled();
       expect(autoStartEmitter.particles[1].init).toHaveBeenCalled();
   });

  it('should start playing and emit burst particles', () => {
    emitter = new ParticleEmitter({ autoStart: false, burst: 3, maxParticles: 5 });
    expect(emitter.isPlaying).toBe(false);
    emitter.start();
    expect(emitter.isPlaying).toBe(true);
    expect(emitter.activeParticles).toBe(3);
    expect(emitter.particles.length).toBe(3);
    expect(emitter.particlePool.length).toBe(2); // 5 total - 3 active
    // Check init calls on the actual emitted particles
    expect(emitter.particles[0].init).toHaveBeenCalled();
    expect(emitter.particles[1].init).toHaveBeenCalled();
    expect(emitter.particles[2].init).toHaveBeenCalled();
  });

  it('should stop playing', () => {
    emitter.start();
    emitter.stop();
    expect(emitter.isPlaying).toBe(false);
  });

  it('should reset and clear active particles', () => {
    emitter.start(); // Emits burst if configured, or starts emission timer
    emitter.update(0.1); // Emit some particles based on rate
    emitter.emit(2); // Manually emit more
    expect(emitter.activeParticles).toBeGreaterThan(0);
    const activeParticleInstance = emitter.particles[0]; // Get ref before reset

    emitter.reset();
    expect(emitter.isPlaying).toBe(false);
    expect(emitter.activeParticles).toBe(0);
    expect(emitter.particles.length).toBe(0);
    expect(emitter.particlePool.length).toBe(emitter.maxParticles); // All particles back in pool
    expect(activeParticleInstance.reset).toHaveBeenCalled(); // Check if reset was called
  });

  it('should emit particles based on emissionRate during update', () => {
    emitter = new ParticleEmitter({ autoStart: false, emissionRate: 20, maxParticles: 10 }); // 20 particles/sec
    emitter.start();

    emitter.update(0.0); // No time elapsed yet
    expect(emitter.activeParticles).toBe(0);

    emitter.update(0.1); // Should emit floor(20 * 0.1) = 2 particles
    expect(emitter.activeParticles).toBe(2);
    expect(emitter.particles.length).toBe(2);
    expect(emitter.particlePool.length).toBe(8);

    emitter.update(0.1); // Should emit floor(2 + 20 * 0.1) = 2 more particles
    expect(emitter.activeParticles).toBe(4);
    expect(emitter.particles.length).toBe(4);
    expect(emitter.particlePool.length).toBe(6);
  });

   it('should handle fractional emission over time', () => {
       emitter = new ParticleEmitter({ autoStart: false, emissionRate: 5, maxParticles: 10 }); // 5 particles/sec
       emitter.start();
       emitter.update(0.1); // Counter = 0.5, Emit = 0
       expect(emitter.activeParticles).toBe(0);
       emitter.update(0.1); // Counter = 1.0, Emit = 1
       expect(emitter.activeParticles).toBe(1);
       emitter.update(0.1); // Counter = 0.5, Emit = 0
       expect(emitter.activeParticles).toBe(1);
       emitter.update(0.1); // Counter = 1.0, Emit = 1
       expect(emitter.activeParticles).toBe(2);
   });

  it('should stop emitting after emissionDuration', () => {
    emitter = new ParticleEmitter({ autoStart: false, emissionRate: 10, emissionDuration: 0.2, maxParticles: 10 });
    emitter.start();
    emitter.update(0.15); // Emit 1 particle (rate*time = 1.5)
    expect(emitter.activeParticles).toBe(1);
    expect(emitter.isPlaying).toBe(true);

    emitter.update(0.1); // Total time 0.25 > duration 0.2. Emit 1 more (rate*time = 1.0). Stop playing.
    expect(emitter.activeParticles).toBe(2);
    expect(emitter.isPlaying).toBe(false); // Should stop after duration

    emitter.update(0.1); // Should not emit more
    expect(emitter.activeParticles).toBe(2);
  });

  it('should loop emission if loop is true', () => {
     emitter = new ParticleEmitter({ autoStart: false, emissionRate: 10, emissionDuration: 0.2, loop: true, maxParticles: 10 });
     emitter.start();
     emitter.update(0.15); // Emit 1
     expect(emitter.activeParticles).toBe(1);
     expect(emitter.isPlaying).toBe(true);

     emitter.update(0.1); // Total time 0.25. Emit 1 more. Duration reached, loop restarts.
     expect(emitter.activeParticles).toBe(2);
     expect(emitter.isPlaying).toBe(true); // Should still be playing due to loop
     expect(emitter.elapsedTime).toBeCloseTo(0.05); // Time wrapped around

     emitter.update(0.1); // Emit 1 more (rate*time = 1.0)
     expect(emitter.activeParticles).toBe(3);
  });

  it('should manually emit particles', () => {
    emitter.emit(2);
    expect(emitter.activeParticles).toBe(2);
    expect(emitter.particles.length).toBe(2);
    expect(emitter.particlePool.length).toBe(3);
    // Check init calls on the actual emitted particles
    expect(emitter.particles[0].init).toHaveBeenCalled();
    expect(emitter.particles[1].init).toHaveBeenCalled();
  });

  it('should not emit more than maxParticles', () => {
    emitter.emit(4); // Emit 4
    expect(emitter.activeParticles).toBe(4);
    emitter.emit(3); // Try to emit 3 more, but only 1 slot left
    expect(emitter.activeParticles).toBe(5); // Capped at maxParticles
    expect(emitter.particles.length).toBe(5);
    expect(emitter.particlePool.length).toBe(0);

    // Further emits should do nothing
    emitter.emit(1);
    expect(emitter.activeParticles).toBe(5);
  });

  it('should update active particles and return dead ones to pool', () => {
    emitter.emit(3); // Emit 3 particles
    const particle1 = emitter.particles[0];
    const particle2 = emitter.particles[1];
    const particle3 = emitter.particles[2];

    // Make particle2 die on the next update
    particle2.update.mockImplementationOnce(() => false);

    emitter.update(0.1);

    expect(particle1.update).toHaveBeenCalledWith(0.1);
    expect(particle2.update).toHaveBeenCalledWith(0.1);
    expect(particle3.update).toHaveBeenCalledWith(0.1);

    expect(emitter.activeParticles).toBe(2);
    expect(emitter.particles.length).toBe(2);
    expect(emitter.particles).not.toContain(particle2); // particle2 removed
    expect(emitter.particlePool).toContain(particle2); // particle2 returned to pool
    expect(emitter.particlePool.length).toBe(3); // Pool started with 2, got 1 back
  });

   it('should generate particle options with randomization', () => {
       const options = {
           particleOptions: {
               maxLife: { min: 0.5, max: 1.5 },
               startSize: 5,
               endSize: { min: 0, max: 1 },
               velocity: { minVx: -10, maxVx: 10, minVy: 5, maxVy: 15 },
               startColor: { minR: 0.8, maxR: 1.0, g: 0.5, minB: 0.0, maxB: 0.2, a: 1 },
               position: { minX: -5, maxX: 5, minY: -5, maxY: 5 } // Area emitter
           }
       };
       emitter = new ParticleEmitter({ autoStart: false, ...options });
       emitter.emit(1);

       expect(emitter.particles.length).toBe(1);
       const emittedParticle = emitter.particles[0];
       expect(emittedParticle.init).toHaveBeenCalled();
       const generatedOptions = emittedParticle.init.mock.calls[0][0];

       // Check if generated values are within expected ranges or match fixed values
       expect(generatedOptions.maxLife).toBeGreaterThanOrEqual(0.5);
       expect(generatedOptions.maxLife).toBeLessThanOrEqual(1.5);
       expect(generatedOptions.startSize).toBe(5);
       expect(generatedOptions.endSize).toBeGreaterThanOrEqual(0);
       expect(generatedOptions.endSize).toBeLessThanOrEqual(1);
       expect(generatedOptions.vx).toBeGreaterThanOrEqual(-10);
       expect(generatedOptions.vx).toBeLessThanOrEqual(10);
       expect(generatedOptions.vy).toBeGreaterThanOrEqual(5);
       expect(generatedOptions.vy).toBeLessThanOrEqual(15);
       expect(generatedOptions.vz).toBe(0); // Default vz
       expect(generatedOptions.startColor.r).toBeGreaterThanOrEqual(0.8);
       expect(generatedOptions.startColor.r).toBeLessThanOrEqual(1.0);
       expect(generatedOptions.startColor.g).toBe(0.5);
       expect(generatedOptions.startColor.b).toBeGreaterThanOrEqual(0.0);
       expect(generatedOptions.startColor.b).toBeLessThanOrEqual(0.2);
       expect(generatedOptions.startColor.a).toBe(1);
       // Check position relative to emitter's base (0,0)
       expect(generatedOptions.x).toBeGreaterThanOrEqual(-5);
       expect(generatedOptions.x).toBeLessThanOrEqual(5);
       expect(generatedOptions.y).toBeGreaterThanOrEqual(-5);
       expect(generatedOptions.y).toBeLessThanOrEqual(5);
       expect(generatedOptions.z).toBe(0); // Default z
   });

    it('should update emitter position if provided in update', () => {
        emitter = new ParticleEmitter({ autoStart: false, particleOptions: { position: { x: 1, y: 2 } }, maxParticles: 5 }); // Particle relative pos
        emitter.emit(1);
        expect(emitter.particles.length).toBe(1);
        const particle1 = emitter.particles[0];
        expect(particle1.init).toHaveBeenCalled();
        const generatedOptions1 = particle1.init.mock.calls[0][0];
        expect(generatedOptions1.x).toBeCloseTo(1); // Relative to emitter (0,0)
        expect(generatedOptions1.y).toBeCloseTo(2);

        // Update emitter position and emit again
        emitter.update(0.1, { x: 100, y: 200 }); // Provide new emitter world position
        emitter.emit(1);
        expect(emitter.particles.length).toBe(2); // Should have 2 active particles now
        const particle2 = emitter.particles[1]; // Get the newly emitted particle
        expect(particle2.init).toHaveBeenCalled();
        const generatedOptions2 = particle2.init.mock.calls[0][0];
        expect(generatedOptions2.x).toBeCloseTo(101); // 100 (emitter) + 1 (particle relative)
        expect(generatedOptions2.y).toBeCloseTo(202); // 200 (emitter) + 2 (particle relative)
    });

});
