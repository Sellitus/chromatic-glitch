import Light, { LightType } from '../../../src/js/engine/graphics/Light.js';

describe('Light', () => {
  it('should initialize with default values (Point Light)', () => {
    const light = new Light();
    expect(light.type).toBe(LightType.POINT);
    expect(light.position).toEqual(new Float32Array([0, 0, 1]));
    expect(light.color).toEqual(new Float32Array([1, 1, 1]));
    expect(light.intensity).toBe(1.0);
    expect(light.range).toBe(10.0);
    expect(light.innerConeAngle).toBe(0.0);
    expect(light.outerConeAngle).toBeCloseTo(Math.PI / 4.0);
    expect(light.cosInnerConeAngle).toBeCloseTo(1.0); // cos(0)
    expect(light.cosOuterConeAngle).toBeCloseTo(Math.cos(Math.PI / 4.0));
    expect(light.enabled).toBe(true);
    expect(light.direction).toEqual(new Float32Array([0, 0, -1])); // Default direction
  });

  it('should initialize with specific options', () => {
    const options = {
      type: LightType.SPOT,
      position: [10, 20, 5],
      color: [1, 0.5, 0],
      intensity: 1.5,
      range: 50,
      innerConeAngle: Math.PI / 8,
      outerConeAngle: Math.PI / 6,
      direction: [0, -1, 0],
      enabled: false,
    };
    const light = new Light(options);
    expect(light.type).toBe(options.type);
    expect(light.position).toEqual(new Float32Array(options.position));
    expect(light.color).toEqual(new Float32Array(options.color));
    expect(light.intensity).toBe(options.intensity);
    expect(light.range).toBe(options.range);
    expect(light.innerConeAngle).toBeCloseTo(options.innerConeAngle);
    expect(light.outerConeAngle).toBeCloseTo(options.outerConeAngle);
    expect(light.cosInnerConeAngle).toBeCloseTo(Math.cos(options.innerConeAngle));
    expect(light.cosOuterConeAngle).toBeCloseTo(Math.cos(options.outerConeAngle));
    expect(light.enabled).toBe(options.enabled);
    expect(light.direction).toEqual(new Float32Array(options.direction)); // Direction set and normalized
  });

   it('should initialize directional light with position as normalized direction', () => {
       const options = { type: LightType.DIRECTIONAL, position: [1, 1, 0] };
       const light = new Light(options);
       expect(light.type).toBe(LightType.DIRECTIONAL);
       const len = Math.sqrt(1*1 + 1*1 + 0*0);
       expect(light.position[0]).toBeCloseTo(1 / len);
       expect(light.position[1]).toBeCloseTo(1 / len);
       expect(light.position[2]).toBeCloseTo(0 / len);
       // Direction should also match position for directional lights after init
       expect(light.direction).toEqual(light.position);
   });

  it('should set position correctly', () => {
    const light = new Light();
    light.setPosition(5, -10, 2);
    expect(light.position).toEqual(new Float32Array([5, -10, 2]));
  });

   it('should set position and normalize for directional light', () => {
       const light = new Light({ type: LightType.DIRECTIONAL });
       light.setPosition(2, 0, 0);
       expect(light.position).toEqual(new Float32Array([1, 0, 0])); // Normalized
       expect(light.direction).toEqual(light.position); // Direction updated
   });

  it('should set direction correctly and normalize', () => {
    const light = new Light({ type: LightType.SPOT }); // Spot uses direction
    light.setDirection([0, 5, 0]);
    expect(light.direction).toEqual(new Float32Array([0, 1, 0])); // Normalized
  });

   it('should set direction and update position for directional light', () => {
       const light = new Light({ type: LightType.DIRECTIONAL });
       light.setDirection([0, 0, -2]);
       expect(light.direction).toEqual(new Float32Array([0, 0, -1])); // Normalized direction
       expect(light.position).toEqual(light.direction); // Position updated
   });

    it('should handle setting zero vector direction', () => {
        const light = new Light({ type: LightType.SPOT });
        light.setDirection([0, 0, 0]);
        expect(light.direction).toEqual(new Float32Array([0, 0, -1])); // Defaults
    });

  it('should set color correctly', () => {
    const light = new Light();
    light.setColor(0.2, 0.4, 0.6);
    expect(light.color).toEqual(new Float32Array([0.2, 0.4, 0.6]));
  });

  it('should set intensity correctly', () => {
    const light = new Light();
    light.setIntensity(2.5);
    expect(light.intensity).toBe(2.5);
    light.setIntensity(-1); // Should clamp
    expect(light.intensity).toBe(0);
  });

  it('should set range correctly', () => {
    const light = new Light();
    light.setRange(100);
    expect(light.range).toBe(100);
    light.setRange(-5); // Should clamp
    expect(light.range).toBe(0);
  });

  it('should set cone angles correctly and update cosines', () => {
    const light = new Light({ type: LightType.SPOT });
    const inner = Math.PI / 10;
    const outer = Math.PI / 8;
    light.setConeAngles(inner, outer);
    expect(light.innerConeAngle).toBeCloseTo(inner);
    expect(light.outerConeAngle).toBeCloseTo(outer);
    expect(light.cosInnerConeAngle).toBeCloseTo(Math.cos(inner));
    expect(light.cosOuterConeAngle).toBeCloseTo(Math.cos(outer));
  });

   it('should clamp cone angles (outer >= inner >= 0)', () => {
       const light = new Light({ type: LightType.SPOT });
       light.setConeAngles(-0.1, -0.2); // Negative angles
       expect(light.innerConeAngle).toBe(0);
       expect(light.outerConeAngle).toBe(0); // Clamped outer >= inner

       light.setConeAngles(Math.PI / 4, Math.PI / 8); // Outer < Inner
       expect(light.innerConeAngle).toBeCloseTo(Math.PI / 4);
       expect(light.outerConeAngle).toBeCloseTo(Math.PI / 4); // Clamped outer >= inner
   });

  it('should set enabled state correctly', () => {
    const light = new Light();
    expect(light.enabled).toBe(true);
    light.setEnabled(false);
    expect(light.enabled).toBe(false);
    light.setEnabled(true);
    expect(light.enabled).toBe(true);
  });
});
