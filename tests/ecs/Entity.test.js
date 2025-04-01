import Entity from "../../src/js/ecs/Entity.js";
import Component from "../../src/js/ecs/Component.js";

describe('Entity', () => {
  let entity;

  beforeEach(() => {
    entity = new Entity('test_entity');
  });

  test('entity initializes with correct ID', () => {
    expect(entity.id).toBe('test_entity');
    expect(entity.isActive).toBe(true);
    expect(entity.components.size).toBe(0);
  });

  test('can add and remove components', () => {
    class TestComponent extends Component {
      constructor() {
        super();
        this.value = 42;
      }
    }

    const component = new TestComponent();
    
    // Add component
    entity.addComponent(component);
    expect(entity.components.size).toBe(1);
    expect(entity.hasComponent(TestComponent)).toBe(true);
    expect(component.entity).toBe(entity);

    // Get component
    const retrieved = entity.getComponent(TestComponent);
    expect(retrieved).toBe(component);
    expect(retrieved.value).toBe(42);

    // Remove component
    const removed = entity.removeComponent(TestComponent);
    expect(removed).toBe(true);
    expect(entity.components.size).toBe(0);
    expect(entity.hasComponent(TestComponent)).toBe(false);
    expect(component.entity).toBe(null);
  });

  test('handles component dependencies', () => {
    class DependencyComponent extends Component {}
    
    class DependentComponent extends Component {
      static getDependencies() {
        return [DependencyComponent];
      }
    }

    const dependent = new DependentComponent();

    // Should throw when adding component with missing dependency
    expect(() => entity.addComponent(dependent)).toThrow();

    // Add dependency first
    const dependency = new DependencyComponent();
    entity.addComponent(dependency);

    // Now should succeed
    expect(() => entity.addComponent(dependent)).not.toThrow();
    expect(entity.hasComponent(DependentComponent)).toBe(true);
  });

  test('can check for multiple components', () => {
    class Component1 extends Component {}
    class Component2 extends Component {}
    class Component3 extends Component {}

    entity.addComponent(new Component1());
    entity.addComponent(new Component2());

    expect(entity.hasComponents(Component1, Component2)).toBe(true);
    expect(entity.hasComponents(Component1, Component3)).toBe(false);
  });

  test('serialization and deserialization', () => {
    class TestComponent extends Component {
      constructor() {
        super();
        this.value = 42;
        this.name = 'test';
      }

      serialize() {
        return {
          ...super.serialize(),
          value: this.value,
          name: this.name
        };
      }

      deserialize(data) {
        this.value = data.value;
        this.name = data.name;
      }
    }

    const component = new TestComponent();
    entity.addComponent(component);

    // Serialize
    const serialized = entity.serialize();
    expect(serialized.id).toBe(entity.id);
    expect(serialized.isActive).toBe(true);
    expect(serialized.components['TestComponent']).toBeDefined();
    expect(serialized.components['TestComponent'].value).toBe(42);

    // Create new entity from serialized data
    const newEntity = new Entity('new_entity');
    const newComponent = new TestComponent();
    newEntity.addComponent(newComponent);

    // Deserialize component
    newComponent.deserialize(serialized.components['TestComponent']);

    expect(newComponent.value).toBe(42);
    expect(newComponent.name).toBe('test');
  });

  test('entity lifecycle and cleanup', () => {
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

    const component1 = new TestComponent();
    const component2 = new TestComponent();

    entity.addComponent(component1);
    entity.addComponent(component2);

    expect(entity.components.size).toBe(2);

    // Destroy entity
    entity.destroy();

    expect(entity.components.size).toBe(0);
    expect(component1.cleanedUp).toBe(true);
    expect(component2.cleanedUp).toBe(true);
  });
});
