import { SET_SCREEN, RESET_STATE } from '../actions/actionTypes';
import { createReducer } from './utils';

const initialState = {
  screen: 'title' // 'title', 'game', 'combat', 'inventory'
};

const handlers = {
  [SET_SCREEN]: (state, action) => ({
    ...state,
    screen: action.payload
  }),
  [RESET_STATE]: () => initialState
};

export const uiReducer = createReducer(initialState, handlers);

// Selectors
export const selectScreen = (state) => state.ui.screen;
