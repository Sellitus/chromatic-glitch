import { Store } from '../../src/js/state/store';
import { rootReducer } from '../../src/js/state/reducers/rootReducer';
import { persistenceMiddleware } from '../../src/js/state/middleware/persistence';
import {
  updateSpiritStrain,
  addCardToCollection,
  removeCardFromCollection,
  setDeck,
  updateResource,
  gainExperience,
  levelUp,
  updateReputation,
  updateStatistic,
  unlockAchievement,
  updateAchievementProgress,
  updatePreference
} from '../../src/js/state/actions/playerActions';

describe('Player State Management', () => {
  let store;
  
  beforeEach(() => {
    const initialState = {
      player: {
        spiritStrain: 0,
        maxSpiritStrain: 100,
        cardCollection: [],
        deck: [],
        resources: {
          currency: 0,
          materials: 0
        },
        experience: 0,
        level: 1,
        reputation: {
          hospital: 0,
          patients: 0,
          community: 0
        },
        statistics: {
          patientsHealed: 0,
          cardsPlayed: 0,
          totalDamageDealt: 0
        },
        achievements: [],
        achievementProgress: {},
        preferences: {
          soundVolume: 1.0,
          showTutorials: true
        }
      }
    };
    store = new Store(rootReducer, initialState, [persistenceMiddleware]);
  });

  describe('Spirit Strain Management', () => {
    it('should update spirit strain within bounds', () => {
      store.dispatch(updateSpiritStrain(50));
      expect(store.getState().player.spiritStrain).toBe(50);

      store.dispatch(updateSpiritStrain(150));
      expect(store.getState().player.spiritStrain).toBe(100);

      store.dispatch(updateSpiritStrain(-150));
      expect(store.getState().player.spiritStrain).toBe(0); // Clamped to min
    });
  });

  describe('Card Collection Management', () => {
    const testCard = { id: 'test-card-1', name: 'Test Card' };

    it('should add and remove cards from collection', () => {
      store.dispatch(addCardToCollection(testCard));
      expect(store.getState().player.cardCollection).toContainEqual(testCard);

      store.dispatch(removeCardFromCollection(testCard.id));
      expect(store.getState().player.cardCollection).not.toContainEqual(testCard);
    });

    it('should set deck contents', () => {
      const deck = [testCard, { id: 'test-card-2', name: 'Another Card' }];
      store.dispatch(setDeck(deck));
      expect(store.getState().player.deck).toEqual(deck);
    });
  });

  describe('Resource Management', () => {
    it('should update resources correctly', () => {
      store.dispatch(updateResource('currency', 100));
      expect(store.getState().player.resources.currency).toBe(100);

      store.dispatch(updateResource('materials', 50));
      expect(store.getState().player.resources.materials).toBe(50);

      // Should not go below 0
      store.dispatch(updateResource('currency', -150));
      expect(store.getState().player.resources.currency).toBe(0);
    });
  });

  describe('Progression System', () => {
    it('should handle experience gain and leveling', () => {
      store.dispatch(gainExperience(50));
      expect(store.getState().player.experience).toBe(50);

      store.dispatch(gainExperience(60)); // Total: 110, should level up
      expect(store.getState().player.level).toBe(2);
      expect(store.getState().player.experience).toBe(10); // Excess XP

      store.dispatch(levelUp());
      expect(store.getState().player.level).toBe(3);
    });
  });

  describe('Reputation System', () => {
    it('should update faction reputation within bounds', () => {
      store.dispatch(updateReputation('hospital', 50));
      expect(store.getState().player.reputation.hospital).toBe(50);

      store.dispatch(updateReputation('patients', -30));
      expect(store.getState().player.reputation.patients).toBe(-30);

      // Should clamp to bounds (-100 to 100)
      store.dispatch(updateReputation('community', 150));
      expect(store.getState().player.reputation.community).toBe(100);
    });
  });

  describe('Statistics System', () => {
    it('should track player statistics', () => {
      store.dispatch(updateStatistic('patientsHealed', 1));
      expect(store.getState().player.statistics.patientsHealed).toBe(1);

      store.dispatch(updateStatistic('cardsPlayed', 5));
      expect(store.getState().player.statistics.cardsPlayed).toBe(5);

      store.dispatch(updateStatistic('totalDamageDealt', 100));
      expect(store.getState().player.statistics.totalDamageDealt).toBe(100);
    });
  });

  describe('Achievement System', () => {
    const achievement = { id: 'first-win', name: 'First Victory' };

    it('should handle achievements and progress', () => {
      store.dispatch(unlockAchievement(achievement));
      expect(store.getState().player.achievements).toContainEqual(achievement);

      store.dispatch(updateAchievementProgress('healing-master', 50));
      expect(store.getState().player.achievementProgress['healing-master']).toBe(50);
    });
  });

  describe('Preferences System', () => {
    it('should update user preferences', () => {
      store.dispatch(updatePreference('soundVolume', 0.5));
      expect(store.getState().player.preferences.soundVolume).toBe(0.5);

      store.dispatch(updatePreference('showTutorials', false));
      expect(store.getState().player.preferences.showTutorials).toBe(false);
    });
  });

  describe('State Persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should persist specific state fields', () => {
      store.dispatch(updatePreference('soundVolume', 0.5));
      store.dispatch(gainExperience(50));
      store.dispatch(updateReputation('hospital', 25));

      const savedState = JSON.parse(localStorage.getItem('playerState'));
      expect(savedState.preferences.soundVolume).toBe(0.5);
      expect(savedState.experience).toBe(50);
      expect(savedState.reputation.hospital).toBe(25);
    });
  });
});
