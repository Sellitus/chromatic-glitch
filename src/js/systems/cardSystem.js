import { cardDatabase } from '../cards/CardDatabase.js';
import { CardFactory } from '../cards/CardFactory.js';
import { cardEffectRegistry } from '../cards/CardEffectRegistry.js';
import '../cards/effects/index.js'; // Register default effects

export class CardSystem {
    /**
     * Initialize the card system
     * @param {Object} eventSystem - Game event system
     * @param {Object} store - Redux store for state management
     */
    constructor(eventSystem, store) {
        this.eventSystem = eventSystem;
        this.store = store;
        this.cards = new Map();
        this.draggingCard = null;
        this.dragOffset = { x: 0, y: 0 };

        // Load card definitions
        this.loadCardDefinitions();
    }

    /**
     * Load card definitions from JSON
     */
    async loadCardDefinitions() {
        try {
            const response = await fetch('/assets/json/cards/definitions.json');
            const data = await response.json();
            cardDatabase.loadDefinitions(data.cards);
        } catch (error) {
            console.error('Failed to load card definitions:', error);
        }
    }

    init() {
        // Register event listeners
        this.eventSystem.on('card:play', this.handleCardPlay.bind(this));
        this.eventSystem.on('card:draw', this.handleCardDraw.bind(this));
        this.eventSystem.on('card:discard', this.handleCardDiscard.bind(this));
        this.eventSystem.on('card:upgrade', this.handleCardUpgrade.bind(this));
        this.eventSystem.on('card:discover', this.handleCardDiscover.bind(this));

        // Set up mouse event listeners
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    update() {
        // Update card animations and states
    }

    render(ctx) {
        // Render all visible cards
        this.renderHand(ctx);
        this.renderDraggingCard(ctx);
    }

    renderHand(ctx) {
        // Implementation will render the player's hand
    }

    renderDraggingCard(ctx) {
        if (this.draggingCard) {
            // Render the card being dragged
        }
    }

    /**
     * Handle playing a card
     * @param {Object} data - Play data
     * @param {string} data.cardId - ID of card being played
     * @param {Object} data.target - Target of the card effect
     */
    async handleCardPlay(data) {
        const { cardId, target } = data;
        const card = this.getCard(cardId);
        
        if (!card) {
            console.error(`Attempted to play nonexistent card: ${cardId}`);
            return;
        }

        try {
            // Execute the card's effect
            await cardEffectRegistry.executeEffect(card.effectKey, {
                card,
                target,
                source: this.store.getState().player, // Assuming player state exists
                gameState: this.store.getState()
            });

            // Emit success event
            this.eventSystem.emit('card:played', { cardId, target });
        } catch (error) {
            console.error('Error playing card:', error);
            this.eventSystem.emit('card:playFailed', { cardId, error: error.message });
        }
    }

    /**
     * Handle drawing cards
     * @param {Object} data - Draw data
     * @param {number} data.count - Number of cards to draw
     */
    handleCardDraw(data) {
        const { count = 1 } = data;
        try {
            const drawnCards = CardFactory.createRandomCards(count);
            drawnCards.forEach(card => {
                this.cards.set(card.id, card);
                this.eventSystem.emit('card:drawn', { cardId: card.id });
            });
        } catch (error) {
            console.error('Error drawing cards:', error);
            this.eventSystem.emit('card:drawFailed', { error: error.message });
        }
    }

    /**
     * Handle discarding a card
     * @param {Object} data - Discard data
     * @param {string} data.cardId - ID of card to discard
     */
    handleCardDiscard(data) {
        const { cardId } = data;
        if (this.cards.delete(cardId)) {
            this.eventSystem.emit('card:discarded', { cardId });
        }
    }

    /**
     * Handle upgrading a card
     * @param {Object} data - Upgrade data
     * @param {string} data.cardId - ID of card to upgrade
     */
    handleCardUpgrade(data) {
        const { cardId } = data;
        const card = this.getCard(cardId);

        if (!card || !card.upgradeToId) {
            this.eventSystem.emit('card:upgradeFailed', { 
                cardId,
                error: 'Card cannot be upgraded'
            });
            return;
        }

        try {
            const upgradedCard = CardFactory.createUpgradedCard(card);
            this.cards.set(upgradedCard.id, upgradedCard);
            this.cards.delete(cardId);
            this.eventSystem.emit('card:upgraded', { 
                oldCardId: cardId,
                newCardId: upgradedCard.id
            });
        } catch (error) {
            console.error('Error upgrading card:', error);
            this.eventSystem.emit('card:upgradeFailed', { 
                cardId,
                error: error.message
            });
        }
    }

    /**
     * Handle discovering a new card
     * @param {Object} data - Discovery data
     * @param {string} data.cardId - ID of discovered card
     */
    handleCardDiscover(data) {
        const { cardId } = data;
        try {
            // Verify card exists in database
            cardDatabase.getDefinition(cardId);
            
            // Dispatch discover action to store
            this.store.dispatch({
                type: 'card/discover',
                payload: cardId
            });

            this.eventSystem.emit('card:discovered', { cardId });
        } catch (error) {
            console.error('Error discovering card:', error);
            this.eventSystem.emit('card:discoveryFailed', { 
                cardId,
                error: error.message
            });
        }
    }

    handleMouseDown(event) {
        // Handle starting card drag
    }

    handleMouseMove(event) {
        if (this.draggingCard) {
            // Update card position during drag
        }
    }

    handleMouseUp(event) {
        if (this.draggingCard) {
            // Handle card drop and potential play
            this.draggingCard = null;
        }
    }

    /**
     * Create a new card instance
     * @param {string} definitionId - Card definition ID
     * @returns {Card} New card instance
     */
    createCard(definitionId) {
        const card = CardFactory.createCard(definitionId);
        this.cards.set(card.id, card);
        return card;
    }

    /**
     * Get a card instance by ID
     * @param {string} cardId - Card instance ID
     * @returns {Card|undefined} Card instance if found
     */
    getCard(cardId) {
        return this.cards.get(cardId);
    }

    /**
     * Clean up resources
     */
    destroy() {
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        this.cards.clear();
    }
}
