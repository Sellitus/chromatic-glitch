/**
 * Manages post-processing effects using WebGL Framebuffer Objects (FBOs) and shaders.
 * Allows rendering the scene to a texture and then applying effects to that texture.
 */
export default class PostProcessor {
  /**
   * Creates a PostProcessor instance.
   * @param {WebGLRenderingContext} gl - The WebGL rendering context.
   * @param {ShaderManager} shaderManager - The shader manager instance.
   * @param {number} width - The width of the rendering canvas/framebuffers.
   * @param {number} height - The height of the rendering canvas/framebuffers.
   */
  constructor(gl, shaderManager, width, height) {
    if (!gl || !shaderManager) {
      throw new Error('PostProcessor requires a WebGL context and a ShaderManager.');
    }
    this.gl = gl;
    this.shaderManager = shaderManager;
    this.width = width;
    this.height = height;

    this.effects = []; // Array of { shaderName: string, uniforms: object }
    this.framebuffers = []; // Pool of FBOs for ping-ponging effects
    this.quadBuffer = null; // Buffer for rendering a full-screen quad

    this._setupQuadBuffer();
    this._setupFramebuffers(2); // Need at least two for ping-ponging
  }

  /**
   * Sets up the vertex buffer for rendering a full-screen quad.
   * @private
   */
  _setupQuadBuffer() {
    const gl = this.gl;
    // Simple quad covering the entire screen in clip space (-1 to 1)
    // Vertices (x, y) and Texture Coordinates (u, v)
    const quadVertices = new Float32Array([
      // x,  y,  u, v
      -1, -1,  0, 0, // Bottom-left
       1, -1,  1, 0, // Bottom-right
      -1,  1,  0, 1, // Top-left
       1,  1,  1, 1, // Top-right
    ]);

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /**
   * Creates a specified number of Framebuffer Objects (FBOs) with attached textures.
   * @param {number} count - Number of framebuffers to create.
   * @private
   */
  _setupFramebuffers(count) {
    const gl = this.gl;
    for (let i = 0; i < count; i++) {
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

      // Create texture to render to
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // Attach texture to framebuffer
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

      // Optional: Add depth/stencil buffer if needed for effects that require depth testing
      // const depthBuffer = gl.createRenderbuffer();
      // gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
      // gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, this.width, this.height);
      // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

      // Check framebuffer status
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error(`PostProcessor: Framebuffer ${i} incomplete: ${status.toString(16)}`);
      }

      this.framebuffers.push({ framebuffer, texture /*, depthBuffer */ });
    }

    // Unbind
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }

  /**
   * Adds a post-processing effect to the chain.
   * @param {string} shaderName - The name of the shader program (must be loaded in ShaderManager).
   * @param {object} [uniforms={}] - An object containing uniform names and their values/update functions for this effect.
   *                                 Example: { u_time: () => performance.now() / 1000, u_intensity: 0.5 }
   */
  addEffect(shaderName, uniforms = {}) {
    const programInfo = this.shaderManager.getProgramInfo(shaderName);
    if (!programInfo) {
      console.error(`PostProcessor: Shader "${shaderName}" not found in ShaderManager.`);
      return;
    }
    this.effects.push({ shaderName, uniforms, programInfo });
  }

  /**
   * Removes all effects from the chain.
   */
  clearEffects() {
    this.effects = [];
  }

  /**
   * Resizes the internal framebuffers and textures. Call when the canvas size changes.
   * @param {number} width - New width.
   * @param {number} height - New height.
   */
  resize(width, height) {
    if (this.width === width && this.height === height) return;

    this.width = width;
    this.height = height;

    // Delete old resources
    this.framebuffers.forEach(fboInfo => {
      this.gl.deleteTexture(fboInfo.texture);
      // if (fboInfo.depthBuffer) this.gl.deleteRenderbuffer(fboInfo.depthBuffer);
      this.gl.deleteFramebuffer(fboInfo.framebuffer);
    });
    this.framebuffers = [];

    // Recreate framebuffers with new size
    this._setupFramebuffers(Math.max(2, this.effects.length + 1)); // Ensure enough for ping-pong
  }

