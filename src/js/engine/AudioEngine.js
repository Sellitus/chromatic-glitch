/**
 * AudioEngine - Core audio system using Web Audio API
 * Handles audio context management, effects routing, volume control,
 * and advanced audio features like crossfading and visualization.
 */
export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isSuspended = true;
        this.sources = new Map();
    }

    // Initialize AudioContext, setting up listeners for interaction if needed
    async init() {
        return new Promise((resolve, reject) => {
            try {
                // Attempt to create the context immediately
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.audioContext.createGain();
                this.masterGain.connect(this.audioContext.destination);
                this.isSuspended = this.audioContext.state !== 'running';
                console.log(`AudioContext initial state: ${this.audioContext.state}`);

                // Function to resume context on interaction
                const resumeContextOnInteraction = async () => {
                    // Check if context exists and is suspended before resuming
                    if (this.audioContext && this.audioContext.state === 'suspended') {
                        try {
                            await this.audioContext.resume();
                            this.isSuspended = false; // Update state
                            console.log("AudioContext resumed via interaction.");
                            // Clean up listeners after successful resume
                            window.removeEventListener('click', resumeContextOnInteraction);
                            window.removeEventListener('keydown', resumeContextOnInteraction);
                        } catch (e) {
                            console.error("Error resuming AudioContext on interaction:", e);
                            // Decide if this should reject the init promise or just log
                        }
                    } else {
                         // Context might already be running or interaction happened before needed
                         // Still remove listeners if they were added
                         window.removeEventListener('click', resumeContextOnInteraction);
                         window.removeEventListener('keydown', resumeContextOnInteraction);
                    }
                };

                // If context starts suspended, add interaction listeners
                if (this.isSuspended) {
                    console.log("AudioContext is suspended. Adding interaction listeners to resume.");
                    // Use { once: true } so they automatically detach after firing
                    window.addEventListener('click', resumeContextOnInteraction, { once: true });
                    window.addEventListener('keydown', resumeContextOnInteraction, { once: true });
                }

                // Resolve the init promise immediately, allowing game load to continue
                resolve();

            } catch (e) {
                // Catch errors during initial AudioContext creation
                console.error("Web Audio API is not supported or context creation failed", e);
                reject(e); // Reject the promise if context cannot be created
            }
        });
    }


    // Master Volume Control with smooth transitions
    setMasterVolume(level) {
        if (!this.masterGain) return;
        this.masterGain.gain.exponentialRampToValueAtTime(
            Math.max(0.0001, level),
            this.audioContext.currentTime + 0.05
        );
    }

    getMasterVolume() {
        return this.masterGain ? this.masterGain.gain.value : 0;
    }

    // Context State Management
    async suspend() {
        if (this.audioContext && this.audioContext.state === 'running') {
            await this.audioContext.suspend();
            this.isSuspended = true;
            console.log("AudioContext suspended.");
        }
    }

    async resume() {
        if (!this.audioContext) {
            console.warn("AudioEngine not initialized. Call init() first.");
            return;
        }

        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                this.isSuspended = false;
                console.log("AudioContext resumed.");
            } catch (e) {
                console.error("Error resuming AudioContext:", e);
                throw e; // Re-throw to allow error handling by caller
            }
        }
    }

    // Utility Functions for Audio Node Creation
    createGainNode(initialGain = 1) {
        if (!this.audioContext) return null;
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(initialGain, this.audioContext.currentTime);
        return gainNode;
    }

    createBufferSource(buffer) {
        if (!this.audioContext) return null;
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        return source;
    }

    createAnalyser(fftSize = 2048) {
        if (!this.audioContext) return null;
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        return analyser;
    }

    // Effects Chain Routing
    connectNodes(nodes) {
        if (!this.audioContext) return;
        for (let i = 0; i < nodes.length - 1; i++) {
            if (nodes[i] && nodes[i+1]) {
                if (typeof nodes[i].connect === 'function') {
                    nodes[i].connect(nodes[i+1]);
                } else {
                    console.warn("Node is not connectable:", nodes[i]);
                    break;
                }
            } else {
                console.warn("Skipping connection due to null node in chain:", nodes);
                break;
            }
        }
    }

    // Enhanced Sound Playback with Effects Chain Support
    playSound(buffer, { volume = 1, effectsChain = [], loop = false, startTime = 0, onEnded = null } = {}) {
        if (!this.audioContext) {
            console.warn("Cannot play sound: AudioContext not initialized.");
            return null;
        }
        if (this.isSuspended) {
            console.warn("Cannot play sound: AudioContext is suspended. Call resume() on user interaction.");
            return null;
        }

        const source = this.createBufferSource(buffer);
        const individualGain = this.createGainNode(volume);
        if (!source || !individualGain) return null;

        source.loop = loop;

        // Connect: source -> individualGain -> [effectsChain] -> masterGain
        const connectionPath = [source, individualGain, ...effectsChain, this.masterGain].filter(Boolean);
        this.connectNodes(connectionPath);

        source.start(this.audioContext.currentTime + startTime);
        if (onEnded && typeof onEnded === 'function') {
            source.onended = onEnded;
        }
        
        return { source, gainNode: individualGain };
    }

    // Crossfade Implementation
    crossfade(sourceAInfo, sourceBInfo, duration) {
        if (!this.audioContext || !sourceAInfo?.gainNode || !sourceBInfo?.gainNode) {
            console.warn("Crossfade requires valid source info with gain nodes.");
            return;
        }
        const now = this.audioContext.currentTime;
        const gainA = sourceAInfo.gainNode.gain;
        const gainB = sourceBInfo.gainNode.gain;

        // Fade out A
        gainA.cancelScheduledValues(now);
        gainA.setValueAtTime(gainA.value, now);
        gainA.linearRampToValueAtTime(0.0001, now + duration);

        // Fade in B
        gainB.cancelScheduledValues(now);
        gainB.setValueAtTime(0.0001, now);
        gainB.linearRampToValueAtTime(1.0, now + duration);

        // Stop source A after fade out
        if (sourceAInfo.source) {
            try {
                sourceAInfo.source.stop(now + duration);
            } catch (e) {
                if (e.name !== 'InvalidStateError') {
                    console.error("Error stopping source A:", e);
                }
            }
        }
    }

    // Audio Visualization Methods
    getFrequencyData(analyserNode) {
        if (!analyserNode) return null;
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);
        return dataArray;
    }

    getTimeDomainData(analyserNode) {
        if (!analyserNode) return null;
        const bufferLength = analyserNode.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(dataArray);
        return dataArray;
    }

    // Audio Loading
    async loadAudioBuffer(url) {
        if (!this.audioContext) {
            return Promise.reject("AudioContext not initialized");
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${url}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Error loading/decoding audio buffer from ${url}:`, error);
            throw error;
        }
    }

    // Additional Utility Methods for Effects
    createBiquadFilter(type = 'lowpass', frequency = 350, Q = 1) {
        if (!this.audioContext) return null;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = type;
        filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        filter.Q.setValueAtTime(Q, this.audioContext.currentTime);
        return filter;
    }

    createDelay(delayTime = 0.5, feedback = 0.5) {
        if (!this.audioContext) return null;
        const delay = this.audioContext.createDelay();
        const feedbackGain = this.createGainNode(feedback);
        
        delay.delayTime.setValueAtTime(delayTime, this.audioContext.currentTime);
        delay.connect(feedbackGain);
        feedbackGain.connect(delay);
        
        return {
            delay,
            feedbackGain,
            input: delay,
            output: delay
        };
    }

    createReverb(duration = 2, decay = 0.5) {
        if (!this.audioContext) return null;
        const length = this.audioContext.sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }

        const convolver = this.audioContext.createConvolver();
        convolver.buffer = impulse;
        return convolver;
    }
}
