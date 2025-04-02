import Component from '../../src/js/ecs/Component.js';

// Mock entity for testing
class MockEntity {
  constructor() {
    this.id = 'mock-entity';
  }
}

// Test component class that extends base Component
class TestComponent extends Component {
  constructor() {
    super();
    this.testValue = 42;
  }

  onUpdate(deltaTime) {
    this.lastDeltaTime = deltaTime;
  }

  serialize() {
    return {
      ...super.serialize(),
      testValue: this.testValue
    };
  }

  deserialize(data) {
    this.testValue = data.testValue ?? 42;
  }

  static getDependencies() {
    return [MockDependency];
  }
}

// Mock dependency component
class MockDependency extends Component {}

describe('Component', () => {
  let component;
  let mockEntity;

  beforeEach(() => {
    component = new TestComponent();
    mockEntity = new MockEntity();
  });

  describe('constructor', () => {
    test('initializes with null entity', () => {
      expect(component.entity).toBeNull();
    });

    test('sets type from constructor name', () => {
      expect(component.type).toBe('TestComponent');
    });
  });

  describe('lifecycle', () => {
    test('attaches to entity', () => {
      component.onAttach(mockEntity);
      expect(component.entity).toBe(mockEntity);
    });

    test('detaches from entity', () => {
      component.onAttach(mockEntity);
      component.onDetach();
      expect(component.entity).toBeNull();
    });

    test('handles update callback', () => {
      component.onUpdate(16.67);
      expect(component.lastDeltaTime).toBe(16.67);
    });

    test('base update callback does nothing', () => {
      const baseComponent = new Component();
      expect(() => baseComponent.onUpdate(16.67)).not.toThrow();
    });
  });

  describe('serialization', () => {
    test('base component serializes type', () => {
      const baseComponent = new Component();
      expect(baseComponent.serialize()).toEqual({
        type: 'Component'
      });
    });

    test('derived component extends serialization', () => {
      expect(component.serialize()).toEqual({
        type: 'TestComponent',
        testValue: 42
      });
    });

    test('base deserialize is empty implementation', () => {
      const baseComponent = new Component();
      expect(() => baseComponent.deserialize({ someData: true })).not.toThrow();
    });

    test('derived component handles deserialization', () => {
      component.deserialize({ testValue: 100 });
      expect(component.testValue).toBe(100);
    });

    test('derived component handles missing deserialization data', () => {
      component.deserialize({});
      expect(component.testValue).toBe(42);
    });
  });

  describe('dependencies', () => {
    test('base component has no dependencies', () => {
      expect(Component.getDependencies()).toEqual([]);
    });

    test('derived component declares dependencies', () => {
      expect(TestComponent.getDependencies()).toEqual([MockDependency]);
    });
  });

  describe('edge cases', () => {
    test('handles detach without prior attach', () => {
      expect(() => component.onDetach()).not.toThrow();
    });

    test('handles multiple attaches', () => {
      const entity1 = new MockEntity();
      const entity2 = new MockEntity();

      component.onAttach(entity1);
      component.onAttach(entity2);
      expect(component.entity).toBe(entity2);
    });

    test('handles multiple detaches', () => {
      component.onAttach(mockEntity);
      component.onDetach();
      component.onDetach();
      expect(component.entity).toBeNull();
    });
  });
});