import ParticleEmitter from './ParticleEmitter.js';

/**
 * Manages multiple ParticleEmitters and handles the rendering of all particles using WebGL.
 */
export default class ParticleSystem {
  /**
   * Creates a ParticleSystem instance.
   * @param {WebGLRenderingContext} gl - The WebGL rendering context.
   */
  constructor(gl) {
    if (!gl) {
      throw new Error('ParticleSystem requires a WebGL rendering context.');
    }
    this.gl = gl;
    this.emitters = [];

    // TODO: Initialize WebGL resources (buffers, shaders, textures) for particle rendering
    this.particleBuffer = null; // Buffer for particle vertex data (position, color, size, etc.)
    this.particleShaderProgram = null; // Shader program for rendering particles
    this.maxRenderableParticles = 10000; // Example limit, adjust as needed
    this.particleRenderData = new Float32Array(this.maxRenderableParticles * this._getVertexSize()); // Pre-allocate buffer data

    this._setupWebGLResources();
  }

  /**
   * Sets up necessary WebGL buffers and shaders for particle rendering.
   * @private
   */
  _setupWebGLResources() {
    const gl = this.gl;

    // --- Vertex Buffer ---
    this.particleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
    // Allocate buffer size, initialize with DYNAMIC_DRAW for frequent updates
    gl.bufferData(gl.ARRAY_BUFFER, this.particleRenderData.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // Unbind

    // --- Shaders (Placeholder - requires actual shader source code) ---
    const vertexShaderSource = `
      attribute vec3 a_position; // x, y, size
      attribute vec4 a_color;    // r, g, b, a
      attribute float a_rotation; // rotation in radians

      uniform mat4 u_projectionMatrix;
      uniform mat4 u_viewMatrix;
      // uniform vec2 u_resolution; // Optional: if needed for point size calculation

      varying vec4 v_color;
      varying float v_rotation; // Pass rotation to fragment shader if needed for textures

      void main() {
        // Simple point sprite rendering - position is center, size controls gl_PointSize
        gl_Position = u_projectionMatrix * u_viewMatrix * vec4(a_position.xy, 0.0, 1.0);
        gl_PointSize = a_position.z; // Use z component of position attribute for size
        v_color = a_color;
        v_rotation = a_rotation;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec4 v_color;
      // varying float v_rotation; // Receive rotation if texturing points
      // uniform sampler2D u_texture; // Optional: particle texture

      void main() {
        // Simple colored points
        // Optional: Add texture lookup and rotation logic here if using textured points
        // vec2 coord = gl_PointCoord - vec2(0.5); // Center texture coordinate
        // // Apply rotation if needed
        // float s = sin(v_rotation);
        // float c = cos(v_rotation);
        // coord = mat2(c, -s, s, c) * coord + vec2(0.5);
        // if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) {
        //   discard; // Discard fragments outside the texture bounds
        // }
        // gl_FragColor = texture2D(u_texture, coord) * v_color;

        // Basic non-textured point:
         gl_FragColor = v_color;
         // Fade edges of points slightly
         float dist = length(gl_PointCoord - vec2(0.5));
         gl_FragColor.a *= smoothstep(0.5, 0.4, dist); // Adjust values for desired softness
      }
    `;

    // TODO: Implement shader compilation and linking logic
    // this.particleShaderProgram = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    console.warn("ParticleSystem: Shader compilation placeholder used. Implement actual shader loading.");

    // TODO: Get attribute and uniform locations from the linked shader program
    // this.attribLocations = { ... };
    // this.uniformLocations = { ... };
  }

  /**
   * Adds a ParticleEmitter to the system.
   * @param {ParticleEmitter} emitter - The emitter to add. Must have update() and getActiveParticles() methods.
   */
  addEmitter(emitter) {
    // Duck typing for mock compatibility
    const isValidEmitter = emitter &&
                           typeof emitter.update === 'function' &&
                           typeof emitter.getActiveParticles === 'function';

    if (isValidEmitter && !this.emitters.includes(emitter)) {
      this.emitters.push(emitter);
    } else {
      console.warn('Attempted to add invalid or duplicate emitter to ParticleSystem.');
    }
  }

  /**
   * Removes a ParticleEmitter from the system.
   * @param {ParticleEmitter} emitter - The emitter to remove.
   */
  removeEmitter(emitter) {
    const index = this.emitters.indexOf(emitter);
    if (index > -1) {
      this.emitters.splice(index, 1);
    }
  }

  /**
   * Updates all managed emitters and their particles.
   * @param {number} deltaTime - Time elapsed since the last update (in seconds).
   */
  update(deltaTime) {
    this.emitters.forEach(emitter => {
      // Pass null for position initially, assuming emitters manage their own world position
      // or are updated by an ECS system later.
      emitter.update(deltaTime, null);
    });
  }

  /**
   * Renders all active particles from all managed emitters.
   * @param {object} camera - The camera object providing view and projection matrices.
   *   @param {mat4} camera.viewMatrix - The view matrix.
   *   @param {mat4} camera.projectionMatrix - The projection matrix.
   */
  render(camera) {
    if (!this.particleShaderProgram || !camera) {
      // console.warn("ParticleSystem.render: Shader program or camera not ready.");
      return; // Shaders or camera not ready
    }

    const gl = this.gl;
    let particleCount = 0;
    const vertexSize = this._getVertexSize(); // Floats per vertex

    // 1. Collect render data from all active particles
    for (const emitter of this.emitters) {
      const activeParticles = emitter.getActiveParticles();
      for (const particle of activeParticles) {
        if (particleCount >= this.maxRenderableParticles) break; // Buffer full

        const offset = particleCount * vertexSize;
        // Position (x, y) and Size (z)
        this.particleRenderData[offset + 0] = particle.x;
        this.particleRenderData[offset + 1] = particle.y;
        this.particleRenderData[offset + 2] = particle.size; // Store size in z component for shader
        // Color (r, g, b, a)
        this.particleRenderData[offset + 3] = particle.color.r;
        this.particleRenderData[offset + 4] = particle.color.g;
        this.particleRenderData[offset + 5] = particle.color.b;
        this.particleRenderData[offset + 6] = particle.color.a;
        // Rotation
        this.particleRenderData[offset + 7] = particle.rotation;

        particleCount++;
      }
       if (particleCount >= this.maxRenderableParticles) {
           console.warn(`ParticleSystem: Exceeded max renderable particles (${this.maxRenderableParticles}). Some particles not rendered.`);
           break;
       }
    }

    if (particleCount === 0) {
      return; // Nothing to render
    }

    // 2. Prepare WebGL state
    // gl.useProgram(this.particleShaderProgram); // TODO: Uncomment when shader is ready
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);

    // 3. Upload particle data to GPU buffer
    // Upload only the data for the active particles
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.particleRenderData.subarray(0, particleCount * vertexSize));

