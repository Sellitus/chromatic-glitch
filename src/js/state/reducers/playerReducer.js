import {
  UPDATE_PLAYER_HEALTH,
  UPDATE_PLAYER_MANA,
  ADD_CARD_TO_HAND,
  REMOVE_CARD_FROM_HAND,
  ADD_EFFECT_TO_PLAYER,
  REMOVE_EFFECT_FROM_PLAYER,
  RESET_PLAYER,
  RESET_STATE
} from '../actions/actionTypes';
import { createReducer, clamp, removeItem } from './utils';

const initialState = {
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  deck: [],
  hand: [],
  effects: []
};

const handlers = {
  [UPDATE_PLAYER_HEALTH]: (state, action) => ({
    ...state,
    health: clamp(state.health + action.payload, 0, state.maxHealth)
  }),

  [UPDATE_PLAYER_MANA]: (state, action) => ({
    ...state,
    mana: clamp(state.mana + action.payload, 0, state.maxMana)
  }),

  [ADD_CARD_TO_HAND]: (state, action) => ({
    ...state,
    hand: [...state.hand, action.payload]
  }),

  [REMOVE_CARD_FROM_HAND]: (state, action) => ({
    ...state,
    hand: removeItem(state.hand, card => card.id === action.payload)
  }),

  [ADD_EFFECT_TO_PLAYER]: (state, action) => ({
    ...state,
    effects: [...state.effects, action.payload]
  }),

  [REMOVE_EFFECT_FROM_PLAYER]: (state, action) => ({
    ...state,
    effects: removeItem(state.effects, effect => effect.id === action.payload)
  }),

  [RESET_PLAYER]: () => ({
    ...initialState,
    deck: [] // Reset with empty deck since deck contents may vary per game
  }),

  [RESET_STATE]: () => initialState
};

export const playerReducer = createReducer(initialState, handlers);

// Selectors
export const selectPlayerHealth = (state) => state.player.health;
export const selectPlayerMaxHealth = (state) => state.player.maxHealth;
export const selectPlayerMana = (state) => state.player.mana;
export const selectPlayerMaxMana = (state) => state.player.maxMana;
export const selectPlayerHand = (state) => state.player.hand;
export const selectPlayerDeck = (state) => state.player.deck;
export const selectPlayerEffects = (state) => state.player.effects;

// Derived selectors
export const selectPlayerHealthPercentage = (state) => 
  (state.player.health / state.player.maxHealth) * 100;

export const selectPlayerManaPercentage = (state) => 
  (state.player.mana / state.player.maxMana) * 100;

export const selectPlayerHandSize = (state) => state.player.hand.length;
export const selectPlayerDeckSize = (state) => state.player.deck.length;
