import TweenManager from '../../engine/tween/TweenManager';
import { Easing } from '../../engine/tween/Easing';

/**
 * Manages card animations using PixiJS and the tween system
 */
export class PixiCardAnimations {
    constructor() {
        this.tweenManager = new TweenManager();
        
        // Animation durations (in milliseconds)
        this.durations = {
            draw: 400,
            play: 300,
            discard: 500,
            hover: 150
        };
        
        // Animation curves
        this.curves = {
            draw: Easing.easeOutCubic,
            play: Easing.easeInOutQuad,
            discard: Easing.easeInCubic,
            hover: Easing.easeOutQuad
        };
    }

    /**
     * Animates a card being drawn from the deck
     * @param {PIXI.Container} cardContainer The card's container
     * @param {Object} startPos Starting position {x, y}
     * @param {Object} endPos Ending position {x, y}
     * @returns {Promise} Resolves when animation completes
     */
    animateDrawCard(cardContainer, startPos, endPos) {
        // Set initial state
        cardContainer.position.set(startPos.x, startPos.y);
        cardContainer.scale.set(0.8);
        cardContainer.alpha = 0;
        cardContainer.rotation = -0.2; // Slight tilt

        return new Promise(resolve => {
            // Position animation
            this.tweenManager.createTween(cardContainer.position, {
                duration: this.durations.draw / 1000,
                easing: this.curves.draw,
                from: { x: startPos.x, y: startPos.y },
                to: { x: endPos.x, y: endPos.y }
            });

            // Scale and rotation animation
            this.tweenManager.createTween(cardContainer, {
                duration: this.durations.draw / 1000,
                easing: this.curves.draw,
                from: { 
                    scale: { x: 0.8, y: 0.8 },
                    rotation: -0.2,
                    alpha: 0
                },
                to: { 
                    scale: { x: 1, y: 1 },
                    rotation: 0,
                    alpha: 1
                },
                onComplete: resolve
            });
        });
    }

    /**
     * Animates a card being played
     * @param {PIXI.Container} cardContainer The card's container
     * @param {Object} targetPos Target position {x, y}
     * @returns {Promise} Resolves when animation completes
     */
    animatePlayCard(cardContainer, targetPos) {
        const startPos = {
            x: cardContainer.position.x,
            y: cardContainer.position.y
        };

        return new Promise(resolve => {
            // Move to target position with a slight arc
            const controlPoint = {
                x: (startPos.x + targetPos.x) / 2,
                y: startPos.y - 100 // Arc height
            };

            let progress = 0;
            
            this.tweenManager.createTween(cardContainer.position, {
                target: { progress: 0 },
                duration: this.durations.play / 1000,
                easing: this.curves.play,
                to: { progress: 1 },
                onUpdate: (obj) => {
                    progress = obj.progress;
                    
                    // Quadratic bezier curve
                    const t = progress;
                    const u = 1 - t;
                    cardContainer.position.x = u * u * startPos.x + 2 * u * t * controlPoint.x + t * t * targetPos.x;
                    cardContainer.position.y = u * u * startPos.y + 2 * u * t * controlPoint.y + t * t * targetPos.y;
                    
                    // Scale down and fade out as it reaches the target
                    cardContainer.scale.set(1 - (0.5 * progress));
                    cardContainer.alpha = 1 - progress;
                },
                onComplete: resolve
            });

            // Add a slight rotation during the animation
            this.tweenManager.createTween(cardContainer, {
                target: cardContainer,
                duration: this.durations.play / 1000,
                easing: this.curves.play,
                to: { rotation: 0.5 }
            });
        });
    }

    /**
     * Animates a card being discarded
     * @param {PIXI.Container} cardContainer The card's container
     * @param {Object} discardPilePos Position of discard pile {x, y}
     * @returns {Promise} Resolves when animation completes
     */
    animateDiscardCard(cardContainer, discardPilePos) {
        const startPos = {
            x: cardContainer.position.x,
            y: cardContainer.position.y
        };

        return new Promise(resolve => {
            // Quick movement toward discard pile while rotating and fading
            this.tweenManager.createTween(cardContainer.position, {
                duration: this.durations.discard / 1000,
                easing: this.curves.discard,
                to: {
                    x: discardPilePos.x,
                    y: discardPilePos.y
                }
            });

            this.tweenManager.createTween(cardContainer, {
                duration: this.durations.discard / 1000,
                easing: this.curves.discard,
                to: {
                    rotation: (Math.random() - 0.5) * 2, // Random rotation
                    alpha: 0,
                    scale: { x: 0.8, y: 0.8 }
                },
                onComplete: resolve
            });
        });
    }

    /**
     * Smoothly transitions a card to a new position
     * @param {PIXI.Container} cardContainer The card's container
     * @param {Object} targetPos Target position {x, y}
     * @returns {Promise} Resolves when animation completes
     */
    animateCardMove(cardContainer, targetPos) {
        return new Promise(resolve => {
            this.tweenManager.createTween(cardContainer.position, {
                duration: this.durations.hover / 1000,
                easing: this.curves.hover,
                to: { x: targetPos.x, y: targetPos.y },
                onComplete: resolve
            });
        });
    }

    /**
     * Updates all active animations
     * @param {number} deltaTime Time since last update in milliseconds
     */
    update(deltaTime) {
        this.tweenManager.update(deltaTime);
    }
}
