import ShaderManager from '../../../src/js/engine/graphics/ShaderManager.js';

// Mock WebGLRenderingContext methods used by ShaderManager
const mockGl = {
  createShader: jest.fn((type) => ({ shaderId: `mockShader_${type}` })),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  // Simplify mock: Always return true for COMPILE_STATUS by default
  getShaderParameter: jest.fn().mockImplementation((shader, pname) => {
    if (pname === mockGl.COMPILE_STATUS) {
      return true; // Default to success
    }
    return undefined;
  }),
  getShaderInfoLog: jest.fn(() => 'mock shader info log'),
  createProgram: jest.fn(() => ({ _id: 'mockProgram' })), // Use a different property name
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  // Simplify mock: Always return default values for known parameters
  getProgramParameter: jest.fn().mockImplementation((program, pname) => {
    if (pname === mockGl.LINK_STATUS) {
      return true; // Default to success
    }
    if (pname === mockGl.ACTIVE_ATTRIBUTES) {
      return 2; // Example value
    }
    if (pname === mockGl.ACTIVE_UNIFORMS) {
      return 2; // Example value
    }
    return undefined; // Default for unknown parameters
  }),
  getProgramInfoLog: jest.fn(() => 'mock program info log'),
  detachShader: jest.fn(),
  deleteShader: jest.fn(),
  deleteProgram: jest.fn(),
  getActiveAttrib: jest.fn((program, index) => {
      if (index === 0) return { name: 'a_position', type: mockGl.FLOAT_VEC3, size: 1 };
      if (index === 1) return { name: 'a_texCoord', type: mockGl.FLOAT_VEC2, size: 1 };
      return null;
  }),
  getAttribLocation: jest.fn((program, name) => {
      if (name === 'a_position') return 0;
      if (name === 'a_texCoord') return 1;
      return -1; // Standard return for not found
  }),
   getActiveUniform: jest.fn((program, index) => {
      if (index === 0) return { name: 'u_matrix', type: mockGl.FLOAT_MAT4, size: 1 };
      if (index === 1) return { name: 'u_texture', type: mockGl.SAMPLER_2D, size: 1 };
      return null;
  }),
  getUniformLocation: jest.fn((program, name) => {
      const baseName = name.replace(/\[\d+\]$/, '');
      if (baseName === 'u_matrix') return { uniformLocId: 'matrixLoc' };
      if (baseName === 'u_texture') return { uniformLocId: 'textureLoc' };
      return null; // Standard return for not found
  }),
  useProgram: jest.fn(),
  // Constants
  VERTEX_SHADER: 'VERTEX_SHADER',
  FRAGMENT_SHADER: 'FRAGMENT_SHADER',
  COMPILE_STATUS: 'COMPILE_STATUS',
  LINK_STATUS: 'LINK_STATUS',
  ACTIVE_ATTRIBUTES: 'ACTIVE_ATTRIBUTES',
  ACTIVE_UNIFORMS: 'ACTIVE_UNIFORMS',
  FLOAT_VEC2: 'FLOAT_VEC2',
  FLOAT_VEC3: 'FLOAT_VEC3',
  FLOAT_MAT4: 'FLOAT_MAT4',
  SAMPLER_2D: 'SAMPLER_2D',
};

const vsSource = 'vertex shader source';
const fsSource = 'fragment shader source';
const programName = 'testProgram';

