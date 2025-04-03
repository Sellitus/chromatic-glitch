import * as PIXI from 'pixi.js';

/**
 * Basic display for the draw pile.
 */
export class PixiDrawPileDisplay extends PIXI.Container {
    constructor(options = {}) {
        super();

        this.interactive = true; // Make it clickable, etc.
        this.buttonMode = true;

        // Card dimensions
        this.cardWidth = 120;
        this.cardHeight = 160;
        
        // Create multiple stack layers for depth effect
        this.stackCards = [];
        
        // Create more cards for a deeper stack effect
        for (let i = 0; i < 5; i++) {
            const card = new PIXI.Graphics();
            
            // Gradient-like effect with slightly different colors
            const color = i === 4 ? 0x1a4d80 : 0x003366; // Top card slightly lighter
            card.beginFill(color);
            card.drawRect(0, 0, this.cardWidth, this.cardHeight);
            card.endFill();
            
            // Add border with slight transparency for depth effect
            const alpha = 0.5 + (i * 0.1); // Increase opacity for cards closer to top
            card.lineStyle(2, 0xFFFFFF, alpha);
            card.drawRect(0, 0, this.cardWidth, this.cardHeight);
            
            // Progressive offset for stack effect
            card.position.set(-4 + (i * 2), -4 + (i * 2));
            
            // Add inner border for more detailed look
            card.lineStyle(1, 0xFFFFFF, 0.3);
            card.drawRect(5, 5, this.cardWidth - 10, this.cardHeight - 10);
            
            this.stackCards.push(card);
            this.addChild(card);
        }
        
        // Add a text element to show card count (optional, placeholder)
        this.countText = new PIXI.Text('?', {
            fontFamily: 'Arial',
            fontSize: 40,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowAlpha: 0.5,
            dropShadowAngle: Math.PI / 4,
            dropShadowBlur: 4,
            dropShadowDistance: 2,
            fill: 0xffffff,
            align: 'center',
            stroke: 0x000000,
            strokeThickness: 4,
        });
        this.countText.anchor.set(0.5);
        this.countText.position.set(this.cardWidth / 2, this.cardHeight / 2);
        this.addChild(this.countText);

        // Apply options if needed (e.g., position is set in the scene)
        Object.assign(this, options);

        // Add a name property so Pixi dev tools can identify it (optional but helpful)
        this.name = 'DrawPileDisplay';

        // Note: This component does NOT create a DOM element with ID '#draw-pile-container'.
        // The integration test needs to be adjusted if it relies on that ID.
    }

    /**
     * Update the display (e.g., card count).
     * @param {number} count - The number of cards in the draw pile.
     */
    updateCount(count) {
        this.countText.text = `${count}`;
        
        // Show/hide stack effect based on count
        this.stackCards.forEach((card, index) => {
            if (count === 0) {
                card.visible = false;
            } else {
                // Show more cards in stack as count increases
                card.visible = count > Math.floor(index * (30 / this.stackCards.length));
            }
        });
    }

    /**
     * Update logic (e.g., animations).
     * @param {number} deltaTime - Time since last update in ms.
     */
    update(deltaTime) {
        // Add any update logic here (e.g., animations)
    }

    // Override destroy to clean up listeners if any are added
    destroy(options) {
        // Remove any event listeners added specific to this component
        super.destroy(options);
    }
}