// AudioManager is now passed in
// import { AudioManager } from './audioManager.js'; 

export class AssetManager {
    constructor(audioManager) { // Accept audioManager as argument
        if (!audioManager) {
            throw new Error("AssetManager requires an AudioManager instance.");
        }
        this.audioManager = audioManager; // Use the passed instance
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
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressFill = document.querySelector('.progress-fill');
        this.progressText = document.querySelector('.progress-text');
    }

    // init() method is removed as it's no longer needed here.
    // AudioEngine initialization is handled in index.js

    updateProgress() {
        const progress = (this.loadedAssets / this.totalAssets) * 100;

        if (this.progressFill && this.progressText) {
            this.progressFill.style.width = `${progress}%`;
            this.progressText.textContent = `Loading: ${Math.round(progress)}%`;
        }

        if (this.loadedAssets === this.totalAssets) {
            this.hideLoadingScreen();
        }
    }

    showLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('hidden');
        }
    }

    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }

    async loadImage(id, src, optional = false) {
        try {
            const image = new Image();
            const promise = new Promise((resolve, reject) => {
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            });

            image.src = `${src}?v=${this.version}`;
            const loadedImage = await promise;
            this.images.set(id, loadedImage);
            if (!optional) {
                this.loadedAssets++;
                this.updateProgress();
            }
            return loadedImage;
        } catch (error) {
            this.loadingErrors.set(id, error);
            if (!optional) {
                this.loadedAssets++;
                this.updateProgress();
            }
            throw error;
        }
    }

    async loadJSON(id, src, optional = false) {
        try {
            const response = await fetch(`${src}?v=${this.version}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.json.set(id, data);
            if (!optional) {
                this.loadedAssets++;
                this.updateProgress();
            }
            return data;
        } catch (error) {
            this.loadingErrors.set(id, error);
            if (!optional) {
                this.loadedAssets++;
                this.updateProgress();
            }
            throw error;
        }
    }

    async loadManifest(manifestUrl) {
        try {
            const response = await fetch(manifestUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.manifest = await response.json();
            this.version = this.manifest.version || this.version;
            return this.manifest;
        } catch (error) {
            throw error;
        }
    }

    async preloadAssets(manifestUrl) {
        this.showLoadingScreen();
        this.loadedAssets = 0;
        this.loadingErrors.clear();

        try {
            const manifest = await this.loadManifest(manifestUrl);
            const requiredAssets = manifest.assets.filter(asset => !asset.optional);
            this.totalAssets = requiredAssets.length;

            const loadPromises = manifest.assets.map(async (asset) => {
                const isOptional = asset.optional || false;
                
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
                    this.loadingErrors.set(asset.id, error);
                    return null;
                }
            });

            await Promise.all(loadPromises);

            return {
                success: this.loadingErrors.size === 0,
                totalAssets: this.totalAssets,
                assetsLoaded: this.loadedAssets
            };
        } catch (error) {
            throw error;
        }
    }

    getImage(id) {
        return this.images.get(id);
    }

    getJSON(id) {
        return this.json.get(id);
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