describe('ShaderManager', () => {
  let shaderManager;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Pass the mock GL context to the constructor
    shaderManager = new ShaderManager(mockGl);
  });

  it('should throw error if no WebGL context is provided', () => {
    expect(() => new ShaderManager(null)).toThrow('ShaderManager requires a WebGL rendering context.');
  });

  it('should compile vertex and fragment shaders', () => {
    shaderManager.createProgram(programName, vsSource, fsSource);
    expect(mockGl.createShader).toHaveBeenCalledWith(mockGl.VERTEX_SHADER);
    expect(mockGl.createShader).toHaveBeenCalledWith(mockGl.FRAGMENT_SHADER);
    expect(mockGl.shaderSource).toHaveBeenCalledTimes(2);
    expect(mockGl.compileShader).toHaveBeenCalledTimes(2);
    expect(mockGl.getShaderParameter).toHaveBeenCalledWith({ shaderId: 'mockShader_VERTEX_SHADER' }, mockGl.COMPILE_STATUS);
    expect(mockGl.getShaderParameter).toHaveBeenCalledWith({ shaderId: 'mockShader_FRAGMENT_SHADER' }, mockGl.COMPILE_STATUS);
  });

  it('should handle vertex shader compilation error', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Simulate compile failure for vertex shader
    // Reset the mock for this specific test case
    mockGl.getShaderParameter.mockReset().mockImplementation((shader, pname) => {
        if (shader && shader.shaderId === 'mockShader_VERTEX_SHADER' && pname === mockGl.COMPILE_STATUS) return false;
        return true; // Assume fragment shader compiles ok
    });

    const result = shaderManager.createProgram(programName, vsSource, fsSource);

    expect(result).toBeNull();
    expect(mockGl.deleteShader).toHaveBeenCalledWith({ shaderId: 'mockShader_VERTEX_SHADER' });
    expect(mockGl.getShaderInfoLog).toHaveBeenCalledWith({ shaderId: 'mockShader_VERTEX_SHADER' });
    // Check the exact arguments passed to console.error
    expect(errorSpy).toHaveBeenCalledWith('Error compiling VERTEX shader:', 'mock shader info log');
    expect(shaderManager.getProgramInfo(programName)).toBeNull(); // Should not be cached
    errorSpy.mockRestore();
     // Restore default mock implementation for other tests
     mockGl.getShaderParameter.mockReset().mockImplementation((shader, pname) => {
        if (pname === mockGl.COMPILE_STATUS) return true;
        return undefined;
     });
  });

   it('should handle fragment shader compilation error', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Simulate compile failure for fragment shader
     mockGl.getShaderParameter.mockReset().mockImplementation((shader, pname) => {
        if (shader && shader.shaderId === 'mockShader_FRAGMENT_SHADER' && pname === mockGl.COMPILE_STATUS) return false;
        // Assume vertex shader compiles ok for this test
        if (shader && shader.shaderId === 'mockShader_VERTEX_SHADER' && pname === mockGl.COMPILE_STATUS) return true;
        return undefined; // Default for other params
    });

    const result = shaderManager.createProgram(programName, vsSource, fsSource);

    expect(result).toBeNull();
    // Ensure both shaders are cleaned up if fragment fails after vertex succeeds
    expect(mockGl.deleteShader).toHaveBeenCalledWith({ shaderId: 'mockShader_VERTEX_SHADER' });
    expect(mockGl.deleteShader).toHaveBeenCalledWith({ shaderId: 'mockShader_FRAGMENT_SHADER' });
    expect(mockGl.getShaderInfoLog).toHaveBeenCalledWith({ shaderId: 'mockShader_FRAGMENT_SHADER' });
    expect(errorSpy).toHaveBeenCalledWith('Error compiling FRAGMENT shader:', 'mock shader info log');
    expect(shaderManager.getProgramInfo(programName)).toBeNull();
    errorSpy.mockRestore();
     // Restore default mock implementation
     mockGl.getShaderParameter.mockReset().mockImplementation((shader, pname) => {
        if (pname === mockGl.COMPILE_STATUS) return true;
        return undefined;
     });
   });


  it('should link the shader program', () => {
    shaderManager.createProgram(programName, vsSource, fsSource);
    expect(mockGl.createProgram).toHaveBeenCalledTimes(1);
    expect(mockGl.attachShader).toHaveBeenCalledTimes(2);
    expect(mockGl.linkProgram).toHaveBeenCalledWith({ _id: 'mockProgram' }); // Expect new object structure
    expect(mockGl.getProgramParameter).toHaveBeenCalledWith({ _id: 'mockProgram' }, mockGl.LINK_STATUS); // Expect new object structure
  });

  it('should handle linking error', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Simulate link failure
    // Reset mock for this specific test case
    mockGl.getProgramParameter.mockReset().mockImplementation((program, pname) => {
        if (program && program._id === 'mockProgram' && pname === mockGl.LINK_STATUS) return false;
        // Assume compile status is fine
        if (pname === mockGl.COMPILE_STATUS) return true;
        // Return defaults for attribute/uniform counts if needed by other parts of createProgram
        if (pname === mockGl.ACTIVE_ATTRIBUTES) return 2;
        if (pname === mockGl.ACTIVE_UNIFORMS) return 2;
        return undefined;
    });

    const result = shaderManager.createProgram(programName, vsSource, fsSource);

    expect(result).toBeNull();
    expect(mockGl.deleteProgram).toHaveBeenCalledWith({ _id: 'mockProgram' }); // Expect new object structure
    expect(mockGl.getProgramInfoLog).toHaveBeenCalledWith({ _id: 'mockProgram' });
    // Check the exact arguments passed to console.error
    expect(errorSpy).toHaveBeenCalledWith('Unable to link shader program:', 'mock program info log');
    expect(shaderManager.getProgramInfo(programName)).toBeNull();
    errorSpy.mockRestore();
    // Restore default mock implementation
    mockGl.getProgramParameter.mockReset().mockImplementation((program, pname) => {
        if (pname === mockGl.LINK_STATUS) return true;
        if (pname === mockGl.ACTIVE_ATTRIBUTES) return 2;
        if (pname === mockGl.ACTIVE_UNIFORMS) return 2;
        return undefined;
    });
  });

  it('should detach and delete shaders after successful link', () => {
     shaderManager.createProgram(programName, vsSource, fsSource);
     expect(mockGl.detachShader).toHaveBeenCalledTimes(2);
     expect(mockGl.deleteShader).toHaveBeenCalledTimes(2);
     expect(mockGl.deleteShader).toHaveBeenCalledWith({ shaderId: 'mockShader_VERTEX_SHADER' });
     expect(mockGl.deleteShader).toHaveBeenCalledWith({ shaderId: 'mockShader_FRAGMENT_SHADER' });
  });

  it('should cache the created program and its info', () => {
    const info1 = shaderManager.createProgram(programName, vsSource, fsSource);
    expect(info1).not.toBeNull();
    // Check if the stored program is the mock object
    expect(shaderManager.getProgram(programName)).toEqual({ _id: 'mockProgram' });
    expect(shaderManager.getProgramInfo(programName)).toBe(info1);
    expect(info1.program).toEqual({ _id: 'mockProgram' }); // Verify the program object in the returned info

    // Call create again, should return cached version
    jest.clearAllMocks();
    const info2 = shaderManager.createProgram(programName, vsSource, fsSource);
    expect(info2).toBe(info1); // Should be the exact same info object from cache
    expect(mockGl.createShader).not.toHaveBeenCalled();
    expect(mockGl.createProgram).not.toHaveBeenCalled();
    expect(mockGl.linkProgram).not.toHaveBeenCalled();
  });

  it('should retrieve attribute locations', () => {
    const info = shaderManager.createProgram(programName, vsSource, fsSource);
    expect(mockGl.getActiveAttrib).toHaveBeenCalledTimes(2); // Based on mock ACTIVE_ATTRIBUTES = 2
    expect(mockGl.getAttribLocation).toHaveBeenCalledWith(info.program, 'a_position');
    expect(mockGl.getAttribLocation).toHaveBeenCalledWith(info.program, 'a_texCoord');
    expect(info.attribLocations.size).toBe(2);
    expect(info.attribLocations.get('a_position')).toBe(0);
    expect(info.attribLocations.get('a_texCoord')).toBe(1);
  });

  it('should retrieve uniform locations', () => {
    const info = shaderManager.createProgram(programName, vsSource, fsSource);
     expect(mockGl.getActiveUniform).toHaveBeenCalledTimes(2); // Based on mock ACTIVE_UNIFORMS = 2
     expect(mockGl.getUniformLocation).toHaveBeenCalledWith(info.program, 'u_matrix');
     expect(mockGl.getUniformLocation).toHaveBeenCalledWith(info.program, 'u_texture');
     expect(info.uniformLocations.size).toBe(2);
     expect(info.uniformLocations.get('u_matrix')).toEqual({ uniformLocId: 'matrixLoc' });
     expect(info.uniformLocations.get('u_texture')).toEqual({ uniformLocId: 'textureLoc' });
  });

  it('should use the specified program', () => {
    const info = shaderManager.createProgram(programName, vsSource, fsSource);
    const result = shaderManager.useProgram(programName);
    expect(result).toBe(true);
    expect(mockGl.useProgram).toHaveBeenCalledWith(info.program); // Check with the exact mock program object
  });

  it('should handle using a non-existent program', () => {
     const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
     const result = shaderManager.useProgram('nonExistentProgram');
     expect(result).toBe(false);
     expect(mockGl.useProgram).toHaveBeenCalledWith(null); // Should use null program
     expect(errorSpy).toHaveBeenCalledWith('ShaderManager: Program "nonExistentProgram" not found.'); // Match exact message
     errorSpy.mockRestore();
  });

  it('should delete a program', () => {
    const info = shaderManager.createProgram(programName, vsSource, fsSource);
    shaderManager.deleteProgram(programName);
    expect(mockGl.deleteProgram).toHaveBeenCalledWith({ _id: 'mockProgram' }); // Expect the exact mock object
    expect(shaderManager.getProgram(programName)).toBeNull();
    expect(shaderManager.getProgramInfo(programName)).toBeNull();
  });

   it('should not fail when deleting a non-existent program', () => {
       shaderManager.deleteProgram('nonExistentProgram');
       expect(mockGl.deleteProgram).not.toHaveBeenCalled();
   });

  it('should destroy all managed programs', () => {
    // Reset createProgram mock for this specific test
    mockGl.createProgram.mockReset()
        .mockImplementationOnce(() => ({ _id: 'mockProgram1' }))
        .mockImplementationOnce(() => ({ _id: 'mockProgram2' }));
    // Reset getProgramParameter mock for this specific test
    mockGl.getProgramParameter.mockReset().mockImplementation((program, pname) => {
        if (program && (program._id === 'mockProgram1' || program._id === 'mockProgram2')) {
             if (pname === mockGl.LINK_STATUS) return true;
             if (pname === mockGl.ACTIVE_ATTRIBUTES) return 2;
             if (pname === mockGl.ACTIVE_UNIFORMS) return 2;
        }
        return undefined;
    });


    const info1 = shaderManager.createProgram('prog1', vsSource, fsSource);
    const info2 = shaderManager.createProgram('prog2', vsSource, fsSource);
    shaderManager.destroy();
    expect(mockGl.deleteProgram).toHaveBeenCalledWith({ _id: 'mockProgram1' }); // Expect exact mock object 1
    expect(mockGl.deleteProgram).toHaveBeenCalledWith({ _id: 'mockProgram2' }); // Expect exact mock object 2
    expect(shaderManager.programs.size).toBe(0);
    expect(shaderManager.programInfo.size).toBe(0);
  });

});
