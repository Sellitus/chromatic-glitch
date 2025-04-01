import System from "../System.js";
import TransformComponent from "../components/TransformComponent.js";
import RendererComponent from "../components/RendererComponent.js";

/**
 * System for rendering entities with visual representation
 */
export default class RenderSystem extends System {
  constructor() {
    super();
    this.renderQueue = new Map(); // Map<number, Entity[]> for layer-based rendering
  }

  /**
   * Get array of required component types for this system
   * @returns {Array<typeof Component>} Array of required component classes
   */
  static getRequiredComponents() {
    return [TransformComponent, RendererComponent];
  }

  /**
   * Pre-process entities into render layers
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  prepareRenderQueue(entityManager) {
    this.renderQueue.clear();

    // Get all renderable entities
    const entities = entityManager.getEntitiesWithComponents(
      TransformComponent,
      RendererComponent
    );

    // Sort entities into layers
    for (const entity of entities) {
      if (!entity.isActive) continue;

      const renderer = entity.getComponent(RendererComponent);
      if (!renderer.visible) continue;

      const layer = renderer.layer;
      if (!this.renderQueue.has(layer)) {
        this.renderQueue.set(layer, []);
      }
      this.renderQueue.get(layer).push(entity);
    }
  }

  /**
   * Process render queue and draw entities
   * @param {number} interpolationFactor - Factor for smoothing rendering between updates
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  render(interpolationFactor, entityManager) {
    if (!this.isActive) return;

    // Prepare render queue
    this.prepareRenderQueue(entityManager);

    // Sort layers
    const sortedLayers = Array.from(this.renderQueue.keys()).sort((a, b) => a - b);

    // Render each layer
    for (const layer of sortedLayers) {
      const entities = this.renderQueue.get(layer);
      for (const entity of entities) {
        this.renderEntity(interpolationFactor, entity);
      }
    }
  }

  /**
   * Render a single entity
   * @param {number} interpolationFactor - Interpolation factor for smooth rendering
   * @param {Entity} entity - Entity to render
   */
  renderEntity(interpolationFactor, entity) {
    const transform = entity.getComponent(TransformComponent);
    const renderer = entity.getComponent(RendererComponent);

    // Get interpolated transform state
    const transformState = transform.getInterpolatedState(interpolationFactor);

    // If entity has a custom render function, use it
    if (renderer.customRender) {
      renderer.customRender(transformState, renderer);
      return;
    }

    // Default rendering logic would go here
    // In a real implementation, this would:
    // 1. Get the sprite/texture from the asset manager using renderer.assetId
    // 2. Apply transform (position, rotation, scale)
    // 3. Apply renderer properties (alpha, tint, blend mode)
    // 4. Draw to the canvas/WebGL context
  }

  /**
   * Process entity during logic update (not used in render system)
   * @param {number} deltaTime - Time elapsed since last update
   * @param {Entity} entity - Entity to process
   */
  processEntity(deltaTime, entity) {
    // Render system uses render() instead of update()
  }

  /**
   * Called when system is attached to entity manager
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  onAttach(entityManager) {
    // Optional: Set up rendering context, load shaders, etc.
  }

  /**
   * Called when system is detached from entity manager
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  onDetach(entityManager) {
    this.renderQueue.clear();
  }
}