  /**
   * Begins the post-processing sequence. Binds the first framebuffer for scene rendering.
   * Call this before rendering your main scene.
   */
  begin() {
    if (this.effects.length === 0) return; // No effects, render directly to canvas

    const gl = this.gl;
    // Bind the first FBO to render the scene into
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[0].framebuffer);
    gl.viewport(0, 0, this.width, this.height);
    // Clear the framebuffer (optional, depends on whether scene clears itself)
    // gl.clearColor(0, 0, 0, 1);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  /**
   * Ends the post-processing sequence. Applies the effects chain and renders the final result to the canvas.
   * Call this after rendering your main scene (if begin() was called).
   */
  end() {
    if (this.effects.length === 0) return; // No effects applied

    const gl = this.gl;
    let sourceFBOIndex = 0;

    gl.disable(gl.DEPTH_TEST); // Usually disable depth test for post-processing quads
    gl.disable(gl.BLEND);    // Disable blend unless the effect requires it

    // Bind the quad buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);

    // Ping-pong through effects
    for (let i = 0; i < this.effects.length; i++) {
      const effect = this.effects[i];
      const targetFBOIndex = (sourceFBOIndex + 1) % this.framebuffers.length;

      // Determine target framebuffer (next FBO or canvas if last effect)
      const targetFramebuffer = (i === this.effects.length - 1)
        ? null // Render last effect to the default framebuffer (canvas)
        : this.framebuffers[targetFBOIndex].framebuffer;

      gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
      gl.viewport(0, 0, this.width, this.height); // Set viewport for target
      // gl.clearColor(0, 0, 0, 1); // Clear target before drawing (optional)
      // gl.clear(gl.COLOR_BUFFER_BIT);

      // Use the effect's shader program
      const programInfo = effect.programInfo;
      gl.useProgram(programInfo.program);

      // Set up attributes for the quad
      const posLoc = programInfo.attribLocations.get('a_position'); // Assuming 'a_position' for vertex coords
      const texLoc = programInfo.attribLocations.get('a_texCoord'); // Assuming 'a_texCoord' for UVs
      if (posLoc !== undefined && texLoc !== undefined) {
          gl.enableVertexAttribArray(posLoc);
          gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0); // 2 floats, 16 bytes stride, 0 offset
          gl.enableVertexAttribArray(texLoc);
          gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8); // 2 floats, 16 bytes stride, 8 offset
      } else {
          console.warn(`PostProcessor: Shader "${effect.shaderName}" missing required attributes 'a_position' or 'a_texCoord'.`);
          continue; // Skip this effect if attributes are missing
      }


      // Bind the texture from the previous step (source FBO)
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.framebuffers[sourceFBOIndex].texture);
      const texUniformLoc = programInfo.uniformLocations.get('u_texture') ?? programInfo.uniformLocations.get('u_sampler'); // Common names
      if (texUniformLoc) {
          gl.uniform1i(texUniformLoc, 0); // Tell shader to use texture unit 0
      } else {
          console.warn(`PostProcessor: Shader "${effect.shaderName}" missing required texture uniform 'u_texture' or 'u_sampler'.`);
      }


      // Set other uniforms for the effect
      this._setUniforms(programInfo, effect.uniforms);

      // Draw the quad
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Disable attributes
      if (posLoc !== undefined) gl.disableVertexAttribArray(posLoc);
      if (texLoc !== undefined) gl.disableVertexAttribArray(texLoc);


      // Update source for the next iteration
      sourceFBOIndex = targetFBOIndex;
    }

    // Clean up
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);
    gl.enable(gl.DEPTH_TEST); // Re-enable depth test if it was enabled before
  }

  /**
   * Sets uniforms for a given shader program.
   * @param {object} programInfo - The program info object from ShaderManager.
   * @param {object} uniforms - Uniform data { name: value | function }.
   * @private
   */
  _setUniforms(programInfo, uniforms) {
    const gl = this.gl;
    for (const name in uniforms) {
      const location = programInfo.uniformLocations.get(name);
      if (location) {
        let value = uniforms[name];
        if (typeof value === 'function') {
          value = value(); // Execute function to get current value (e.g., for time)
        }

        // Determine uniform type and call appropriate gl.uniform* method
        // This is a simplified example; a robust solution would inspect uniform type
        if (typeof value === 'number') {
          gl.uniform1f(location, value);
        } else if (Array.isArray(value) || value instanceof Float32Array) {
          if (value.length === 2) gl.uniform2fv(location, value);
          else if (value.length === 3) gl.uniform3fv(location, value);
          else if (value.length === 4) gl.uniform4fv(location, value);
          // Add cases for matrices (mat2, mat3, mat4) if needed
        } else if (typeof value === 'boolean') {
          gl.uniform1i(location, value ? 1 : 0); // Use integer for boolean uniforms
        }
        // Add more types as needed (integers, textures, etc.)
      } else {
        // console.warn(`PostProcessor: Uniform "${name}" not found in shader program.`);
      }
    }
     // Set resolution uniform automatically if present
     const resLoc = programInfo.uniformLocations.get('u_resolution');
     if (resLoc) {
         gl.uniform2f(resLoc, this.width, this.height);
     }
  }

  /**
   * Cleans up WebGL resources.
   */
  destroy() {
    const gl = this.gl;
    this.framebuffers.forEach(fboInfo => {
      gl.deleteTexture(fboInfo.texture);
      // if (fboInfo.depthBuffer) gl.deleteRenderbuffer(fboInfo.depthBuffer);
      gl.deleteFramebuffer(fboInfo.framebuffer);
    });
    this.framebuffers = [];

    if (this.quadBuffer) {
      gl.deleteBuffer(this.quadBuffer);
      this.quadBuffer = null;
    }
    this.effects = [];
  }
}
