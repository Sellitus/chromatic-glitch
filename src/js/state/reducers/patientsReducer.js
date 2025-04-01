import {
  ADD_PATIENT,
  SET_CURRENT_PATIENT,
  COMPLETE_PATIENT,
  UPDATE_WAITING_LIST,
  INCREMENT_PATIENTS_HEALED,
  INCREMENT_CARDS_PLAYED,
  UPDATE_DAMAGE_DEALT,
  UPDATE_HEALING_DONE,
  RESET_STATE
} from '../actions/actionTypes';
import { createReducer, removeItem } from './utils';

// Frozen empty array for consistent empty state
const EMPTY_ARRAY = Object.freeze([]);

// Ensure array and all its contents are frozen
const deepFreezeArray = (arr) => {
  if (!arr || !arr.length) return EMPTY_ARRAY;
  
  // First freeze each element
  const frozenElements = arr.map(item => {
    if (!item || typeof item !== 'object') return item;
    return Object.freeze({...item});
  });
  
  // Then freeze the array itself
  return Object.freeze(frozenElements);
};

const initialState = {
  waiting: EMPTY_ARRAY,
  current: null,
  treated: EMPTY_ARRAY,
  stats: {
    healed: 0,
    cardsPlayed: 0,
    damageDealt: 0,
    healingDone: 0
  }
};

// Cache for selector results
const selectorCache = new WeakMap();
const getFromCache = (key, fn) => {
  if (!selectorCache.has(key)) {
    selectorCache.set(key, fn());
  }
  return selectorCache.get(key);
};

const handlers = {
  [ADD_PATIENT]: (state, action) => ({
    ...state,
    waiting: deepFreezeArray([...state.waiting, action.payload])
  }),

  [SET_CURRENT_PATIENT]: (state, action) => ({
    ...state,
    current: action.payload,
    waiting: deepFreezeArray(
      action.payload 
        ? removeItem(state.waiting, p => p.id === action.payload.id)
        : state.waiting
    )
  }),

  [COMPLETE_PATIENT]: (state, action) => ({
    ...state,
    current: null,
    treated: deepFreezeArray([...state.treated, state.current]),
    stats: {
      ...state.stats,
      healed: state.stats.healed + 1
    }
  }),

  [UPDATE_WAITING_LIST]: (state, action) => ({
    ...state,
    waiting: deepFreezeArray(action.payload)
  }),

  [INCREMENT_PATIENTS_HEALED]: (state) => ({
    ...state,
    stats: {
      ...state.stats,
      healed: state.stats.healed + 1
    }
  }),

  [INCREMENT_CARDS_PLAYED]: (state) => ({
    ...state,
    stats: {
      ...state.stats,
      cardsPlayed: state.stats.cardsPlayed + 1
    }
  }),

  [UPDATE_DAMAGE_DEALT]: (state, action) => ({
    ...state,
    stats: {
      ...state.stats,
      damageDealt: state.stats.damageDealt + action.payload
    }
  }),

  [UPDATE_HEALING_DONE]: (state, action) => ({
    ...state,
    stats: {
      ...state.stats,
      healingDone: state.stats.healingDone + action.payload
    }
  }),

  [RESET_STATE]: () => initialState
};

export const patientsReducer = createReducer(initialState, handlers);

// Patient Selectors
export const selectWaitingPatients = (state) => {
  if (!state?.patients?.waiting) return EMPTY_ARRAY;
  
  // Use cached value if available
  return getFromCache(state.patients.waiting, () => 
    deepFreezeArray(state.patients.waiting)
  );
};

export const selectCurrentPatient = (state) => 
  state?.patients?.current;

export const selectTreatedPatients = (state) => {
  if (!state?.patients?.treated) return EMPTY_ARRAY;
  
  return getFromCache(state.patients.treated, () =>
    deepFreezeArray(state.patients.treated)
  );
};

export const selectWaitingCount = (state) => 
  state?.patients?.waiting?.length || 0;

export const selectHasCurrentPatient = (state) => 
  !!state?.patients?.current;

// Stats Selectors
export const selectPatientsHealed = (state) => 
  state?.patients?.stats?.healed || 0;

export const selectCardsPlayed = (state) => 
  state?.patients?.stats?.cardsPlayed || 0;

export const selectDamageDealt = (state) => 
  state?.patients?.stats?.damageDealt || 0;

export const selectHealingDone = (state) => 
  state?.patients?.stats?.healingDone || 0;

// Derived Stats Selectors
export const selectAverageHealingPerPatient = (state) => {
  const healed = selectPatientsHealed(state);
  if (!healed) return 0;
  return selectHealingDone(state) / healed;
};

export const selectAverageCardsPerPatient = (state) => {
  const healed = selectPatientsHealed(state);
  if (!healed) return 0;
  return selectCardsPlayed(state) / healed;
};
