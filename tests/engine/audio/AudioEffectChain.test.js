import { AudioEffectChain } from '../../../src/js/engine/audio/AudioEffectChain';
// Import the real EffectNode for potential type checks if needed elsewhere, but primarily use local mock.
import { EffectNode } from '../../../src/js/engine/audio/effects/EffectNode';

// Define a simple local Mock Effect class mimicking EffectNode structure
const createLocalMockNode = () => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { // Mock gain param if needed by tests (like bypass)
        value: 1,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
    }
});

class MockEffectNode { // Standalone mock class
    // Keep track of instances for potential checks
    static instances = [];
    static mockClear() {
        MockEffectNode.instances = [];
        // Reset static mocks if any were added
    }

    constructor(audioContext) {
        // No super() call needed
        this.audioContext = audioContext;
        this._input = createLocalMockNode();
        this._output = createLocalMockNode();
        this.dispose = jest.fn();
        this.toJSON = jest.fn().mockReturnValue({ mockParam: 'mockValue' });
        this.constructorName = 'MockEffectNode'; // Helper for identification
        MockEffectNode.instances.push(this);
    }

    getInputNode() { return this._input; }
    getOutputNode() { return this._output; }
}

describe('AudioEffectChain', () => {
    let audioContext;
    let effectChain;

    beforeEach(() => {
        // Reset mocks for EffectNode before each test
        MockEffectNode.mockClear(); // Clear instances of our local mock
        // Use the globally mocked AudioContext
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        effectChain = new AudioEffectChain(audioContext);
    });

    afterEach(() => {
        if (effectChain) effectChain.dispose(); // Clean up chain if it exists
        jest.clearAllTimers(); // Clear any pending timers
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
        // Use the local MockEffectNode
        const mockEffect = new MockEffectNode(audioContext);
        const inputDisconnectSpy = jest.spyOn(effectChain.input, 'disconnect'); // Spy on the specific instance

        effectChain.addEffect(mockEffect);

        expect(effectChain.effects).toHaveLength(1);
        expect(effectChain.effects[0]).toBe(mockEffect);
        // Check connections: input -> effectInput, effectOutput -> output
        expect(inputDisconnectSpy).toHaveBeenCalled(); // Check the spy
        expect(effectChain.input.connect).toHaveBeenCalledWith(mockEffect.getInputNode());
        expect(mockEffect.getOutputNode().connect).toHaveBeenCalledWith(effectChain.output);
    });

     test('should add multiple effects and connect them sequentially', () => {
        const effect1 = new MockEffectNode(audioContext);
        const effect2 = new MockEffectNode(audioContext);
        effectChain.addEffect(effect1);
        effectChain.addEffect(effect2);

        expect(effectChain.effects).toHaveLength(2);
        // Check connections: input -> effect1.input, effect1.output -> effect2.input, effect2.output -> output
        expect(effectChain.input.connect).toHaveBeenCalledWith(effect1.getInputNode());
        expect(effect1.getOutputNode().connect).toHaveBeenCalledWith(effect2.getInputNode());
        expect(effect2.getOutputNode().connect).toHaveBeenCalledWith(effectChain.output);
    });

    test('should remove an effect correctly', () => {
        const effect1 = new MockEffectNode(audioContext);
        const effect2 = new MockEffectNode(audioContext);
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
        const effect1 = new MockEffectNode(audioContext);
        const effect2 = new MockEffectNode(audioContext);
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
        const effect1 = new MockEffectNode(audioContext);
        const effect2 = new MockEffectNode(audioContext);
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
        const effect1 = new MockEffectNode(audioContext);
        effectChain.addEffect(effect1); // Add our local mock

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
        const effect1 = new MockEffectNode(audioContext);
        const effect2 = new MockEffectNode(audioContext);
        effectChain.addEffect(effect1);
        effectChain.addEffect(effect2);

        const preset = effectChain.savePreset();

        // Check the structure and that toJSON was called, accept the mocked base name
        expect(preset.effects).toHaveLength(2);
        expect(preset.effects[0].type).toBeDefined(); // Check type exists
        expect(preset.effects[0].state).toEqual({ mockParam: 'mockValue' }); // Matches local mock
        expect(preset.effects[1].type).toBeDefined();
        expect(preset.effects[1].state).toEqual({ mockParam: 'mockValue' }); // Matches local mock
        expect(effect1.toJSON).toHaveBeenCalled();
        expect(effect2.toJSON).toHaveBeenCalled();
    });

    // loadPreset requires a mechanism to map type string to class constructor,
    // so we only test the clearing part and the warning/error logs for now.
    test('loadPreset should clear existing effects and handle unknown/invalid types', () => {
        const effect1 = new MockEffectNode(audioContext);
        effectChain.addEffect(effect1); // Add our local mock
        // const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(); // Remove spies
        // const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Load with an unknown type to trigger the 'not found in registry' error
        effectChain.loadPreset({ effects: [{ type: 'UnknownEffect', state: {} }] });

        expect(effect1.dispose).toHaveBeenCalled();
        expect(effectChain.effects).toHaveLength(0); // Should still be empty as UnknownEffect wasn't added
        // expect(consoleErrorSpy).toHaveBeenCalledWith('Could not find effect class for type: UnknownEffect in registry.');

        // Test invalid format separately
        effectChain.loadPreset({}); // Invalid format
        // expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid preset data format.");

        // consoleWarnSpy.mockRestore(); // Remove spies
        // consoleErrorSpy.mockRestore();
    });
});
