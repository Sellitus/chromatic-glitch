import System from '../../src/js/ecs/System.js';
import Component from '../../src/js/ecs/Component.js';

// Mock components for testing
class MockComponentA extends Component {}
class MockComponentB extends Component {}

// Test system class that requires components
class TestSystem extends System {
  static getRequiredComponents() {
    return [MockComponentA, MockComponentB];
  }

  processEntity(deltaTime, entity) {
    this.lastProcessedDeltaTime = deltaTime;
    this.lastProcessedEntity = entity;
  }

  processEntityRender(interpolationFactor, entity) {
    this.lastRenderFactor = interpolationFactor;
    this.lastRenderedEntity = entity;
  }
}

// Mock entity for testing
class MockEntity {
  constructor(isActive = true) {
    this.isActive = isActive;
    this.components = new Map();
  }

  hasComponent(type) {
    return this.components.has(type);
  }

  addComponent(component) {
    this.components.set(component.constructor, component);
  }
}

// Mock entity manager for testing
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

describe('System', () => {
  let system;
  let entityManager;
  let entity;

  beforeEach(() => {
    system = new TestSystem();
    entity = new MockEntity();
    entity.addComponent(new MockComponentA());
    entity.addComponent(new MockComponentB());
    entityManager = new MockEntityManager([entity]);
  });

  describe('constructor', () => {
    test('initializes with default state', () => {
      expect(system.isActive).toBe(true);
      expect(system.requiredComponents).toEqual([MockComponentA, MockComponentB]);
    });

    test('base system has no required components', () => {
      const baseSystem = new System();
      expect(baseSystem.requiredComponents).toEqual([]);
    });
  });

  describe('update cycle', () => {
    test('processes active entities with required components', () => {
      system.update(16.67, entityManager);
      
      expect(system.lastProcessedDeltaTime).toBe(16.67);
      expect(system.lastProcessedEntity).toBe(entity);
    });

    test('skips inactive entities', () => {
      entity.isActive = false;
      system.update(16.67, entityManager);
      
      expect(system.lastProcessedEntity).toBeUndefined();
    });

    test('skips processing when system is inactive', () => {
      system.isActive = false;
      system.update(16.67, entityManager);
      
      expect(system.lastProcessedEntity).toBeUndefined();
    });

    test('processes only entities with all required components', () => {
      const incompleteEntity = new MockEntity();
      incompleteEntity.addComponent(new MockComponentA());
      entityManager = new MockEntityManager([incompleteEntity, entity]);
      
      system.update(16.67, entityManager);
      expect(system.lastProcessedEntity).toBe(entity);
    });
  });

  describe('render cycle', () => {
    test('renders active entities with required components', () => {
      system.render(0.5, entityManager);
      
      expect(system.lastRenderFactor).toBe(0.5);
      expect(system.lastRenderedEntity).toBe(entity);
    });

    test('skips rendering inactive entities', () => {
      entity.isActive = false;
      system.render(0.5, entityManager);
      
      expect(system.lastRenderedEntity).toBeUndefined();
    });

    test('skips rendering when system is inactive', () => {
      system.isActive = false;
      system.render(0.5, entityManager);
      
      expect(system.lastRenderedEntity).toBeUndefined();
    });

    test('base system render methods are empty implementations', () => {
      const baseSystem = new System();
      expect(() => {
        baseSystem.render(0.5, entityManager);
        baseSystem.processEntityRender(0.5, entity);
      }).not.toThrow();
    });
  });

  describe('entity processing', () => {
    test('shouldProcessEntity checks entity compatibility', () => {
      expect(system.shouldProcessEntity(entity)).toBe(true);
      
      const incompatibleEntity = new MockEntity();
      expect(system.shouldProcessEntity(incompatibleEntity)).toBe(false);
    });

    test('shouldProcessEntity returns false for inactive entities', () => {
      entity.isActive = false;
      expect(system.shouldProcessEntity(entity)).toBe(false);
    });

    test('base processEntity is empty implementation', () => {
      const baseSystem = new System();
      expect(() => baseSystem.processEntity(16.67, entity)).not.toThrow();
    });
  });

  describe('lifecycle hooks', () => {
    test('onAttach and onDetach are optional implementations', () => {
      expect(() => {
        system.onAttach(entityManager);
        system.onDetach(entityManager);
      }).not.toThrow();
    });
  });
});