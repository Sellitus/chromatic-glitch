import { PixiScene } from '../engine/PixiScene';
import { PixiHandDisplay } from '../ui/components/PixiHandDisplay';
import { PixiCardPreview } from '../ui/components/PixiCardPreview';
import { CardFactory } from '../cards/CardFactory';

/**
 * Scene that handles card-based gameplay
 */
export class CardGameScene extends PixiScene {
    constructor(pixiApp) {
        super('cardGame', pixiApp);
        
        // Components
        this.handDisplay = null;
        this.cardPreview = null;
        
        // Game state
        this.playerHand = [];
        this.cardFactory = new CardFactory();
    }

    /**
     * Initialize the scene
     */
    init() {
        super.init();

        // Create hand display
        this.handDisplay = new PixiHandDisplay({
            width: this.pixiApp.getApp().screen.width,
            height: 200
        });
        this.handDisplay.position.set(
            0,
            this.pixiApp.getApp().screen.height - 220
        );
        this.getContainer('cards').addChild(this.handDisplay);

        // Create card preview
        this.cardPreview = new PixiCardPreview({
            scale: 1.5
        });
        this.getContainer('preview').addChild(this.cardPreview);

        // Setup preview interaction with hand
        this._setupPreviewInteraction();

        // Initial layout
        this._handleResize({
            width: this.pixiApp.getApp().screen.width,
            height: this.pixiApp.getApp().screen.height
        });
    }

    /**
     * Handle window resize
     * @param {Object} dimensions New dimensions
     * @private
     */
    _handleResize({ width, height }) {
        if (this.handDisplay) {
            this.handDisplay.width = width;
            this.handDisplay.position.set(0, height - 220);
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
        for (let i = 0; i < count; i++) {
            // Create a test card (replace with actual card creation logic)
            const card = this.cardFactory.createCard({
                name: `Test Card ${i + 1}`,
                description: 'This is a test card with some effect description that might be long enough to wrap.',
                cost: Math.floor(Math.random() * 3) + 1,
                type: ['ATTACK', 'SKILL', 'POWER'][Math.floor(Math.random() * 3)],
                rarity: ['COMMON', 'UNCOMMON', 'RARE'][Math.floor(Math.random() * 3)]
            });

            // Add to hand with animation
            await this.handDisplay.addCard(card, true);
            this.playerHand.push(card);

            // Small delay between dealing cards
            await new Promise(resolve => setTimeout(resolve, 100));
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

        super.destroy();
    }
}
