import SpriteSheet from '../../../src/js/engine/animation/SpriteSheet.js';

// Mock texture object (can be simple for testing logic)
const mockTexture = {
  naturalWidth: 128,
  naturalHeight: 64,
  // Add other properties if SpriteSheet uses them (e.g., instanceof checks)
};

// Mock atlas data (TexturePacker JSON Hash format)
const mockAtlasHash = {
  frames: {
    'frameA.png': {
      frame: { x: 0, y: 0, w: 32, h: 32 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
    },
    'frameB.png': {
      frame: { x: 32, y: 0, w: 32, h: 32 },
      rotated: false,
      trimmed: true, // Example trimmed
      spriteSourceSize: { x: 2, y: 2, w: 28, h: 28 },
      sourceSize: { w: 32, h: 32 },
    },
    'frameC.png': {
      frame: { x: 64, y: 0, w: 32, h: 32 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
    },
  },
  meta: {
    image: 'spritesheet.png',
    format: 'RGBA8888',
    size: { w: 128, h: 64 }, // Match mockTexture dimensions
    scale: '1',
  },
};

// Mock atlas data (Array format)
const mockAtlasArray = {
  frames: [
    {
      filename: 'frame_0',
      frame: { x: 0, y: 0, w: 32, h: 32 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
    },
    {
      filename: 'frame_1',
      frame: { x: 32, y: 0, w: 32, h: 32 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
    },
  ],
   meta: {
    image: 'spritesheet.png',
    format: 'RGBA8888',
    size: { w: 128, h: 64 }, // Match mockTexture dimensions
    scale: '1',
  },
};


describe('SpriteSheet', () => {

  it('should throw error for invalid constructor arguments', () => {
    expect(() => new SpriteSheet(null, mockAtlasHash)).toThrow();
    expect(() => new SpriteSheet(mockTexture, null)).toThrow();
    expect(() => new SpriteSheet(mockTexture, {})).toThrow(); // Missing frames
    expect(() => new SpriteSheet(mockTexture, { frames: null })).toThrow();
  });

  describe('Hash Format Atlas', () => {
    let spriteSheet;

    beforeEach(() => {
      spriteSheet = new SpriteSheet(mockTexture, mockAtlasHash);
    });

    it('should initialize correctly with hash format', () => {
      expect(spriteSheet.texture).toBe(mockTexture);
      expect(spriteSheet.atlasData).toBe(mockAtlasHash);
      expect(spriteSheet.frames.size).toBe(Object.keys(mockAtlasHash.frames).length * 2); // Name + Index
      expect(spriteSheet.frameList.length).toBe(Object.keys(mockAtlasHash.frames).length);
    });

    it('should parse frame data correctly from hash', () => {
      const frameA = spriteSheet.getFrame('frameA.png');
      expect(frameA).toBeDefined();
      expect(frameA.name).toBe('frameA.png');
      expect(frameA.index).toBe(0);
      expect(frameA.rect).toEqual({ x: 0, y: 0, w: 32, h: 32 });
      expect(frameA.rotated).toBe(false);
      expect(frameA.trimmed).toBe(false);
      expect(frameA.sourceRect).toEqual({ x: 0, y: 0, w: 32, h: 32 });
      expect(frameA.sourceSize).toEqual({ w: 32, h: 32 });

      const frameB = spriteSheet.getFrame(1); // Access by index
      expect(frameB).toBeDefined();
      expect(frameB.name).toBe('frameB.png');
      expect(frameB.index).toBe(1);
      expect(frameB.rect).toEqual({ x: 32, y: 0, w: 32, h: 32 });
      expect(frameB.trimmed).toBe(true);
      expect(frameB.sourceRect).toEqual({ x: 2, y: 2, w: 28, h: 28 });
    });

    it('should return correct frame count', () => {
      expect(spriteSheet.getFrameCount()).toBe(3);
    });

    it('should return the correct texture', () => {
      expect(spriteSheet.getTexture()).toBe(mockTexture);
    });

    it('should return null for non-existent frame', () => {
      expect(spriteSheet.getFrame('nonexistent.png')).toBeNull();
      expect(spriteSheet.getFrame(99)).toBeNull();
    });

    it('should calculate UVs correctly', () => {
      const uvsA = spriteSheet.getFrameUVs('frameA.png');
      expect(uvsA).toEqual({
        u1: 0 / 128,
        v1: 0 / 64,
        u2: 32 / 128,
        v2: 32 / 64,
      });

      const uvsB = spriteSheet.getFrameUVs(1); // frameB.png
       expect(uvsB).toEqual({
        u1: 32 / 128,
        v1: 0 / 64,
        u2: (32 + 32) / 128,
        v2: 32 / 64,
      });
    });

     it('should return null UVs for non-existent frame', () => {
        expect(spriteSheet.getFrameUVs('nonexistent.png')).toBeNull();
        expect(spriteSheet.getFrameUVs(99)).toBeNull();
     });

     it('should handle missing texture dimensions gracefully for UVs', () => {
        const sheetNoDims = new SpriteSheet({ /* no dims */ }, mockAtlasHash);
        // Suppress console.warn during this test
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const uvs = sheetNoDims.getFrameUVs('frameA.png');
        // Expects UVs based on meta.size (128x64) as texture object has no dims
        expect(uvs).toEqual({ u1: 0 / 128, v1: 0 / 64, u2: 32 / 128, v2: 32 / 64 });
        // Warning should NOT be called because meta.size is used
        expect(warnSpy).not.toHaveBeenCalled();
        warnSpy.mockRestore();
     });

      it('should handle zero texture dimensions gracefully for UVs', () => {
        const sheetZeroDims = new SpriteSheet({ naturalWidth: 0, naturalHeight: 0 }, mockAtlasHash);
        const uvs = sheetZeroDims.getFrameUVs('frameA.png');
        expect(uvs).toBeNull();
     });
  });


  describe('Array Format Atlas', () => {
     let spriteSheet;

    beforeEach(() => {
      spriteSheet = new SpriteSheet(mockTexture, mockAtlasArray);
    });

     it('should initialize correctly with array format', () => {
      expect(spriteSheet.texture).toBe(mockTexture);
      expect(spriteSheet.atlasData).toBe(mockAtlasArray);
      expect(spriteSheet.frames.size).toBe(mockAtlasArray.frames.length * 2); // Name + Index
      expect(spriteSheet.frameList.length).toBe(mockAtlasArray.frames.length);
    });

     it('should parse frame data correctly from array', () => {
      const frame0 = spriteSheet.getFrame('frame_0');
      expect(frame0).toBeDefined();
      expect(frame0.name).toBe('frame_0');
      expect(frame0.index).toBe(0);
      expect(frame0.rect).toEqual({ x: 0, y: 0, w: 32, h: 32 });

      const frame1 = spriteSheet.getFrame(1);
      expect(frame1).toBeDefined();
      expect(frame1.name).toBe('frame_1');
      expect(frame1.index).toBe(1);
      expect(frame1.rect).toEqual({ x: 32, y: 0, w: 32, h: 32 });
    });

     it('should return correct frame count for array format', () => {
        expect(spriteSheet.getFrameCount()).toBe(2);
     });

     it('should calculate UVs correctly for array format', () => {
        const uvs1 = spriteSheet.getFrameUVs(1); // frame_1
        expect(uvs1).toEqual({
            u1: 32 / 128,
            v1: 0 / 64,
            u2: (32 + 32) / 128,
            v2: 32 / 64,
        });
     });
  });

});
