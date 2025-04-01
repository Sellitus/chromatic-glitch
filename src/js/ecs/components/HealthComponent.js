import Component from "../Component.js";

/**
 * Component for managing entity health
 */
export default class HealthComponent extends Component {
  constructor(maxHealth = 100) {
    super();
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.invulnerable = false;
    this.lastDamageTime = 0;
    this.lastHealTime = 0;

    // Optional regeneration settings
    this.regenAmount = 0;
    this.regenInterval = 0;
    this.lastRegenTime = 0;

    // Optional status effects
    this.statusEffects = new Map(); // Map<string, { duration: number, startTime: number, effect: Function }>
  }

  /**
   * Update method for regeneration and status effects
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    const currentTime = performance.now();

    // Handle regeneration
    if (this.regenAmount > 0 && this.regenInterval > 0) {
      if (currentTime - this.lastRegenTime >= this.regenInterval) {
        this.heal(this.regenAmount);
        this.lastRegenTime = currentTime;
      }
    }

    // Update status effects
    for (const [effectId, effect] of this.statusEffects) {
      if (currentTime - effect.startTime >= effect.duration) {
        this.removeStatusEffect(effectId);
      } else if (effect.effect) {
        effect.effect(this, deltaTime);
      }
    }
  }

  /**
   * Deal damage to the entity
   * @param {number} amount - Amount of damage to deal
   * @returns {boolean} True if damage was dealt
   */
  damage(amount) {
    if (this.invulnerable || amount <= 0) return false;

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.lastDamageTime = performance.now();

    return true;
  }

  /**
   * Heal the entity
   * @param {number} amount - Amount to heal
   * @returns {boolean} True if healing was applied
   */
  heal(amount) {
    if (amount <= 0 || this.currentHealth >= this.maxHealth) return false;

    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    this.lastHealTime = performance.now();

    return true;
  }

  /**
   * Set health regeneration
   * @param {number} amount - Amount to regenerate per interval
   * @param {number} interval - Time between regeneration ticks in milliseconds
   */
  setRegeneration(amount, interval) {
    this.regenAmount = amount;
    this.regenInterval = interval;
    this.lastRegenTime = performance.now();
  }

  /**
   * Add a status effect
   * @param {string} effectId - Unique identifier for the effect
   * @param {number} duration - Duration in milliseconds
   * @param {Function} effect - Effect function called during update
   */
  addStatusEffect(effectId, duration, effect) {
    this.statusEffects.set(effectId, {
      duration,
      startTime: performance.now(),
      effect
    });
  }

  /**
   * Remove a status effect
   * @param {string} effectId - ID of effect to remove
   */
  removeStatusEffect(effectId) {
    this.statusEffects.delete(effectId);
  }

  /**
   * Check if entity has a specific status effect
   * @param {string} effectId - ID of effect to check
   * @returns {boolean} True if effect is active
   */
  hasStatusEffect(effectId) {
    return this.statusEffects.has(effectId);
  }

  /**
   * Get remaining duration of a status effect
   * @param {string} effectId - ID of effect to check
   * @returns {number} Remaining duration in milliseconds, or 0 if not active
   */
  getStatusEffectDuration(effectId) {
    const effect = this.statusEffects.get(effectId);
    if (!effect) return 0;

    const elapsed = performance.now() - effect.startTime;
    return Math.max(0, effect.duration - elapsed);
  }

  /**
   * Serialize the component's data
   * @returns {Object} JSON-serializable object
   */
  serialize() {
    return {
      ...super.serialize(),
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
      invulnerable: this.invulnerable,
      regenAmount: this.regenAmount,
      regenInterval: this.regenInterval
    };
  }

  /**
   * Deserialize data into the component
   * @param {Object} data - Data to deserialize from
   */
  deserialize(data) {
    this.maxHealth = data.maxHealth ?? 100;
    this.currentHealth = data.currentHealth ?? this.maxHealth;
    this.invulnerable = data.invulnerable ?? false;
    this.regenAmount = data.regenAmount ?? 0;
    this.regenInterval = data.regenInterval ?? 0;
    this.lastRegenTime = performance.now();
    this.statusEffects.clear();
  }
}
