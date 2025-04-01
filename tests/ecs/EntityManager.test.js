import EntityManager from "../../src/js/ecs/EntityManager.js";
import Component from "../../src/js/ecs/Component.js";
import System from "../../src/js/ecs/System.js";

describe('EntityManager', () => {
  let manager;

  beforeEach(() => {
    manager = new EntityManager();
  });

  test('entity creation and retrieval', () => {
    const entity = manager.createEntity();
    expect(entity.id).toBeDefined();
    expect(manager.getEntity(entity.id)).toBe(entity);

    const entity2 = manager.createEntity();
    expect(entity2.id).not.toBe(entity.id);
  });

  test('entity destruction', () => {
    const entity = manager.createEntity();
    const id = entity.id;

    expect(manager.getEntity(id)).toBe(entity);
    expect(manager.destroyEntity(entity)).toBe(true);
    expect(manager.getEntity(id)).toBe(null);

    // Try destroying non-existent entity
    expect(manager.destroyEntity('non_existent')).toBe(false);
  });

  test('entity querying with components', () => {
    class Component1 extends Component {}
    class Component2 extends Component {}
    class Component3 extends Component {}

    const entity1 = manager.createEntity();
    const entity2 = manager.createEntity();
    const entity3 = manager.createEntity();

    entity1.addComponent(new Component1());
    entity1.addComponent(new Component2());

    entity2.addComponent(new Component1());
    entity2.addComponent(new Component3());

    entity3.addComponent(new Component2());
    entity3.addComponent(new Component3());

    const withComp1 = manager.getEntitiesWithComponents(Component1);
    expect(withComp1.length).toBe(2);
    expect(withComp1).toContain(entity1);
    expect(withComp1).toContain(entity2);

    const withComp1And2 = manager.getEntitiesWithComponents(Component1, Component2);
    expect(withComp1And2.length).toBe(1);
    expect(withComp1And2[0]).toBe(entity1);
  });

  test('system management', () => {
    class TestComponent extends Component {}

    class TestSystem extends System {
      static getRequiredComponents() {
        return [TestComponent];
      }

      processEntity(deltaTime, entity) {
        this.processedEntities = this.processedEntities || [];
        this.processedEntities.push(entity);
      }
    }

    const system = new TestSystem();
    manager.addSystem(system);

    // Create some entities
    const entity1 = manager.createEntity();
    entity1.addComponent(new TestComponent());

    const entity2 = manager.createEntity();
    entity2.addComponent(new TestComponent());

    const entity3 = manager.createEntity(); // No component

    // Update logic systems
    manager.updateLogic(16.67); // Simulate 60fps

    expect(system.processedEntities.length).toBe(2);
    expect(system.processedEntities).toContain(entity1);
    expect(system.processedEntities).toContain(entity2);
    expect(system.processedEntities).not.toContain(entity3);
  });

  test('render system update', () => {
    class TestRenderSystem extends System {
      constructor() {
        super();
        this.renderedEntities = [];
      }

      render(interpolationFactor, entityManager) {
        this.renderedEntities = [];
        const entities = entityManager.getEntitiesWithComponents(TestComponent);
        entities.forEach(entity => this.renderedEntities.push(entity));
      }
    }

    class TestComponent extends Component {}

    const renderSystem = new TestRenderSystem();
    manager.addSystem(renderSystem, true); // true for render system

    const entity = manager.createEntity();
    entity.addComponent(new TestComponent());

    manager.updateRendering(0.5); // 50% interpolation

    expect(renderSystem.renderedEntities.length).toBe(1);
    expect(renderSystem.renderedEntities[0]).toBe(entity);
  });

  test('serialization and deserialization', () => {
    class TestComponent extends Component {
      constructor(value = 0) {
        super();
        this.value = value;
      }

      serialize() {
        return {
          ...super.serialize(),
          value: this.value
        };
      }

      deserialize(data) {
        this.value = data.value;
      }
    }

    // Create and set up an entity
    const entity = manager.createEntity();
    entity.addComponent(new TestComponent(42));

    // Serialize
    const serialized = manager.serialize();

    // Create new manager and deserialize
    const newManager = new EntityManager();
    const componentTypes = new Map([['TestComponent', TestComponent]]);
    newManager.deserialize(serialized, componentTypes);

    // Verify deserialized state
    const entities = newManager.getEntitiesWithComponents(TestComponent);
    expect(entities.length).toBe(1);
    
    const component = entities[0].getComponent(TestComponent);
    expect(component.value).toBe(42);
  });

  test('system lifecycle hooks', () => {
    class TestSystem extends System {
      constructor() {
        super();
        this.attached = false;
        this.detached = false;
      }

      onAttach(entityManager) {
        this.attached = true;
        this.manager = entityManager;
      }

      onDetach(entityManager) {
        this.detached = true;
        this.manager = null;
      }
    }

    const system = new TestSystem();
    
    manager.addSystem(system);
    expect(system.attached).toBe(true);
    expect(system.manager).toBe(manager);

    manager.removeSystem(system);
    expect(system.detached).toBe(true);
    expect(system.manager).toBe(null);
  });

  test('cleanup on destroy', () => {
    class TestComponent extends Component {
      constructor() {
        super();
        this.cleanedUp = false;
      }

      onDetach() {
        super.onDetach();
        this.cleanedUp = true;
      }
    }

    class TestSystem extends System {
      constructor() {
        super();
        this.cleanedUp = false;
      }

      onDetach() {
        this.cleanedUp = true;
      }
    }

    const system = new TestSystem();
    manager.addSystem(system);

    const entity = manager.createEntity();
    const component = new TestComponent();
    entity.addComponent(component);

    manager.destroy();

    expect(component.cleanedUp).toBe(true);
    expect(system.cleanedUp).toBe(true);
    expect(manager.entities.size).toBe(0);
    expect(manager.systems.size).toBe(0);
  });
});
