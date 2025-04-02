import { Container } from 'pixi.js';
import { PixiCardRenderer } from '../renderers/PixiCardRenderer';
import { PixiCardEffects } from '../effects/PixiCardEffects';
import { PixiCardAnimations } from '../animations/PixiCardAnimations';

/**
 * Manages the display and interaction of cards in the player's hand
 */
export class PixiHandDisplay extends Container {
    /**
     * @param {Object} options Configuration options
     */
    constructor(options = {}) {
        super();

        this.width = options.width || 800;
        this.height = options.height || 200;
        
        // Initialize subsystems
        this.cardRenderer = new PixiCardRenderer();
        this.cardEffects = new PixiCardEffects();
        this.cardAnimations = new PixiCardAnimations();
        
        // Card management
        this.cards = new Map(); // Map of card.id to container
        this.selectedCard = null;
        
        // Hand layout properties
        this.cardSpacing = 80; // Horizontal space between cards
        this.cardOverlap = 0.8; // How much cards overlap (1 = no overlap)
        this.arcHeight = 50; // Height of hand arc
        this.cardScale = 0.8; // Base scale for cards in hand
        
        // Interaction state
        this.isDragging = false;
        this.dragTarget = null;
        this.dragStartPos = null;
        this.hoveredCard = null;
        
        // Enable interaction
        this.interactive = true;
        this.interactiveChildren = true;
        
        // Setup event listeners
        this._setupInteraction();
    }

    /**
     * Adds a card to the hand
     * @param {Card} card Card data to add
     * @param {boolean} animate Whether to animate the card entry
     */
    async addCard(card, animate = true) {
        // Create card display object
        const cardContainer = this.cardRenderer.createCardDisplay(card);
        cardContainer.scale.set(this.cardScale);
        
        // Store reference
        this.cards.set(card.id, {
            container: cardContainer,
            data: card
        });
        
        // Add to display
        this.addChild(cardContainer);
        
        // Position the card (initially at deck position if animating)
        const finalPos = this._calculateCardPosition(this.cards.size - 1);
        if (animate) {
            const deckPos = { x: this.width / 2, y: -200 };
            await this.cardAnimations.animateDrawCard(cardContainer, deckPos, finalPos);
        } else {
            cardContainer.position.copyFrom(finalPos);
        }
        
        // Rearrange hand
        this._layoutCards();
    }

    /**
     * Removes a card from the hand
     * @param {string} cardId ID of card to remove
     * @param {Object} targetPos Position to animate to (optional)
     */
    async removeCard(cardId, targetPos) {
        const card = this.cards.get(cardId);
        if (!card) return;
        
        if (targetPos) {
            // Animate to target (e.g., play or discard animation)
            await this.cardAnimations.animateDiscardCard(card.container, targetPos);
        }
        
        // Remove from display and tracking
        this.removeChild(card.container);
        this.cards.delete(cardId);
        
        // Re-layout remaining cards
        this._layoutCards();
    }

    /**
     * Updates the hand display
     * @param {number} deltaTime Time since last update in milliseconds
     */
    update(deltaTime) {
        // Update animations
        this.cardAnimations.update(deltaTime);
        
        // Update drag if active
        if (this.isDragging && this.dragTarget) {
            this._updateDrag();
        }
    }

    /**
     * Calculates the position for a card in the hand
     * @private
     */
    _calculateCardPosition(index) {
        const totalCards = this.cards.size;
        if (totalCards === 0) return { x: 0, y: 0 };
        
        // Calculate spread
        const totalWidth = (totalCards - 1) * (this.cardSpacing * this.cardOverlap);
        const startX = (this.width - totalWidth) / 2;
        
        // Position along arc
        const x = startX + (index * this.cardSpacing * this.cardOverlap);
        const progress = (x - startX) / totalWidth;
        const normalizedProgress = progress * 2 - 1; // -1 to 1
        const y = this.arcHeight * (1 - (normalizedProgress * normalizedProgress));
        
        return { x, y: this.height - y };
    }

    /**
     * Arranges all cards in the hand
     * @private
     */
    _layoutCards() {
        let index = 0;
        for (const [_, card] of this.cards) {
            if (card.container !== this.dragTarget) {
                const pos = this._calculateCardPosition(index);
                this.cardAnimations.animateCardMove(card.container, pos);
            }
            index++;
        }
    }

    /**
     * Sets up interaction handlers
     * @private
     */
    _setupInteraction() {
        // Pointer over card
        this.on('mouseover', (event) => {
            const cardContainer = event.target;
            const cardData = this._findCardData(cardContainer);
            if (cardData && cardContainer !== this.dragTarget) {
                this.hoveredCard = cardData;
                this.cardEffects.applyHoverEffect(cardContainer);
                cardContainer.zIndex = 1;
            }
        });
        
        // Pointer out
        this.on('mouseout', (event) => {
            const cardContainer = event.target;
            const cardData = this._findCardData(cardContainer);
            if (cardData && cardContainer !== this.dragTarget) {
                this.hoveredCard = null;
                this.cardEffects.removeHoverEffect(cardContainer);
                cardContainer.zIndex = 0;
            }
        });
        
        // Drag start
        this.on('mousedown', (event) => {
            const cardContainer = event.target;
            const cardData = this._findCardData(cardContainer);
            if (cardData) {
                this.isDragging = true;
                this.dragTarget = cardContainer;
                this.dragStartPos = {
                    x: cardContainer.position.x - event.data.global.x,
                    y: cardContainer.position.y - event.data.global.y
                };
                cardContainer.zIndex = 2;
            }
        });
        
        // Drag end
        this.on('mouseup', () => this._endDrag());
        this.on('mouseupoutside', () => this._endDrag());
    }

    /**
     * Updates drag position
     * @private
     */
    _updateDrag() {
        if (!this.dragTarget || !this.dragStartPos) return;
        
        const newPosition = this.dragTarget.position;
        this.cardAnimations.animateCardMove(this.dragTarget, {
            x: this.dragTarget.position.x,
            y: this.dragTarget.position.y - 50 // Lift card while dragging
        });
    }

    /**
     * Ends the current drag operation
     * @private
     */
    _endDrag() {
        if (this.dragTarget) {
            this.isDragging = false;
            const cardIndex = Array.from(this.cards.values())
                .findIndex(card => card.container === this.dragTarget);
            const finalPos = this._calculateCardPosition(cardIndex);
            this.cardAnimations.animateCardMove(this.dragTarget, finalPos);
            this.dragTarget.zIndex = 0;
            this.dragTarget = null;
            this.dragStartPos = null;
        }
    }

    /**
     * Finds card data for a container
     * @private
     */
    _findCardData(container) {
        for (const [id, card] of this.cards) {
            if (card.container === container) {
                return card;
            }
        }
        return null;
    }
}
