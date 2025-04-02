import TransformComponent from '../../../src/js/ecs/components/TransformComponent.js';

describe('TransformComponent', () => {
  let transform;

  beforeEach(() => {
    transform = new TransformComponent();
  });

  describe('constructor', () => {
    test('creates with default values', () => {
      expect(transform.x).toBe(0);
      expect(transform.y).toBe(0);
      expect(transform.rotation).toBe(0);
      expect(transform.scaleX).toBe(1);
      expect(transform.scaleY).toBe(1);
      expect(transform.previousX).toBe(0);
      expect(transform.previousY).toBe(0);
      expect(transform.previousRotation).toBe(0);
    });

    test('creates with custom values', () => {
      const customTransform = new TransformComponent(10, 20, Math.PI, 2, 3);
      expect(customTransform.x).toBe(10);
      expect(customTransform.y).toBe(20);
      expect(customTransform.rotation).toBe(Math.PI);
      expect(customTransform.scaleX).toBe(2);
      expect(customTransform.scaleY).toBe(3);
      expect(customTransform.previousX).toBe(10);
      expect(customTransform.previousY).toBe(20);
      expect(customTransform.previousRotation).toBe(Math.PI);
    });
  });

  describe('state management', () => {
    test('stores previous state', () => {
      transform.setPosition(10, 20);
      transform.storePreviousState();
      
      expect(transform.previousX).toBe(10);
      expect(transform.previousY).toBe(20);
      expect(transform.previousRotation).toBe(0);
    });

    test('interpolates between states', () => {
      transform.setPosition(10, 20);
      
      const halfwayState = transform.getInterpolatedState(0.5);
      expect(halfwayState.x).toBe(5); // Halfway between 0 and 10
      expect(halfwayState.y).toBe(10); // Halfway between 0 and 20
      expect(halfwayState.rotation).toBe(0);
      expect(halfwayState.scaleX).toBe(1);
      expect(halfwayState.scaleY).toBe(1);

      const fullState = transform.getInterpolatedState(1);
      expect(fullState.x).toBe(10);
      expect(fullState.y).toBe(20);
      
      const noInterpolation = transform.getInterpolatedState(0);
      expect(noInterpolation.x).toBe(0);
      expect(noInterpolation.y).toBe(0);
    });

    test('interpolates rotation', () => {
      transform.setRotation(Math.PI);
      
      const halfwayState = transform.getInterpolatedState(0.5);
      expect(halfwayState.rotation).toBe(Math.PI / 2); // Halfway between 0 and PI
    });
  });

  describe('setters', () => {
    test('setPosition updates coordinates and stores previous', () => {
      transform.setPosition(10, 20);
      
      expect(transform.x).toBe(10);
      expect(transform.y).toBe(20);
      expect(transform.previousX).toBe(0);
      expect(transform.previousY).toBe(0);
    });

    test('setRotation updates angle and stores previous', () => {
      transform.setRotation(Math.PI);
      
      expect(transform.rotation).toBe(Math.PI);
      expect(transform.previousRotation).toBe(0);
    });

    test('setScale updates scale factors', () => {
      transform.setScale(2, 3);
      
      expect(transform.scaleX).toBe(2);
      expect(transform.scaleY).toBe(3);
    });
  });

  describe('serialization', () => {
    test('serializes all properties', () => {
      transform.setPosition(10, 20);
      transform.setRotation(Math.PI);
      transform.setScale(2, 3);

      const serialized = transform.serialize();
      expect(serialized).toEqual({
        type: 'TransformComponent',
        x: 10,
        y: 20,
        rotation: Math.PI,
        scaleX: 2,
        scaleY: 3
      });
    });

    test('deserializes all properties', () => {
      const data = {
        x: 10,
        y: 20,
        rotation: Math.PI,
        scaleX: 2,
        scaleY: 3
      };

      transform.deserialize(data);
      
      expect(transform.x).toBe(10);
      expect(transform.y).toBe(20);
      expect(transform.rotation).toBe(Math.PI);
      expect(transform.scaleX).toBe(2);
      expect(transform.scaleY).toBe(3);
      expect(transform.previousX).toBe(10);
      expect(transform.previousY).toBe(20);
      expect(transform.previousRotation).toBe(Math.PI);
    });

    test('deserializes with missing properties using defaults', () => {
      const data = {};
      transform.deserialize(data);
      
      expect(transform.x).toBe(0);
      expect(transform.y).toBe(0);
      expect(transform.rotation).toBe(0);
      expect(transform.scaleX).toBe(1);
      expect(transform.scaleY).toBe(1);
      expect(transform.previousX).toBe(0);
      expect(transform.previousY).toBe(0);
      expect(transform.previousRotation).toBe(0);
    });
  });
});