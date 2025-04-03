import { PixiHandDisplay } from '../../../src/js/ui/components/PixiHandDisplay';
import { PixiCardRenderer } from '../../../src/js/ui/renderers/PixiCardRenderer';
import { PixiCardEffects } from '../../../src/js/ui/effects/PixiCardEffects';
import { PixiCardAnimations } from '../../../src/js/ui/animations/PixiCardAnimations';

// Mock the dependencies
jest.mock('../../../src/js/ui/renderers/PixiCardRenderer');
jest.mock('../../../src/js/ui/effects/PixiCardEffects');
jest.mock('../../../src/js/ui/animations/PixiCardAnimations');

// Mock pixi.js module
jest.mock('pixi.js', () => {
    class MockEventEmitter {
        constructor() {
            this._events = {};
        }

        on(event, fn) {
            this._events[event] = this._events[event] || [];
            this._events[event].push(fn);
            return this;
        }

        emit(event, ...args) {
            if (this._events[event]) {
                this._events[event].forEach(fn => fn(...args));
            }
        }
    }

    class MockContainer extends MockEventEmitter {
        constructor() {
            super();
            this.children = [];
            this.addChild = jest.fn(child => {
                this.children.push(child);
            });
            this.removeChild = jest.fn();
            this.destroy = jest.fn();
            this.position = { set: jest.fn(), copyFrom: jest.fn() };
            this.scale = { set: jest.fn(), x: 1, y: 1 };
            this.x = 0;
            this.y = 0;
            this.width = 800;
            this.height = 200;
            this.interactive = false;
            this.interactiveChildren = false;
            this.buttonMode = false;
            this.zIndex = 0;
            this.visible = true;
        }
    }

    return { __esModule: true, Container: MockContainer };
});

