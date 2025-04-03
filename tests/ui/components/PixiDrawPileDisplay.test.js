import { PixiDrawPileDisplay } from '../../../src/js/ui/components/PixiDrawPileDisplay';

// Mock pixi.js module
jest.mock('pixi.js', () => {
    class MockContainer {
        constructor() {
            this.children = [];
            this.addChild = jest.fn(child => {
                this.children.push(child);
            });
            this.removeChild = jest.fn();
            this.destroy = jest.fn();
            this.position = { 
                set: jest.fn(),
                copyFrom: jest.fn()
            };
            this.scale = { 
                set: jest.fn(),
                x: 1,
                y: 1
            };
            this.x = 0;
            this.y = 0;
            this.width = 800;
            this.height = 200;
            this.interactive = false;
            this.buttonMode = false;
            this.visible = true;
            this.zIndex = 0;
        }
    }

    class MockGraphics extends MockContainer {
        constructor() {
            super();
            this.beginFill = jest.fn().mockReturnThis();
            this.drawRect = jest.fn().mockReturnThis();
            this.endFill = jest.fn().mockReturnThis();
            this.lineStyle = jest.fn().mockReturnThis();
        }
    }

    const mockGraphicsFn = jest.fn().mockImplementation(() => new MockGraphics());
    mockGraphicsFn.prototype = Object.create(MockContainer.prototype);
    mockGraphicsFn.prototype.constructor = mockGraphicsFn;

    class MockText extends MockContainer {
        constructor(text, style) {
            super();
            this.text = text;
            this.style = style;
            this.anchor = { set: jest.fn() };
        }
    }

    const mockTextFn = jest.fn().mockImplementation((text, style) => new MockText(text, style));
    mockTextFn.prototype = Object.create(MockContainer.prototype);
    mockTextFn.prototype.constructor = mockTextFn;

    return {
        __esModule: true,
        Container: MockContainer,
        Graphics: mockGraphicsFn,
        Text: mockTextFn
    };
});

describe('PixiDrawPileDisplay', () => {
    let drawPile;
    let mockGraphics;
    
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        const { Graphics } = require('pixi.js');
        mockGraphics = Graphics;
        
        // Create instance
        drawPile = new PixiDrawPileDisplay();
    });

    describe('Initialization', () => {
        it('sets up interactive properties', () => {
            expect(drawPile.interactive).toBe(true);
            expect(drawPile.buttonMode).toBe(true);
        });

        it('creates stack cards with correct properties', () => {
            expect(drawPile.stackCards.length).toBe(5);
            expect(mockGraphics).toHaveBeenCalledTimes(5);

            drawPile.stackCards.forEach((card, index) => {
                expect(card.beginFill).toHaveBeenCalled();
                expect(card.drawRect).toHaveBeenCalledWith(0, 0, drawPile.cardWidth, drawPile.cardHeight);
                expect(card.lineStyle).toHaveBeenCalled();
                expect(card.position.set).toHaveBeenCalledWith(
                    -4 + (index * 2),
                    -4 + (index * 2)
                );
            });
        });

        it('creates count text with correct properties', () => {
            const { Text } = require('pixi.js');
            expect(Text).toHaveBeenCalledWith('?', expect.any(Object));
            expect(drawPile.countText.anchor.set).toHaveBeenCalledWith(0.5);
            expect(drawPile.countText.position.set).toHaveBeenCalledWith(
                drawPile.cardWidth / 2,
                drawPile.cardHeight / 2
            );
        });

        it('applies options when provided', () => {
            const options = {
                x: 100,
                y: 200,
                scale: { x: 0.5, y: 0.5 }
            };
            const customDrawPile = new PixiDrawPileDisplay(options);
            expect(customDrawPile.x).toBe(options.x);
            expect(customDrawPile.y).toBe(options.y);
            expect(customDrawPile.scale).toEqual(options.scale);
        });
    });

    describe('Count Updates', () => {
        it('updates count text when count changes', () => {
            drawPile.updateCount(10);
            expect(drawPile.countText.text).toBe('10');
        });

        it('shows all stack cards when count is high', () => {
            drawPile.updateCount(30);
            drawPile.stackCards.forEach(card => {
                expect(card.visible).toBe(true);
            });
        });

        it('hides all stack cards when count is zero', () => {
            drawPile.updateCount(0);
            drawPile.stackCards.forEach(card => {
                expect(card.visible).toBe(false);
            });
        });

        it('shows partial stack based on count', () => {
            drawPile.updateCount(15);
            const visibleCount = drawPile.stackCards.filter(card => card.visible).length;
            expect(visibleCount).toBeGreaterThan(0);
            expect(visibleCount).toBeLessThan(5);
        });
    });

    describe('Update and Destroy', () => {
        it('has update method for future animations', () => {
            expect(() => drawPile.update(16)).not.toThrow();
        });

        it('calls parent destroy method', () => {
            const options = { children: true };
            drawPile.destroy(options);
            expect(drawPile.destroy).toHaveBeenCalledWith(options);
        });
    });

    describe('Component Identification', () => {
        it('sets the correct component name', () => {
            expect(drawPile.name).toBe('DrawPileDisplay');
        });
    });
});
