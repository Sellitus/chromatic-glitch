# Defines the PlayerCharacter class and archetypes

# Import specific components needed
from .cards import (
    Card, Strike, Guard, ForcefulNote, SteadyRhythm, EchoingShout, KaelensResolve, # Kaelen
    Soothe, Mend, FlowingChord, EntanglingTune, HarmonicPulse, LyrasInsight # Lyra
)
# Import concrete types needed for instantiation here
from .dice import Die, ObsidianFocusDie, RiverPearlDie
from .tools import Tool, ResonantGourd, SteadyDrum, TunedPanpipes
# Import Equipment for isinstance check
from .items import Equipment
# Use forward references (strings) for types from other modules for type hinting
from typing import TYPE_CHECKING, Any
if TYPE_CHECKING:
    # Keep these for type hints in method signatures
    from .items import Consumable # Keep Consumable here if only used in hints
    from .ui.abstract_ui import AbstractRenderer, AbstractInputHandler

import random
# Remove imports that are now at the top
# from .dice import Die, ObsidianFocusDie, RiverPearlDie
# from .tools import Tool, ResonantGourd, SteadyDrum, TunedPanpipes

class PlayerCharacter:
    """Represents the player character."""
    # __init__ doesn't need UI handlers directly, they are accessed via game_state
    def __init__(self, name, archetype, starting_deck, starting_die, starting_tools, starting_currency=50):
        self.name = name
        self.archetype = archetype

        # Core Gameplay Elements
        self.deck = list(starting_deck) # Current deck for combat
        self.hand = []
        self.discard_pile = []
        self.card_collection = list(starting_deck) # All owned cards

        # Collection holds all owned dice initially
        self.dice_collection: list['Die'] = [starting_die] + [Die("Standard Die") for _ in range(5)]
        # Loadout is the first 6 dice equipped (ensure distinct objects if needed later)
        self.dice_loadout: list['Die'] = list(self.dice_collection[:6]) # Ensure loadout has exactly 6 dice initially

        self.tools: list['Tool'] = list(starting_tools) # Type hint list of Tool
        self.max_tools = len(starting_tools)

        self.max_equipment_slots = 5 # From design doc
        self.equipment: list['Equipment' | None] = [None] * self.max_equipment_slots # Type hint list of optional Equipment
        self.item_collection: list[Any] = [] # Holds Equipment and Consumable objects, use Any for simplicity or Union
        self.consumables: dict[str, int] = {} # Type hint dictionary

        # Stats & Resources
        self.currency = starting_currency
        self.max_ap = 3 # Default Action Points per turn
        self.current_ap = 0

        # Status Effects (applied to the character directly, if any)
        self.status_effects = {} # e.g., {"Focus": 2} turns remaining
        # Effects applied at the start of the next combat
        self.next_combat_start_effects = {} # e.g., {"Distracted": 1}
        # Effects applied at the start of the next turn
        self.next_turn_effects = {} # e.g., {"BonusAP": 1}

        # Don't print here, let main loop handle it via renderer
        # print(f"Character '{self.name}' ({self.archetype}) created.")

    # Modified to accept renderer
    def draw_card(self, amount: int, renderer: 'AbstractRenderer'): # Use string hint
        """Draws cards from the deck to the hand."""
        drawn_cards: list[Card] = [] # Type hint list of Card
        for _ in range(amount):
            if not self.deck:
                if not self.discard_pile:
                    renderer.display_message("Deck and discard pile are empty!")
                    break
                renderer.display_message("Deck empty. Shuffling discard pile...")
                random.shuffle(self.discard_pile)
                self.deck.extend(self.discard_pile)
                self.discard_pile = []

            drawn_card = self.deck.pop()
            self.hand.append(drawn_card)
            drawn_cards.append(drawn_card)
        if drawn_cards:
             # Renderer can decide how verbose to be
             renderer.display_message(f"Drew {len(drawn_cards)} card(s). Hand size: {len(self.hand)}")
        return drawn_cards

    # Modified to accept renderer
    def shuffle_deck(self, renderer: 'AbstractRenderer'): # Use string hint
        """Shuffles the deck."""
        renderer.display_message("Shuffling deck...")
        random.shuffle(self.deck)

    # Modified to accept renderer
    def start_combat(self, renderer: 'AbstractRenderer'): # Use string hint
        """Resets state for the start of combat."""
        renderer.display_message("Preparing for combat...")
        self.deck = list(self.card_collection)
        self.hand = []
        self.discard_pile = []
        self.shuffle_deck(renderer) # Pass renderer
        # Reset tool health? Or does it persist between combats? Assuming persist for now.
        # Reset player status effects? TBD - Keep persistent ones? Clear combat ones?
        self.status_effects = {}
        # Clear next combat effects AFTER applying them (handled in treatment phase start)
        # self.next_combat_start_effects = {} # Don't clear here
        # Apply equipment effects at start of combat? Or are they always active? Assume always active for now.

    # Modified to accept renderer
    def equip_item(self, item_to_equip: 'Equipment', slot_index: int, renderer: 'AbstractRenderer'): # Use string hints
        """Equips an item into a specific slot, handling unequip of previous item."""
        # isinstance check works with the actual class, no change needed here
        if not isinstance(item_to_equip, Equipment):
            renderer.display_message(f"Error: Cannot equip {item_to_equip.name}, it's not Equipment.")
            return False
        if not (0 <= slot_index < self.max_equipment_slots):
            renderer.display_message(f"Error: Invalid equipment slot index {slot_index}.")
            return False

        # Unequip item currently in slot, if any
        self.unequip_item(slot_index, renderer) # Pass renderer

        # Equip new item
        self.equipment[slot_index] = item_to_equip
        # Apply passive effect (method now accepts renderer)
        item_to_equip.apply_effect(self, renderer)
        # Message handled by apply_effect now
        # renderer.display_message(f"Equipped {item_to_equip.name} in slot {slot_index + 1}.")
        return True

    # Modified to accept renderer
    def unequip_item(self, slot_index: int, renderer: 'AbstractRenderer'): # Use string hint
        """Unequips an item from a specific slot."""
        if not (0 <= slot_index < self.max_equipment_slots):
            renderer.display_message(f"Error: Invalid equipment slot index {slot_index}.")
            return False

        equipped_item = self.equipment[slot_index]
        if equipped_item:
            # Remove passive effect (method now accepts renderer)
            equipped_item.remove_effect(self, renderer)
            # Message handled by remove_effect now
            # renderer.display_message(f"Unequipped {equipped_item.name} from slot {slot_index + 1}.")
            self.equipment[slot_index] = None
            return True
        return False # Nothing to unequip

    # Modified to accept renderer
    def start_turn(self, renderer: 'AbstractRenderer'): # Use string hint
        """Actions to perform at the start of the player's turn."""
        # Apply next turn effects first
        bonus_ap = self.next_turn_effects.get("BonusAP", 0)
        self.current_ap = self.max_ap + bonus_ap
        if bonus_ap > 0:
            renderer.display_message(f"Gained {bonus_ap} bonus AP this turn!")
        # Clear effects after applying
        self.next_turn_effects = {}

        # TODO: Handle status effect ticks (positive/negative) on player?
        renderer.display_message(f"\n--- {self.name}'s Turn ---")
        renderer.display_message(f"AP: {self.current_ap}/{self.max_ap}")

    # Modified to accept renderer
    def end_turn(self, renderer: 'AbstractRenderer'): # Use string hint
        """Actions to perform at the end of the player's turn."""
        # TODO: Discard remaining hand? (Depends on game rules)
        # TODO: Handle end-of-turn status effects
        renderer.display_message(f"--- End {self.name}'s Turn ---")


