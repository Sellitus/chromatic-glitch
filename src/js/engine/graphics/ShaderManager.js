/**
 * Manages WebGL shader programs, including loading, compiling, linking,
 * and providing access to attribute and uniform locations.
 */
export default class ShaderManager {
  constructor(gl) {
    if (!gl) {
      throw new Error('ShaderManager requires a WebGL rendering context.');
    }
    this.gl = gl;
    this.programs = new Map(); // Stores the actual program objects (mock or real)
    this.programInfo = new Map(); // Stores info including the program object
  }

  createProgram(name, vsSource, fsSource) {
    if (this.programInfo.has(name)) {
      return this.programInfo.get(name);
    }

    const gl = this.gl;
    let vertexShader = null;
    let fragmentShader = null;
    let program = null; // Use the exact object from gl.createProgram

    try {
      // Compile Vertex Shader
      vertexShader = gl.createShader(gl.VERTEX_SHADER);
      if (!vertexShader) throw new Error('Failed to create vertex shader.');
      gl.shaderSource(vertexShader, vsSource);
      gl.compileShader(vertexShader);
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(vertexShader);
        // Pass message and log as separate arguments for the spy
        console.error('Error compiling VERTEX shader:', log);
        throw new Error(`Vertex shader compilation failed: ${log}`);
      }

      // Compile Fragment Shader
      fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fragmentShader) throw new Error('Failed to create fragment shader.');
      gl.shaderSource(fragmentShader, fsSource);
      gl.compileShader(fragmentShader);
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(fragmentShader);
         // Pass message and log as separate arguments for the spy
        console.error('Error compiling FRAGMENT shader:', log);
        throw new Error(`Fragment shader compilation failed: ${log}`);
      }

      // Create and Link Program
      program = gl.createProgram(); // Assign the object returned by mock/real GL
      if (!program) throw new Error('Failed to create program.');
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program);
         // Pass message and log as separate arguments for the spy
        console.error('Unable to link shader program:', log);
        throw new Error(`Shader program linking failed: ${log}`);
      }

      // --- Linking Succeeded ---

      // Get attribute locations
      const attribLocations = new Map();
      const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
      for (let i = 0; i < numAttribs; i++) {
        const info = gl.getActiveAttrib(program, i);
        if (info) {
          attribLocations.set(info.name, gl.getAttribLocation(program, info.name));
        }
      }

      // Get uniform locations
      const uniformLocations = new Map();
      const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < numUniforms; i++) {
        const info = gl.getActiveUniform(program, i);
        if (info) {
          const baseName = info.name.replace(/\[\d+\]$/, '');
          uniformLocations.set(baseName, gl.getUniformLocation(program, baseName));
        }
      }

      // Detach and delete shaders immediately after successful linking and info retrieval
      gl.detachShader(program, vertexShader);
      gl.detachShader(program, fragmentShader);
      gl.deleteShader(vertexShader); // Pass the exact mock object
      gl.deleteShader(fragmentShader); // Pass the exact mock object
      vertexShader = null; // Mark as deleted
      fragmentShader = null; // Mark as deleted

      // Store info
      const programInfo = { program, attribLocations, uniformLocations };
      this.programs.set(name, program); // Store the exact program object
      this.programInfo.set(name, programInfo);

      return programInfo;

    } catch (error) {
      // Error is already logged where it occurs
      // Cleanup resources if creation failed at any step
      if (program) gl.deleteProgram(program); // Use the potentially created program object
      // Shaders are deleted in finally block if they were created and not already deleted
      return null;
    } finally {
      // Ensure shaders are deleted if they were created but an error occurred before explicit deletion
      if (vertexShader) {
         gl.deleteShader(vertexShader);
      }
      if (fragmentShader) {
         gl.deleteShader(fragmentShader);
      }
    }
  }

  getProgramInfo(name) {
    return this.programInfo.get(name) || null;
  }

  getProgram(name) {
    return this.programs.get(name) || null;
  }

  useProgram(name) {
    const program = this.getProgram(name);
    if (!program) {
      console.error(`ShaderManager: Program "${name}" not found.`);
      this.gl.useProgram(null);
      return false;
    }
    this.gl.useProgram(program);
    return true;
  }

  deleteProgram(name) {
    const program = this.getProgram(name);
    if (program) {
      this.gl.deleteProgram(program);
      this.programs.delete(name);
      this.programInfo.delete(name);
    }
  }

  destroy() {
    // Iterate over the stored program objects (values) and delete them
    for (const program of this.programs.values()) {
      this.gl.deleteProgram(program); // Pass the actual stored program object
    }
    this.programs.clear();
    this.programInfo.clear();
  }
}
