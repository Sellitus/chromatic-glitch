/**
 * Represents the game camera, managing view and projection transformations
 * and providing effects like pan, zoom, and shake.
 */
export default class Camera {
  /**
   * Creates a Camera instance.
   * @param {number} viewportWidth - The width of the game viewport.
   * @param {number} viewportHeight - The height of the game viewport.
   * @param {object} [options={}] - Optional configuration.
   * @param {number} [options.x=0] - Initial horizontal position.
   * @param {number} [options.y=0] - Initial vertical position.
   * @param {number} [options.zoom=1] - Initial zoom level (1 = no zoom, <1 = zoom out, >1 = zoom in).
   * @param {number} [options.rotation=0] - Initial rotation in radians.
   * @param {number} [options.minZoom=0.1] - Minimum allowed zoom level.
   * @param {number} [options.maxZoom=10] - Maximum allowed zoom level.
   */
  constructor(viewportWidth, viewportHeight, options = {}) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.zoom = options.zoom ?? 1;
    this.rotation = options.rotation ?? 0;

    this.minZoom = options.minZoom ?? 0.1;
    this.maxZoom = options.maxZoom ?? 10;

    // Use global mat4 and vec3 objects when available
    this._mat4 = mat4;
    this._vec3 = vec3;

    this.viewMatrix = this._mat4.create();
    this.projectionMatrix = this._mat4.create();

    // Shake effect properties
    this.isShaking = false;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    this._updateProjectionMatrix();
    this._updateViewMatrix();
  }

  /**
   * Updates the camera state, including effects like shake.
   * Should be called once per frame.
   * @param {number} deltaTime - Time elapsed since the last update (in seconds).
   */
  update(deltaTime) {
    let viewNeedsUpdate = false;

    // Update shake effect
    if (this.isShaking) {
      this.shakeTimer += deltaTime;
      if (this.shakeTimer >= this.shakeDuration) {
        this.isShaking = false;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      } else {
        const progress = this.shakeTimer / this.shakeDuration;
        const currentIntensity = this.shakeIntensity * (1 - progress);
        this.shakeOffsetX = (Math.random() - 0.5) * 2 * currentIntensity;
        this.shakeOffsetY = (Math.random() - 0.5) * 2 * currentIntensity;
      }
      viewNeedsUpdate = true;
    }

    if (viewNeedsUpdate) {
      this._updateViewMatrix();
    }
  }

  /**
   * Updates the projection matrix based on viewport size and zoom.
   * @private
   */
  _updateProjectionMatrix() {
    const halfWidth = (this.viewportWidth / 2) / this.zoom;
    const halfHeight = (this.viewportHeight / 2) / this.zoom;

    this._mat4.ortho(this.projectionMatrix, -halfWidth, halfWidth, -halfHeight, halfHeight, -1, 1);
  }

  /**
   * Updates the view matrix based on position, rotation, and shake.
   * @private
   */
  _updateViewMatrix() {
    this._mat4.identity(this.viewMatrix);

    // Apply inverse transformations
    this._mat4.translate(this.viewMatrix, this.viewMatrix, this._vec3.fromValues(-this.x, -this.y, 0));
    this._mat4.rotateZ(this.viewMatrix, this.viewMatrix, -this.rotation);

    if (this.isShaking) {
      this._mat4.translate(this.viewMatrix, this.viewMatrix, this._vec3.fromValues(-this.shakeOffsetX, -this.shakeOffsetY, 0));
    }
  }

  /**
   * Sets the camera's position.
   * @param {number} x - New horizontal position.
   * @param {number} y - New vertical position.
   */
  setPosition(x, y) {
    if (this.x !== x || this.y !== y) {
      this.x = x;
      this.y = y;
      this._updateViewMatrix();
    }
  }

  /**
   * Moves the camera by a relative amount.
   * @param {number} dx - Change in horizontal position.
   * @param {number} dy - Change in vertical position.
   */
  pan(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      this.x += dx;
      this.y += dy;
      this._updateViewMatrix();
    }
  }

  /**
   * Sets the camera's zoom level.
   * @param {number} zoomLevel - New zoom level. Clamped between minZoom and maxZoom.
   */
  setZoom(zoomLevel) {
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoomLevel));
    if (this.zoom !== newZoom) {
      this.zoom = newZoom;
      this._updateProjectionMatrix();
    }
  }

  /**
   * Zooms the camera by a multiplicative factor.
   * @param {number} factor - Factor to multiply the current zoom by.
   */
  zoomBy(factor) {
    this.setZoom(this.zoom * factor);
  }

  /**
   * Sets the camera's rotation.
   * @param {number} radians - New rotation angle in radians.
   */
  setRotation(radians) {
    if (this.rotation !== radians) {
      this.rotation = radians;
      this._updateViewMatrix();
    }
  }

  /**
   * Rotates the camera by a relative amount.
   * @param {number} deltaRadians - Change in rotation angle in radians.
   */
  rotateBy(deltaRadians) {
    this.setRotation(this.rotation + deltaRadians);
  }

  /**
   * Initiates a camera shake effect.
   * @param {number} intensity - Maximum displacement magnitude for the shake.
   * @param {number} duration - Duration of the shake effect in seconds.
   */
  shake(intensity, duration) {
    if (intensity <= 0 || duration <= 0) return;
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
    this.isShaking = true;
  }

  /**
   * Called when the viewport size changes.
   * @param {number} width - New viewport width.
   * @param {number} height - New viewport height.
   */
  resize(width, height) {
    if (this.viewportWidth !== width || this.viewportHeight !== height) {
      this.viewportWidth = width;
      this.viewportHeight = height;
      this._updateProjectionMatrix();
    }
  }

  /**
   * Gets the current view matrix.
   * @returns {Float32Array} The view matrix.
   */
  getViewMatrix() {
    return this.viewMatrix;
  }

  /**
   * Gets the current projection matrix.
   * @returns {Float32Array} The projection matrix.
   */
  getProjectionMatrix() {
    return this.projectionMatrix;
  }

  /**
   * Converts world coordinates to screen coordinates.
   * @param {number} worldX - World X coordinate.
   * @param {number} worldY - World Y coordinate.
   * @returns {{x: number, y: number} | null} Screen coordinates or null if conversion fails.
   */
  worldToScreen(worldX, worldY) {
    console.warn("Camera.worldToScreen: Not implemented (requires matrix math library).");
    return null;
  }

  /**
   * Converts screen coordinates to world coordinates.
   * @param {number} screenX - Screen X coordinate.
   * @param {number} screenY - Screen Y coordinate.
   * @returns {{x: number, y: number} | null} World coordinates or null if conversion fails.
   */
  screenToWorld(screenX, screenY) {
    console.warn("Camera.screenToWorld: Not implemented (requires matrix math library).");
    return null;
  }
}
