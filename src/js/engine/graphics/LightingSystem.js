import Light from './Light.js';

/**
 * Manages light sources in the scene.
 * Provides methods to add, remove, and access lights,
 * and potentially prepares light data for shaders.
 */
export default class LightingSystem {
  /**
   * Creates a LightingSystem instance.
   * @param {object} [options={}] - Configuration options.
   * @param {number[]} [options.ambientColor=[0.1, 0.1, 0.1]] - Default ambient light color (RGB, 0-1).
   * @param {number} [options.maxLights=16] - Maximum number of lights to support (relevant for shader uniform arrays).
   */
  constructor(options = {}) {
    this.lights = [];
    this.ambientColor = new Float32Array(options.ambientColor ?? [0.1, 0.1, 0.1]);
    this.maxLights = options.maxLights ?? 16; // Max lights the shader might support
  }

  /**
   * Adds a light source to the system.
   * @param {Light} light - The light object to add. Should have properties like type, position, color, intensity, enabled etc.
   */
  addLight(light) {
    // Duck typing: Check for essential properties instead of instanceof with mocks
    const isValidLight = light &&
                         typeof light.enabled === 'boolean' &&
                         typeof light.type === 'number' && // Assuming LightType enum results in numbers
                         light.position && typeof light.position.length === 'number' && // Check if array-like
                         light.color && typeof light.color.length === 'number' &&
                         typeof light.intensity === 'number';
                         // Add more checks as needed based on what LightingSystem uses

    if (isValidLight && !this.lights.includes(light)) {
      if (this.lights.length >= this.maxLights) {
        console.warn(`LightingSystem: Maximum number of lights (${this.maxLights}) reached. Cannot add more.`);
        return;
      }
      this.lights.push(light);
    } else {
      console.warn('LightingSystem: Attempted to add invalid or duplicate light.');
    }
  }

  /**
   * Removes a light source from the system.
   * @param {Light} light - The light object to remove.
   */
  removeLight(light) {
    const index = this.lights.indexOf(light);
    if (index > -1) {
      this.lights.splice(index, 1);
    }
  }

  /**
   * Removes all light sources.
   */
  clearLights() {
    this.lights = [];
  }

  /**
   * Gets all active lights.
   * @returns {Light[]} An array of enabled light objects.
   */
  getActiveLights() {
    return this.lights.filter(light => light.enabled);
  }

  /**
   * Sets the ambient light color.
   * @param {number} r - Red component (0-1).
   * @param {number} g - Green component (0-1).
   * @param {number} b - Blue component (0-1).
   */
  setAmbientColor(r, g, b) {
    this.ambientColor[0] = r;
    this.ambientColor[1] = g;
    this.ambientColor[2] = b;
  }

  /**
   * Prepares light data in a format suitable for uploading to shader uniforms.
   * This often involves packing data into arrays or structures defined by the shader.
   * (This is a placeholder - the actual structure depends heavily on the shader implementation).
   * @returns {object} An object containing light data arrays (e.g., positions, colors, intensities).
   */
  getShaderData() {
    const activeLights = this.getActiveLights();
    const numLights = Math.min(activeLights.length, this.maxLights);

    // Example structure - adapt based on shader needs
    const lightData = {
      ambientColor: this.ambientColor,
      numLights: numLights,
      types: new Int32Array(this.maxLights), // Use Int32Array for integer types
      positions: new Float32Array(this.maxLights * 3), // Pack x,y,z
      colors: new Float32Array(this.maxLights * 3),    // Pack r,g,b
      intensities: new Float32Array(this.maxLights),
      ranges: new Float32Array(this.maxLights),
      directions: new Float32Array(this.maxLights * 3), // For spot/directional
      cosInnerConeAngles: new Float32Array(this.maxLights), // For spot
      cosOuterConeAngles: new Float32Array(this.maxLights), // For spot
    };

    for (let i = 0; i < numLights; i++) {
      const light = activeLights[i];
      const baseIndex3 = i * 3;

      lightData.types[i] = light.type;
      lightData.intensities[i] = light.intensity;
      lightData.ranges[i] = light.range;
      lightData.cosInnerConeAngles[i] = light.cosInnerConeAngle;
      lightData.cosOuterConeAngles[i] = light.cosOuterConeAngle;

      lightData.positions[baseIndex3 + 0] = light.position[0];
      lightData.positions[baseIndex3 + 1] = light.position[1];
      lightData.positions[baseIndex3 + 2] = light.position[2];

      lightData.colors[baseIndex3 + 0] = light.color[0];
      lightData.colors[baseIndex3 + 1] = light.color[1];
      lightData.colors[baseIndex3 + 2] = light.color[2];

      lightData.directions[baseIndex3 + 0] = light.direction[0];
      lightData.directions[baseIndex3 + 1] = light.direction[1];
      lightData.directions[baseIndex3 + 2] = light.direction[2];
    }

    // It might be more efficient to upload these arrays directly to UBOs (Uniform Buffer Objects)
    // if the platform supports WebGL2 or relevant extensions.

    return lightData;
  }

  /**
   * Updates lights (e.g., if they are attached to moving entities).
   * This might be handled by an ECS system instead.
   * @param {number} deltaTime - Time since last update.
   */
  update(deltaTime) {
    // Placeholder: Update light positions/properties if they change dynamically
    // For example, if lights are attached to entities via components.
  }
}
