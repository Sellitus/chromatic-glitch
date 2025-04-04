import unittest
import sys
import os

# Add project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from chromatic_glitch.items import ResonatorCrystal, SoothingPoultice
from chromatic_glitch.characters import PlayerCharacter, get_kaelen_data
from tests.mocks import MockRenderer, MockGameState

class TestItemEffects(unittest.TestCase):

    def setUp(self):
        self.game_state = MockGameState()
        self.player = PlayerCharacter(**get_kaelen_data())
        self.game_state.player_character = self.player
        # Ensure dice_score_bonus doesn't exist initially
        if hasattr(self.player, 'dice_score_bonus'):
            delattr(self.player, 'dice_score_bonus')

    def test_resonator_crystal_equip_unequip(self):
        """Test equipping and unequipping Resonator Crystal applies/removes bonus."""
        item = ResonatorCrystal()
        renderer = self.game_state.renderer

        # Check initial state
        self.assertFalse(hasattr(self.player, 'dice_score_bonus') or getattr(self.player, 'dice_score_bonus', 0) != 0)

        # Equip - Slot 0
        equipped = self.player.equip_item(item, 0, renderer)
        self.assertTrue(equipped)
        self.assertTrue(hasattr(self.player, 'dice_score_bonus'))
        self.assertEqual(self.player.dice_score_bonus, 50)
        self.assertIn("Equipped Resonator Crystal", "".join(renderer.messages)) # Check message

        # Unequip
        unequipped = self.player.unequip_item(0, renderer)
        self.assertTrue(unequipped)
        # Check bonus is removed or reset (assuming 0 if removed)
        self.assertEqual(getattr(self.player, 'dice_score_bonus', 0), 0)
        self.assertIn("Unequipped Resonator Crystal", "".join(renderer.messages)) # Check message

    def test_soothing_poultice_heal(self):
        """Test Soothing Poultice heals the most damaged tool."""
        item = SoothingPoultice()
        renderer = self.game_state.renderer
        tool1 = self.player.tools[0]
        tool2 = self.player.tools[1]

        # Damage tools unequally
        tool1.take_damage(20, renderer) # More damaged
        tool2.take_damage(10, renderer)
        initial_res1 = tool1.current_resonance
        initial_res2 = tool2.current_resonance

        # Use item
        used = item.use(self.player, renderer)
        self.assertTrue(used)

        # Check only tool1 was healed
        self.assertEqual(tool1.current_resonance, min(initial_res1 + 15, tool1.max_resonance))
        self.assertEqual(tool2.current_resonance, initial_res2) # Tool 2 should be unchanged

if __name__ == '__main__':
    unittest.main()
