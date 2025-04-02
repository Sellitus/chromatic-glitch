import RenderSystem from '../../../src/js/ecs/systems/RenderSystem.js';
import TransformComponent from '../../../src/js/ecs/components/TransformComponent.js';
import RendererComponent from '../../../src/js/ecs/components/RendererComponent.js';

// Mock performance.now for consistent testing
const mockNow = jest.spyOn(performance, 'now');
mockNow.mockImplementation(() => 0);

class MockEntity {
  constructor(isActive = true) {
    this.isActive = isActive;
    this.components = new Map();
  }

  getComponent(type) {
    return this.components.get(type);
  }

  hasComponent(type) {
    return this.components.has(type);
  }

  addComponent(component) {
    this.components.set(component.constructor, component);
    component.entity = this;
  }
}

class MockEntityManager {
  constructor(entities = []) {
    this.entities = entities;
  }

  getEntitiesWithComponents(...componentTypes) {
    return this.entities.filter(entity => 
      componentTypes.every(type => entity.hasComponent(type))
    );
  }
}

describe('RenderSystem', () => {
  let system;
  let entityManager;
  let entity;
  let transform;
  let renderer;

  beforeEach(() => {
    system = new RenderSystem();
    entity = new MockEntity();
    
    transform = new TransformComponent(10, 20, Math.PI/4, 2, 2);
    renderer = new RendererComponent({
      visible: true,
      alpha: 0.8,
      tint: 0xFF0000,
      layer: 1
    });

    entity.addComponent(transform);
    entity.addComponent(renderer);
    entityManager = new MockEntityManager([entity]);
  });

  describe('required components', () => {
    test('requires TransformComponent and RendererComponent', () => {
      const required = RenderSystem.getRequiredComponents();
      expect(required).toContain(TransformComponent);
      expect(required).toContain(RendererComponent);
    });
  });

  describe('render queue', () => {
    test('prepares render queue with visible entities', () => {
      system.prepareRenderQueue(entityManager);
      expect(system.renderQueue.get(1)).toContain(entity);
    });

    test('skips inactive entities', () => {
      entity.isActive = false;
      system.prepareRenderQueue(entityManager);
      expect(system.renderQueue.get(1)).toBeUndefined();
    });

    test('skips invisible entities', () => {
      renderer.visible = false;
      system.prepareRenderQueue(entityManager);
      expect(system.renderQueue.get(1)).toBeUndefined();
    });

    test('organizes entities by layer', () => {
      const entity2 = new MockEntity();
      const transform2 = new TransformComponent();
      const renderer2 = new RendererComponent({ layer: 2 });
      entity2.addComponent(transform2);
      entity2.addComponent(renderer2);
      entityManager = new MockEntityManager([entity, entity2]);

      system.prepareRenderQueue(entityManager);
      expect(system.renderQueue.get(1)).toContain(entity);
      expect(system.renderQueue.get(2)).toContain(entity2);
    });

    test('clears previous render queue', () => {
      system.prepareRenderQueue(entityManager);
      renderer.visible = false;
      system.prepareRenderQueue(entityManager);
      expect(system.renderQueue.get(1)).toBeUndefined();
    });
  });

  describe('entity rendering', () => {
    test('uses custom render function if provided', () => {
      const customRender = jest.fn();
      renderer.customRender = customRender;

      system.renderEntity(0.5, entity);
      expect(customRender).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 10,
          y: 20,
          rotation: Math.PI/4,
          scaleX: 2,
          scaleY: 2
        }),
        renderer
      );
    });

    test('skips rendering if system is inactive', () => {
      const customRender = jest.fn();
      renderer.customRender = customRender;
      system.isActive = false;

      system.render(0.5, entityManager);
      expect(customRender).not.toHaveBeenCalled();
    });

    test('renders entities in layer order', () => {
      const entity2 = new MockEntity();
      const transform2 = new TransformComponent();
      const renderer2 = new RendererComponent({ layer: 0 });
      entity2.addComponent(transform2);
      entity2.addComponent(renderer2);
      
      const renderedEntities = [];
      const mockRenderEntity = jest.spyOn(system, 'renderEntity')
        .mockImplementation((_, entity) => renderedEntities.push(entity));

      entityManager = new MockEntityManager([entity, entity2]);
      system.render(0.5, entityManager);

      expect(renderedEntities[0]).toBe(entity2); // Layer 0 first
      expect(renderedEntities[1]).toBe(entity); // Layer 1 second
      
      mockRenderEntity.mockRestore();
    });
  });

  describe('lifecycle', () => {
    test('clears render queue on detach', () => {
      system.prepareRenderQueue(entityManager);
      expect(system.renderQueue.size).toBeGreaterThan(0);

      system.onDetach(entityManager);
      expect(system.renderQueue.size).toBe(0);
    });
  });

  describe('edge cases', () => {
    test('handles empty entity list', () => {
      entityManager = new MockEntityManager([]);
      expect(() => system.render(0.5, entityManager)).not.toThrow();
    });

    test('handles entities without required components', () => {
      const incompleteEntity = new MockEntity();
      incompleteEntity.addComponent(new TransformComponent());
      entityManager = new MockEntityManager([incompleteEntity]);
      
      expect(() => system.render(0.5, entityManager)).not.toThrow();
    });

    test('handles multiple entities in same layer', () => {
      const entity2 = new MockEntity();
      entity2.addComponent(new TransformComponent());
      entity2.addComponent(new RendererComponent({ layer: 1 }));
      entityManager = new MockEntityManager([entity, entity2]);

      system.prepareRenderQueue(entityManager);
      const layerEntities = system.renderQueue.get(1);
      expect(layerEntities).toHaveLength(2);
      expect(layerEntities).toContain(entity);
      expect(layerEntities).toContain(entity2);
    });
  });
});