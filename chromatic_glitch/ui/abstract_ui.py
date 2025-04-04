# Defines abstract base classes for UI components (Renderer and Input Handler)
# This allows the core game logic to interact with different UI implementations (CLI, GUI)

from abc import ABC, abstractmethod

# Forward declarations for type hinting if needed (or import specific types)
# from ..game_state import GameState # Avoid circular imports if possible
# from ..characters import PlayerCharacter
# from ..ailments import Ailment

class AbstractRenderer(ABC):
    """Abstract base class for rendering game information."""

    @abstractmethod
    def display_message(self, message: str):
        """Displays a generic message to the user."""
        pass

    @abstractmethod
    def display_combat_state(self, player, ailments):
        """Displays the current state of combat (player tools, ailments, etc.)."""
        pass

    @abstractmethod
    def display_player_status(self, player):
        """Displays the player's current status (currency, etc.)."""
        pass

    @abstractmethod
    def display_deck(self, player):
        """Displays the player's current deck."""
        pass

    @abstractmethod
    def display_dice(self, player):
        """Displays the player's dice loadout and collection."""
        pass

    @abstractmethod
    def display_items(self, player):
        """Displays the player's items (equipment, consumables)."""
        pass

    @abstractmethod
    def display_shop_inventory(self, shop):
        """Displays the shop's inventory."""
        pass

    @abstractmethod
    def display_available_patients(self, patients):
        """Displays the available patient options."""
        pass

    @abstractmethod
    def display_omen_options(self, text: str, options: list[str]):
        """Displays the text and options for an Omen event."""
        pass

    @abstractmethod
    def display_dice_roll(self, roll_values: list[int]):
        """Displays the result of a dice roll."""
        pass

    @abstractmethod
    def display_dice_scores(self, possible_scores: list):
        """Displays the possible scoring combinations for a dice roll."""
        pass

    # Add other display methods as needed (e.g., display_aftermath_rewards)


class AbstractInputHandler(ABC):
    """Abstract base class for handling user input."""

    @abstractmethod
    def get_player_choice(self, prompt: str, options: list[str]) -> tuple[int, str]:
        """Gets a choice from the player based on a list of numbered options."""
        pass

    @abstractmethod
    def get_combat_action(self, player, active_ailments) -> tuple[str, dict]:
        """Gets the player's action choice during combat."""
        pass

    @abstractmethod
    def get_target_index(self, prompt: str, max_index: int, allow_cancel=True) -> int | None:
        """Gets a valid numeric target index (0-based) from the user."""
        pass

    @abstractmethod
    def get_target_index_alpha(self, prompt: str, max_count: int, allow_cancel=True) -> int | None:
        """Gets a valid 0-based index based on letter input (A=0, B=1...)."""
        pass

    @abstractmethod
    def confirm_action(self, prompt: str) -> bool:
        """Asks the user for a simple yes/no confirmation."""
        pass

    @abstractmethod
    def wait_for_acknowledgement(self, prompt: str = "Press Enter to continue..."):
        """Pauses execution until the user acknowledges (e.g., presses Enter)."""
        pass

    @abstractmethod
    def get_dice_to_set_aside(self, possible_scores: list, can_reroll: bool, reroll_options: list) -> tuple[str, dict | None]:
        """Handles the complex input for the dice game selection phase."""
        # Returns action type ('set_aside', 'reroll', 'stop') and data
        pass

    @abstractmethod
    def get_dice_reroll_choice(self) -> bool:
        """Asks the player if they want to roll remaining dice again."""
        pass

    # Add other input methods as needed
