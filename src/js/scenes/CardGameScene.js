import { PixiScene } from '../engine/PixiScene';
import { PixiHandDisplay } from '../ui/components/PixiHandDisplay';
import { PixiDrawPileDisplay } from '../ui/components/PixiDrawPileDisplay';

import { PixiCardPreview } from '../ui/components/PixiCardPreview';
import { CardType } from '../cards/CardType.js'; // Import CardType
import { Card } from '../cards/Card.js'; // Import Card class

/**
 * Scene that handles card-based gameplay
 */
export class CardGameScene extends PixiScene {
    constructor(pixiApp) {
        super('cardGame', pixiApp);
        
        // Components
        this.handDisplay = null;
        this.cardPreview = null;
        
        this.drawPileDisplay = null;

        // Game state
        this.playerHand = [];
        this.drawPileSize = 30; // Initial number of cards in draw pile
        // No need for CardFactory instance here for test data
    }

    /**
     * Initialize the scene
     */
    init() {
        super.init();

        // Create hand display
        this.handDisplay = new PixiHandDisplay({
            width: this.pixiApp.getApp().screen.width,
            height: 220
        });
        this.handDisplay.position.set(
            this.pixiApp.getApp().screen.width / 2 - this.handDisplay.width / 2,
            this.pixiApp.getApp().screen.height - 240
        );
        this.getContainer('ui').addChild(this.handDisplay);

        // Create card preview
        this.cardPreview = new PixiCardPreview({
            scale: 1.5
        });
        this.getContainer('preview').addChild(this.cardPreview);


        // Create draw pile display
        this.drawPileDisplay = new PixiDrawPileDisplay();
        // Position it (e.g., top right corner - adjust as needed)
        this.drawPileDisplay.position.set(
            this.pixiApp.getApp().screen.width - 180, // Move left a bit to account for larger cards
            50 // Example Y
        );
        // Set initial draw pile count
        this.drawPileDisplay.updateCount(this.drawPileSize);
        this.getContainer('ui').addChild(this.drawPileDisplay); // Assuming a 'ui' container exists

        // Setup preview interaction with hand
        this._setupPreviewInteraction();

        // Initial layout
        this._handleResize({
            width: this.pixiApp.getApp().screen.width,
            height: this.pixiApp.getApp().screen.height
        });

        // Deal initial hand
        this.dealCards(5);
    }

    /**
     * Handle window resize
     * @param {Object} dimensions New dimensions
     * @private
     */
    _handleResize({ width, height }) {
        if (this.handDisplay) {
            this.handDisplay.width = width;
            this.handDisplay.position.set(
                width / 2 - this.handDisplay.width / 2,
                height - 240
            );
        }

        if (this.drawPileDisplay) {
            // Keep draw pile in top right corner
            this.drawPileDisplay.position.set(
                width - 180,
                50
            );
        }
    }

    /**
     * Setup preview interaction
     * @private
     */
    _setupPreviewInteraction() {
        // Track mouse position for preview
        this.pixiApp.getApp().stage.interactive = true;
        this.pixiApp.getApp().stage.on('mousemove', (event) => {
            if (this.cardPreview.getCurrentCard()) {
                this.cardPreview.showPreview(
                    this.cardPreview.getCurrentCard(),
                    event.data.global.x,
                    event.data.global.y
                );
            }
        });

        // Listen for hover events from hand display
        this.handDisplay.on('cardHoverStart', (card) => {
            this.cardPreview.showPreview(
                card,
                this.pixiApp.getApp().renderer.plugins.interaction.mouse.global.x,
                this.pixiApp.getApp().renderer.plugins.interaction.mouse.global.y
            );
        });

        this.handDisplay.on('cardHoverEnd', () => {
            this.cardPreview.hidePreview();
        });
    }

    /**
     * Deal cards to the player's hand
     * @param {number} count Number of cards to deal
     */
    async dealCards(count) {
        // Check if we have enough cards to deal
        if (count > this.drawPileSize) {
            count = this.drawPileSize;
        }

        for (let i = 0; i < count; i++) {
            // Create a test card (replace with actual card creation logic)
            const cardDefinition = {
                id: `test_${i + 1}`, // Add required ID
                name: `Ability ${i + 1}`,
                description: 'This is a test card with some effect description that might be long enough to wrap.',
                cost: Math.floor(Math.random() * 3) + 1,
                type: 'MELODY', // Use valid card type from enum
                rarity: 'COMMON', // Start with common cards
                effectKey: 'placeholderEffect' // Add required effectKey
            };
            const card = new Card(cardDefinition); // Instantiate Card directly

            // Add to hand with animation
            await this.handDisplay.addCard(card, true);
            this.playerHand.push(card);

            // Small delay between dealing cards
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Update draw pile size and display
            this.drawPileSize--;
            this.drawPileDisplay.updateCount(this.drawPileSize);
        }
    }

    /**
     * Update scene logic
     * @param {number} deltaTime Time elapsed since last update in milliseconds
     */
    update(deltaTime) {
        if (this.isPaused) return;

        // Update components
        if (this.handDisplay) {
            this.handDisplay.update(deltaTime);
        }
        if (this.cardPreview) {
            this.cardPreview.update(deltaTime);
        }
        if (this.drawPileDisplay) {
            this.drawPileDisplay.update(deltaTime);
        }

    }

    /**
     * Clean up scene resources
     */
    destroy() {
        if (this.handDisplay) {
            this.handDisplay.destroy({ children: true });
            this.handDisplay = null;
        }
        if (this.cardPreview) {
            this.cardPreview.destroy({ children: true });
            this.cardPreview = null;
        }
        if (this.drawPileDisplay) {
            this.drawPileDisplay.destroy({ children: true });
            this.drawPileDisplay = null;
        }


        super.destroy();
    }
}
