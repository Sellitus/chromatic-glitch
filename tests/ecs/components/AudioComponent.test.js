import AudioComponent from '../../../src/js/ecs/components/AudioComponent.js';

describe('AudioComponent', () => {
  let audio;

  beforeEach(() => {
    audio = new AudioComponent();
  });

  describe('constructor', () => {
    test('creates with default values', () => {
      expect(audio.sounds.size).toBe(0);
      expect(audio.currentlyPlaying.size).toBe(0);
      expect(audio.volume).toBe(1);
      expect(audio.muted).toBe(false);
    });
  });

  describe('sound registration', () => {
    test('registers sound with default options', () => {
      audio.registerSound('test', 'test.mp3');
      const sound = audio.sounds.get('test');
      
      expect(sound).toBeDefined();
      expect(sound.assetId).toBe('test.mp3');
      expect(sound.loop).toBe(false);
      expect(sound.volume).toBe(1);
      expect(sound.pitch).toBe(1);
      expect(sound.spatialize).toBe(false);
      expect(sound.minDistance).toBeUndefined();
      expect(sound.maxDistance).toBeUndefined();
    });

    test('registers sound with custom options', () => {
      const options = {
        loop: true,
        volume: 0.5,
        pitch: 1.5,
        minDistance: 10,
        maxDistance: 100,
        spatialize: true
      };

      audio.registerSound('test', 'test.mp3', options);
      const sound = audio.sounds.get('test');
      
      expect(sound).toBeDefined();
      expect(sound.assetId).toBe('test.mp3');
      expect(sound.loop).toBe(true);
      expect(sound.volume).toBe(0.5);
      expect(sound.pitch).toBe(1.5);
      expect(sound.minDistance).toBe(10);
      expect(sound.maxDistance).toBe(100);
      expect(sound.spatialize).toBe(true);
    });
  });

  describe('sound playback', () => {
    beforeEach(() => {
      audio.registerSound('test', 'test.mp3', { volume: 0.5 });
    });

    test('plays registered sound', () => {
      const result = audio.playSound('test');
      expect(result).toBe(true);
      expect(audio.isPlaying('test')).toBe(true);
    });

    test('plays sound with override options', () => {
      const result = audio.playSound('test', { volume: 0.8 });
      expect(result).toBe(true);
      expect(audio.isPlaying('test')).toBe(true);
    });

    test('fails to play unregistered sound', () => {
      const result = audio.playSound('nonexistent');
      expect(result).toBe(false);
      expect(audio.isPlaying('nonexistent')).toBe(false);
    });

    test('does not play sound when muted', () => {
      audio.setMuted(true);
      const result = audio.playSound('test');
      expect(result).toBe(false);
      expect(audio.isPlaying('test')).toBe(false);
    });

    test('stops specific sound', () => {
      audio.playSound('test');
      audio.stopSound('test');
      expect(audio.isPlaying('test')).toBe(false);
    });

    test('stops all sounds', () => {
      audio.registerSound('test2', 'test2.mp3');
      audio.playSound('test');
      audio.playSound('test2');
      
      audio.stopAllSounds();
      expect(audio.isPlaying('test')).toBe(false);
      expect(audio.isPlaying('test2')).toBe(false);
      expect(audio.currentlyPlaying.size).toBe(0);
    });
  });

  describe('volume control', () => {
    test('sets volume within valid range', () => {
      audio.setVolume(0.5);
      expect(audio.volume).toBe(0.5);

      audio.setVolume(-1);
      expect(audio.volume).toBe(0);

      audio.setVolume(2);
      expect(audio.volume).toBe(1);
    });

    test('muting stops all playing sounds', () => {
      audio.registerSound('test', 'test.mp3');
      audio.playSound('test');
      
      audio.setMuted(true);
      expect(audio.muted).toBe(true);
      expect(audio.isPlaying('test')).toBe(false);
    });

    test('unmuting allows sounds to be played again', () => {
      audio.setMuted(true);
      audio.setMuted(false);
      
      audio.registerSound('test', 'test.mp3');
      const result = audio.playSound('test');
      expect(result).toBe(true);
      expect(audio.isPlaying('test')).toBe(true);
    });
  });

  describe('component lifecycle', () => {
    test('onDetach stops all sounds', () => {
      audio.registerSound('test', 'test.mp3');
      audio.playSound('test');
      
      audio.onDetach();
      expect(audio.currentlyPlaying.size).toBe(0);
    });
  });

  describe('serialization', () => {
    test('serializes empty state', () => {
      const serialized = audio.serialize();
      expect(serialized).toEqual({
        type: 'AudioComponent',
        sounds: {},
        volume: 1,
        muted: false
      });
    });

    test('serializes with registered sounds', () => {
      audio.registerSound('test1', 'test1.mp3', { volume: 0.5 });
      audio.registerSound('test2', 'test2.mp3', { loop: true });
      audio.setVolume(0.8);
      audio.setMuted(true);

      const serialized = audio.serialize();
      expect(serialized).toEqual({
        type: 'AudioComponent',
        sounds: {
          test1: {
            assetId: 'test1.mp3',
            volume: 0.5,
            loop: false,
            pitch: 1,
            spatialize: false
          },
          test2: {
            assetId: 'test2.mp3',
            volume: 1,
            loop: true,
            pitch: 1,
            spatialize: false
          }
        },
        volume: 0.8,
        muted: true
      });
    });

    test('deserializes empty state', () => {
      const data = { 
        sounds: {},
        volume: 0.5,
        muted: true
      };

      audio.deserialize(data);
      expect(audio.sounds.size).toBe(0);
      expect(audio.volume).toBe(0.5);
      expect(audio.muted).toBe(true);
    });

    test('deserializes with sounds', () => {
      const data = {
        sounds: {
          test: {
            assetId: 'test.mp3',
            volume: 0.5,
            loop: true,
            pitch: 1.5,
            spatialize: true
          }
        },
        volume: 0.8,
        muted: false
      };

      audio.deserialize(data);
      expect(audio.sounds.size).toBe(1);
      const sound = audio.sounds.get('test');
      expect(sound).toBeDefined();
      expect(sound.assetId).toBe('test.mp3');
      expect(sound.volume).toBe(0.5);
      expect(sound.loop).toBe(true);
      expect(sound.pitch).toBe(1.5);
      expect(sound.spatialize).toBe(true);
    });

    test('deserializes with missing properties using defaults', () => {
      const data = {};
      audio.deserialize(data);
      
      expect(audio.sounds.size).toBe(0);
      expect(audio.volume).toBe(1);
      expect(audio.muted).toBe(false);
    });
  });
});