# TODO: Define specific character archetypes (Kaelen, Lyra) with their starting data
# Example (needs actual Card, Die, Tool objects defined first):
# Kaelen_Start_Deck = [Strike(), Strike(), ...]
# Kaelen_Start_Die = ObsidianFocusDie()
# --- Character Archetype Definitions ---

def get_kaelen_data():
    """Returns the starting data dictionary for Kaelen."""
    starting_deck = [
        Strike(), Strike(), Strike(), Strike(),
        Guard(), Guard(),
        ForcefulNote(),
        SteadyRhythm(),
        EchoingShout(),
        KaelensResolve()
    ]
    starting_die = ObsidianFocusDie()
    # Example starting tools - can be adjusted
    starting_tools = [ResonantGourd(), SteadyDrum()]
    return {
        "name": "Kaelen",
        "archetype": "Resonant Chanter",
        "starting_deck": starting_deck,
        "starting_die": starting_die,
        "starting_tools": starting_tools,
        "starting_currency": 50 # Default, can be overridden
    }

def get_lyra_data():
    """Returns the starting data dictionary for Lyra."""
    starting_deck = [
        Soothe(), Soothe(), Soothe(),
        Mend(), Mend(), Mend(),
        FlowingChord(),
        EntanglingTune(),
        HarmonicPulse(),
        LyrasInsight()
    ]
    starting_die = RiverPearlDie()
    # Example starting tools - can be adjusted
    starting_tools = [ResonantGourd(), TunedPanpipes()] # Using Gourd and Panpipes
    return {
        "name": "Lyra",
        "archetype": "Melodic Weaver",
        "starting_deck": starting_deck,
        "starting_die": starting_die,
        "starting_tools": starting_tools,
        "starting_currency": 50 # Default, can be overridden
    }

# Example of creating characters:
# kaelen_data = get_kaelen_data()
# kaelen = PlayerCharacter(**kaelen_data)
# lyra_data = get_lyra_data()
# lyra = PlayerCharacter(**lyra_data)
