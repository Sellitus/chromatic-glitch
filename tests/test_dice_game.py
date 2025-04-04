import unittest
import sys
import os

# Add project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from chromatic_glitch.dice import DiceGame, Die, ObsidianFocusDie, RiverPearlDie, calculate_score
from chromatic_glitch.characters import PlayerCharacter, get_kaelen_data
from tests.mocks import MockRenderer, MockInputHandler
import random # Import random module

# Mock random.randint to control dice rolls
original_randint = random.randint
def controlled_randint(a, b):
    """Return predefined rolls or default."""
    if controlled_randint.rolls:
        return controlled_randint.rolls.pop(0)
    return original_randint(a, b) # Fallback if needed
controlled_randint.rolls = []

import random
random.randint = controlled_randint

class TestDiceGameFlow(unittest.TestCase):

    def setUp(self):
        self.player = PlayerCharacter(**get_kaelen_data())
        self.renderer = MockRenderer()
        self.input_handler = MockInputHandler()
        # Reset rolls before each test
        controlled_randint.rolls = []

    def tearDown(self):
        # Restore original randint after tests
        random.randint = original_randint

    def test_bust_on_first_roll(self):
        """Test busting immediately."""
        controlled_randint.rolls = [2, 3, 4, 6, 2, 4] # No scoring dice
        dice_game = DiceGame(self.player)
        round_score = dice_game._play_round(self.renderer, self.input_handler)
        self.assertEqual(round_score, 0)
        self.assertIn("No scoring dice! Busted this round.", "".join(self.renderer.messages))

    def test_score_singles_and_stop(self):
        """Test scoring 1 and 5 then stopping."""
        controlled_randint.rolls = [1, 5, 2, 2, 3, 6] # Roll 1, 5, and non-scorers (avoiding straight)
        dice_game = DiceGame(self.player)

        # Preset inputs:
        # 1. Choose action: Set aside 'Single 1' (assume it's option 1)
        # 2. Choose action: Set aside 'Single 5' (assume it's option 1 after '1' is gone)
        # 3. Choose action: Done ('d')
        # 4. Choose roll again? No ('n')
        # Note: This relies heavily on the order presented by the mock input handler's get_dice_to_set_aside
        # A more robust mock might be needed for complex scenarios.
        # Let's assume the mock returns the first valid score if multiple exist.
        possible_scores_roll1 = calculate_score([1, 5, 2, 2, 3, 6])
        score_1_data = next(d for d in possible_scores_roll1 if d[0] == (1,))
        self.input_handler.add_dice_action("set_aside", {"combo": score_1_data[0], "score": score_1_data[1], "desc": score_1_data[2]})

        possible_scores_roll2 = calculate_score([5, 2, 2, 3, 6]) # After setting aside 1
        score_5_data = next(d for d in possible_scores_roll2 if d[0] == (5,))
        self.input_handler.add_dice_action("set_aside", {"combo": score_5_data[0], "score": score_5_data[1], "desc": score_5_data[2]})

        self.input_handler.add_dice_action("stop") # Choose 'd'
        self.input_handler.add_reroll_choice(False) # Choose 'n'

        round_score = dice_game._play_round(self.renderer, self.input_handler)
        self.assertEqual(round_score, 150) # 100 + 50

    def test_score_triple_roll_again_bust(self):
        """Test scoring a triple, rolling again, then busting."""
        controlled_randint.rolls = [4, 4, 4, 2, 3, 6] + [2, 3, 6] # Roll 1 + Roll 2 (bust)
        dice_game = DiceGame(self.player)

        # Preset inputs:
        # 1. Choose action: Set aside 'Triple 4s'
        # 2. Choose action: Done ('d')
        # 3. Choose roll again? Yes ('y')
        # (Next roll is [2, 3, 6] -> Bust)
        possible_scores_roll1 = calculate_score([4, 4, 4, 2, 3, 6])
        score_444_data = next(d for d in possible_scores_roll1 if d[0] == (4, 4, 4))
        self.input_handler.add_dice_action("set_aside", {"combo": score_444_data[0], "score": score_444_data[1], "desc": score_444_data[2]})
        self.input_handler.add_dice_action("stop")
        self.input_handler.add_reroll_choice(True) # Roll again

        round_score = dice_game._play_round(self.renderer, self.input_handler)
        # Even though 400 was scored initially, the bust on the second roll zeroes the round
        self.assertEqual(round_score, 0)
        self.assertIn("No scoring dice! Busted this round.", "".join(self.renderer.messages))

    # TODO: Add tests for Hot Dice
    # TODO: Add tests for Obsidian Focus Die reroll interaction

if __name__ == '__main__':
    unittest.main()