describe('PixiHandDisplay', () => {
    let handDisplay;
    let mockCardRenderer;
    let mockCardEffects;
    let mockCardAnimations;
    let mockCardContainer;

    beforeEach(() => {
        const { Container } = require('pixi.js');
        
        // Reset mocks
        jest.clearAllMocks();

        // Create mock instances
        mockCardRenderer = {
            createCardDisplay: jest.fn().mockReturnValue(new Container())
        };
        mockCardEffects = {
            applyHoverEffect: jest.fn(),
            removeHoverEffect: jest.fn()
        };
        mockCardAnimations = {
            animateDrawCard: jest.fn().mockResolvedValue(undefined),
            animateDiscardCard: jest.fn().mockResolvedValue(undefined),
            animateCardMove: jest.fn(),
            update: jest.fn()
        };

        // Override constructor mocks
        PixiCardRenderer.mockImplementation(() => mockCardRenderer);
        PixiCardEffects.mockImplementation(() => mockCardEffects);
        PixiCardAnimations.mockImplementation(() => mockCardAnimations);

        // Create hand display instance
        handDisplay = new PixiHandDisplay({ width: 800, height: 200 });
        
        // Initialize mock card container
        mockCardContainer = new Container();
        mockCardContainer.zIndex = 0;
        mockCardRenderer.createCardDisplay.mockReturnValue(mockCardContainer);
    });

    describe('Initialization', () => {
        it('initializes with default properties', () => {
            expect(handDisplay.width).toBe(800);
            expect(handDisplay.height).toBe(200);
            expect(handDisplay.cards.size).toBe(0);
            expect(handDisplay.interactive).toBe(true);
            expect(handDisplay.interactiveChildren).toBe(true);
        });

        it('creates required subsystems', () => {
            expect(PixiCardRenderer).toHaveBeenCalled();
            expect(PixiCardEffects).toHaveBeenCalled();
            expect(PixiCardAnimations).toHaveBeenCalled();
        });
    });

    describe('Card Management', () => {
        const mockCard = { id: 'card1', name: 'Test Card' };

        it('adds a card with animation', async () => {
            await handDisplay.addCard(mockCard, true);
            
            expect(mockCardRenderer.createCardDisplay).toHaveBeenCalledWith(mockCard);
            expect(handDisplay.cards.size).toBe(1);
            expect(mockCardAnimations.animateDrawCard).toHaveBeenCalled();
        });

        it('adds a card without animation', async () => {
            await handDisplay.addCard(mockCard, false);
            
            expect(mockCardRenderer.createCardDisplay).toHaveBeenCalledWith(mockCard);
            expect(handDisplay.cards.size).toBe(1);
            expect(mockCardAnimations.animateDrawCard).not.toHaveBeenCalled();
        });

        it('removes a card', async () => {
            await handDisplay.addCard(mockCard);
            await handDisplay.removeCard(mockCard.id);
            
            expect(handDisplay.cards.size).toBe(0);
        });

        it('removes a card with target position animation', async () => {
            const targetPos = { x: 100, y: 100 };
            await handDisplay.addCard(mockCard);
            await handDisplay.removeCard(mockCard.id, targetPos);
            
            expect(mockCardAnimations.animateDiscardCard).toHaveBeenCalled();
            expect(handDisplay.cards.size).toBe(0);
        });
    });

    describe('Interaction Handling', () => {
        const mockCard = { id: 'card1', name: 'Test Card' };

        beforeEach(async () => {
            await handDisplay.addCard(mockCard);
        });

        it('handles card hover', () => {
            handDisplay.emit('mouseover', { target: mockCardContainer });
            
            expect(mockCardEffects.applyHoverEffect).toHaveBeenCalledWith(mockCardContainer);
            expect(mockCardContainer.zIndex).toBe(1);
        });

        it('handles card hover end', () => {
            handDisplay.emit('mouseout', { target: mockCardContainer });
            
            expect(mockCardEffects.removeHoverEffect).toHaveBeenCalledWith(mockCardContainer);
            expect(mockCardContainer.zIndex).toBe(0);
        });

        it('initiates card drag', () => {
            const event = {
                target: mockCardContainer,
                data: { global: { x: 0, y: 0 } }
            };

            handDisplay.emit('mousedown', event);
            
            expect(handDisplay.isDragging).toBe(true);
            expect(handDisplay.dragTarget).toBe(mockCardContainer);
            expect(mockCardContainer.zIndex).toBe(2);
        });

        it('ends card drag', () => {
            handDisplay.emit('mousedown', {
                target: mockCardContainer,
                data: { global: { x: 0, y: 0 } }
            });

            handDisplay.emit('mouseup');
            
            expect(handDisplay.isDragging).toBe(false);
            expect(handDisplay.dragTarget).toBeNull();
            expect(mockCardAnimations.animateCardMove).toHaveBeenCalled();
        });
    });

    describe('Layout', () => {
        it('calculates correct card positions', () => {
            const pos = handDisplay._calculateCardPosition(0);
            expect(pos).toHaveProperty('x');
            expect(pos).toHaveProperty('y');
            expect(typeof pos.x).toBe('number');
            expect(typeof pos.y).toBe('number');
        });

        it('updates layout when cards change', async () => {
            await handDisplay.addCard({ id: 'card1' });
            await handDisplay.addCard({ id: 'card2' });
            expect(mockCardAnimations.animateCardMove).toHaveBeenCalled();
        });
    });

    describe('Update Loop', () => {
        it('updates animations', () => {
            handDisplay.update(16);
            expect(mockCardAnimations.update).toHaveBeenCalledWith(16);
        });

        it('updates drag state when dragging', async () => {
            await handDisplay.addCard({ id: 'card1' });
            
            handDisplay.emit('mousedown', {
                target: mockCardContainer,
                data: { global: { x: 0, y: 0 } }
            });
            
            handDisplay.update(16);
            
            expect(mockCardAnimations.animateCardMove).toHaveBeenCalled();
        });
    });
});