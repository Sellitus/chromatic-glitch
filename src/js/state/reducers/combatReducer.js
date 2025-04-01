import {
  START_COMBAT,
  END_COMBAT,
  SET_ACTIVE_CARD,
  SET_SELECTED_TARGET,
  UPDATE_ENEMY,
  REMOVE_ENEMY,
  INCREMENT_TURN,
  RESET_STATE
} from '../actions/actionTypes';
import { createReducer, updateObject, removeItem } from './utils';

const initialState = {
  active: false,
  turn: 0,
  enemies: [],
  activeCard: null,
  selectedTarget: null
};

const handlers = {
  [START_COMBAT]: (state, action) => ({
    ...state,
    active: true,
    enemies: action.payload,
    turn: 0,
    activeCard: null,
    selectedTarget: null
  }),

  [END_COMBAT]: (state) => ({
    ...state,
    active: false,
    enemies: [],
    activeCard: null,
    selectedTarget: null
  }),

  [SET_ACTIVE_CARD]: (state, action) => ({
    ...state,
    activeCard: action.payload
  }),

  [SET_SELECTED_TARGET]: (state, action) => ({
    ...state,
    selectedTarget: action.payload
  }),

  [UPDATE_ENEMY]: (state, action) => ({
    ...state,
    enemies: state.enemies.map(enemy => 
      enemy.id === action.payload.enemyId
        ? updateObject(enemy, action.payload.changes)
        : enemy
    )
  }),

  [REMOVE_ENEMY]: (state, action) => ({
    ...state,
    enemies: removeItem(state.enemies, enemy => enemy.id === action.payload),
    // Clear selected target if it was the removed enemy
    selectedTarget: state.selectedTarget?.id === action.payload 
      ? null 
      : state.selectedTarget
  }),

  [INCREMENT_TURN]: (state) => ({
    ...state,
    turn: state.turn + 1
  }),

  [RESET_STATE]: () => initialState
};

export const combatReducer = createReducer(initialState, handlers);

// Basic selectors
export const selectCombatActive = (state) => state.combat.active;
export const selectCombatTurn = (state) => state.combat.turn;
export const selectCombatEnemies = (state) => state.combat.enemies;
export const selectActiveCard = (state) => state.combat.activeCard;
export const selectSelectedTarget = (state) => state.combat.selectedTarget;

// Derived selectors
export const selectRemainingEnemies = (state) => state.combat.enemies.length;

export const selectEnemyById = (state, enemyId) => 
  state.combat.enemies.find(enemy => enemy.id === enemyId);

export const selectLowHealthEnemies = (state, threshold = 30) =>
  state.combat.enemies.filter(enemy => 
    (enemy.health / enemy.maxHealth) * 100 <= threshold
  );

export const selectIsTargetSelected = (state) => state.combat.selectedTarget !== null;
