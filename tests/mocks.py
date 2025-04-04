# Mock objects for testing core logic without real UI interaction

from chromatic_glitch.ui.abstract_ui import AbstractRenderer, AbstractInputHandler
from chromatic_glitch.characters import PlayerCharacter # For type hints
from chromatic_glitch.ailments import Ailment # For type hints
from chromatic_glitch.shop import Shop # For type hints
from chromatic_glitch.game_state import Patient # For type hints

class MockRenderer(AbstractRenderer):
    """A mock renderer that captures messages instead of printing."""
    def __init__(self):
        self.messages = []

    def display_message(self, message: str):
        self.messages.append(message)
        # print(f"[MockRender]: {message}") # Optional: uncomment for debug visibility

    # Implement other methods as needed, potentially just passing or logging calls
    def display_combat_state(self, player, ailments): pass
    def display_player_status(self, player): pass
    def display_deck(self, player): pass
    def display_dice(self, player): pass
    def display_items(self, player): pass
    def display_shop_inventory(self, shop): pass
    def display_available_patients(self, patients): pass
    def display_omen_options(self, text: str, options: list[str]): pass
    def display_dice_roll(self, roll_values: list[int]): pass
    def display_dice_scores(self, possible_scores: list): pass

class MockInputHandler(AbstractInputHandler):
    """A mock input handler that returns predefined responses."""
    def __init__(self):
        self.preset_choices = {} # Map prompt to choice index/value
        self.preset_confirmations = {} # Map prompt to True/False
        self.preset_dice_actions = [] # List of ('action_type', data) tuples
        self.preset_reroll_choices = [] # List of True/False

    # --- Methods to preset responses ---
    def set_choice(self, prompt_substring, choice_index):
        self.preset_choices[prompt_substring] = choice_index

    def set_confirmation(self, prompt_substring, value: bool):
        self.preset_confirmations[prompt_substring] = value

    def add_dice_action(self, action_type: str, data: dict | None = None):
        self.preset_dice_actions.append((action_type, data))

    def add_reroll_choice(self, value: bool):
        self.preset_reroll_choices.append(value)

    # --- Abstract Method Implementations ---
    def get_player_choice(self, prompt: str, options: list[str]) -> tuple[int, str]:
        for key, index in self.preset_choices.items():
            if key in prompt:
                if 0 <= index < len(options):
                    # print(f"[MockInput] Choice for '{prompt}': {index+1} -> {options[index]}")
                    return index, options[index]
        # Default or error if no preset match
        print(f"[MockInput] WARN: No preset choice for prompt: {prompt}")
        return 0, options[0] # Default to first option

    def get_combat_action(self, player, active_ailments) -> tuple[str, dict]:
        # Needs more sophisticated presets if used in complex tests
        print("[MockInput] WARN: get_combat_action not fully mocked.")
        return "END_TURN", {} # Default to ending turn

    def get_target_index(self, prompt: str, max_index: int, allow_cancel=True) -> int | None:
        for key, index in self.preset_choices.items():
            if key in prompt:
                # print(f"[MockInput] Target Index for '{prompt}': {index+1}")
                return index
        print(f"[MockInput] WARN: No preset target index for prompt: {prompt}")
        return 0 # Default to first target

    def get_target_index_alpha(self, prompt: str, max_count: int, allow_cancel=True) -> int | None:
        for key, index in self.preset_choices.items():
             if key in prompt:
                  # print(f"[MockInput] Target Index Alpha for '{prompt}': {chr(ord('A')+index)}")
                  return index
        print(f"[MockInput] WARN: No preset alpha target index for prompt: {prompt}")
        return 0 # Default to first target

    def confirm_action(self, prompt: str) -> bool:
        for key, value in self.preset_confirmations.items():
            if key in prompt:
                # print(f"[MockInput] Confirmation for '{prompt}': {value}")
                return value
        print(f"[MockInput] WARN: No preset confirmation for prompt: {prompt}")
        return True # Default to True

    def wait_for_acknowledgement(self, prompt: str = "Press Enter to continue..."):
        # print(f"[MockInput] Acknowledged: {prompt}")
        pass # Do nothing in mock

    def get_dice_to_set_aside(self, possible_scores: list, can_reroll: bool, reroll_options: list) -> tuple[str, dict | None]:
        if self.preset_dice_actions:
            action = self.preset_dice_actions.pop(0)
            # print(f"[MockInput] Dice Action: {action}")
            return action
        print("[MockInput] WARN: No preset dice action, stopping round.")
        return "stop", None # Default to stopping

    def get_dice_reroll_choice(self) -> bool:
        if self.preset_reroll_choices:
            choice = self.preset_reroll_choices.pop(0)
            # print(f"[MockInput] Reroll Choice: {choice}")
            return choice
        print("[MockInput] WARN: No preset reroll choice, choosing 'n'.")
        return False # Default to not rerolling

class MockGameState:
    """A simplified GameState holding mock UI handlers for testing."""
    def __init__(self):
        self.renderer = MockRenderer()
        self.input_handler = MockInputHandler()
        self.player_character = None # Tests should set this
        # Add other state attributes if needed by the methods being tested
        self.current_phase = "TEST"

    # Add dummy transition method if needed by tested code
    def transition_to_phase(self, next_phase):
        # print(f"[MockGameState] Transitioning to {next_phase}")
        self.current_phase = next_phase
