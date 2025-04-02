/**
 * Represents a sprite sheet, typically loaded from a texture atlas JSON and an image.
 * Provides methods to access individual frame data (coordinates, dimensions).
 */
export default class SpriteSheet {
  /**
   * Creates a SpriteSheet instance.
   * @param {HTMLImageElement|WebGLTexture} texture - The texture image containing all frames.
   * @param {object} atlasData - The JSON data describing the frames within the texture atlas.
   *                             Expected format (similar to TexturePacker JSON Hash):
   *                             {
   *                               frames: {
   *                                 "frameName1.png": {
   *                                   frame: { x: 0, y: 0, w: 32, h: 32 },
   *                                   rotated: false,
   *                                   trimmed: false,
   *                                   spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 },
   *                                   sourceSize: { w: 32, h: 32 }
   *                                 },
   *                                 "frameName2.png": { ... }
   *                               },
   *                               meta: {
   *                                 image: "spritesheet.png",
   *                                 format: "RGBA8888",
   *                                 size: { w: 128, h: 64 },
   *                                 scale: "1"
   *                               }
   *                             }
   *                             OR an array format:
   *                             {
   *                               frames: [
   *                                 { filename: "frameName1.png", frame: {x,y,w,h}, ... },
   *                                 { filename: "frameName2.png", frame: {x,y,w,h}, ... }
   *                               ],
   *                               meta: { ... }
   *                             }
   */
  constructor(texture, atlasData) {
    if (!texture || !atlasData || (!atlasData.frames && !Array.isArray(atlasData.frames))) {
      throw new Error('SpriteSheet requires a texture and valid atlas data (object or array frames).');
    }

    this.texture = texture; // Could be HTMLImageElement or WebGLTexture
    this.atlasData = atlasData;
    this.frames = new Map(); // Map<string|number, object> for easy access by name or index
    this.frameList = []; // Ordered list of frames

    this._parseAtlasData();
  }

  /**
   * Parses the atlas data and populates the frames map and list.
   * @private
   */
  _parseAtlasData() {
    const framesSource = this.atlasData.frames;

    if (Array.isArray(framesSource)) {
      // Handle array format (common in some tools)
      framesSource.forEach((frameData, index) => {
        const name = frameData.filename || `frame_${index}`; // Use filename or generate index
        const frameInfo = {
          name: name,
          index: index,
          rect: { ...frameData.frame }, // {x, y, w, h} on the sheet
          rotated: frameData.rotated ?? false,
          trimmed: frameData.trimmed ?? false,
          sourceRect: frameData.spriteSourceSize ?? { ...frameData.frame, x: 0, y: 0 }, // {x, y, w, h} original sprite pos offset
          sourceSize: frameData.sourceSize ?? { w: frameData.frame.w, h: frameData.frame.h }, // {w, h} original sprite size
        };
        this.frames.set(name, frameInfo);
        this.frames.set(index, frameInfo); // Allow access by index too
        this.frameList.push(frameInfo);
      });
    } else if (typeof framesSource === 'object' && framesSource !== null) {
      // Handle hash/object format (TexturePacker default)
      let index = 0;
      for (const name in framesSource) {
        if (framesSource.hasOwnProperty(name)) {
          const frameData = framesSource[name];
          const frameInfo = {
            name: name,
            index: index,
            rect: { ...frameData.frame }, // {x, y, w, h}
            rotated: frameData.rotated ?? false,
            trimmed: frameData.trimmed ?? (frameData.spriteSourceSize?.x !== 0 || frameData.spriteSourceSize?.y !== 0),
            sourceRect: frameData.spriteSourceSize ?? { ...frameData.frame, x: 0, y: 0 },
            sourceSize: frameData.sourceSize ?? { w: frameData.frame.w, h: frameData.frame.h },
          };
          this.frames.set(name, frameInfo);
          this.frames.set(index, frameInfo);
          this.frameList.push(frameInfo);
          index++;
        }
      }
    } else {
        console.error("Unsupported atlas data frames format:", framesSource);
        throw new Error("Unsupported atlas data frames format.");
    }
  }

  /**
   * Gets the data for a specific frame.
   * @param {string|number} frameIdentifier - The name (string) or index (number) of the frame.
   * @returns {object|null} Frame data object { name, index, rect, rotated, trimmed, sourceRect, sourceSize } or null if not found.
   */
  getFrame(frameIdentifier) {
    return this.frames.get(frameIdentifier) || null;
  }

  /**
   * Gets the UV coordinates for a specific frame, suitable for WebGL.
   * Assumes the texture origin (0,0) is top-left.
   * @param {string|number} frameIdentifier - The name (string) or index (number) of the frame.
   * @returns {{u1: number, v1: number, u2: number, v2: number}|null} UV coordinates {u1, v1, u2, v2} or null if not found.
   */
  getFrameUVs(frameIdentifier) {
    const frame = this.getFrame(frameIdentifier);
    if (!frame) return null;

    // Determine texture dimensions - Prioritize texture object, then metadata, then default
    let textureWidth = 0;
    let textureHeight = 0;
    let foundDims = false;

    // 1. Try getting dimensions from the texture object itself
    //    (Currently only checks naturalWidth/Height, might need extension for WebGLTexture if applicable)
    if (this.texture && typeof this.texture.naturalWidth === 'number' && typeof this.texture.naturalHeight === 'number') {
        textureWidth = this.texture.naturalWidth;
        textureHeight = this.texture.naturalHeight;
        // Check for valid dimensions immediately
        if (textureWidth > 0 && textureHeight > 0) {
            foundDims = true;
        } else {
             // If texture object provided 0x0, return null immediately
             return null;
        }
    }

    // 2. If not found on texture object, try metadata
    if (!foundDims && this.atlasData.meta && this.atlasData.meta.size) {
        textureWidth = this.atlasData.meta.size.w;
        textureHeight = this.atlasData.meta.size.h;
        // Check for valid dimensions immediately
        if (textureWidth > 0 && textureHeight > 0) {
            foundDims = true;
        } else {
            // If metadata provided 0x0, return null immediately
            return null;
        }
    }

    // 3. If still no valid dimensions, warn and default to 1x1
    if (!foundDims) {
        console.warn("Cannot determine valid texture dimensions for UV calculation. Assuming 1x1.");
        textureWidth = 1;
        textureHeight = 1;
    }

    // Note: The check for 0 dimensions is now handled within the dimension-finding logic above.

    const { x, y, w, h } = frame.rect;

    // Calculate UVs (top-left origin)
    const u1 = x / textureWidth;
    const v1 = y / textureHeight;
    const u2 = (x + w) / textureWidth;
    const v2 = (y + h) / textureHeight;

    // TODO: Handle rotated frames if necessary.
    // If rotated, UVs might need swapping or adjustment depending on rendering method.
    if (frame.rotated) {
        console.warn(`Frame "${frameIdentifier}" is rotated. UVs calculated assuming non-rotated rendering. Rotation handling might be needed in the shader or vertex data.`);
        // Example (might need adjustment):
        // return { u1: x / textureWidth, v1: y / textureHeight, u2: (x + h) / textureWidth, v2: (y + w) / textureHeight };
    }

    return { u1, v1, u2, v2 };
  }

  /**
   * Gets the total number of frames in the sprite sheet.
   * @returns {number}
   */
  getFrameCount() {
    return this.frameList.length;
  }

  /**
   * Gets the underlying texture.
   * @returns {HTMLImageElement|WebGLTexture}
   */
  getTexture() {
    return this.texture;
  }
}
