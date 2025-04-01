import Scene from "../../src/js/engine/scene.js";
import Component from "../../src/js/ecs/Component.js";
import System from "../../src/js/ecs/System.js";
import TransformComponent from "../../src/js/ecs/components/TransformComponent.js";

describe('Scene ECS Integration', () => {
  let scene;

  beforeEach(() => {
    scene = new Scene('test_scene');
    scene.init();
  });

  test('scene initializes with core systems', () => {
    expect(scene.systems.timer).toBeDefined();
    expect(scene.systems.render).toBeDefined();
    expect(scene.systems.audio).toBeDefined();
  });

  test('can create and manage entities', () => {
    const entity = scene.createEntity();
    expect(entity).toBeDefined();
    expect(entity.id).toBeDefined();

    const transform = new TransformComponent(100, 200);
    entity.addComponent(transform);

    const retrieved = scene.getEntity(entity.id);
    expect(retrieved).toBe(entity);
    expect(retrieved.getComponent(TransformComponent)).toBe(transform);
  });

  test('entity queries work through scene', () => {
    class TestComponent extends Component {}

    const entity1 = scene.createEntity();
    entity1.addComponent(new TestComponent());
    entity1.addComponent(new TransformComponent());

    const entity2 = scene.createEntity();
    entity2.addComponent(new TestComponent());

    const entity3 = scene.createEntity();
    entity3.addComponent(new TransformComponent());

    const withBoth = scene.getEntitiesWithComponents(TestComponent, TransformComponent);
    expect(withBoth.length).toBe(1);
    expect(withBoth[0]).toBe(entity1);

    const withTest = scene.getEntitiesWithComponents(TestComponent);
    expect(withTest.length).toBe(2);
    expect(withTest).toContain(entity1);
    expect(withTest).toContain(entity2);
  });

  test('can add custom systems', () => {
    class TestSystem extends System {
      constructor() {
        super();
        this.updates = 0;
      }

      processEntity(deltaTime, entity) {
        this.updates++;
      }
    }

    const testSystem = new TestSystem();
    scene.addSystem(testSystem);

    // Create an entity that will be processed
    const entity = scene.createEntity();

    // Update scene
    scene.update(16.67); // Simulate 60fps

    expect(testSystem.updates).toBe(1);
  });

  test('pause/resume affects updates', () => {
    let updateCount = 0;
    class TestSystem extends System {
      processEntity(deltaTime, entity) {
        updateCount++;
      }
    }

    scene.addSystem(new TestSystem());
    const entity = scene.createEntity();

    // Normal update
    scene.update(16.67);
    expect(updateCount).toBe(1);

    // Pause and update
    scene.pause();
    scene.update(16.67);
    expect(updateCount).toBe(1); // Should not have increased

    // Resume and update
    scene.resume();
    scene.update(16.67);
    expect(updateCount).toBe(2);
  });

  test('cleanup on destroy', () => {
    // Create some test entities and systems
    const entity1 = scene.createEntity();
    const entity2 = scene.createEntity();

    class TestSystem extends System {
      constructor() {
        super();
        this.destroyed = false;
      }

      onDetach() {
        this.destroyed = true;
      }
    }

    const testSystem = new TestSystem();
    scene.addSystem(testSystem);

    // Destroy scene
    scene.destroy();

    // Verify everything is cleaned up
    expect(scene.entityManager.entities.size).toBe(0);
    expect(testSystem.destroyed).toBe(true);
  });

  test('serialization and deserialization', () => {
    class TestComponent extends Component {
      constructor(value) {
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

    // Create an entity with components
    const entity = scene.createEntity();
    entity.addComponent(new TestComponent(42));
    entity.addComponent(new TransformComponent(100, 200));

    // Serialize
    const data = scene.serialize();

    // Create new scene
    const newScene = new Scene('new_scene');
    newScene.init();

    // Register component types
    const componentTypes = new Map([
      ['TestComponent', TestComponent],
      ['TransformComponent', TransformComponent]
    ]);

    // Deserialize
    newScene.deserialize(data, componentTypes);

    // Verify
    const entities = newScene.getEntitiesWithComponents(TestComponent, TransformComponent);
    expect(entities.length).toBe(1);

    const newEntity = entities[0];
    expect(newEntity.getComponent(TestComponent).value).toBe(42);
    expect(newEntity.getComponent(TransformComponent).x).toBe(100);
    expect(newEntity.getComponent(TransformComponent).y).toBe(200);
  });
});
