import PostProcessor from '../../../src/js/engine/graphics/PostProcessor.js';
import ShaderManager from '../../../src/js/engine/graphics/ShaderManager.js'; // Needed for mock type

// Mock WebGLRenderingContext methods used by PostProcessor
const mockGl = {
  createFramebuffer: jest.fn(() => ({ fboId: `mockFBO_${Math.random()}` })),
  bindFramebuffer: jest.fn(),
  createTexture: jest.fn(() => ({ texId: `mockTex_${Math.random()}` })),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  framebufferTexture2D: jest.fn(),
  checkFramebufferStatus: jest.fn(() => mockGl.FRAMEBUFFER_COMPLETE), // Assume complete by default
  deleteFramebuffer: jest.fn(),
  deleteTexture: jest.fn(),
  createBuffer: jest.fn(() => ({ bufferId: 'mockQuadBuffer' })),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  deleteBuffer: jest.fn(),
  viewport: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  depthMask: jest.fn(),
  useProgram: jest.fn(),
  activeTexture: jest.fn(),
  uniform1i: jest.fn(),
  uniform1f: jest.fn(),
  uniform2f: jest.fn(),
  uniform2fv: jest.fn(),
  uniform3fv: jest.fn(),
  uniform4fv: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  disableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  drawArrays: jest.fn(),
  // Constants
  FRAMEBUFFER: 'FRAMEBUFFER',
  TEXTURE_2D: 'TEXTURE_2D',
  RGBA: 'RGBA',
  UNSIGNED_BYTE: 'UNSIGNED_BYTE',
  LINEAR: 'LINEAR',
  CLAMP_TO_EDGE: 'CLAMP_TO_EDGE',
  COLOR_ATTACHMENT0: 'COLOR_ATTACHMENT0',
  FRAMEBUFFER_COMPLETE: 'FRAMEBUFFER_COMPLETE',
  ARRAY_BUFFER: 'ARRAY_BUFFER',
  STATIC_DRAW: 'STATIC_DRAW',
  TRIANGLE_STRIP: 'TRIANGLE_STRIP',
  FLOAT: 'FLOAT',
  TEXTURE0: 'TEXTURE0',
  DEPTH_TEST: 'DEPTH_TEST',
  BLEND: 'BLEND',
};

// Mock ShaderManager
const mockShaderManager = {
  getProgramInfo: jest.fn((name) => {
    // Return mock program info if the shader is expected to exist
    if (name === 'effectShader1' || name === 'effectShader2') {
      return {
        program: { programId: `mockProgram_${name}` },
        attribLocations: new Map([['a_position', 0], ['a_texCoord', 1]]),
        uniformLocations: new Map([['u_texture', { locId: 'texLoc' }], ['u_intensity', { locId: 'intensityLoc' }], ['u_resolution', { locId: 'resLoc' }]]),
      };
    }
    return null;
  }),
  // Add other methods if PostProcessor uses them
};

