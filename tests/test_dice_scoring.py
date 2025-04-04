import unittest
import sys
import os

# Add project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from chromatic_glitch.dice import calculate_score, Die, RiverPearlDie

class TestDiceScoring(unittest.TestCase):

    def test_no_score(self):
        """Test roll with no scoring dice."""
        scores = calculate_score([2, 3, 4, 6, 2, 4])
        self.assertEqual(scores, [])

    def test_single_1(self):
        """Test single 1 scoring."""
        scores = calculate_score([1, 2, 3, 4, 6, 2])
        self.assertIn(((1,), 100, 'Single 1'), scores)

    def test_single_5(self):
        """Test single 5 scoring."""
        scores = calculate_score([5, 2, 3, 4, 6, 2])
        self.assertIn(((5,), 50, 'Single 5'), scores)

    def test_multiple_singles(self):
        """Test multiple single 1s and 5s."""
        scores = calculate_score([1, 5, 1, 2, 3, 4])
        # Note: Current implementation returns separate entries for each single
        self.assertTrue(any(s == ((1,), 100, 'Single 1') for s in scores))
        self.assertTrue(any(s == ((5,), 50, 'Single 5') for s in scores))
        # Check count if implementation changes later
        # self.assertEqual(sum(1 for s in scores if s[0] == (1,)), 2)

    def test_triple_2s(self):
        """Test triple 2s scoring."""
        scores = calculate_score([2, 2, 2, 3, 4, 6])
        self.assertIn(((2, 2, 2), 200, 'Triple 2s'), scores)

    def test_triple_1s(self):
        """Test triple 1s scoring."""
        scores = calculate_score([1, 1, 1, 3, 4, 6])
        self.assertIn(((1, 1, 1), 1000, 'Triple 1s'), scores)

    def test_triple_and_single(self):
        """Test triple and single scoring together."""
        scores = calculate_score([3, 3, 3, 1, 4, 6])
        self.assertTrue(any(s == ((3, 3, 3), 300, 'Triple 3s') for s in scores))
        self.assertTrue(any(s == ((1,), 100, 'Single 1') for s in scores))

    def test_two_triples(self):
        """Test two triples scoring."""
        scores = calculate_score([4, 4, 4, 6, 6, 6])
        self.assertTrue(any(s == ((4, 4, 4), 400, 'Triple 4s') for s in scores))
        self.assertTrue(any(s == ((6, 6, 6), 600, 'Triple 6s') for s in scores))

    def test_straight(self):
        """Test straight 1-6 scoring."""
        scores = calculate_score([1, 2, 3, 4, 5, 6])
        self.assertEqual(scores, [((1, 2, 3, 4, 5, 6), 1500, 'Straight 1-6')])

    def test_river_pearl_5(self):
        """Test River Pearl Die effect on single 5."""
        dice_objects = [RiverPearlDie(), Die("Standard"), Die("Standard"), Die("Standard"), Die("Standard"), Die("Standard")]
        scores = calculate_score([5, 2, 3, 4, 6, 2], dice_objects)
        # Check if the River Pearl score is present
        self.assertTrue(any(s == ((5,), 60, 'Single 5 (River Pearl)') for s in scores))
        # Check if the standard 5 score is NOT present
        self.assertFalse(any(s == ((5,), 50, 'Single 5') for s in scores))

    def test_river_pearl_triple_5(self):
        """Test River Pearl Die effect with triple 5s (should still be base triple score)."""
        dice_objects = [RiverPearlDie(), RiverPearlDie(), RiverPearlDie(), Die("Standard"), Die("Standard"), Die("Standard")]
        scores = calculate_score([5, 5, 5, 2, 3, 4], dice_objects)
        # Triple score should be standard
        self.assertTrue(any(s == ((5, 5, 5), 500, 'Triple 5s') for s in scores))
        # No single 5s should be scored as the triple takes precedence
        self.assertFalse(any(s[2].startswith('Single 5') for s in scores))

    # TODO: Add tests for more complex combos if implemented (4-of-a-kind etc.)
    # TODO: Add tests for other special dice effects

if __name__ == '__main__':
    unittest.main()
