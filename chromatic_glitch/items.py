# Defines Item classes (Equipment, Consumables)
# Import UI interfaces for type hinting
from .ui.abstract_ui import AbstractRenderer
# Import other types for hinting using forward references
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .characters import PlayerCharacter

class Item:
    """Base class for all items."""
    def __init__(self, name, description):
        self.name = name
        self.description = description

    def __str__(self):
        return f"{self.name} - {self.description}"

class Equipment(Item):
    """Represents passive equipment items."""
    def __init__(self, name, description, apply_effect_func=None, remove_effect_func=None):
        super().__init__(name, description)
        # Functions to apply/remove passive effects when equipped/unequipped
        self._apply_effect = apply_effect_func
        self._remove_effect = remove_effect_func

    # Modified to accept renderer
    def apply_effect(self, player, renderer: AbstractRenderer):
        if self._apply_effect:
            self._apply_effect(player) # Assume effect func doesn't print directly
            renderer.display_message(f"Equipped {self.name}, applying effect.")
        else:
            renderer.display_message(f"Equipped {self.name} (no passive effect defined).")

    # Modified to accept renderer
    def remove_effect(self, player, renderer: AbstractRenderer):
        if self._remove_effect:
            self._remove_effect(player) # Assume effect func doesn't print directly
            renderer.display_message(f"Unequipped {self.name}, removing effect.")
        else:
            renderer.display_message(f"Unequipped {self.name} (no passive effect defined).")

class Consumable(Item):
    """Represents single-use consumable items."""
    def __init__(self, name, description, use_effect_func):
        super().__init__(name, description)
        self._use_effect = use_effect_func

    # Modified to accept renderer
    def use(self, player, renderer: AbstractRenderer, target=None):
        """Uses the consumable item."""
        renderer.display_message(f"Using {self.name}...")
        if self._use_effect:
            # Pass renderer to the effect function
            self._use_effect(player, renderer, target)
            return True
        else:
            renderer.display_message(f"{self.name} has no defined effect!")
            return False

# --- Effect Functions ---
# These functions define what consumables actually do.
# Modified to accept renderer.

# Use string hint for PlayerCharacter here as well
def use_soothing_poultice(player: 'PlayerCharacter', renderer: AbstractRenderer, target=None):
    """Heals the player's most damaged tool."""
    target_tool = None
    if player.tools:
        active_tools = [t for t in player.tools if t.current_resonance > 0]
        if active_tools:
            # Find tool with lowest percentage health, or just lowest absolute health for simplicity
            target_tool = min(active_tools, key=lambda t: t.current_resonance)

    if target_tool:
        # heal method needs renderer
        healed = target_tool.heal(15, renderer) # Heal amount from design doc
        # Message handled by heal method now
        # renderer.display_message(f"{target_tool.name} restored {healed} Resonance.")
    else:
        renderer.display_message("No active tools to heal.")

# TODO: Add effect functions for other consumables

# --- Specific Item Definitions ---

# Consumables
class SoothingPoultice(Consumable):
    def __init__(self):
        super().__init__(name="Soothing Poultice",
                         description="Restore 15 Resonance to the most damaged Tool.",
                         use_effect_func=use_soothing_poultice)
        self.cost = 30 # Example cost

# TODO: Define Luminous Moss Paste, Focusing Incense, etc.

# Equipment
class ResonatorCrystal(Equipment):
    """Basic equipment example."""
    def __init__(self):
        # Define effect functions locally or import them
        # Effect functions no longer print directly
        def apply_effect(player):
            setattr(player, 'dice_score_bonus', getattr(player, 'dice_score_bonus', 0) + 50)
            # Message moved to Equipment.apply_effect

        def remove_effect(player):
            setattr(player, 'dice_score_bonus', getattr(player, 'dice_score_bonus', 50) - 50)
            # Message moved to Equipment.remove_effect

        super().__init__(name="Resonator Crystal",
                         description="Dice Games start with +50 points.",
                         apply_effect_func=apply_effect,
                         remove_effect_func=remove_effect)
        self.cost = 75 # Example cost

# TODO: Define Ceiba Root Charm, Jaguar Claw Pendant, etc.


# No longer need direct renderer import here
# from .ui import renderer
