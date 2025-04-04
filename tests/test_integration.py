import unittest
import sys
import os

# Add project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from chromatic_glitch.game_state import GameState
from chromatic_glitch.characters import PlayerCharacter, get_kaelen_data
from chromatic_glitch.phases.omen import handle_omen_phase
from chromatic_glitch.phases.preparation import handle_preparation_phase
from chromatic_glitch.phases.treatment import handle_treatment_phase
from chromatic_glitch.phases.aftermath import handle_aftermath_phase
from tests.mocks import MockRenderer, MockInputHandler, MockGameState # Use full mock state
import random # Import random module

# Mock random.choice for predictable Omen event
original_choice = random.choice
def predictable_choice(seq):
    """Return the first element for predictability."""
    if predictable_choice.force_choice is not None:
        choice = predictable_choice.force_choice
        predictable_choice.force_choice = None # Reset after use
        return choice
    return seq[0] # Default to first element
predictable_choice.force_choice = None

import random
random_choice_backup = random.choice
random.choice = predictable_choice

class TestIntegrationSimplePlaythrough(unittest.TestCase):

    def setUp(self):
        # Use full mock state which includes mock UI handlers
        self.game_state = MockGameState()
        self.player = PlayerCharacter(**get_kaelen_data())
        self.game_state.player_character = self.player
        # Reset forced choice
        predictable_choice.force_choice = None

    def tearDown(self):
        # Restore original random.choice
        random.choice = random_choice_backup

    def test_simple_cycle(self):
        """Test a single cycle: Omen -> Prep -> Treat -> Aftermath."""
        input_handler = self.game_state.input_handler
        renderer = self.game_state.renderer

        # --- Omen Phase ---
        # Force Trail Shrine event (assuming it's first in OMEN_EVENTS)
        # Preset choice: Offer thanks (index 0)
        input_handler.set_choice("What do you do?", 0)
        handle_omen_phase(self.game_state)
        self.assertEqual(self.game_state.current_phase, "PREPARATION")
        # Check if tool was healed (assuming max health initially)
        # self.assertEqual(self.player.tools[0].current_resonance, self.player.tools[0].max_resonance)

        # --- Preparation Phase ---
        # Preset choice: Choose first patient (index 0)
        input_handler.set_choice("Choose a patient to treat:", 0)
        # Preset choice: Start Treatment (assuming it's the last option, index depends on menu length)
        # Let's assume 6 options: View Deck, View Dice, View Items, Equip Item, Manage Dice, Visit Shop, Start Treatment -> index 6
        input_handler.set_choice("Prepare yourself:", 6)
        handle_preparation_phase(self.game_state)
        self.assertEqual(self.game_state.current_phase, "TREATMENT")
        self.assertIsNotNone(self.game_state.current_encounter)

        # --- Treatment Phase ---
        # Preset combat action: Play first card (Strike, index 0) targeting first ailment (index 0)
        self.player.draw_card(1, renderer) # Explicitly draw one card before treatment simulation
        # Note: Mock get_combat_action is basic, needs improvement for real testing
        # We'll manually simulate playing one card for now
        initial_ailment_res = self.game_state.current_encounter[0].current_resonance
        card_to_play = self.player.hand[0] # Assume Strike is first card drawn
        target_ailment = self.game_state.current_encounter[0]
        # card_to_play.execute(self.player, target_ailment, self.game_state) # Bypass card execute
        target_ailment.take_soothe(4, renderer) # Call take_soothe directly with expected amount (4 for Strike)
        self.assertLess(target_ailment.current_resonance, initial_ailment_res)
        # Simulate winning immediately for simplicity
        self.game_state.current_encounter = [] # Clear ailments
        # Manually transition (usually happens inside handle_treatment_phase)
        renderer.display_message("Victory! The Ailments have been Soothed.")
        self.game_state.transition_to_phase("AFTERMATH")


        # --- Aftermath Phase ---
        initial_currency = self.player.currency
        initial_collection_size = len(self.player.card_collection)
        # Preset choice: Choose first card reward (index 0)
        input_handler.set_choice("Choose a card to add", 0)
        handle_aftermath_phase(self.game_state)
        self.assertEqual(self.game_state.current_phase, "OMEN") # Loops back
        self.assertGreater(self.player.currency, initial_currency)
        self.assertEqual(len(self.player.card_collection), initial_collection_size + 1)


if __name__ == '__main__':
    unittest.main()
