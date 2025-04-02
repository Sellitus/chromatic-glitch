import { filters } from 'pixi.js';

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
        const glowFilter = new filters.GlowFilter({
            distance: 15,
            outerStrength: 1.5,
            innerStrength: 0.5,
            color: this.colors.hover,
            quality: 0.5
        });

        // Scale up slightly
        cardContainer.scale.set(1.1);
        
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
        
        // Remove glow filter
        if (cardContainer.filters) {
            cardContainer.filters = cardContainer.filters.filter(
                filter => !(filter instanceof filters.GlowFilter)
            );
        }
    }

    /**
     * Applies a selection effect to a card container
     * @param {PIXI.Container} cardContainer The card's container
     */
    applySelectionEffect(cardContainer) {
        // Create a highlight filter
        const highlightFilter = new filters.ColorMatrixFilter();
        highlightFilter.brightness(1.2);
        
        // Add outline glow
        const glowFilter = new filters.GlowFilter({
            distance: 10,
            outerStrength: 2,
            innerStrength: 1,
            color: this.colors.selected,
            quality: 0.5
        });
        
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
                filter => !(filter instanceof filters.ColorMatrixFilter) &&
                         !(filter instanceof filters.GlowFilter)
            );
        }
    }

    /**
     * Applies a disabled effect to a card container
     * @param {PIXI.Container} cardContainer The card's container
     */
    applyDisabledEffect(cardContainer) {
        // Create grayscale and darken filters
        const grayscaleFilter = new filters.ColorMatrixFilter();
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
                filter => !(filter instanceof filters.ColorMatrixFilter)
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
        
        const glowFilter = new filters.GlowFilter({
            distance: 15,
            outerStrength: 1,
            innerStrength: 0.3,
            color: glowColor,
            quality: 0.5
        });
        
        cardContainer.filters = cardContainer.filters || [];
        cardContainer.filters.push(glowFilter);
    }

    /**
     * Applies a generic highlight effect
     * @param {PIXI.Container} cardContainer The card's container
     * @param {number} color The color to highlight with
     */
    applyHighlight(cardContainer, color) {
        const highlightFilter = new filters.GlowFilter({
            distance: 8,
            outerStrength: 2,
            innerStrength: 0.5,
            color: color,
            quality: 0.5
        });
        
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
