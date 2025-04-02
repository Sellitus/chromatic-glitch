import LightingSystem from '../../../src/js/engine/graphics/LightingSystem.js';
import Light, { LightType } from '../../../src/js/engine/graphics/Light.js';

// Mock the Light class
jest.mock('../../../src/js/engine/graphics/Light.js');

describe('LightingSystem', () => {
  let lightingSystem;
  let mockLightInstances;

  beforeEach(() => {
    // Reset mocks
    Light.mockClear();
    mockLightInstances = [];

    // Mock Light constructor and properties needed by LightingSystem
    Light.mockImplementation((options = {}) => {
      const mockInstance = {
        type: options.type ?? LightType.POINT,
        position: new Float32Array(options.position ?? [0, 0, 1]),
        color: new Float32Array(options.color ?? [1, 1, 1]),
        intensity: options.intensity ?? 1.0,
        range: options.range ?? 10.0,
        direction: new Float32Array(options.direction ?? [0, 0, -1]),
        cosInnerConeAngle: Math.cos(options.innerConeAngle ?? 0.0),
        cosOuterConeAngle: Math.cos(options.outerConeAngle ?? Math.PI / 4.0),
        enabled: options.enabled ?? true,
        // Mock methods if LightingSystem calls them
        // setEnabled: jest.fn(function(enabled) { this.enabled = enabled; }),
      };
      mockLightInstances.push(mockInstance);
      return mockInstance;
    });

    lightingSystem = new LightingSystem();
  });

  it('should initialize with default values', () => {
    expect(lightingSystem.lights).toEqual([]);
    expect(lightingSystem.ambientColor).toEqual(new Float32Array([0.1, 0.1, 0.1]));
    expect(lightingSystem.maxLights).toBe(16);
  });

  it('should initialize with specific options', () => {
    const options = { ambientColor: [0.2, 0.2, 0.3], maxLights: 8 };
    lightingSystem = new LightingSystem(options);
    expect(lightingSystem.ambientColor).toEqual(new Float32Array(options.ambientColor));
    expect(lightingSystem.maxLights).toBe(options.maxLights);
  });

  it('should add a valid light', () => {
    const light = new Light(); // Creates a mock instance
    lightingSystem.addLight(light);
    expect(lightingSystem.lights).toContain(light);
    expect(lightingSystem.lights.length).toBe(1);
  });

  it('should not add duplicate lights', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const light = new Light();
    lightingSystem.addLight(light);
    lightingSystem.addLight(light); // Duplicate
    expect(lightingSystem.lights.length).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('duplicate light'));
    warnSpy.mockRestore();
  });

   it('should not add invalid objects', () => {
       const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
       lightingSystem.addLight(null);
       lightingSystem.addLight({});
       expect(lightingSystem.lights.length).toBe(0);
       expect(warnSpy).toHaveBeenCalledTimes(2);
       warnSpy.mockRestore();
   });

  it('should not add more lights than maxLights', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    lightingSystem = new LightingSystem({ maxLights: 2 });
    lightingSystem.addLight(new Light());
    lightingSystem.addLight(new Light());
    lightingSystem.addLight(new Light()); // Try to add a third
    expect(lightingSystem.lights.length).toBe(2);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Maximum number of lights (2) reached'));
    warnSpy.mockRestore();
  });

  it('should remove a light', () => {
    const light1 = new Light();
    const light2 = new Light();
    lightingSystem.addLight(light1);
    lightingSystem.addLight(light2);
    lightingSystem.removeLight(light1);
    expect(lightingSystem.lights).not.toContain(light1);
    expect(lightingSystem.lights).toContain(light2);
    expect(lightingSystem.lights.length).toBe(1);
  });

   it('should not fail when removing a non-existent light', () => {
       const light1 = new Light();
       const light2 = new Light();
       lightingSystem.addLight(light1);
       lightingSystem.removeLight(light2); // Not added
       expect(lightingSystem.lights.length).toBe(1);
   });

  it('should clear all lights', () => {
    lightingSystem.addLight(new Light());
    lightingSystem.addLight(new Light());
    lightingSystem.clearLights();
    expect(lightingSystem.lights.length).toBe(0);
  });

  it('should get active lights', () => {
    const light1 = new Light({ enabled: true });
    const light2 = new Light({ enabled: false });
    const light3 = new Light({ enabled: true });
    lightingSystem.addLight(light1);
    lightingSystem.addLight(light2);
    lightingSystem.addLight(light3);

    const activeLights = lightingSystem.getActiveLights();
    expect(activeLights.length).toBe(2);
    expect(activeLights).toContain(light1);
    expect(activeLights).not.toContain(light2);
    expect(activeLights).toContain(light3);
  });

  it('should set ambient color', () => {
    lightingSystem.setAmbientColor(0.5, 0.6, 0.7);
    expect(lightingSystem.ambientColor).toEqual(new Float32Array([0.5, 0.6, 0.7]));
  });

  it('should prepare shader data correctly', () => {
    const light1 = new Light({ type: LightType.POINT, position: [1, 2, 3], color: [1, 0, 0], intensity: 1.5, range: 20 });
    const light2 = new Light({ type: LightType.DIRECTIONAL, position: [0, -1, 0], color: [0, 1, 0], intensity: 0.8 }); // Position is direction
    const light3 = new Light({ type: LightType.SPOT, position: [4, 5, 6], color: [0, 0, 1], intensity: 1.0, range: 30, direction: [1, 0, 0], innerConeAngle: 0.1, outerConeAngle: 0.2 });
    const light4Disabled = new Light({ enabled: false }); // Should be ignored

    lightingSystem.addLight(light1);
    lightingSystem.addLight(light2);
    lightingSystem.addLight(light3);
    lightingSystem.addLight(light4Disabled);

    const shaderData = lightingSystem.getShaderData();

    expect(shaderData.ambientColor).toEqual(lightingSystem.ambientColor);
    expect(shaderData.numLights).toBe(3); // Only enabled lights

    // Check data for light1 (index 0)
    expect(shaderData.types[0]).toBe(light1.type);
    expect(shaderData.positions[0]).toBe(light1.position[0]);
    expect(shaderData.positions[1]).toBe(light1.position[1]);
    expect(shaderData.positions[2]).toBe(light1.position[2]);
    expect(shaderData.colors[0]).toBe(light1.color[0]);
    expect(shaderData.colors[1]).toBe(light1.color[1]);
    expect(shaderData.colors[2]).toBe(light1.color[2]);
    expect(shaderData.intensities[0]).toBe(light1.intensity);
    expect(shaderData.ranges[0]).toBe(light1.range);
    // Spot/Directional specific data might be default for point light
    // expect(shaderData.directions[0]).toBe(...);
    // expect(shaderData.cosInnerConeAngles[0]).toBe(...);
    // expect(shaderData.cosOuterConeAngles[0]).toBe(...);

    // Check data for light2 (index 1) - Directional
    expect(shaderData.types[1]).toBe(light2.type);
    expect(shaderData.positions[3]).toBe(light2.position[0]); // Position holds direction
    expect(shaderData.positions[4]).toBe(light2.position[1]);
    expect(shaderData.positions[5]).toBe(light2.position[2]);
    expect(shaderData.colors[3]).toBe(light2.color[0]);
    // ... intensity etc.
    expect(shaderData.directions[3]).toBe(light2.direction[0]); // Direction might be redundant but check if set
    expect(shaderData.directions[4]).toBe(light2.direction[1]);
    expect(shaderData.directions[5]).toBe(light2.direction[2]);


    // Check data for light3 (index 2) - Spot
    expect(shaderData.types[2]).toBe(light3.type);
    expect(shaderData.positions[6]).toBe(light3.position[0]);
    // ... position, color, intensity, range ...
    expect(shaderData.directions[6]).toBe(light3.direction[0]);
    expect(shaderData.directions[7]).toBe(light3.direction[1]);
    expect(shaderData.directions[8]).toBe(light3.direction[2]);
    // Use toBeCloseTo for floating point comparisons
    expect(shaderData.cosInnerConeAngles[2]).toBeCloseTo(light3.cosInnerConeAngle);
    expect(shaderData.cosOuterConeAngles[2]).toBeCloseTo(light3.cosOuterConeAngle);

    // Check that remaining slots in arrays are likely default (e.g., 0)
    expect(shaderData.intensities[3]).toBe(0); // Assuming Float32Array defaults to 0
  });

   it('should prepare shader data respecting maxLights', () => {
       lightingSystem = new LightingSystem({ maxLights: 1 });
       const light1 = new Light({ intensity: 1.5 });
       const light2 = new Light({ intensity: 0.8 });
       lightingSystem.addLight(light1);
       lightingSystem.addLight(light2); // Only first light should be included

       const shaderData = lightingSystem.getShaderData();
       expect(shaderData.numLights).toBe(1);
       expect(shaderData.intensities.length).toBe(1); // Array size matches maxLights
       expect(shaderData.intensities[0]).toBe(light1.intensity);
   });

  // update() method is a placeholder, no specific tests needed unless implemented
  it('should have an update method (placeholder)', () => {
    expect(typeof lightingSystem.update).toBe('function');
    // No specific behavior to test in the placeholder
    lightingSystem.update(0.016); // Should not throw error
  });
});
