/**
 * Mock WebGL renderer for testing
 */
export class MockRenderer {
    constructor(options = {}) {
        this.width = options.width || 800;
        this.height = options.height || 600;
        this.resolution = options.resolution || 1;
        this.view = options.view || document.createElement('canvas');
        this.type = 'WebGL';
    }

    render() {}
    resize() {}
    destroy() {}
    reset() {}
    clear() {}
    init() {}
}

/**
 * Creates a complete WebGL context mock for testing
 */
export const createWebGLContextMock = () => ({
    getExtension: () => ({
        VERTEX_SHADER: 'VERTEX_SHADER',
        FRAGMENT_SHADER: 'FRAGMENT_SHADER',
        createVertexArrayOES: () => ({}),
        bindVertexArrayOES: () => {}
    }),
    getShaderPrecisionFormat: () => ({ precision: 'high', rangeMin: 1, rangeMax: 1 }),
    getParameter: () => 1,
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    enable: () => {},
    disable: () => {},
    blendFunc: () => {},
    drawElements: () => {},
    drawArrays: () => {},
    createTexture: () => ({}),
    bindTexture: () => {},
    texImage2D: () => {},
    texParameteri: () => {},
    viewport: () => {},
    clear: () => {},
    clearColor: () => {},
    createProgram: () => ({}),
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    useProgram: () => {},
    getAttribLocation: () => 0,
    getUniformLocation: () => ({}),
    uniform1i: () => {},
    uniform1f: () => {},
    uniform2f: () => {},
    uniform3f: () => {},
    uniform4f: () => {},
    uniformMatrix4fv: () => {},
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    VERTEX_SHADER: 'VERTEX_SHADER',
    FRAGMENT_SHADER: 'FRAGMENT_SHADER',
    ARRAY_BUFFER: 'ARRAY_BUFFER',
    ELEMENT_ARRAY_BUFFER: 'ELEMENT_ARRAY_BUFFER',
    STATIC_DRAW: 'STATIC_DRAW',
    FLOAT: 'FLOAT',
    TRIANGLES: 'TRIANGLES',
    TEXTURE_2D: 'TEXTURE_2D',
    TEXTURE_MIN_FILTER: 'TEXTURE_MIN_FILTER',
    TEXTURE_MAG_FILTER: 'TEXTURE_MAG_FILTER',
    NEAREST: 'NEAREST',
    RGB: 'RGB',
    RGBA: 'RGBA',
    UNSIGNED_BYTE: 'UNSIGNED_BYTE',
    COLOR_BUFFER_BIT: 0x00004000,
    DEPTH_BUFFER_BIT: 0x00000100,
    STENCIL_BUFFER_BIT: 0x00000400
});

/**
 * Sets up the WebGL context mock on HTMLCanvasElement
 */
export const setupWebGLContext = () => {
    const mockContext = createWebGLContextMock();
    HTMLCanvasElement.prototype.getContext = function(contextType) {
        if (contextType === 'webgl' || contextType === 'webgl2') {
            return mockContext;
        }
        return null;
    };
    global.WebGLRenderingContext = MockRenderer;
    return mockContext;
};
