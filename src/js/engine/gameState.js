class GameState {
  constructor() {
    this.state = {
      screen: 'title', // title, game, combat, inventory
      player: {
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        deck: [],
        hand: [],
        effects: []
      },
      combat: {
        active: false,
        turn: 0,
        enemies: [],
        activeCard: null,
        selectedTarget: null
      },
      patients: {
        waiting: [],
        current: null,
        treated: 0
      },
      stats: {
        patientsHealed: 0,
        cardsPlayed: 0,
        damageDealt: 0,
        healingDone: 0
      }
    };
  }

  init() {
    // Initialize game state
    this.resetState();
  }

  resetState() {
    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        health: this.state.player.maxHealth,
        mana: this.state.player.maxMana,
        hand: [],
        effects: []
      },
      combat: {
        ...this.state.combat,
        active: false,
        turn: 0,
        enemies: [],
        activeCard: null,
        selectedTarget: null
      }
    };
  }

  getState() {
    return this.state;
  }

  updateState(newState) {
    this.state = {
      ...this.state,
      ...newState
    };
  }

  getScreen() {
    return this.state.screen;
  }

  setScreen(screen) {
    this.state.screen = screen;
  }

  getPlayer() {
    return this.state.player;
  }

  getCombat() {
    return this.state.combat;
  }

  getPatients() {
    return this.state.patients;
  }

  getStats() {
    return this.state.stats;
  }

  // Helper methods for common state updates
  updatePlayerHealth(amount) {
    const player = this.state.player;
    player.health = Math.max(0, Math.min(player.health + amount, player.maxHealth));
  }

  updatePlayerMana(amount) {
    const player = this.state.player;
    player.mana = Math.max(0, Math.min(player.mana + amount, player.maxMana));
  }

  addCardToHand(card) {
    this.state.player.hand.push(card);
  }

  removeCardFromHand(cardId) {
    this.state.player.hand = this.state.player.hand.filter(card => card.id !== cardId);
  }

  startCombat(enemies) {
    this.state.combat.active = true;
    this.state.combat.enemies = enemies;
    this.state.combat.turn = 0;
  }

  endCombat() {
    this.state.combat.active = false;
    this.state.combat.enemies = [];
    this.state.combat.activeCard = null;
    this.state.combat.selectedTarget = null;
  }
}

module.exports = { GameState };