describe('PostProcessor', () => {
  let postProcessor;
  const width = 800;
  const height = 600;

  beforeEach(() => {
    jest.clearAllMocks();
    postProcessor = new PostProcessor(mockGl, mockShaderManager, width, height);
  });

  it('should throw error if no GL context or ShaderManager is provided', () => {
    expect(() => new PostProcessor(null, mockShaderManager, width, height)).toThrow();
    expect(() => new PostProcessor(mockGl, null, width, height)).toThrow();
  });

  it('should setup quad buffer on initialization', () => {
    expect(mockGl.createBuffer).toHaveBeenCalledTimes(1); // For quad buffer
    expect(mockGl.bindBuffer).toHaveBeenCalledWith(mockGl.ARRAY_BUFFER, { bufferId: 'mockQuadBuffer' });
    expect(mockGl.bufferData).toHaveBeenCalledWith(mockGl.ARRAY_BUFFER, expect.any(Float32Array), mockGl.STATIC_DRAW);
  });

  it('should setup initial framebuffers on initialization', () => {
    // Constructor calls _setupFramebuffers(2)
    expect(mockGl.createFramebuffer).toHaveBeenCalledTimes(2); // Default 2 FBOs
    expect(mockGl.createTexture).toHaveBeenCalledTimes(2);
    // bindFramebuffer is called once per FBO creation + once to unbind at the end
    expect(mockGl.bindFramebuffer).toHaveBeenCalledTimes(3);
    // bindTexture is called once per FBO creation + once to unbind at the end
    expect(mockGl.bindTexture).toHaveBeenCalledTimes(3);
    expect(mockGl.texImage2D).toHaveBeenCalledTimes(2);
    expect(mockGl.framebufferTexture2D).toHaveBeenCalledTimes(2);
    expect(mockGl.checkFramebufferStatus).toHaveBeenCalledTimes(2);
    expect(postProcessor.framebuffers.length).toBe(2);
  });

   it('should handle framebuffer incomplete status', () => {
       const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
       mockGl.checkFramebufferStatus.mockReturnValueOnce('INCOMPLETE_MOCK_STATUS'); // Simulate failure for the first FBO
       new PostProcessor(mockGl, mockShaderManager, width, height); // Create new instance for this test
       expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Framebuffer 0 incomplete'));
       errorSpy.mockRestore();
   });

  it('should add valid effects', () => {
    postProcessor.addEffect('effectShader1', { u_intensity: 0.5 });
    expect(postProcessor.effects.length).toBe(1);
    expect(postProcessor.effects[0].shaderName).toBe('effectShader1');
    expect(postProcessor.effects[0].uniforms).toEqual({ u_intensity: 0.5 });
    expect(postProcessor.effects[0].programInfo).toBeDefined();
    expect(mockShaderManager.getProgramInfo).toHaveBeenCalledWith('effectShader1');
  });

  it('should not add effect if shader not found in manager', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    postProcessor.addEffect('nonExistentShader');
    expect(postProcessor.effects.length).toBe(0);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Shader "nonExistentShader" not found'));
    errorSpy.mockRestore();
  });

  it('should clear effects', () => {
    postProcessor.addEffect('effectShader1');
    postProcessor.clearEffects();
    expect(postProcessor.effects.length).toBe(0);
  });

  it('should resize framebuffers', () => {
    const oldFBOs = [...postProcessor.framebuffers]; // Copy refs
    const newWidth = 1024;
    const newHeight = 768;

    postProcessor.resize(newWidth, newHeight);

    expect(postProcessor.width).toBe(newWidth);
    expect(postProcessor.height).toBe(newHeight);

    // Check old resources deleted
    expect(mockGl.deleteTexture).toHaveBeenCalledTimes(oldFBOs.length);
    expect(mockGl.deleteFramebuffer).toHaveBeenCalledTimes(oldFBOs.length);
    oldFBOs.forEach(fboInfo => {
        expect(mockGl.deleteTexture).toHaveBeenCalledWith(fboInfo.texture);
        expect(mockGl.deleteFramebuffer).toHaveBeenCalledWith(fboInfo.framebuffer);
    });

    // Check new resources created (at least 2)
    expect(mockGl.createFramebuffer).toHaveBeenCalledTimes(2 + oldFBOs.length); // 2 initial + 2 new
    expect(mockGl.createTexture).toHaveBeenCalledTimes(2 + oldFBOs.length);
    expect(postProcessor.framebuffers.length).toBeGreaterThanOrEqual(2);
    // Check new textures created with correct size
    expect(mockGl.texImage2D).toHaveBeenCalledWith(mockGl.TEXTURE_2D, 0, mockGl.RGBA, newWidth, newHeight, 0, mockGl.RGBA, mockGl.UNSIGNED_BYTE, null);
  });

   it('should not resize if dimensions are the same', () => {
       postProcessor.resize(width, height); // Same dimensions
       expect(mockGl.deleteTexture).not.toHaveBeenCalled();
       expect(mockGl.deleteFramebuffer).not.toHaveBeenCalled();
       expect(mockGl.createFramebuffer).toHaveBeenCalledTimes(2); // Only initial creation
   });

  it('should bind the first framebuffer on begin() if effects exist', () => {
    postProcessor.addEffect('effectShader1');
    postProcessor.begin();
    expect(mockGl.bindFramebuffer).toHaveBeenCalledWith(mockGl.FRAMEBUFFER, postProcessor.framebuffers[0].framebuffer);
    expect(mockGl.viewport).toHaveBeenCalledWith(0, 0, width, height);
   });

  it('should not bind framebuffer on begin() if no effects exist', () => {
    // Clear mocks called during constructor before testing begin()
    jest.clearAllMocks();
    postProcessor.begin(); // Should do nothing as effects array is empty
    expect(mockGl.bindFramebuffer).not.toHaveBeenCalled();
  });

  it('should do nothing on end() if no effects exist', () => {
    postProcessor.end();
    expect(mockGl.useProgram).not.toHaveBeenCalled();
    expect(mockGl.drawArrays).not.toHaveBeenCalled();
  });

  it('should apply effects and render to canvas on end()', () => {
    postProcessor.addEffect('effectShader1', { u_intensity: 0.5 });
    postProcessor.addEffect('effectShader2', { u_intensity: () => 0.8 }); // Uniform as function

    // --- begin() ---
    postProcessor.begin();
    const fbo1 = postProcessor.framebuffers[0];
    const fbo2 = postProcessor.framebuffers[1];
    expect(mockGl.bindFramebuffer).toHaveBeenCalledWith(mockGl.FRAMEBUFFER, fbo1.framebuffer);
    mockGl.bindFramebuffer.mockClear(); // Clear calls from begin

    // --- end() ---
    postProcessor.end();

    // Effect 1: Render FBO1 -> FBO2
    expect(mockGl.bindFramebuffer).toHaveBeenCalledWith(mockGl.FRAMEBUFFER, fbo2.framebuffer);
    expect(mockGl.useProgram).toHaveBeenCalledWith({ programId: 'mockProgram_effectShader1' });
    expect(mockGl.activeTexture).toHaveBeenCalledWith(mockGl.TEXTURE0);
    expect(mockGl.bindTexture).toHaveBeenCalledWith(mockGl.TEXTURE_2D, fbo1.texture); // Use FBO1 texture as input
    expect(mockGl.uniform1i).toHaveBeenCalledWith({ locId: 'texLoc' }, 0); // Set texture unit
    expect(mockGl.uniform1f).toHaveBeenCalledWith({ locId: 'intensityLoc' }, 0.5); // Set intensity uniform
    expect(mockGl.uniform2f).toHaveBeenCalledWith({ locId: 'resLoc' }, width, height); // Set resolution
    expect(mockGl.drawArrays).toHaveBeenCalledWith(mockGl.TRIANGLE_STRIP, 0, 4);

    // Effect 2: Render FBO2 -> Canvas (null FBO)
    expect(mockGl.bindFramebuffer).toHaveBeenCalledWith(mockGl.FRAMEBUFFER, null); // Render to canvas
    expect(mockGl.useProgram).toHaveBeenCalledWith({ programId: 'mockProgram_effectShader2' });
    expect(mockGl.bindTexture).toHaveBeenCalledWith(mockGl.TEXTURE_2D, fbo2.texture); // Use FBO2 texture as input
    expect(mockGl.uniform1i).toHaveBeenCalledWith({ locId: 'texLoc' }, 0);
    expect(mockGl.uniform1f).toHaveBeenCalledWith({ locId: 'intensityLoc' }, 0.8); // Called function for value
    expect(mockGl.uniform2f).toHaveBeenCalledWith({ locId: 'resLoc' }, width, height);
    expect(mockGl.drawArrays).toHaveBeenCalledWith(mockGl.TRIANGLE_STRIP, 0, 4);

    // Check final cleanup
    expect(mockGl.bindFramebuffer).toHaveBeenLastCalledWith(mockGl.FRAMEBUFFER, null);
    expect(mockGl.bindTexture).toHaveBeenLastCalledWith(mockGl.TEXTURE_2D, null);
    expect(mockGl.useProgram).toHaveBeenLastCalledWith(null);
    expect(mockGl.enable).toHaveBeenCalledWith(mockGl.DEPTH_TEST); // Re-enable depth test
  });

  it('should destroy resources', () => {
     const fboInfos = [...postProcessor.framebuffers];
     const quadBuffer = postProcessor.quadBuffer;
     postProcessor.destroy();

     expect(mockGl.deleteTexture).toHaveBeenCalledTimes(fboInfos.length);
     expect(mockGl.deleteFramebuffer).toHaveBeenCalledTimes(fboInfos.length);
     fboInfos.forEach(fboInfo => {
         expect(mockGl.deleteTexture).toHaveBeenCalledWith(fboInfo.texture);
         expect(mockGl.deleteFramebuffer).toHaveBeenCalledWith(fboInfo.framebuffer);
     });
     expect(mockGl.deleteBuffer).toHaveBeenCalledWith(quadBuffer);
     expect(postProcessor.framebuffers.length).toBe(0);
     expect(postProcessor.quadBuffer).toBeNull();
     expect(postProcessor.effects.length).toBe(0);
  });

});
