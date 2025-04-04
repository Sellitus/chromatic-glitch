import unittest
import sys
import os

# Add project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Add project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from chromatic_glitch.tools import Tool
from chromatic_glitch.ailments import Ailment
# Import cards needed for tests
from chromatic_glitch.cards import FlowingChord, EntanglingTune, Guard, StutteringBeat, Strike
# Import mock game state and player using absolute path
from tests.mocks import MockGameState
from chromatic_glitch.characters import PlayerCharacter, get_kaelen_data # Use real player for tool access

class TestStatusEffects(unittest.TestCase):

    def setUp(self):
        self.game_state = MockGameState() # Use mock game state
        # Use a real player to have tools
        self.player = PlayerCharacter(**get_kaelen_data())
        self.game_state.player_character = self.player
        # Reset tool/ailment state for each test
        self.tool = self.player.tools[0]
        self.tool.current_resonance = self.tool.max_resonance
        self.tool.status_effects = {}
        self.ailment = Ailment("Test Ailment", 30)
        self.ailment.status_effects = {}


    def test_entangling_tune_application(self): # Keep this as it tests Slow application
        """Test Entangling Tune applies Slow status."""
        card = EntanglingTune()
        self.assertNotIn("Slow_1", self.ailment.status_effects)
        # Pass game_state to execute
        card.execute(self.player, self.ailment, self.game_state)
        self.assertIn("Slow_1", self.ailment.status_effects)
        self.assertEqual(self.ailment.status_effects["Slow_1"], card.status_effect_duration)

    def test_stuttering_beat_applies_both(self):
        """Test Stuttering Beat applies Slow and Fragile."""
        card = StutteringBeat() # Need to import this card
        self.assertNotIn("Slow_1", self.ailment.status_effects)
        self.assertNotIn("Fragile_1", self.ailment.status_effects)
        card.execute(self.player, self.ailment, self.game_state)
        self.assertIn("Slow_1", self.ailment.status_effects)
        self.assertIn("Fragile_1", self.ailment.status_effects)
        self.assertEqual(self.ailment.status_effects["Slow_1"], card.status_duration)
        self.assertEqual(self.ailment.status_effects["Fragile_1"], card.status_duration)

    def test_stuttering_beat_draws_if_slowed(self):
        """Test Stuttering Beat draws a card if target is already Slowed."""
        card = StutteringBeat()
        # Apply Slow first
        self.ailment.add_status_effect("Slow_1", 1, self.game_state.renderer)
        self.assertIn("Slow_1", self.ailment.status_effects)

        initial_hand_size = len(self.player.hand)
        # Ensure deck has cards
        self.player.deck = [Strike(), Strike()] # Add dummy cards

        card.execute(self.player, self.ailment, self.game_state)
        # Check Fragile was applied
        self.assertIn("Fragile_1", self.ailment.status_effects)
        # Check card was drawn
        self.assertEqual(len(self.player.hand), initial_hand_size + 1)

    def test_fragile_increases_soothe(self):
        """Test Fragile status increases Soothe damage taken."""
        # Apply Fragile_1
        self.ailment.add_status_effect("Fragile_1", 1, self.game_state.renderer)
        initial_resonance = self.ailment.current_resonance
        base_soothe = 10
        expected_soothe = int(base_soothe * 1.5) # 50% increase for Fragile_1

        # Apply soothe
        self.ailment.take_soothe(base_soothe, self.game_state.renderer)
        self.assertEqual(self.ailment.current_resonance, initial_resonance - expected_soothe)


    def test_resonance_application(self):
        """Test Flowing Chord applies Resonance status."""
        card = FlowingChord()
        self.assertNotIn("Resonance_2", self.tool.status_effects)
        # Pass game_state to execute
        card.execute(self.player, self.tool, self.game_state)
        self.assertIn("Resonance_2", self.tool.status_effects)
        self.assertEqual(self.tool.status_effects["Resonance_2"], card.status_effect_duration)

    def test_resonance_ticking_heal(self):
        """Test Resonance status effect heals over time."""
        card = FlowingChord()
        # Pass game_state to execute
        card.execute(self.player, self.tool, self.game_state) # Apply Resonance_2

        # Damage the tool (needs renderer)
        self.tool.take_damage(10, self.game_state.renderer)
        initial_resonance = self.tool.current_resonance # Should be 40

        # Tick 1 (needs renderer)
        self.tool.tick_status_effects(self.game_state.renderer)
        self.assertEqual(self.tool.current_resonance, initial_resonance + card.status_effect_value) # Healed by 2
        self.assertEqual(self.tool.status_effects["Resonance_2"], card.status_effect_duration - 1) # Duration decreased

        # Tick 2 (needs renderer)
        initial_resonance = self.tool.current_resonance # Should be 42
        self.tool.tick_status_effects(self.game_state.renderer)
        self.assertEqual(self.tool.current_resonance, initial_resonance + card.status_effect_value) # Healed by 2
        self.assertNotIn("Resonance_2", self.tool.status_effects) # Effect expired

    def test_slow_application(self):
        """Test Entangling Tune applies Slow status."""
        card = EntanglingTune()
        self.assertNotIn("Slow_1", self.ailment.status_effects)
        # Pass game_state to execute
        card.execute(self.player, self.ailment, self.game_state)
        self.assertIn("Slow_1", self.ailment.status_effects)
        self.assertEqual(self.ailment.status_effects["Slow_1"], card.status_effect_duration)

    def test_slow_ticking(self):
        """Test Slow status effect ticks down."""
        card = EntanglingTune()
        # Pass game_state to execute
        card.execute(self.player, self.ailment, self.game_state) # Apply Slow_1

        # Tick 1 (needs renderer)
        self.ailment.tick_status_effects(self.game_state.renderer)
        self.assertNotIn("Slow_1", self.ailment.status_effects) # Effect expired after 1 tick

    def test_guard_application(self):
        """Test Guard card applies Guard status."""
        card = Guard()
        self.assertNotIn("Guard", self.tool.status_effects)
        # Pass game_state to execute
        card.execute(self.player, self.tool, self.game_state)
        self.assertIn("Guard", self.tool.status_effects)
        self.assertEqual(self.tool.status_effects["Guard"], card.status_effect_duration)

    def test_guard_blocking(self):
        """Test Guard status blocks damage and is consumed."""
        card = Guard()
        # Pass game_state to execute
        card.execute(self.player, self.tool, self.game_state) # Apply Guard
        initial_resonance = self.tool.current_resonance
        self.assertIn("Guard", self.tool.status_effects)

        # Apply damage (needs renderer)
        self.tool.take_damage(10, self.game_state.renderer)

        # Check resonance unchanged and Guard consumed
        self.assertEqual(self.tool.current_resonance, initial_resonance)
        self.assertNotIn("Guard", self.tool.status_effects)

    def test_guard_ticking(self):
        """Test Guard status expires after ticking."""
        card = Guard()
        # Pass game_state to execute
        card.execute(self.player, self.tool, self.game_state) # Apply Guard
        self.assertIn("Guard", self.tool.status_effects)

        # Tick 1 (needs renderer)
        self.tool.tick_status_effects(self.game_state.renderer)
        self.assertNotIn("Guard", self.tool.status_effects) # Should expire

if __name__ == '__main__':
    unittest.main()
