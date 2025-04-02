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
                [CardType.SKILL]: 0x006400,    // Dark green
                [CardType.POWER]: 0x4b0082,    // Dark purple
                [CardType.STATUS]: 0x696969,   // Dark gray
                [CardType.CURSE]: 0x800000     // Maroon
            },
            rarity: {
                [CardRarity.COMMON]: 0x505050,   // Gray
                [CardRarity.UNCOMMON]: 0x1e90ff, // Blue
                [CardRarity.RARE]: 0xffd700,     // Gold
                [CardRarity.SPECIAL]: 0xff1493   // Pink
            }
        };

        // Text styles
        this.textStyles = {
            title: {
                fontFamily: 'Arial',
                fontSize: 18,
                fill: this.colors.text,
                align: 'center'
            },
            cost: {
                fontFamily: 'Arial',
                fontSize: 24,
                fill: this.colors.text,
                align: 'center'
            },
            description: {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: this.colors.text,
                align: 'center',
                wordWrap: true,
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
        graphics.drawRoundedRect(0, 0, this.cardWidth, this.cardHeight, 10);
        graphics.endFill();
        
        // Add type-specific overlay
        graphics.beginFill(this.colors.type[cardType] || this.colors.type[CardType.STATUS], 0.2);
        graphics.drawRoundedRect(0, 0, this.cardWidth, this.cardHeight, 10);
        graphics.endFill();
        
        return graphics;
    }

    /**
     * Creates the card's border
     * @private
     */
    _createBorder(rarity) {
        const graphics = new Graphics();
        const borderColor = this.colors.rarity[rarity] || this.colors.rarity[CardRarity.COMMON];
        graphics.lineStyle(2, borderColor);
        graphics.drawRoundedRect(0, 0, this.cardWidth, this.cardHeight, 10);
        return graphics;
    }

    /**
     * Creates the cost display circle
     * @private
     */
    _createCostDisplay(cost) {
        const container = new Container();
        
        // Circle background
        const circle = new Graphics();
        circle.beginFill(this.colors.cost);
        circle.drawCircle(0, 0, 20);
        circle.endFill();
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
        const height = 80;
        
        // Draw placeholder rectangle
        graphics.beginFill(0x333333);
        graphics.drawRect(-width/2, -height/2, width, height);
        graphics.endFill();
        
        // Add crossed lines
        graphics.lineStyle(1, 0x444444);
        graphics.moveTo(-width/2, -height/2);
        graphics.lineTo(width/2, height/2);
        graphics.moveTo(width/2, -height/2);
        graphics.lineTo(-width/2, height/2);
        
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
