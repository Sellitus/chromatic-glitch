import { CardEffectRegistry, cardEffectRegistry } from '../../src/js/cards/CardEffectRegistry.js';

describe('CardEffectRegistry', () => {
    let registry;

    beforeEach(() => {
        registry = new CardEffectRegistry();
    });

    it('should register and retrieve effects', () => {
        const effect = jest.fn();
        registry.register('test', effect);
        
        expect(registry.hasEffect('test')).toBe(true);
        expect(registry.getEffect('test')).toBe(effect);
    });

    it('should throw on duplicate registration', () => {
        const effect = jest.fn();
        registry.register('test', effect);
        
        expect(() => {
            registry.register('test', jest.fn());
        }).toThrow();
    });

    it('should throw when retrieving non-existent effect', () => {
        expect(() => {
            registry.getEffect('nonexistent');
        }).toThrow();
    });

    it('should validate effect parameters', () => {
        expect(() => {
            registry.register('', jest.fn());
        }).toThrow();

        expect(() => {
            registry.register('test', null);
        }).toThrow();

        expect(() => {
            registry.register('test', 'not a function');
        }).toThrow();
    });

    it('should execute effects with context', async () => {
        const effect = jest.fn().mockResolvedValue(undefined);
        const context = {
            card: { id: 'test' },
            source: { id: 'player' },
            target: { id: 'enemy' },
            gameState: {}
        };

        registry.register('test', effect);
        await registry.executeEffect('test', context);

        expect(effect).toHaveBeenCalledWith(context);
    });

    it('should list all registered effects', () => {
        registry.register('effect1', jest.fn());
        registry.register('effect2', jest.fn());

        const effects = registry.getAllEffectKeys();
        expect(effects).toContain('effect1');
        expect(effects).toContain('effect2');
        expect(effects.length).toBe(2);
    });

    it('should unregister effects', () => {
        registry.register('test', jest.fn());
        expect(registry.hasEffect('test')).toBe(true);

        registry.unregister('test');
        expect(registry.hasEffect('test')).toBe(false);
    });

    it('should clear all effects', () => {
        registry.register('effect1', jest.fn());
        registry.register('effect2', jest.fn());
        
        registry.clear();
        
        expect(registry.hasEffect('effect1')).toBe(false);
        expect(registry.hasEffect('effect2')).toBe(false);
        expect(registry.getAllEffectKeys().length).toBe(0);
    });
});

describe('cardEffectRegistry singleton', () => {
    beforeEach(() => {
        cardEffectRegistry.clear();
    });

    it('should be an instance of CardEffectRegistry', () => {
        expect(cardEffectRegistry).toBeInstanceOf(CardEffectRegistry);
    });

    it('should maintain singleton state', () => {
        const effect = jest.fn();
        cardEffectRegistry.register('test', effect);

        expect(cardEffectRegistry.hasEffect('test')).toBe(true);
        expect(cardEffectRegistry.getEffect('test')).toBe(effect);
    });
});