    // 4. Set up attributes (TODO: Use actual locations)
    const stride = vertexSize * Float32Array.BYTES_PER_ELEMENT;
    // Example attribute setup (replace with actual locations and sizes)
    // gl.vertexAttribPointer(this.attribLocations.position, 3, gl.FLOAT, false, stride, 0); // x, y, size
    // gl.enableVertexAttribArray(this.attribLocations.position);
    // gl.vertexAttribPointer(this.attribLocations.color, 4, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT); // r, g, b, a
    // gl.enableVertexAttribArray(this.attribLocations.color);
    // gl.vertexAttribPointer(this.attribLocations.rotation, 1, gl.FLOAT, false, stride, 7 * Float32Array.BYTES_PER_ELEMENT); // rotation
    // gl.enableVertexAttribArray(this.attribLocations.rotation);

    // 5. Set up uniforms (TODO: Use actual locations)
    // gl.uniformMatrix4fv(this.uniformLocations.projectionMatrix, false, camera.projectionMatrix);
    // gl.uniformMatrix4fv(this.uniformLocations.viewMatrix, false, camera.viewMatrix);
    // Optional: Set texture uniform if using textures
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, /* particle texture */);
    // gl.uniform1i(this.uniformLocations.texture, 0);

    // 6. Set blend mode for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Standard alpha blending
    // Or use additive blending for effects like fire/magic:
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false); // Disable depth writing for transparent particles (usually)

    // 7. Draw the particles
    gl.drawArrays(gl.POINTS, 0, particleCount);

    // 8. Clean up state
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // gl.disableVertexAttribArray(this.attribLocations.position); // TODO: Uncomment
    // gl.disableVertexAttribArray(this.attribLocations.color);    // TODO: Uncomment
    // gl.disableVertexAttribArray(this.attribLocations.rotation); // TODO: Uncomment
    // gl.useProgram(null); // Optional: Unbind program if managing state elsewhere
  }

  /**
   * Returns the number of float values per particle vertex.
   * @returns {number}
   * @private
   */
  _getVertexSize() {
    // position (x, y, size) = 3 floats
    // color (r, g, b, a) = 4 floats
    // rotation = 1 float
    return 3 + 4 + 1; // 8 floats per particle
  }

  /**
   * Cleans up WebGL resources used by the system.
   */
  destroy() {
    const gl = this.gl;
    if (this.particleBuffer) {
      gl.deleteBuffer(this.particleBuffer);
      this.particleBuffer = null;
    }
    if (this.particleShaderProgram) {
      gl.deleteProgram(this.particleShaderProgram);
      this.particleShaderProgram = null;
    }
    this.emitters = [];
    this.particleRenderData = null;
  }
}

// TODO: Implement helper function for shader creation
// function createShaderProgram(gl, vsSource, fsSource) { ... }
