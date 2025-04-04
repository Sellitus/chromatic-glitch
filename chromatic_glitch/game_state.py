# Manages the overall game state, including player progress, current phase, etc.
from .ui.abstract_ui import AbstractRenderer, AbstractInputHandler # Import interfaces
from .characters import PlayerCharacter # For type hinting

class GameState:
    """Represents the current state of the game."""
    # Modified __init__ to accept UI handlers
    def __init__(self, renderer: AbstractRenderer, input_handler: AbstractInputHandler):
        self.renderer = renderer
        self.input_handler = input_handler

        self.current_phase = "START" # e.g., OMEN, PREPARATION, TREATMENT, AFTERMATH
        self.player_character: PlayerCharacter | None = None
        self.current_patient = None
        self.available_patients = []
        self.shop_inventory = {}
        self.currency = 0
        self.current_encounter = [] # Ailments for the current treatment
        # Add other relevant state variables as needed
        print("GameState initialized.")

    def transition_to_phase(self, next_phase):
        """Handles logic for changing game phases."""
        print(f"\n>>> Transitioning from {self.current_phase} to {next_phase} <<<")
        self.current_phase = next_phase
        # Add any logic needed on phase transitions


# --- Patient Class ---
# Represents a patient needing treatment. Contains info about the encounter.
class Patient:
    def __init__(self, name, description, ailment_types, ailment_instances, difficulty, reward_focus, turns=10):
        self.name = name
        self.description = description # Flavor text
        self.ailment_types = ailment_types # List of strings/enums, e.g., ["Fear", "Spike"]
        self.ailment_instances = ailment_instances # List of actual Ailment objects for the fight
        self.difficulty = difficulty # e.g., 1, 2, 3 or "Easy", "Medium", "Hard"
        self.reward_focus = reward_focus # e.g., "Card", "Dice", "Item", "Currency"
        self.turns_remaining = turns # Optional timer

    def __str__(self):
        ailment_names = [a.name for a in self.ailment_instances]
        return (f"{self.name}: {self.description}\n"
                f"  Ailments: {', '.join(ailment_names)} (Difficulty: {self.difficulty})\n"
                f"  Reward Focus: {self.reward_focus}")
