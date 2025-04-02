import { Container } from 'pixi.js';
import { PixiCardRenderer } from '../renderers/PixiCardRenderer';
import { PixiCardEffects } from '../effects/PixiCardEffects';

/**
 * Handles the preview/zoom display of cards
 */
export class PixiCardPreview extends Container {
    /**
     * @param {Object} options Configuration options
     */
    constructor(options = {}) {
        super();

        // Preview configuration
        this.previewScale = options.scale || 1.5;
        this.fadeTime = options.fadeTime || 150;
        this.offset = options.offset || { x: 100, y: 0 }; // Offset from cursor
        
        // Initialize subsystems
        this.cardRenderer = new PixiCardRenderer({
            cardWidth: 300,  // Larger size for preview
            cardHeight: 420
        });
        this.cardEffects = new PixiCardEffects();
        
        // State
        this.visible = false;
        this.currentCard = null;
        this.targetAlpha = 0;
        this.fadeStart = 0;
        
        // Initial setup
        this.alpha = 0;
    }

    /**
     * Shows the preview for a card
     * @param {Card} card Card data to preview
     * @param {number} x X position for preview
     * @param {number} y Y position for preview
     */
    showPreview(card, x, y) {
        // Don't recreate if same card
        if (this.currentCard?.id === card.id) {
            this._updatePosition(x, y);
            return;
        }
        
        // Clear existing preview
        this.removeChildren();
        
        // Create new preview
        const cardContainer = this.cardRenderer.createCardDisplay(card);
        cardContainer.scale.set(this.previewScale);
        this.addChild(cardContainer);
        
        // Add rarity glow
        this.cardEffects.applyRarityGlow(cardContainer, card.rarity);
        
        // Store reference
        this.currentCard = card;
        
        // Position and show
        this._updatePosition(x, y);
        this.visible = true;
        this.targetAlpha = 1;
        this.fadeStart = Date.now();
    }

    /**
     * Hides the preview
     */
    hidePreview() {
        this.targetAlpha = 0;
        this.fadeStart = Date.now();
    }

    /**
     * Updates the preview
     * @param {number} deltaTime Time since last update in milliseconds
     */
    update(deltaTime) {
        // Handle fade animation
        if (this.alpha !== this.targetAlpha) {
            const elapsed = Date.now() - this.fadeStart;
            const progress = Math.min(elapsed / this.fadeTime, 1);
            
            this.alpha = this.targetAlpha === 1
                ? progress
                : 1 - progress;
            
            // Hide container when fade out complete
            if (this.alpha === 0) {
                this.visible = false;
                this.currentCard = null;
            }
        }
    }

    /**
     * Updates the preview position
     * @param {number} x Base X position (usually cursor)
     * @param {number} y Base Y position (usually cursor)
     * @private
     */
    _updatePosition(x, y) {
        // Position relative to cursor with offset
        const targetX = x + this.offset.x;
        const targetY = y + this.offset.y;
        
        // Ensure preview stays within stage bounds
        const stage = this.parent;
        if (stage) {
            const previewBounds = this.getBounds();
            
            // Check right edge
            if (targetX + previewBounds.width > stage.width) {
                // Flip to left side of cursor
                this.position.x = x - previewBounds.width - this.offset.x;
            } else {
                this.position.x = targetX;
            }
            
            // Check bottom edge
            if (targetY + previewBounds.height > stage.height) {
                // Move up to fit
                this.position.y = stage.height - previewBounds.height;
            } else {
                this.position.y = targetY;
            }
        } else {
            // No stage reference, use raw position
            this.position.set(targetX, targetY);
        }
    }

    /**
     * Gets the current preview card
     * @returns {Card|null} The currently previewed card or null
     */
    getCurrentCard() {
        return this.currentCard;
    }
}
