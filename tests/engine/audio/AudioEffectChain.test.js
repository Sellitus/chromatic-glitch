import { AudioEffectChain } from '../../../src/js/engine/audio/AudioEffectChain';
// Import the real EffectNode to use for instanceof check if needed, but mock its implementation details.
// It seems jest.mock hoists, so we might need a different approach if instanceof is strict.
// Let's try mocking the module and creating a simple class that extends the *mocked* base.

// Define a simple mock implementation FIRST
const mockNodeMethods = {
    connect: jest.fn(),
    disconnect: jest.fn(),
};
const mockAudioParam = {
    value: 0,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
};
const mockGainNode = { ...mockNodeMethods, gain: mockAudioParam };

// Mock the base class module
jest.mock('../../../src/js/engine/audio/effects/EffectNode', () => {
    // This is the mocked base class constructor
    const MockEffectNodeBase = jest.fn().mockImplementation(function(audioContext) {
        // Simulate base properties needed by subclasses or the chain
        this.audioContext = audioContext;
        this._input = { ...mockGainNode };
        this._output = { ...mockGainNode };
        this._effectInput = { ...mockGainNode };
        this._bypassGain = { ...mockGainNode };
        this._isBypassed = false;
        // Simulate base connections if necessary for tests accessing these nodes
        this._input.connect(this._bypassGain);
        this._input.connect(this._effectInput);
        this._bypassGain.connect(this._output);
    });
    // Mock prototype methods needed
    MockEffectNodeBase.prototype.getInputNode = jest.fn(function() { return this._input; });
    MockEffectNodeBase.prototype.getOutputNode = jest.fn(function() { return this._output; });
    MockEffectNodeBase.prototype.dispose = jest.fn();
    MockEffectNodeBase.prototype.toJSON = jest.fn().mockReturnValue({ param: 'value' });
    // Add other base methods if needed by AudioEffectChain directly

    return { EffectNode: MockEffectNodeBase };
});

// Now import the mocked version
import { EffectNode } from '../../../src/js/engine/audio/effects/EffectNode';

// Create a simple concrete class extending the mocked EffectNode for testing addEffect
class ConcreteMockEffect extends EffectNode {
    constructor(audioContext) {
        super(audioContext); // Calls the mocked base constructor
        // Add any specific properties or methods if needed for differentiation
        // Removed setting constructor.name as it's often read-only
    }
    // Implement abstract methods if the test requires calling them (likely not needed here)
    setParameters = jest.fn();
    getParameters = jest.fn();
    fromJSON = jest.fn();
    // toJSON is mocked on the prototype
}

// Mock AudioContext provided by jest.setup.js or define basic mocks here if needed
// Assuming global.AudioContext is mocked by jest.setup.js

