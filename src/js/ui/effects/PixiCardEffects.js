import { BlurFilter, ColorMatrixFilter } from 'pixi.js';

/**
 * Manages visual effects for cards using PixiJS
 */
export class PixiCardEffects {
    constructor() {
        // Effect-specific colors (dark, dreary theme)
        this.colors = {
            hover: 0x3d3d3d,
            selected: 0x4a4a4a,
            disabled: 0x1a1a1a,
            glow: {
                common: 0x404040,
                uncommon: 0x104e8b,
                rare: 0x8b7500,
                special: 0x8b1a62
            }
        };
    }

    /**
     * Applies a hover effect to a card container
     * @param {PIXI.Container} cardContainer The card's container
     */
    applyHoverEffect(cardContainer) {
        // Create a glow filter
        const glowFilter = new BlurFilter(15);
        glowFilter.tint = 0x6495ED; // Cornflower blue for better visibility
        glowFilter.alpha = 0.7;

        // Scale up and lift card
        cardContainer.scale.set(1.2);
        cardContainer.position.y -= 40; // Lift card up when hovered
        
        // Add the glow
        cardContainer.filters = cardContainer.filters || [];
        cardContainer.filters.push(glowFilter);
    }

    /**
     * Removes hover effect from a card container
     * @param {PIXI.Container} cardContainer The card's container
     */
    removeHoverEffect(cardContainer) {
        // Reset scale
        cardContainer.scale.set(1.0);
        cardContainer.position.y += 40; // Return to original position
        
        // Remove glow filter
        if (cardContainer.filters) {
            cardContainer.filters = cardContainer.filters.filter(
                filter => !(filter instanceof BlurFilter)
            );
        }
    }

    /**
     * Applies a selection effect to a card container
     * @param {PIXI.Container} cardContainer The card's container
     */
    applySelectionEffect(cardContainer) {
        // Create a highlight filter
        const highlightFilter = new ColorMatrixFilter();
        highlightFilter.brightness(1.2);
        
        // Add outline glow
        const glowFilter = new BlurFilter(10);
        glowFilter.tint = this.colors.selected;
        glowFilter.alpha = 0.7;
        
        // Apply filters
        cardContainer.filters = cardContainer.filters || [];
        cardContainer.filters.push(highlightFilter, glowFilter);
    }

    /**
     * Removes selection effect from a card container
     * @param {PIXI.Container} cardContainer The card's container
     */
    removeSelectionEffect(cardContainer) {
        if (cardContainer.filters) {
            cardContainer.filters = cardContainer.filters.filter(
                filter => !(filter instanceof ColorMatrixFilter) &&
                         !(filter instanceof BlurFilter)
            );
        }
    }

    /**
     * Applies a disabled effect to a card container
     * @param {PIXI.Container} cardContainer The card's container
     */
    applyDisabledEffect(cardContainer) {
        // Create grayscale and darken filters
        const grayscaleFilter = new ColorMatrixFilter();
        grayscaleFilter.desaturate();
        grayscaleFilter.brightness(0.7);
        
        // Apply filters
        cardContainer.filters = cardContainer.filters || [];
        cardContainer.filters.push(grayscaleFilter);
        
        // Reduce opacity
        cardContainer.alpha = 0.7;
    }

    /**
     * Removes disabled effect from a card container
     * @param {PIXI.Container} cardContainer The card's container
     */
    removeDisabledEffect(cardContainer) {
        if (cardContainer.filters) {
            cardContainer.filters = cardContainer.filters.filter(
                filter => !(filter instanceof ColorMatrixFilter)
            );
        }
        cardContainer.alpha = 1.0;
    }

    /**
     * Applies a rarity-based glow effect
     * @param {PIXI.Container} cardContainer The card's container
     * @param {string} rarity The card's rarity
     */
    applyRarityGlow(cardContainer, rarity) {
        const glowColor = this.colors.glow[rarity.toLowerCase()] || this.colors.glow.common;
        
        const glowFilter = new BlurFilter(15);
        glowFilter.tint = glowColor;
        glowFilter.alpha = 0.3;
        
        cardContainer.filters = cardContainer.filters || [];
        cardContainer.filters.push(glowFilter);
    }

    /**
     * Applies a generic highlight effect
     * @param {PIXI.Container} cardContainer The card's container
     * @param {number} color The color to highlight with
     */
    applyHighlight(cardContainer, color) {
        const highlightFilter = new BlurFilter(8);
        highlightFilter.tint = color;
        highlightFilter.alpha = 0.5;
        
        cardContainer.filters = cardContainer.filters || [];
        cardContainer.filters.push(highlightFilter);
    }

    /**
     * Removes all effects from a card container
     * @param {PIXI.Container} cardContainer The card's container
     */
    removeAllEffects(cardContainer) {
        cardContainer.filters = [];
        cardContainer.alpha = 1.0;
        cardContainer.scale.set(1.0);
    }
}
