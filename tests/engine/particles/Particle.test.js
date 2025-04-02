import Particle from '../../../src/js/engine/particles/Particle.js';

describe('Particle', () => {
  let particle;

  beforeEach(() => {
    particle = new Particle();
  });

  it('should initialize with default values', () => {
    expect(particle.active).toBe(false);
    expect(particle.x).toBe(0);
    expect(particle.y).toBe(0);
    expect(particle.z).toBe(0);
    expect(particle.vx).toBe(0);
    expect(particle.vy).toBe(0);
    expect(particle.vz).toBe(0);
    expect(particle.life).toBe(0);
    expect(particle.maxLife).toBe(1);
    expect(particle.size).toBe(1);
    expect(particle.startSize).toBe(1);
    expect(particle.endSize).toBe(1);
    expect(particle.rotation).toBe(0);
    expect(particle.angularVelocity).toBe(0);
    expect(particle.color).toEqual({ r: 1, g: 1, b: 1, a: 1 });
    expect(particle.startColor).toEqual({ r: 1, g: 1, b: 1, a: 1 });
    expect(particle.endColor).toEqual({ r: 1, g: 1, b: 1, a: 1 });
    expect(particle.data).toBeNull();
  });

  it('should initialize with provided options', () => {
    const options = {
      x: 10, y: 20, z: 5,
      vx: 1, vy: -1, vz: 0.5,
      maxLife: 2.5,
      startSize: 5, endSize: 0.5,
      rotation: Math.PI / 2, angularVelocity: 0.1,
      startColor: { r: 1, g: 0, b: 0, a: 1 },
      endColor: { r: 0, g: 0, b: 1, a: 0 },
      data: { custom: 'value' },
    };
    particle.init(options);

    expect(particle.active).toBe(true);
    expect(particle.x).toBe(options.x);
    expect(particle.y).toBe(options.y);
    expect(particle.z).toBe(options.z);
    expect(particle.vx).toBe(options.vx);
    expect(particle.vy).toBe(options.vy);
    expect(particle.vz).toBe(options.vz);
    expect(particle.life).toBe(0);
    expect(particle.maxLife).toBe(options.maxLife);
    expect(particle.size).toBe(options.startSize);
    expect(particle.startSize).toBe(options.startSize);
    expect(particle.endSize).toBe(options.endSize);
    expect(particle.rotation).toBe(options.rotation);
    expect(particle.angularVelocity).toBe(options.angularVelocity);
    expect(particle.color).toEqual(options.startColor);
    expect(particle.startColor).toEqual(options.startColor);
    expect(particle.endColor).toEqual(options.endColor);
    expect(particle.data).toEqual(options.data);
  });

   it('should use defaults for missing options during init', () => {
    const options = { x: 5, maxLife: 2 };
    particle.init(options);
    expect(particle.active).toBe(true);
    expect(particle.x).toBe(5);
    expect(particle.y).toBe(0); // Default
    expect(particle.vx).toBe(0); // Default
    expect(particle.maxLife).toBe(2);
    expect(particle.startSize).toBe(1); // Default
    expect(particle.endSize).toBe(1); // Defaulted to startSize
    expect(particle.startColor).toEqual({ r: 1, g: 1, b: 1, a: 1 }); // Default
    expect(particle.endColor).toEqual({ r: 1, g: 1, b: 1, a: 1 }); // Defaulted to startColor
  });

  it('should update position based on velocity', () => {
    particle.init({ vx: 10, vy: -5 });
    particle.update(0.1);
    expect(particle.x).toBeCloseTo(1); // 10 * 0.1
    expect(particle.y).toBeCloseTo(-0.5); // -5 * 0.1
  });

  it('should update rotation based on angular velocity', () => {
    particle.init({ rotation: 0, angularVelocity: Math.PI }); // 180 deg/sec
    particle.update(0.5);
    expect(particle.rotation).toBeCloseTo(Math.PI / 2); // 90 deg after 0.5 sec
  });

  it('should update life and become inactive when maxLife is reached', () => {
    particle.init({ maxLife: 0.5 });
    expect(particle.active).toBe(true);

    let isActive = particle.update(0.2);
    expect(isActive).toBe(true);
    expect(particle.life).toBeCloseTo(0.2);
    expect(particle.active).toBe(true);

    isActive = particle.update(0.3); // Reaches maxLife
    expect(isActive).toBe(false);
    expect(particle.life).toBeCloseTo(0.5);
    expect(particle.active).toBe(false);

    // Further updates should do nothing and return false
    isActive = particle.update(0.1);
    expect(isActive).toBe(false);
    expect(particle.life).toBeCloseTo(0.5); // Life doesn't increase further
  });

  it('should interpolate size linearly', () => {
    particle.init({ maxLife: 1.0, startSize: 10, endSize: 0 });
    particle.update(0.0); // Initial state
    expect(particle.size).toBeCloseTo(10);

    particle.update(0.5); // Halfway through life
    expect(particle.size).toBeCloseTo(5); // Linear interpolation

    particle.update(0.5); // End of life
    expect(particle.size).toBeCloseTo(0);
  });

   it('should interpolate color linearly', () => {
    particle.init({
      maxLife: 1.0,
      startColor: { r: 1, g: 0, b: 0, a: 1 },
      endColor: { r: 0, g: 1, b: 0, a: 0 },
    });
    particle.update(0.0);
    expect(particle.color.r).toBeCloseTo(1);
    expect(particle.color.g).toBeCloseTo(0);
    expect(particle.color.b).toBeCloseTo(0);
    expect(particle.color.a).toBeCloseTo(1);

    particle.update(0.5); // Halfway
    expect(particle.color.r).toBeCloseTo(0.5);
    expect(particle.color.g).toBeCloseTo(0.5);
    expect(particle.color.b).toBeCloseTo(0);
    expect(particle.color.a).toBeCloseTo(0.5);

    particle.update(0.5); // End
    expect(particle.color.r).toBeCloseTo(0);
    expect(particle.color.g).toBeCloseTo(1);
    expect(particle.color.b).toBeCloseTo(0);
    expect(particle.color.a).toBeCloseTo(0);
  });

   it('should clamp interpolated values', () => {
    // Test size clamping
    particle.init({ maxLife: 1.0, startSize: 1, endSize: -10 }); // Ends below 0
    particle.update(1.0);
    expect(particle.size).toBeCloseTo(0); // Clamped to 0

    // Test color clamping
    particle.init({
        maxLife: 1.0,
        startColor: { r: 0.5, g: -1, b: 2, a: 0.5 }, // Invalid start values
        endColor: { r: 0.5, g: 2, b: -1, a: 0.5 }    // Invalid end values
    });
     particle.update(0.0); // Check initial clamping if needed (though init doesn't clamp)
     particle.update(0.5); // Check interpolated clamping
     expect(particle.color.r).toBeCloseTo(0.5);
     expect(particle.color.g).toBeGreaterThanOrEqual(0); // Should be clamped between 0 and 1
     expect(particle.color.g).toBeLessThanOrEqual(1);
     expect(particle.color.b).toBeGreaterThanOrEqual(0);
     expect(particle.color.b).toBeLessThanOrEqual(1);
     expect(particle.color.a).toBeCloseTo(0.5);
   });

  it('should reset correctly', () => {
    particle.init({ x: 10, life: 0.5, active: true });
    particle.reset();
    expect(particle.active).toBe(false);
    expect(particle.life).toBe(0);
    // Other properties might or might not be reset depending on pooling strategy
    // expect(particle.x).toBe(0); // This might not be necessary if init overwrites all
  });

});
