import RendererComponent from '../../../src/js/ecs/components/RendererComponent.js';
import TransformComponent from '../../../src/js/ecs/components/TransformComponent.js';

describe('RendererComponent', () => {
  let renderer;

  beforeEach(() => {
    renderer = new RendererComponent();
  });

  describe('constructor', () => {
    test('creates with default values', () => {
      expect(renderer.visible).toBe(true);
      expect(renderer.alpha).toBe(1);
      expect(renderer.tint).toBe(0xFFFFFF);
      expect(renderer.blendMode).toBe('normal');
      expect(renderer.assetId).toBeNull();
      expect(renderer.customRender).toBeNull();
      expect(renderer.width).toBe(0);
      expect(renderer.height).toBe(0);
      expect(renderer.anchorX).toBe(0.5);
      expect(renderer.anchorY).toBe(0.5);
      expect(renderer.layer).toBe(0);
    });

    test('creates with custom options', () => {
      const options = {
        visible: false,
        alpha: 0.5,
        tint: 0xFF0000,
        blendMode: 'add',
        assetId: 'sprite1',
        customRender: () => {},
        width: 100,
        height: 200,
        anchorX: 0,
        anchorY: 1,
        layer: 2
      };

      const customRenderer = new RendererComponent(options);
      expect(customRenderer.visible).toBe(false);
      expect(customRenderer.alpha).toBe(0.5);
      expect(customRenderer.tint).toBe(0xFF0000);
      expect(customRenderer.blendMode).toBe('add');
      expect(customRenderer.assetId).toBe('sprite1');
      expect(typeof customRenderer.customRender).toBe('function');
      expect(customRenderer.width).toBe(100);
      expect(customRenderer.height).toBe(200);
      expect(customRenderer.anchorX).toBe(0);
      expect(customRenderer.anchorY).toBe(1);
      expect(customRenderer.layer).toBe(2);
    });
  });

  describe('dependencies', () => {
    test('requires TransformComponent', () => {
      expect(RendererComponent.getDependencies()).toContain(TransformComponent);
    });
  });

  describe('serialization', () => {
    test('serializes all properties', () => {
      renderer.setVisible(false);
      renderer.setAlpha(0.5);
      renderer.setTint(0xFF0000);
      renderer.setDimensions(100, 200);
      renderer.setAnchor(0, 1);
      renderer.setLayer(2);

      const serialized = renderer.serialize();
      expect(serialized).toEqual({
        type: 'RendererComponent',
        visible: false,
        alpha: 0.5,
        tint: 0xFF0000,
        blendMode: 'normal',
        assetId: null,
        width: 100,
        height: 200,
        anchorX: 0,
        anchorY: 1,
        layer: 2
      });
    });

    test('deserializes all properties', () => {
      const data = {
        visible: false,
        alpha: 0.5,
        tint: 0xFF0000,
        blendMode: 'add',
        assetId: 'sprite1',
        width: 100,
        height: 200,
        anchorX: 0,
        anchorY: 1,
        layer: 2
      };

      renderer.deserialize(data);
      expect(renderer.visible).toBe(false);
      expect(renderer.alpha).toBe(0.5);
      expect(renderer.tint).toBe(0xFF0000);
      expect(renderer.blendMode).toBe('add');
      expect(renderer.assetId).toBe('sprite1');
      expect(renderer.width).toBe(100);
      expect(renderer.height).toBe(200);
      expect(renderer.anchorX).toBe(0);
      expect(renderer.anchorY).toBe(1);
      expect(renderer.layer).toBe(2);
    });

    test('deserializes with missing properties using defaults', () => {
      const data = {};
      renderer.deserialize(data);
      
      expect(renderer.visible).toBe(true);
      expect(renderer.alpha).toBe(1);
      expect(renderer.tint).toBe(0xFFFFFF);
      expect(renderer.blendMode).toBe('normal');
      expect(renderer.assetId).toBeNull();
      expect(renderer.width).toBe(0);
      expect(renderer.height).toBe(0);
      expect(renderer.anchorX).toBe(0.5);
      expect(renderer.anchorY).toBe(0.5);
      expect(renderer.layer).toBe(0);
    });
  });

  describe('setters', () => {
    test('setVisible updates visibility', () => {
      renderer.setVisible(false);
      expect(renderer.visible).toBe(false);
    });

    test('setAlpha clamps values between 0 and 1', () => {
      renderer.setAlpha(-0.5);
      expect(renderer.alpha).toBe(0);

      renderer.setAlpha(1.5);
      expect(renderer.alpha).toBe(1);

      renderer.setAlpha(0.5);
      expect(renderer.alpha).toBe(0.5);
    });

    test('setTint updates color', () => {
      renderer.setTint(0xFF0000);
      expect(renderer.tint).toBe(0xFF0000);
    });

    test('setDimensions updates width and height', () => {
      renderer.setDimensions(100, 200);
      expect(renderer.width).toBe(100);
      expect(renderer.height).toBe(200);
    });

    test('setAnchor updates anchor points', () => {
      renderer.setAnchor(0.25, 0.75);
      expect(renderer.anchorX).toBe(0.25);
      expect(renderer.anchorY).toBe(0.75);
    });

    test('setLayer updates render layer', () => {
      renderer.setLayer(5);
      expect(renderer.layer).toBe(5);
    });
  });
});