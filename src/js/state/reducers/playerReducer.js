import {
  UPDATE_PLAYER_HEALTH,
  UPDATE_PLAYER_MANA,
  ADD_CARD_TO_HAND,
  REMOVE_CARD_FROM_HAND,
  ADD_EFFECT_TO_PLAYER,
  REMOVE_EFFECT_FROM_PLAYER,
  UPDATE_SPIRIT_STRAIN,
  ADD_CARD_TO_COLLECTION,
  REMOVE_CARD_FROM_COLLECTION,
  SET_DECK,
  UPDATE_RESOURCE,
  GAIN_EXPERIENCE,
  LEVEL_UP,
  UPDATE_REPUTATION,
  UPDATE_STATISTIC,
  UNLOCK_ACHIEVEMENT,
  UPDATE_ACHIEVEMENT_PROGRESS,
  UPDATE_PREFERENCE,
  RESET_PLAYER,
  RESET_STATE
} from '../actions/actionTypes';
import { createReducer, clamp, removeItem } from './utils';

const initialState = {
  // Basic attributes
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  
  // Card management
  deck: [],
  hand: [],
  cardCollection: [],
  
  // Status
  effects: [],
  spiritStrain: 0,
  maxSpiritStrain: 100,
  
  // Resources
  resources: {
    currency: 0,
    materials: 0
  },
  
  // Progression
  level: 1,
  experience: 0,
  experienceToNext: 100,
  
  // Reputation (per faction)
  reputation: {
    hospital: 0,
    patients: 0,
    community: 0
  },
  
  // Statistics
  statistics: {
    patientsHealed: 0,
    cardsPlayed: 0,
    battlesWon: 0,
    totalDamageDealt: 0,
    totalHealingDone: 0
  },
  
  // Achievements
  achievements: [],
  achievementProgress: {},
  
  // User preferences
  preferences: {
    soundVolume: 1,
    musicVolume: 1,
    uiScale: 1,
    showTutorials: true
  }
};

// Experience points needed for each level
const getExperienceForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));

const handlers = {
  [UPDATE_PLAYER_HEALTH]: (state, action) => ({
    ...state,
    health: clamp(state.health + action.payload, 0, state.maxHealth)
  }),

  [UPDATE_SPIRIT_STRAIN]: (state, action) => ({
    ...state,
    spiritStrain: clamp(state.spiritStrain + action.payload, 0, state.maxSpiritStrain)
  }),

  [UPDATE_PLAYER_MANA]: (state, action) => ({
    ...state,
    mana: clamp(state.mana + action.payload, 0, state.maxMana)
  }),

  [ADD_CARD_TO_HAND]: (state, action) => ({
    ...state,
    hand: [...state.hand, action.payload]
  }),

  [ADD_CARD_TO_COLLECTION]: (state, action) => ({
    ...state,
    cardCollection: [...state.cardCollection, action.payload]
  }),

  [REMOVE_CARD_FROM_COLLECTION]: (state, action) => ({
    ...state,
    cardCollection: removeItem(state.cardCollection, card => card.id === action.payload)
  }),

  [SET_DECK]: (state, action) => ({
    ...state,
    deck: action.payload
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

  [UPDATE_RESOURCE]: (state, action) => ({
    ...state,
    resources: {
      ...state.resources,
      [action.payload.resource]: Math.max(0, state.resources[action.payload.resource] + action.payload.amount)
    }
  }),

  [GAIN_EXPERIENCE]: (state, action) => {
    const newExperience = state.experience + action.payload;
    const experienceToNext = getExperienceForLevel(state.level);
    return {
      ...state,
      experience: newExperience >= experienceToNext ? newExperience - experienceToNext : newExperience,
      level: newExperience >= experienceToNext ? state.level + 1 : state.level,
      experienceToNext
    };
  },

  [LEVEL_UP]: (state) => ({
    ...state,
    level: state.level + 1,
    experienceToNext: getExperienceForLevel(state.level + 1)
  }),

  [UPDATE_REPUTATION]: (state, action) => ({
    ...state,
    reputation: {
      ...state.reputation,
      [action.payload.faction]: clamp(
        state.reputation[action.payload.faction] + action.payload.amount,
        -100,
        100
      )
    }
  }),

  [UPDATE_STATISTIC]: (state, action) => ({
    ...state,
    statistics: {
      ...state.statistics,
      [action.payload.stat]: state.statistics[action.payload.stat] + action.payload.amount
    }
  }),

  [UNLOCK_ACHIEVEMENT]: (state, action) => ({
    ...state,
    achievements: [...state.achievements, action.payload]
  }),

  [UPDATE_ACHIEVEMENT_PROGRESS]: (state, action) => ({
    ...state,
    achievementProgress: {
      ...state.achievementProgress,
      [action.payload.id]: action.payload.progress
    }
  }),

  [UPDATE_PREFERENCE]: (state, action) => ({
    ...state,
    preferences: {
      ...state.preferences,
      [action.payload.key]: action.payload.value
    }
  }),

  [RESET_PLAYER]: () => ({
    ...initialState,
    preferences: initialState.preferences, // Preserve user preferences on reset
    cardCollection: initialState.cardCollection, // Preserve card collection
    achievements: initialState.achievements, // Preserve achievements
    statistics: initialState.statistics // Preserve statistics
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

// New selectors for player state management
export const selectSpiritStrain = (state) => state.player.spiritStrain;
export const selectMaxSpiritStrain = (state) => state.player.maxSpiritStrain;
export const selectCardCollection = (state) => state.player.cardCollection;
export const selectResources = (state) => state.player.resources;
export const selectResource = (state, resource) => state.player.resources[resource];
export const selectLevel = (state) => state.player.level;
export const selectExperience = (state) => state.player.experience;
export const selectExperienceToNext = (state) => state.player.experienceToNext;
export const selectReputation = (state) => state.player.reputation;
export const selectFactionReputation = (state, faction) => state.player.reputation[faction];
export const selectStatistics = (state) => state.player.statistics;
export const selectStat = (state, stat) => state.player.statistics[stat];
export const selectAchievements = (state) => state.player.achievements;
export const selectAchievementProgress = (state) => state.player.achievementProgress;
export const selectPreferences = (state) => state.player.preferences;
export const selectPreference = (state, key) => state.player.preferences[key];

// Derived selectors
export const selectPlayerHealthPercentage = (state) => 
  (state.player.health / state.player.maxHealth) * 100;

export const selectPlayerManaPercentage = (state) => 
  (state.player.mana / state.player.maxMana) * 100;

export const selectPlayerHandSize = (state) => state.player.hand.length;
export const selectPlayerDeckSize = (state) => state.player.deck.length;
