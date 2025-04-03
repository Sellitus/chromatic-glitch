import { Container, Graphics, Text } from 'pixi.js';
import { CardType } from '../../cards/CardType';
import { CardRarity } from '../../cards/CardRarity';

/**
 * Handles rendering of cards using PixiJS
 */
export class PixiCardRenderer {
    /**
     * Create a new card renderer
     * @param {Object} options Rendering options
     */
    constructor(options = {}) {
        // Default card dimensions
        this.cardWidth = options.cardWidth || 200;
        this.cardHeight = options.cardHeight || 280;
        
        // Default colors (dark, dreary theme inspired by Norco)
        this.colors = {
            background: 0x1a1a1a,
            border: 0x333333,
            text: 0xcccccc,
            cost: 0x8b4513,
            type: {
                [CardType.ATTACK]: 0x8b0000,   // Dark red
                [CardType.SKILL]: 0x228b22,    // Forest green
                [CardType.POWER]: 0x8a2be2,    // Blue violet
                [CardType.STATUS]: 0x696969,   // Dark gray
                [CardType.CURSE]: 0x800000     // Maroon
            },
            rarity: {
                [CardRarity.COMMON]: 0x505050,   // Gray
                [CardRarity.UNCOMMON]: 0x4169e1, // Royal blue
                [CardRarity.RARE]: 0xffd700,     // Gold
                [CardRarity.SPECIAL]: 0xda70d6   // Orchid
            }
        };

        // Text styles
        this.textStyles = {
            title: {
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0xffffff,
                align: 'center',
                stroke: 0x000000,
                strokeThickness: 2
            },
            cost: {
                fontFamily: 'Arial',
                fontSize: 24,
                fill: 0xffffff,
                align: 'center',
                stroke: 0x000000,
                strokeThickness: 3
            },
            description: {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0xffffff,
                align: 'center',
                wordWrap: true,
                stroke: 0x000000,
                strokeThickness: 1,
                wordWrapWidth: this.cardWidth - 20
            }
        };
    }

    /**
     * Creates a new card display object
     * @param {Card} cardData The card data to render
     * @returns {Container} A container with the card's visual elements
     */
    createCardDisplay(cardData) {
        const container = new Container();
        
        // Add background
        const background = this._createBackground(cardData.type);
        container.addChild(background);
        
        // Add border based on rarity
        const border = this._createBorder(cardData.rarity);
        container.addChild(border);
        
        // Add cost circle
        const costDisplay = this._createCostDisplay(cardData.cost);
        costDisplay.position.set(20, 20);
        container.addChild(costDisplay);
        
        // Add title
        const title = this._createTitle(cardData.name);
        title.position.set(this.cardWidth / 2, 30);
        container.addChild(title);
        
        // Add art placeholder
        const artPlaceholder = this._createArtPlaceholder();
        artPlaceholder.position.set(this.cardWidth / 2, 100);
        container.addChild(artPlaceholder);
        
        // Add description
        const description = this._createDescription(cardData.description);
        description.position.set(this.cardWidth / 2, 200);
        container.addChild(description);

        // Add upgrade indicator if applicable
        if (cardData.upgraded) {
            const upgradeIndicator = this._createUpgradeIndicator();
            upgradeIndicator.position.set(this.cardWidth - 20, 20);
            container.addChild(upgradeIndicator);
        }

        return container;
    }

    /**
     * Creates the card's background
     * @private
     */
    _createBackground(cardType) {
        const graphics = new Graphics();
        graphics.beginFill(this.colors.background);
        graphics.drawRoundedRect(0, 0, this.cardWidth, this.cardHeight, 15);
        graphics.endFill();
        
        // Add type-specific overlay
        graphics.beginFill(this.colors.type[cardType] || this.colors.type[CardType.STATUS], 0.2);
        graphics.drawRoundedRect(0, 0, this.cardWidth, this.cardHeight, 15);
        graphics.endFill();
        
        // Add inner glow
        graphics.lineStyle(2, this.colors.type[cardType] || this.colors.type[CardType.STATUS], 0.3);
        graphics.drawRoundedRect(5, 5, this.cardWidth - 10, this.cardHeight - 10, 12);
        
        return graphics;
    }

    /**
     * Creates the card's border
     * @private
     */
    _createBorder(rarity) {
        const graphics = new Graphics();
        const borderColor = this.colors.rarity[rarity] || this.colors.rarity[CardRarity.COMMON];
        graphics.lineStyle(3, borderColor);
        graphics.drawRoundedRect(0, 0, this.cardWidth, this.cardHeight, 15);
        return graphics;
    }

    /**
     * Creates the cost display circle
     * @private
     */
    _createCostDisplay(cost) {
        const container = new Container();
        
        // Main circle
        const circle = new Graphics();
        const radius = 22;
        
        // Outer glow
        circle.lineStyle(3, 0xffd700, 0.3);
        circle.drawCircle(0, 0, radius + 2);
        
        // Main circle fill
        circle.beginFill(this.colors.cost);
        circle.lineStyle(2, 0x000000, 1);
        circle.drawCircle(0, 0, radius);
        circle.endFill();
        
        // Inner highlight
        circle.lineStyle(1, 0xffffff, 0.2);
        circle.drawCircle(0, 0, radius - 4);
        
        container.addChild(circle);
        
        // Cost text
        const text = new Text(cost.toString(), this.textStyles.cost);
        text.anchor.set(0.5);
        container.addChild(text);
        
        return container;
    }

    /**
     * Creates the title text
     * @private
     */
    _createTitle(title) {
        const text = new Text(title, this.textStyles.title);
        text.anchor.set(0.5, 0);
        return text;
    }

    /**
     * Creates a placeholder for card art
     * @private
     */
    _createArtPlaceholder() {
        const graphics = new Graphics();
        const width = this.cardWidth - 40;
        const height = 100;
        
        // Background with gradient effect
        graphics.beginFill(0x222222);
        graphics.drawRoundedRect(-width/2, -height/2, width, height, 8);
        graphics.endFill();
        
        // Add a subtle pattern
        graphics.lineStyle(1, 0x333333, 0.5);
        for (let i = -width/2; i < width/2; i += 20) {
            graphics.moveTo(i, -height/2);
            graphics.lineTo(i + height, height/2);
        }
        
        return graphics;
    }

    /**
     * Creates the description text
     * @private
     */
    _createDescription(description) {
        const text = new Text(description, this.textStyles.description);
        text.anchor.set(0.5, 0);
        return text;
    }

    /**
     * Creates an upgrade indicator
     * @private
     */
    _createUpgradeIndicator() {
        const graphics = new Graphics();
        
        // Draw a star shape
        graphics.beginFill(0xffd700);
        const points = [];
        const spikes = 5;
        const outerRadius = 10;
        const innerRadius = 4;
        
        for(let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            points.push(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
            );
        }
        
        graphics.drawPolygon(points);
        graphics.endFill();
        
        return graphics;
    }
}
