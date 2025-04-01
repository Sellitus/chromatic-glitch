const { EffectNode } = require('../../../../src/js/engine/audio/effects/EffectNode');

describe('EffectNode', () => {
    let audioContext;

    beforeEach(() => {
        // Mock AudioContext and its methods
        audioContext = {
            createGain: jest.fn(() => ({
                gain: {
                    setValueAtTime: jest.fn(),
                    linearRampToValueAtTime: jest.fn()
                },
                connect: jest.fn(),
                disconnect: jest.fn()
            })),
            currentTime: 0
        };
    });

    describe('constructor', () => {
        it('should throw error when instantiated directly', () => {
            expect(() => new EffectNode(audioContext))
                .toThrow("Abstract classes can't be instantiated.");
        });

        it('should throw error when audioContext is not provided', () => {
            class TestEffect extends EffectNode {}
            expect(() => new TestEffect())
                .toThrow("AudioContext is required to create an EffectNode.");
        });

        it('should create internal nodes when properly instantiated', () => {
            class TestEffect extends EffectNode {
                setParameters() {}
                getParameters() {}
                toJSON() {}
                fromJSON() {}
            }

            const effect = new TestEffect(audioContext);
            expect(audioContext.createGain).toHaveBeenCalledTimes(4);
            expect(effect.getInputNode()).toBeDefined();
            expect(effect.getOutputNode()).toBeDefined();
        });
    });

    describe('abstract methods', () => {
        class TestEffect extends EffectNode {}
        let effect;

        beforeEach(() => {
            effect = new TestEffect(audioContext);
        });

        it('should throw error when setParameters is not implemented', () => {
            expect(() => effect.setParameters({}))
                .toThrow("Method 'setParameters()' must be implemented");
        });

        it('should throw error when getParameters is not implemented', () => {
            expect(() => effect.getParameters())
                .toThrow("Method 'getParameters()' must be implemented");
        });

        it('should throw error when toJSON is not implemented', () => {
            expect(() => effect.toJSON())
                .toThrow("Method 'toJSON()' must be implemented");
        });

        it('should throw error when fromJSON is not implemented', () => {
            expect(() => effect.fromJSON({}))
                .toThrow("Method 'fromJSON()' must be implemented");
        });
    });

    describe('connection methods', () => {
        it('should handle null output node during connect', () => {
            class TestEffect extends EffectNode {
                setParameters() {}
                getParameters() {}
                toJSON() {}
                fromJSON() {}
            }
            const effect = new TestEffect(audioContext);
            effect._output = null;
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            effect.connect({});
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot connect: Output node for'));
            consoleSpy.mockRestore();
        });

        it('should handle already null output during disconnect', () => {
            class TestEffect extends EffectNode {
                setParameters() {}
                getParameters() {}
                toJSON() {}
                fromJSON() {}
            }
            const effect = new TestEffect(audioContext);
            effect._output = null;
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            effect.disconnect();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot disconnect: Output node for'));
            consoleSpy.mockRestore();
        });

        class TestEffect extends EffectNode {
            setParameters() {}
            getParameters() {}
            toJSON() {}
            fromJSON() {}
        }
        let effect;

        beforeEach(() => {
            effect = new TestEffect(audioContext);
        });

        it('should not connect when destination is null', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            effect.connect(null);
            expect(consoleSpy).toHaveBeenCalledWith("Destination node is required for connection.");
            consoleSpy.mockRestore();
        });

        it('should connect output to destination node', () => {
            const destination = { connect: jest.fn() };
            effect.connect(destination);
            expect(effect.getOutputNode().connect).toHaveBeenCalledWith(destination);
        });

        it('should handle disconnect when output exists', () => {
            effect.disconnect();
            expect(effect.getOutputNode().disconnect).toHaveBeenCalled();
        });
    });

    describe('bypass functionality', () => {
        class TestEffect extends EffectNode {
            setParameters() {}
            getParameters() {}
            toJSON() {}
            fromJSON() {}
        }
        let effect;

        beforeEach(() => {
            effect = new TestEffect(audioContext);
        });

        it('should set bypass state and update gain values', () => {
            effect.bypass(true);
            expect(effect.isBypassed()).toBe(true);
        });

        it('should handle bypass when nodes are disposed', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            effect.dispose();
            effect.bypass(true);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot bypass'));
            consoleSpy.mockRestore();
        });
    });

    describe('visualization', () => {
        class TestEffect extends EffectNode {
            setParameters() {}
            getParameters() {}
            toJSON() {}
            fromJSON() {}
        }
        let effect;

        beforeEach(() => {
            effect = new TestEffect(audioContext);
        });

        it('should return null by default for visualization data', () => {
            expect(effect.getVisualizationData()).toBeNull();
        });
    });

    describe('disposal', () => {
        class TestEffect extends EffectNode {
            setParameters() {}
            getParameters() {}
            toJSON() {}
            fromJSON() {}
        }
        let effect;

        beforeEach(() => {
            effect = new TestEffect(audioContext);
        });

        it('should disconnect and nullify all nodes', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            effect.dispose();
            
            expect(effect.getInputNode()).toBeNull();
            expect(effect.getOutputNode()).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Disposing base EffectNode'));
            consoleSpy.mockRestore();
        });

        it('should handle errors during node disconnection', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const mockError = new Error('Test error');
            effect.getInputNode().disconnect.mockImplementation(() => {
                throw mockError;
            });

            effect.dispose();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error disconnecting _input'));
            consoleSpy.mockRestore();
        });
    });
});