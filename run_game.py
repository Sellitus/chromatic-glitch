#!/usr/bin/env python3

"""
Entry point script to run the Chromatic Glitch prototype.
"""

import sys
import os

# Add the project root to the Python path to allow imports from chromatic_glitch
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from chromatic_glitch.main import run_game

if __name__ == "__main__":
    run_game()
