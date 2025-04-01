/**
 * Creates a reducer function that maps action types to handlers
 * @param {Object} initialState - Initial state for the reducer
 * @param {Object} handlers - Map of action types to handler functions
 * @returns {Function} A reducer function
 */
export const createReducer = (initialState, handlers) => {
  return (state = initialState, action) => {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    }
    return state;
  };
};

/**
 * Updates an object immutably
 * @param {Object} oldObject - The object to update
 * @param {Object} newValues - The values to update
 * @returns {Object} A new object with the updates applied
 */
export const updateObject = (oldObject, newValues) => {
  return {
    ...oldObject,
    ...newValues
  };
};

/**
 * Updates an item in an array immutably
 * @param {Array} array - The array to update
 * @param {number} index - Index of item to update
 * @param {Object} newValues - The values to update
 * @returns {Array} A new array with the item updated
 */
export const updateItemInArray = (array, index, newValues) => {
  return array.map((item, i) => {
    if (i !== index) {
      return item;
    }
    return {
      ...item,
      ...newValues
    };
  });
};

/**
 * Removes an item from an array immutably
 * @param {Array} array - The array to update
 * @param {Function} predicate - Function that returns true for item to remove
 * @returns {Array} A new array with the item removed
 */
export const removeItem = (array, predicate) => {
  return array.filter(item => !predicate(item));
};

/**
 * Clamps a number between min and max values
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} The clamped value
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};
