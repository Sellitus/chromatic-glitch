import AudioSystem from '../../../src/js/ecs/systems/AudioSystem.js';
import AudioComponent from '../../../src/js/ecs/components/AudioComponent.js';
import TransformComponent from '../../../src/js/ecs/components/TransformComponent.js';

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

describe('AudioSystem', () => {
  let system;
  let entityManager;
  let entity;
  let audio;
  let transform;

  beforeEach(() => {
    system = new AudioSystem();
    entity = new MockEntity();
    
    audio = new AudioComponent();
    audio.registerSound('test', 'test.mp3', {
      spatialize: true,
      minDistance: 50,
      maxDistance: 500
    });
    audio.playSound('test');

    transform = new TransformComponent(100, 200);
    
    entity.addComponent(audio);
    entity.addComponent(transform);
    
    entityManager = new MockEntityManager([entity]);
  });

  describe('required components', () => {
    test('requires AudioComponent', () => {
      const required = AudioSystem.getRequiredComponents();
      expect(required).toEqual([AudioComponent]);
    });
  });

  describe('listener position', () => {
    test('sets and retrieves listener position', () => {
      system.setListenerPosition(10, 20);
      expect(system.listenerPosition).toEqual({ x: 10, y: 20 });
    });

    test('defaults to origin', () => {
      expect(system.listenerPosition).toEqual({ x: 0, y: 0 });
    });
  });

  describe('spatial audio', () => {
    test('calculates full volume within min distance', () => {
      system.setListenerPosition(90, 190); // Distance = ~14.14, within minDistance of 50
      const volume = system.calculateSpatialVolume(
        { x: 100, y: 200 },
        50,
        500
      );
      expect(volume).toBe(1);
    });

    test('calculates zero volume beyond max distance', () => {
      system.setListenerPosition(0, 0); // Distance = ~223.6, beyond maxDistance of 200
      const volume = system.calculateSpatialVolume(
        { x: 100, y: 200 },
        50,
        200
      );
      expect(volume).toBe(0);
    });

    test('calculates interpolated volume between min and max distance', () => {
      system.setListenerPosition(0, 0); // Distance = ~223.6
      const volume = system.calculateSpatialVolume(
        { x: 100, y: 200 },
        100, // min distance
        300  // max distance
      );
      // Expected: 1 - (223.6 - 100) / (300 - 100) ≈ 0.38
      expect(volume).toBeCloseTo(0.38, 2);
    });
  });

  describe('entity processing', () => {
    test('updates spatial audio for entities with transform', () => {
      system.setListenerPosition(0, 0);
      system.processEntity(16.67, entity);
      
      const sound = audio.sounds.get('test');
      expect(sound.currentVolume).toBeDefined();
      expect(sound.currentVolume).toBeLessThan(1);
    });

    test('skips spatial processing for non-spatialized sounds', () => {
      audio.registerSound('nonspatial', 'test2.mp3', { spatialize: false });
      audio.playSound('nonspatial');
      
      system.processEntity(16.67, entity);
      
      const sound = audio.sounds.get('nonspatial');
      expect(sound.currentVolume).toBeUndefined();
    });

    test('uses default distances when not specified', () => {
      audio.registerSound('defaultTest', 'test.mp3', { spatialize: true });
      audio.playSound('defaultTest');
      
      system.setListenerPosition(150, 150); // ~70 units away from entity at (100, 200)
      system.processEntity(16.67, entity);
      
      const sound = audio.sounds.get('defaultTest');
      expect(sound.currentVolume).toBeDefined();
      // Should use defaults: minDistance = 100, maxDistance = 1000
      // At 70 units, should be full volume (within minDistance)
      expect(sound.currentVolume).toBe(audio.volume);
    });

    test('handles entities without transform', () => {
      const noTransformEntity = new MockEntity();
      noTransformEntity.addComponent(new AudioComponent());
      
      expect(() => {
        system.processEntity(16.67, noTransformEntity);
      }).not.toThrow();
    });

    test('handles non-playing sounds', () => {
      audio.stopSound('test');
      system.processEntity(16.67, entity);
      
      const sound = audio.sounds.get('test');
      expect(sound.currentVolume).toBeUndefined();
    });
  });

  describe('lifecycle', () => {
    test('stops all sounds on detach', () => {
      const stopAllSounds = jest.spyOn(audio, 'stopAllSounds');
      system.onDetach(entityManager);
      expect(stopAllSounds).toHaveBeenCalled();
    });

    test('handles detach with no audio entities', () => {
      entityManager = new MockEntityManager([]);
      expect(() => system.onDetach(entityManager)).not.toThrow();
    });
  });

  describe('global controls', () => {
    test('pauses system', () => {
      system.pause();
      expect(system.isActive).toBe(false);
    });

    test('resumes system', () => {
      system.pause();
      system.resume();
      expect(system.isActive).toBe(true);
    });

    test('sets master volume', () => {
      expect(() => system.setMasterVolume(0.5)).not.toThrow();
    });

    test('sets master mute', () => {
      expect(() => system.setMasterMute(true)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    test('handles invalid spatial distance configuration', () => {
      const volume = system.calculateSpatialVolume(
        { x: 0, y: 0 },
        100,
        50
      );
      expect(volume).toBe(1); // Any distance <= minDistance returns 1
    });

    test('processes entity with empty audio component', () => {
      const emptyEntity = new MockEntity();
      emptyEntity.addComponent(new AudioComponent());
      emptyEntity.addComponent(new TransformComponent());
      
      expect(() => {
        system.processEntity(16.67, emptyEntity);
      }).not.toThrow();
    });
  });
});