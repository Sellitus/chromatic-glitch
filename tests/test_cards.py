import unittest
import sys
import os

# Add project root to sys.path to allow importing chromatic_glitch modules
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Add project root to sys.path to allow importing chromatic_glitch modules
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Import all necessary cards and character data functions
from chromatic_glitch.cards import (
    Strike, Mend, Guard, ForcefulNote, KaelensResolve, SteadyRhythm,
    EchoingShout, HarmonicPulse, LyrasInsight, Soothe # Added missing imports
)
from chromatic_glitch.characters import PlayerCharacter, get_kaelen_data, get_lyra_data # Added get_lyra_data
from chromatic_glitch.ailments import Ailment, CrawlingAnxiety, SensorySpike # Added SensorySpike for test
from chromatic_glitch.tools import Tool, ResonantGourd, SteadyDrum # Added SteadyDrum for test
# Import mock game state using absolute path from project root
from tests.mocks import MockGameState

class TestCardEffects(unittest.TestCase):

    def setUp(self):
        """Set up common objects for tests."""
        self.game_state = MockGameState() # Use mock game state
        self.player = PlayerCharacter(**get_kaelen_data())
        self.game_state.player_character = self.player
        self.target_ailment = CrawlingAnxiety()
        # Ensure target tool exists and reset resonance for tests
        self.target_tool = self.player.tools[0]
        self.target_tool.current_resonance = self.target_tool.max_resonance
        self.target_tool.status_effects = {} # Ensure clean status effects

    def test_strike_card(self):
        """Test the Strike card deals correct Soothe."""
        strike = Strike()
        initial_resonance = self.target_ailment.current_resonance
        # Pass game_state to execute
        strike.execute(self.player, self.target_ailment, self.game_state)
        # Check resonance (take_soothe now needs renderer, but tests don't check messages here)
        self.assertEqual(self.target_ailment.current_resonance, initial_resonance - strike.soothe_amount)

    def test_mend_card(self):
        """Test the Mend card restores correct Resonance."""
        mend = Mend()
        # Damage the tool first (take_damage needs renderer)
        self.target_tool.take_damage(10, self.game_state.renderer)
        initial_resonance = self.target_tool.current_resonance
        # Pass game_state to execute
        mend.execute(self.player, self.target_tool, self.game_state)
        # Heal should be capped at max_resonance
        expected_resonance = min(initial_resonance + mend.resonance_amount, self.target_tool.max_resonance)
        self.assertEqual(self.target_tool.current_resonance, expected_resonance)

    def test_guard_card(self):
        """Test the Guard card applies the Guard status."""
        guard = Guard()
        self.assertNotIn("Guard", self.target_tool.status_effects)
        # Pass game_state to execute
        guard.execute(self.player, self.target_tool, self.game_state)
        self.assertIn("Guard", self.target_tool.status_effects)
        self.assertEqual(self.target_tool.status_effects["Guard"], guard.status_effect_duration)

    def test_forceful_note_no_dice(self):
        """Test Forceful Note base damage without dice score."""
        card = ForcefulNote()
        initial_resonance = self.target_ailment.current_resonance
        # Pass game_state to execute
        card.execute(self.player, self.target_ailment, self.game_state, dice_score=0)
        self.assertEqual(self.target_ailment.current_resonance, initial_resonance - card.soothe_amount)

    def test_forceful_note_with_dice(self):
        """Test Forceful Note bonus damage with dice score."""
        card = ForcefulNote()
        dice_score = 550 # Example score > 0
        bonus_soothe = dice_score // 50
        initial_resonance = self.target_ailment.current_resonance
        # Pass game_state to execute
        card.execute(self.player, self.target_ailment, self.game_state, dice_score=dice_score)
        expected_damage = card.soothe_amount + bonus_soothe
        # Ensure expected resonance doesn't go below 0
        expected_resonance = max(0, initial_resonance - expected_damage)
        self.assertEqual(self.target_ailment.current_resonance, expected_resonance)

    def test_kaelens_resolve_low_score(self):
        """Test Kaelen's Resolve deals damage on low score."""
        card = KaelensResolve()
        dice_score = 50 # Low score <= 100
        initial_tool_res = self.target_tool.current_resonance
        # Execute affects the first tool
        card.execute(self.player, None, self.game_state, dice_score=dice_score)
        self.assertEqual(self.target_tool.current_resonance, initial_tool_res - 2) # Expect 2 damage

    def test_kaelens_resolve_high_score(self):
        """Test Kaelen's Resolve heals on high score."""
        card = KaelensResolve()
        dice_score = 450 # High score > 100
        heal_amount = dice_score // 100 # 4
        # Damage tool first so heal has effect
        self.target_tool.take_damage(10, self.game_state.renderer)
        initial_tool_res = self.target_tool.current_resonance
        # Execute affects the first tool
        card.execute(self.player, None, self.game_state, dice_score=dice_score)
        expected_res = min(initial_tool_res + heal_amount, self.target_tool.max_resonance)
        self.assertEqual(self.target_tool.current_resonance, expected_res)

    def test_steady_rhythm_low_score(self):
        """Test Steady Rhythm grants no AP on low score."""
        card = SteadyRhythm()
        dice_score = 250 # Low score <= 300
        self.player.next_turn_effects = {} # Ensure no pre-existing effects
        card.execute(self.player, None, self.game_state, dice_score=dice_score)
        self.assertNotIn("BonusAP", self.player.next_turn_effects)

    def test_steady_rhythm_high_score(self):
        """Test Steady Rhythm grants +1 AP on high score."""
        card = SteadyRhythm()
        dice_score = 350 # High score > 300
        self.player.next_turn_effects = {} # Ensure no pre-existing effects
        card.execute(self.player, None, self.game_state, dice_score=dice_score)
        self.assertIn("BonusAP", self.player.next_turn_effects)
        self.assertEqual(self.player.next_turn_effects["BonusAP"], 1)

    def test_lyras_insight_no_buff(self):
        """Test Lyra's Insight draws 1 card when no tool has buffs."""
        # Need Lyra's deck for this card
        self.player = PlayerCharacter(**get_lyra_data()) # Re-init player as Lyra
        self.game_state.player_character = self.player
        self.target_tool = self.player.tools[0]
        self.target_tool.status_effects = {} # Ensure no buffs

        card = LyrasInsight()
        initial_hand_size = len(self.player.hand)
        # Ensure deck has cards
        self.player.deck = [Strike(), Strike(), Strike()] # Add dummy cards

        card.execute(self.player, None, self.game_state)
        self.assertEqual(len(self.player.hand), initial_hand_size + 1) # Drew 1 card

    def test_lyras_insight_with_buff(self):
        """Test Lyra's Insight draws 2 cards when a tool has buffs."""
        self.player = PlayerCharacter(**get_lyra_data()) # Re-init player as Lyra
        self.game_state.player_character = self.player
        self.target_tool = self.player.tools[0]
        # Give tool a buff
        self.target_tool.add_status_effect("Guard", 1, self.game_state.renderer)

        card = LyrasInsight()
        initial_hand_size = len(self.player.hand)
        # Ensure deck has cards
        self.player.deck = [Strike(), Strike(), Strike()] # Add dummy cards

        card.execute(self.player, None, self.game_state)
        self.assertEqual(len(self.player.hand), initial_hand_size + 2) # Drew 2 cards

    def test_echoing_shout(self):
        """Test Echoing Shout hits the first two ailments."""
        card = EchoingShout()
        # Ensure ailments have full health for consistent testing
        ailment1 = CrawlingAnxiety()
        ailment1.current_resonance = ailment1.max_resonance
        ailment2 = SensorySpike()
        ailment2.current_resonance = ailment2.max_resonance
        ailment3 = CrawlingAnxiety()
        ailment3.current_resonance = ailment3.max_resonance
        active_ailments = [ailment1, ailment2, ailment3]

        initial_res1 = ailment1.current_resonance
        initial_res2 = ailment2.current_resonance
        initial_res3 = ailment3.current_resonance

        # Execute with the list of ailments
        card.execute(self.player, active_ailments, self.game_state)

        self.assertEqual(ailment1.current_resonance, initial_res1 - card.soothe_amount)
        self.assertEqual(ailment2.current_resonance, initial_res2 - card.soothe_amount)
        self.assertEqual(ailment3.current_resonance, initial_res3) # Third ailment should be unaffected

    def test_harmonic_pulse(self):
        """Test Harmonic Pulse heals all active tools."""
        card = HarmonicPulse()
        # Add another tool for testing AoE
        tool2 = SteadyDrum()
        self.player.tools.append(tool2)
        tool1 = self.player.tools[0] # Already exists from setUp

        # Reset resonance and damage both tools
        tool1.current_resonance = tool1.max_resonance
        tool2.current_resonance = tool2.max_resonance
        tool1.take_damage(10, self.game_state.renderer)
        tool2.take_damage(15, self.game_state.renderer)
        initial_res1 = tool1.current_resonance
        initial_res2 = tool2.current_resonance

        # Execute with player.tools list
        card.execute(self.player, self.player.tools, self.game_state)

        expected_res1 = min(initial_res1 + card.resonance_amount, tool1.max_resonance)
        expected_res2 = min(initial_res2 + card.resonance_amount, tool2.max_resonance)

        self.assertEqual(tool1.current_resonance, expected_res1)
        self.assertEqual(tool1.current_resonance, expected_res1)
        self.assertEqual(tool2.current_resonance, expected_res2)

    def test_enhance_strike(self):
        """Test enhancing a Strike card."""
        card = Strike()
        initial_name = card.name
        initial_soothe = card.soothe_amount
        enhanced = card.enhance(self.game_state.renderer)
        self.assertTrue(enhanced)
        self.assertEqual(card.name, initial_name + "+")
        self.assertEqual(card.soothe_amount, initial_soothe + 2)
        # Test enhancing again fails
        enhanced_again = card.enhance(self.game_state.renderer)
        self.assertFalse(enhanced_again)
        self.assertEqual(card.soothe_amount, initial_soothe + 2) # Amount shouldn't change

    def test_enhance_mend(self):
        """Test enhancing a Mend card."""
        card = Mend()
        initial_name = card.name
        initial_resonance = card.resonance_amount
        enhanced = card.enhance(self.game_state.renderer)
        self.assertTrue(enhanced)
        self.assertEqual(card.name, initial_name + "+")
        self.assertEqual(card.resonance_amount, initial_resonance + 2)
        # Test enhancing again fails
        enhanced_again = card.enhance(self.game_state.renderer)
        self.assertFalse(enhanced_again)
        self.assertEqual(card.resonance_amount, initial_resonance + 2) # Amount shouldn't change


    # TODO: Add tests for EntanglingTune

if __name__ == '__main__':
    unittest.main()
