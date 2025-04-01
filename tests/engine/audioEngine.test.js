const { AudioEngine } = require('../../src/js/engine/AudioEngine');

describe('AudioEngine', () => {
    let audioEngine;
    let mockAudioContext;
    let mockAudioContextInstance; // To hold the instance created by the engine
    let consoleSpy;
    // let defaultAudioContextMock; // Will use global mock
    let addEventListenerSpy;
    let removeEventListenerSpy;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        addEventListenerSpy = jest.spyOn(window, 'addEventListener').mockImplementation();
        removeEventListenerSpy = jest.spyOn(window, 'removeEventListener').mockImplementation();

        // Rely on the global AudioContext mock from jest.setup.js
        // We will get the instance after audioEngine.init()

        // Ensure window exists and add spies
        global.window = {
            ...global.window, // Keep existing window properties (like AudioContext mock)
            // webkitAudioContext: undefined, // Global mock handles this
            addEventListener: addEventListenerSpy,
            removeEventListener: removeEventListenerSpy
        };

        // Set up fetch mock
        global.fetch = jest.fn(() => 
            Promise.resolve({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            })
        );

        audioEngine = new AudioEngine();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
        // No need to restore AudioContext here, rely on Jest's environment teardown
    });

    describe('initialization', () => {
        it('should create an AudioContext when initialized', async () => {
            await audioEngine.init();
            expect(audioEngine.audioContext).toBeDefined();
            expect(audioEngine.masterGain).toBeDefined();
            // Check if it's an instance of the global mock
            expect(audioEngine.audioContext).toBeInstanceOf(window.AudioContext);
            mockAudioContextInstance = audioEngine.audioContext; // Store instance
        });

        it('should handle initialization failure', async () => {
            const error = new Error('Not supported');
            const originalAudioContext = window.AudioContext; // Backup original mock
            window.AudioContext = jest.fn(() => { throw error; }); // Temporarily override
            await expect(audioEngine.init()).rejects.toThrow(error);
            window.AudioContext = originalAudioContext; // Restore original mock
        });

        it('should add interaction listeners when context is suspended', async () => {
            await audioEngine.init();
            mockAudioContextInstance = audioEngine.audioContext; // Get instance
            mockAudioContextInstance.state = 'suspended'; // Set state on the instance

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), { once: true });
            expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), { once: true });

            const [[, clickHandler]] = addEventListenerSpy.mock.calls.filter(call => call[0] === 'click');
            await clickHandler();
            expect(mockAudioContextInstance.resume).toHaveBeenCalled();
            expect(removeEventListenerSpy).toHaveBeenCalled();
        });

        it('should handle resume error on interaction', async () => {
            await audioEngine.init();
            mockAudioContextInstance = audioEngine.audioContext;
            mockAudioContextInstance.state = 'suspended';

            const error = new Error('Resume failed');
            mockAudioContextInstance.resume.mockRejectedValueOnce(error); // Mock on instance
            const [[, clickHandler]] = addEventListenerSpy.mock.calls.filter(call => call[0] === 'click');

            const errorSpy = jest.spyOn(console, 'error').mockImplementation();
            await clickHandler();
            expect(errorSpy).toHaveBeenCalledWith('Error resuming AudioContext on interaction:', error);
            errorSpy.mockRestore();
        });

        it('should clean up listeners if context is already running', async () => {
            await audioEngine.init();
            mockAudioContextInstance = audioEngine.audioContext;
            mockAudioContextInstance.state = 'suspended'; // Start suspended
            const [[, clickHandler]] = addEventListenerSpy.mock.calls.filter(call => call[0] === 'click');
            mockAudioContextInstance.state = 'running'; // Set to running before click
            await clickHandler();
            expect(removeEventListenerSpy).toHaveBeenCalledWith('click', clickHandler);
        });
    });

    describe('context state management', () => {
        beforeEach(async () => {
            await audioEngine.init();
            mockAudioContextInstance = audioEngine.audioContext; // Get instance
        });

        it('should handle suspend request', async () => {
            mockAudioContextInstance.state = 'running'; // Ensure starts running
            await audioEngine.suspend();
            expect(mockAudioContextInstance.suspend).toHaveBeenCalled();
            expect(audioEngine.isSuspended).toBe(true);
        });

        it('should handle resume request', async () => {
            mockAudioContextInstance.state = 'suspended'; // Ensure starts suspended
            await audioEngine.resume();
            expect(mockAudioContextInstance.resume).toHaveBeenCalled();
            expect(audioEngine.isSuspended).toBe(false);
        });

        it('should handle resume failure', async () => {
            mockAudioContextInstance.state = 'suspended'; // Ensure starts suspended
            mockAudioContextInstance.resume.mockRejectedValueOnce(new Error('Resume failed')); // Mock on instance
            await expect(audioEngine.resume()).rejects.toThrow('Resume failed');
        });

        it('should warn when resuming without initialization', async () => {
            const newEngine = new AudioEngine();
            await newEngine.resume();
            expect(consoleSpy).toHaveBeenCalledWith('AudioEngine not initialized. Call init() first.');
        });
    });

    describe('volume control', () => {
        beforeEach(async () => {
            await audioEngine.init();
            // No need to assign mockGainNode, use audioEngine.masterGain directly
        });

        it('should set master volume', () => {
            audioEngine.setMasterVolume(0.5);
            expect(audioEngine.masterGain.gain.exponentialRampToValueAtTime)
                .toHaveBeenCalledWith(0.5, expect.any(Number));
        });

        it('should handle zero volume', () => {
            audioEngine.setMasterVolume(0);
            expect(audioEngine.masterGain.gain.exponentialRampToValueAtTime)
                .toHaveBeenCalledWith(0.0001, expect.any(Number));
        });

        it('should get current volume', () => {
            audioEngine.masterGain.gain.value = 0.7; // Set value on the actual masterGain's param
            expect(audioEngine.getMasterVolume()).toBe(0.7);
        });

        it('should handle missing master gain', () => {
            const newEngine = new AudioEngine();
            expect(newEngine.getMasterVolume()).toBe(0);
            newEngine.setMasterVolume(0.5); // Should not throw
        });
    });

    describe('effects creation', () => {
        beforeEach(async () => {
            await audioEngine.init();
            mockAudioContextInstance = audioEngine.audioContext; // Get instance
        });

        describe('biquad filter', () => {
            it('should create biquad filter with custom parameters', () => {
                const filter = audioEngine.createBiquadFilter('highpass', 1000, 2);
                expect(filter).toBeDefined();
                expect(filter.type).toBe('highpass');
                expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1000, 0);
                expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(2, 0);
            });

            it('should create biquad filter with default parameters', () => {
                const filter = audioEngine.createBiquadFilter();
                expect(filter).toBeDefined();
                expect(filter.type).toBe('lowpass');
                expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(350, 0);
                expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(1, 0);
            });

            it('should handle missing AudioContext', () => {
                const newEngine = new AudioEngine();
                expect(newEngine.createBiquadFilter()).toBeNull();
            });
        });

        describe('delay effect', () => {
            it('should create delay with custom parameters', () => {
                const { delay, feedbackGain, input, output } = audioEngine.createDelay(0.3, 0.4);
                expect(delay).toBeDefined();
                expect(feedbackGain).toBeDefined();
                expect(delay.delayTime.setValueAtTime).toHaveBeenCalledWith(0.3, 0);
                expect(feedbackGain.gain.setValueAtTime).toHaveBeenCalledWith(0.4, 0);
                expect(delay.connect).toHaveBeenCalledWith(feedbackGain);
                expect(feedbackGain.connect).toHaveBeenCalledWith(delay);
                expect(input).toBe(delay);
                expect(output).toBe(delay);
            });

            it('should create delay with default parameters', () => {
                const { delay, feedbackGain } = audioEngine.createDelay();
                expect(delay.delayTime.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
                expect(feedbackGain.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
            });

            it('should handle missing AudioContext', () => {
                const newEngine = new AudioEngine();
                expect(newEngine.createDelay()).toBeNull();
            });
        });

        describe('reverb effect', () => {
            it('should create reverb with custom parameters', () => {
                const convolver = audioEngine.createReverb(2, 0.5);
                // Check call on the instance
                expect(convolver).toBeDefined();
                expect(mockAudioContextInstance.createBuffer).toHaveBeenCalledWith(2, expect.any(Number), 44100);
                expect(convolver.buffer).toBeDefined();
            });

            it('should create reverb with default parameters', () => {
                const convolver = audioEngine.createReverb();
                // Check call on the instance
                expect(mockAudioContextInstance.createBuffer).toHaveBeenCalledWith(2, expect.any(Number), 44100);
                expect(convolver.buffer).toBeDefined();
            });

            it('should handle missing AudioContext', () => {
                const newEngine = new AudioEngine();
                expect(newEngine.createReverb()).toBeNull();
            });

            it('should generate impulse response with decay', () => {
                const convolver = audioEngine.createReverb(3, 0.8);
                // Access the buffer created *within* createReverb via the mock
                // Use the instance's mock method
                const createBufferMock = mockAudioContextInstance.createBuffer;
                const lastCallArgs = createBufferMock.mock.calls[createBufferMock.mock.calls.length - 1];
                expect(lastCallArgs[1]).toBe(Math.floor(3 * 44100)); // Check the length argument passed to createBuffer
                expect(convolver.buffer).toBeDefined();
            });
        });
    });

    describe('playback', () => {
        beforeEach(async () => {
            await audioEngine.init();
            mockAudioContextInstance = audioEngine.audioContext; // Get instance
        });

        it('should play sound with options', () => {
            // Use the globally mocked createBuffer to create a mock buffer
            const buffer = mockAudioContextInstance.createBuffer(1, 44100, 44100);
            // The global mock's playSound needs to return source/gainNode
            // const mockPlayback = { source: mockAudioContextInstance.createBufferSource(), gainNode: mockAudioContextInstance.createGain() };
            const onEnded = jest.fn();

            // Ensure context is running for this test
            mockAudioContextInstance.state = 'running';
            audioEngine.isSuspended = false;
            const result = audioEngine.playSound(buffer, {
                volume: 0.5,
                loop: true,
                startTime: 1,
                onEnded
            });
            expect(result).toBeDefined();
            // Need to adjust expectations based on what playSound actually returns
            // Check properties on the returned source and gainNode
            expect(result.source).toBeDefined();
            expect(result.gainNode).toBeDefined();
            expect(result.source.loop).toBe(true);
            expect(result.source.start).toHaveBeenCalledWith(expect.any(Number)); // Check if start was called
            expect(result.gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.5, expect.any(Number)); // Check gain setting
        });

        it('should handle missing AudioContext', () => {
            const newEngine = new AudioEngine();
            const result = newEngine.playSound({});
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Cannot play sound: AudioContext not initialized.');
        });

        it('should handle suspended context', () => {
            mockAudioContextInstance.state = 'suspended'; // Set state on instance
            audioEngine.isSuspended = true;
            const result = audioEngine.playSound({});
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Cannot play sound: AudioContext is suspended. Call resume() on user interaction.');
        });
    });

    describe('node connection', () => {
        let source;
        let gain;

        beforeEach(async () => {
            await audioEngine.init();
            source = audioEngine.createBufferSource({});
            source.connect = jest.fn();
            gain = audioEngine.createGainNode();
            gain.connect = jest.fn();
        });

        it('should connect valid nodes', () => {
            audioEngine.connectNodes([source, gain, mockAudioContextInstance.destination]);
            expect(source.connect).toHaveBeenCalledWith(gain);
            expect(gain.connect).toHaveBeenCalledWith(mockAudioContextInstance.destination);
        });

        it('should handle invalid nodes array', () => {
            audioEngine.connectNodes([]);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid nodes array provided to connectNodes');
        });

        it('should handle null nodes', () => {
            audioEngine.connectNodes([null, mockAudioContextInstance.destination]);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid node in chain, aborting connection');
        });

        it('should handle connection errors', () => {
            const error = new Error('Connection failed');
            source.connect.mockImplementation(() => { throw error; });
            const errorSpy = jest.spyOn(console, 'error').mockImplementation();
            expect(() => {
                audioEngine.connectNodes([source, mockAudioContextInstance.destination]);
            }).toThrow(error);
            errorSpy.mockRestore();
        });
    });

    describe('crossfade', () => {
        beforeEach(async () => {
            await audioEngine.init();
            mockAudioContextInstance = audioEngine.audioContext; // Get instance
        });

        it('should perform crossfade between sources', () => {
            // Use globally mocked nodes
            const sourceA = { 
                source: mockAudioContextInstance.createBufferSource(), 
                gainNode: mockAudioContextInstance.createGain() 
            };
            const sourceB = { 
                source: mockAudioContextInstance.createBufferSource(), 
                gainNode: mockAudioContextInstance.createGain() 
            };
            
            audioEngine.crossfade(sourceA, sourceB, 1);
            expect(sourceA.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalled();
            expect(sourceB.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalled();
            expect(sourceA.gainNode.gain.cancelScheduledValues).toHaveBeenCalled();
            expect(sourceB.gainNode.gain.cancelScheduledValues).toHaveBeenCalled();
        });

        it('should handle invalid source info', () => {
            // consoleSpy is set up in top-level beforeEach
            audioEngine.crossfade(null, null, 1);
            expect(consoleSpy).toHaveBeenCalledWith('Crossfade requires valid source info with gain nodes.');
        });

        it('should handle source stop errors', () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation();
            const sourceA = {                // Mock stop to throw a generic error
 
                source: { stop: jest.fn(() => { throw new Error('Some other error'); }) },
                gainNode: mockAudioContextInstance.createGain()
            };
            const sourceB = { 
                source: mockAudioContextInstance.createBufferSource(), 
                gainNode: mockAudioContextInstance.createGain() 
            };
            
            audioEngine.crossfade(sourceA, sourceB, 1);
            expect(errorSpy).toHaveBeenCalledWith('Error stopping source A:', expect.any(Error));
            errorSpy.mockRestore();
        });

        it('should not log error for InvalidStateError', () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation();
            const sourceA = {                // Mock stop to throw InvalidStateError
 
                source: { stop: jest.fn(() => { 
                    const error = new Error('InvalidStateError');
                    error.name = 'InvalidStateError';
                    throw error;
                }) },
                gainNode: mockAudioContextInstance.createGain()
            };
            const sourceB = { 
                source: mockAudioContextInstance.createBufferSource(), 
                gainNode: mockAudioContextInstance.createGain() 
            };
            
            audioEngine.crossfade(sourceA, sourceB, 1);
            expect(errorSpy).not.toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });

    describe('visualization', () => {
        beforeEach(async () => {
            await audioEngine.init();
            mockAudioContextInstance = audioEngine.audioContext; // Get instance
        });

        it('should get frequency data', () => {
            // createAnalyser is mocked globally
            const analyser = audioEngine.createAnalyser();
            expect(analyser).toBeDefined();
            const data = audioEngine.getFrequencyData(analyser);
            expect(analyser.getByteFrequencyData).toHaveBeenCalled();
            expect(data instanceof Uint8Array).toBe(true);
            // Check length based on global mock's default fftSize / 2
            expect(data.length).toBe(analyser.frequencyBinCount);
        });

        it('should get time domain data', () => {
            // createAnalyser is mocked globally
            const analyser = audioEngine.createAnalyser();
            expect(analyser).toBeDefined();
            const data = audioEngine.getTimeDomainData(analyser);
            expect(analyser.getByteTimeDomainData).toHaveBeenCalled();
            expect(data instanceof Uint8Array).toBe(true);
            // Check length based on global mock's default fftSize
            expect(data.length).toBe(analyser.fftSize);
        });

        it('should handle null analyser', () => {
            // consoleSpy is set up in top-level beforeEach
            expect(audioEngine.getFrequencyData(null)).toBeNull();
            expect(audioEngine.getTimeDomainData(null)).toBeNull();
        });
    });
});
