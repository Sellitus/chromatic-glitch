import {
  ADD_PATIENT,
  SET_CURRENT_PATIENT,
  COMPLETE_PATIENT,
  UPDATE_WAITING_LIST,
  INCREMENT_PATIENTS_HEALED,
  INCREMENT_CARDS_PLAYED,
  UPDATE_DAMAGE_DEALT,
  UPDATE_HEALING_DONE
} from './actionTypes';

// Patient Actions

/**
 * Action creator for adding a new patient to the waiting list
 * @param {Object} patient - Patient object to add
 * @returns {Object} Action object
 */
export const addPatient = (patient) => ({
  type: ADD_PATIENT,
  payload: patient
});

/**
 * Action creator for setting the current patient being treated
 * @param {Object|null} patient - Patient object or null if no current patient
 * @returns {Object} Action object
 */
export const setCurrentPatient = (patient) => ({
  type: SET_CURRENT_PATIENT,
  payload: patient
});

/**
 * Action creator for completing treatment of a patient
 * @param {string} patientId - ID of the patient completed
 * @returns {Object} Action object
 */
export const completePatient = (patientId) => ({
  type: COMPLETE_PATIENT,
  payload: patientId
});

/**
 * Action creator for updating the waiting list
 * @param {Array} waitingList - New array of waiting patients
 * @returns {Object} Action object
 */
export const updateWaitingList = (waitingList) => ({
  type: UPDATE_WAITING_LIST,
  payload: waitingList
});

// Stats Actions

/**
 * Action creator for incrementing the patients healed counter
 * @returns {Object} Action object
 */
export const incrementPatientsHealed = () => ({
  type: INCREMENT_PATIENTS_HEALED
});

/**
 * Action creator for incrementing the cards played counter
 * @returns {Object} Action object
 */
export const incrementCardsPlayed = () => ({
  type: INCREMENT_CARDS_PLAYED
});

/**
 * Action creator for updating the total damage dealt
 * @param {number} amount - Amount of damage dealt
 * @returns {Object} Action object
 */
export const updateDamageDealt = (amount) => ({
  type: UPDATE_DAMAGE_DEALT,
  payload: amount
});

/**
 * Action creator for updating the total healing done
 * @param {number} amount - Amount of healing done
 * @returns {Object} Action object
 */
export const updateHealingDone = (amount) => ({
  type: UPDATE_HEALING_DONE,
  payload: amount
});
