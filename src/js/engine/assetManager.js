import { AudioManager } from './audioManager.js';

// Add a small delay for testing loading screen
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export class AssetManager {
    constructor() {
        console.log('Initializing AssetManager');
        this.audioManager = new AudioManager();
        this.images = new Map();
        this.json = new Map();
        this.manifest = null;
        this.loadingErrors = new Map();
        this.version = '1.0.0';
        
        // Loading progress tracking
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.initializeLoadingElements();
    }

    initializeLoadingElements() {
        console.log('Initializing loading screen elements');
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressFill = document.querySelector('.progress-fill');
        this.progressText = document.querySelector('.progress-text');

        if (!this.loadingScreen || !this.progressFill || !this.progressText) {
            console.warn('Some loading screen elements were not found:', {
                screen: !!this.loadingScreen,
                fill: !!this.progressFill,
                text: !!this.progressText
            });
        }
    }

    init() {
        console.log('Initializing audio manager');
        this.audioManager.init();
        // Ensure loading elements are initialized
        if (!this.loadingScreen) {
            this.initializeLoadingElements();
        }
    }

    updateProgress() {
        console.log(`Updating progress: ${this.loadedAssets}/${this.totalAssets}`);
        const progress = (this.loadedAssets / this.totalAssets) * 100;

        if (this.progressFill && this.progressText) {
            console.log(`Setting progress: ${progress}%`);
            this.progressFill.style.width = `${progress}%`;
            this.progressText.textContent = `Loading: ${Math.round(progress)}%`;
        } else {
            console.warn('Progress elements not found during update');
        }

        if (this.loadedAssets === this.totalAssets) {
            console.log('Loading complete, hiding loading screen');
            this.hideLoadingScreen();
        }
    }

    showLoadingScreen() {
        console.log('Showing loading screen');
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('hidden');
        } else {
            console.warn('Loading screen element not found');
        }
    }

    hideLoadingScreen() {
        console.log('Hiding loading screen');
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        } else {
            console.warn('Loading screen element not found');
        }
    }

    async loadImage(id, src, optional = false) {
        try {
            console.log(`Loading image: ${id} from ${src}`);
            await delay(800);
            const image = new Image();
            const promise = new Promise((resolve, reject) => {
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            });

            image.src = `${src}?v=${this.version}`;
            const loadedImage = await promise;
            console.log(`Successfully loaded image: ${id}`);
            this.images.set(id, loadedImage);
            if (!optional) {
                this.loadedAssets++;
                this.updateProgress();
            }
            return loadedImage;
        } catch (error) {
            this.loadingErrors.set(id, error);
            console.error(`Error loading image ${id}:`, error);
            if (!optional) {
                this.loadedAssets++;
                this.updateProgress();
            }
            return null;
        }
    }

    async loadJSON(id, src, optional = false) {
        try {
            console.log(`Loading JSON asset: ${id} from ${src}`);
            await delay(1000);
            const response = await fetch(`${src}?v=${this.version}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(`Successfully loaded JSON asset: ${id}`, data);
            this.json.set(id, data);
            if (!optional) {
                this.loadedAssets++;
                console.log(`Progress: ${this.loadedAssets}/${this.totalAssets}`);
                this.updateProgress();
            }
            return data;
        } catch (error) {
            this.loadingErrors.set(id, error);
            console.error(`Error loading JSON ${id}:`, error);
            console.error('Full error details:', {
                id,
                src,
                error: error.toString(),
                stack: error.stack
            });
            if (!optional) {
                this.loadedAssets++;
                this.updateProgress();
            }
            return null;
        }
    }

    async loadManifest(manifestUrl) {
        try {
            console.log('Loading manifest from:', manifestUrl);
            const response = await fetch(manifestUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.manifest = await response.json();
            this.version = this.manifest.version || this.version;
            console.log('Manifest loaded successfully:', this.manifest);
            return this.manifest;
        } catch (error) {
            console.error('Error loading manifest:', error);
            console.error('Full error details:', {
                url: manifestUrl,
                error: error.toString(),
                stack: error.stack
            });
            throw error;
        }
    }

    async preloadAssets(manifestUrl) {
        console.log('Starting asset preload...');
        this.showLoadingScreen();
        this.loadedAssets = 0;
        this.loadingErrors.clear();

        try {
            const manifest = await this.loadManifest(manifestUrl);
            this.totalAssets = manifest.assets.filter(asset => !asset.optional).length;
            console.log(`Total assets to load: ${this.totalAssets}`);

            const loadPromises = manifest.assets.map(async (asset) => {
                const isOptional = asset.optional || false;
                console.log(`Processing asset: ${asset.id} (${asset.type}) - optional: ${isOptional}`);
                console.log(`Current progress before loading: ${this.loadedAssets}/${this.totalAssets}`);

                try {
                    switch (asset.type) {
                        case 'image':
                            return await this.loadImage(asset.id, asset.src, isOptional);
                        case 'audio':
                            return await this.audioManager.loadSound(asset.id, asset.src);
                        case 'music':
                            return await this.audioManager.loadMusic(asset.id, asset.src);
                        case 'json':
                            return await this.loadJSON(asset.id, asset.src, isOptional);
                        default:
                            console.warn(`Unknown asset type: ${asset.type}`);
                            return null;
                    }
                } catch (error) {
                    console.error(`Error loading asset ${asset.id}:`, error);
                    this.loadingErrors.set(asset.id, error);
                    return null;
                }
            });

            const results = await Promise.all(loadPromises);
            console.log('All assets processed:', results);

            if (this.loadingErrors.size > 0) {
                console.warn('Some assets failed to load:', this.loadingErrors);
            }

            if (this.loadedAssets !== this.totalAssets) {
                console.warn(`Asset count mismatch: loaded ${this.loadedAssets} of ${this.totalAssets}`);
                this.loadedAssets = this.totalAssets;
                this.updateProgress();
            }

            return {
                success: this.loadingErrors.size === 0,
                errors: this.loadingErrors,
                assetsLoaded: this.loadedAssets,
                totalAssets: this.totalAssets
            };
        } catch (error) {
            console.error('Error during preload:', error);
            throw error;
        }
    }

    getImage(id) {
        return this.images.get(id);
    }

    getJSON(id) {
        const data = this.json.get(id);
        console.log(`Getting JSON data for ${id}:`, data);
        return data;
    }

    playSound(id) {
        this.audioManager.playSound(id);
    }

    playMusic(id, loop = true) {
        this.audioManager.playMusic(id, loop);
    }

    stopMusic() {
        this.audioManager.stopMusic();
    }

    unloadAsset(id) {
        if (this.images.has(id)) {
            this.images.delete(id);
            return true;
        }
        if (this.json.has(id)) {
            this.json.delete(id);
            return true;
        }
        return false;
    }

    getLoadingStatus() {
        return {
            total: this.totalAssets,
            loaded: this.loadedAssets,
            progress: this.totalAssets ? (this.loadedAssets / this.totalAssets) * 100 : 0,
            errors: Array.from(this.loadingErrors.entries()).map(([id, error]) => ({
                id,
                error: error.message
            }))
        };
    }
}