describe('AudioEffectChain', () => {
    let audioContext;
    let effectChain;

    beforeEach(() => {
        // Reset mocks for EffectNode before each test
        EffectNode.mockClear();
        // Create a new AudioContext mock instance for isolation if necessary
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        effectChain = new AudioEffectChain(audioContext);
    });

    afterEach(() => {
        effectChain.dispose(); // Clean up after each test
    });

    test('should instantiate correctly', () => {
        expect(effectChain).toBeInstanceOf(AudioEffectChain);
        expect(effectChain.audioContext).toBe(audioContext);
        expect(effectChain.effects).toEqual([]);
        expect(effectChain.input).toBeDefined();
        expect(effectChain.output).toBeDefined();
        // Check initial connection (input -> output)
        expect(effectChain.input.connect).toHaveBeenCalledWith(effectChain.output);
    });

    test('should add an effect correctly', () => {
        // Use the concrete mock class that extends the mocked base
        const mockEffect = new ConcreteMockEffect(audioContext);
        effectChain.addEffect(mockEffect);

        expect(effectChain.effects).toHaveLength(1); // Should pass instanceof check now
        expect(effectChain.effects[0]).toBe(mockEffect);
        // Check connections: input -> effectInput, effectOutput -> output
        expect(effectChain.input.disconnect).toHaveBeenCalled(); // Disconnected previous input->output
        expect(effectChain.input.connect).toHaveBeenCalledWith(mockEffect.getInputNode());
        expect(mockEffect.getOutputNode().connect).toHaveBeenCalledWith(effectChain.output);
    });

     test('should add multiple effects and connect them sequentially', () => {
        const effect1 = new ConcreteMockEffect(audioContext);
        const effect2 = new ConcreteMockEffect(audioContext);
        effectChain.addEffect(effect1);
        effectChain.addEffect(effect2);

        expect(effectChain.effects).toHaveLength(2);
        // Check connections: input -> effect1.input, effect1.output -> effect2.input, effect2.output -> output
        expect(effectChain.input.connect).toHaveBeenCalledWith(effect1.getInputNode());
        expect(effect1.getOutputNode().connect).toHaveBeenCalledWith(effect2.getInputNode());
        expect(effect2.getOutputNode().connect).toHaveBeenCalledWith(effectChain.output);
    });

    test('should remove an effect correctly', () => {
        const effect1 = new ConcreteMockEffect(audioContext);
        const effect2 = new ConcreteMockEffect(audioContext);
        effectChain.addEffect(effect1);
        effectChain.addEffect(effect2);

        effectChain.removeEffect(effect1);

        expect(effectChain.effects).toHaveLength(1);
        expect(effectChain.effects[0]).toBe(effect2);
        expect(effect1.dispose).toHaveBeenCalled();
        // Check connections: input -> effect2.input, effect2.output -> output
        expect(effectChain.input.connect).toHaveBeenCalledWith(effect2.getInputNode());
        expect(effect2.getOutputNode().connect).toHaveBeenCalledWith(effectChain.output);
        // Ensure effect1 nodes were disconnected (implicitly tested by _updateConnections)
    });

     test('should remove effect by index correctly', () => {
        const effect1 = new ConcreteMockEffect(audioContext);
        const effect2 = new ConcreteMockEffect(audioContext);
        effectChain.addEffect(effect1);
        effectChain.addEffect(effect2);

        effectChain.removeEffectAtIndex(0); // Remove effect1

        expect(effectChain.effects).toHaveLength(1);
        expect(effectChain.effects[0]).toBe(effect2);
        expect(effect1.dispose).toHaveBeenCalled();
        expect(effectChain.input.connect).toHaveBeenCalledWith(effect2.getInputNode());
        expect(effect2.getOutputNode().connect).toHaveBeenCalledWith(effectChain.output);
    });

    test('should reorder effects correctly', () => {
        const effect1 = new ConcreteMockEffect(audioContext);
        const effect2 = new ConcreteMockEffect(audioContext);
        effectChain.addEffect(effect1);
        effectChain.addEffect(effect2); // Chain: [effect1, effect2]

        effectChain.reorderEffect(0, 1); // Move effect1 to index 1

        expect(effectChain.effects).toHaveLength(2);
        expect(effectChain.effects[0]).toBe(effect2);
        expect(effectChain.effects[1]).toBe(effect1);
        // Check connections: input -> effect2.input, effect2.output -> effect1.input, effect1.output -> output
        expect(effectChain.input.connect).toHaveBeenCalledWith(effect2.getInputNode());
        expect(effect2.getOutputNode().connect).toHaveBeenCalledWith(effect1.getInputNode());
        expect(effect1.getOutputNode().connect).toHaveBeenCalledWith(effectChain.output);
    });

    test('should return input and output nodes', () => {
        expect(effectChain.getInputNode()).toBe(effectChain.input);
        expect(effectChain.getOutputNode()).toBe(effectChain.output);
    });

    // Basic bypass test (implementation might need refinement)
    test('should apply bypass (basic gain toggle)', () => {
        effectChain.bypass(true);
        expect(effectChain.output.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
        expect(effectChain.isBypassed()).toBe(true);

        effectChain.bypass(false);
        expect(effectChain.output.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, expect.any(Number));
        expect(effectChain.isBypassed()).toBe(false);
    });

    test('dispose should disconnect nodes and dispose effects', () => {
        const effect1 = new ConcreteMockEffect(audioContext);
        effectChain.addEffect(effect1);

        const inputDisconnectSpy = jest.spyOn(effectChain.input, 'disconnect');
        const outputDisconnectSpy = jest.spyOn(effectChain.output, 'disconnect');

        effectChain.dispose();

        expect(inputDisconnectSpy).toHaveBeenCalled();
        expect(outputDisconnectSpy).toHaveBeenCalled();
        expect(effect1.dispose).toHaveBeenCalled();
        expect(effectChain.effects).toEqual([]);
        expect(effectChain.input).toBeNull();
        expect(effectChain.output).toBeNull();
    });

    test('savePreset should return correct structure', () => {
        const effect1 = new ConcreteMockEffect(audioContext);
        const effect2 = new ConcreteMockEffect(audioContext);
        effectChain.addEffect(effect1);
        effectChain.addEffect(effect2);

        const preset = effectChain.savePreset();

        // Check the structure and that toJSON was called, accept the mocked base name
        expect(preset.effects).toHaveLength(2);
        expect(preset.effects[0].type).toBeDefined(); // Check type exists
        expect(preset.effects[0].state).toEqual({ param: 'value' });
        expect(preset.effects[1].type).toBeDefined();
        expect(preset.effects[1].state).toEqual({ param: 'value' });
        expect(effect1.toJSON).toHaveBeenCalled();
        expect(effect2.toJSON).toHaveBeenCalled();
    });

    // loadPreset requires a mechanism to map type string to class constructor,
    // so we only test the clearing part and the warning/error logs for now.
    test('loadPreset should clear existing effects and handle unknown/invalid types', () => {
        const effect1 = new ConcreteMockEffect(audioContext);
        effectChain.addEffect(effect1);
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Load with an unknown type to trigger the 'not found in registry' error
        effectChain.loadPreset({ effects: [{ type: 'UnknownEffect', state: {} }] });

        expect(effect1.dispose).toHaveBeenCalled();
        expect(effectChain.effects).toHaveLength(0); // Should still be empty as UnknownEffect wasn't added
        expect(consoleErrorSpy).toHaveBeenCalledWith('Could not find effect class for type: UnknownEffect in registry.'); // Check for specific error

        // Test invalid format separately
        effectChain.loadPreset({}); // Invalid format
        expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid preset data format.");

        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });
});
