/**
 * Example effect functions for demonstration.
 * Real implementations would interact with game systems.
 */

/**
 * Deal damage to a target
 * @param {Object} context - Effect context
 * @param {Card} context.card - The card being played
 * @param {Object} context.target - Target to damage
 * @returns {Promise<void>}
 */
export const dealDamage = async ({ card, target }) => {
    // Implementation would use actual damage system
    console.log(`${card.name} deals damage to ${target.name}`);
};

/**
 * Apply shield/block to the source
 * @param {Object} context - Effect context
 * @param {Card} context.card - The card being played
 * @param {Object} context.source - Entity gaining shield
 * @returns {Promise<void>}
 */
export const applyShield = async ({ card, source }) => {
    // Implementation would use actual defense system
    console.log(`${card.name} applies shield to ${source.name}`);
};

/**
 * Apply a buff effect
 * @param {Object} context - Effect context
 * @param {Card} context.card - The card being played
 * @param {Object} context.target - Target to buff
 * @returns {Promise<void>}
 */
export const applyBuff = async ({ card, target }) => {
    // Implementation would use actual buff/status system
    console.log(`${card.name} applies buff to ${target.name}`);
};

/**
 * Apply a debuff effect
 * @param {Object} context - Effect context
 * @param {Card} context.card - The card being played
 * @param {Object} context.target - Target to debuff
 * @returns {Promise<void>}
 */
export const applyDebuff = async ({ card, target }) => {
    // Implementation would use actual buff/status system
    console.log(`${card.name} applies debuff to ${target.name}`);
};

/**
 * Draw additional cards
 * @param {Object} context - Effect context
 * @param {Card} context.card - The card being played
 * @param {Object} context.source - Entity drawing cards
 * @returns {Promise<void>}
 */
export const drawCards = async ({ card, source }) => {
    // Implementation would use actual card draw system
    console.log(`${card.name} causes ${source.name} to draw cards`);
};

/**
 * Gain energy/resources
 * @param {Object} context - Effect context
 * @param {Card} context.card - The card being played
 * @param {Object} context.source - Entity gaining energy
 * @returns {Promise<void>}
 */
export const gainEnergy = async ({ card, source }) => {
    // Implementation would use actual resource system
    console.log(`${card.name} gives energy to ${source.name}`);
};

// Register all effect functions with the registry
import { cardEffectRegistry } from '../CardEffectRegistry.js';

cardEffectRegistry.register('dealDamage', dealDamage);
cardEffectRegistry.register('applyShield', applyShield);
cardEffectRegistry.register('applyBuff', applyBuff);
cardEffectRegistry.register('applyDebuff', applyDebuff);
cardEffectRegistry.register('drawCards', drawCards);
cardEffectRegistry.register('gainEnergy', gainEnergy);
