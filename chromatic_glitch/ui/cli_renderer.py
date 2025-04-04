# Concrete CLI implementation of the AbstractRenderer

from .abstract_ui import AbstractRenderer
# Import necessary game objects for type hinting or displaying attributes
from ..characters import PlayerCharacter
from ..ailments import Ailment
from ..shop import Shop
from ..game_state import Patient

class CLIRenderer(AbstractRenderer):
    """Renders game information to the command line."""

    def display_message(self, message: str):
        print(message)

    def display_combat_state(self, player: PlayerCharacter, ailments: list[Ailment]):
        print("\n" + "="*10 + " Combat State " + "="*10)
        # Display Player Tools (A, B, C...)
        print("Your Tools:")
        if not player.tools:
            print("  None")
        else:
            for i, tool in enumerate(player.tools):
                tool_letter = chr(ord('A') + i)
                status_str = ", ".join(f"{k}({v})" for k, v in tool.status_effects.items())
                status_display = f" [{status_str}]" if status_str else ""
                print(f"  {tool_letter}. {tool.name} ({tool.current_resonance}/{tool.max_resonance} Res){status_display}")

        # Display Ailments (1, 2, 3...)
        print("\nAilments:")
        if not ailments:
            print("  None")
        else:
            for i, ailment in enumerate(ailments):
                status_str = ", ".join(f"{k}({v})" for k, v in ailment.status_effects.items())
                status_display = f" [{status_str}]" if status_str else ""
                # TODO: Display ailment intent if available
                print(f"  {i+1}. {ailment.name} ({ailment.current_resonance}/{ailment.max_resonance} Res){status_display}")

        # Display Player Hand
        print("\nYour Hand:")
        if not player.hand:
            print("  Empty")
        else:
            for i, card in enumerate(player.hand):
                print(f"  {i+1}. {card}") # Uses card.__str__

        print(f"\nAP: {player.current_ap}/{player.max_ap}")
        print("="*34)

    def display_player_status(self, player: PlayerCharacter):
        # Basic status for now
        print(f"Currency: {player.currency}")
        # Could add more here later (deck size, discard size, etc.)

    def display_deck(self, player: PlayerCharacter):
        print("\n--- Your Deck ---")
        if not player.card_collection: # Show full collection for now
            print("  Empty")
        else:
            # Group identical cards?
            counts = {}
            for card in player.card_collection:
                 counts[str(card)] = counts.get(str(card), 0) + 1
            for card_str, count in counts.items():
                 print(f"  {card_str} x{count}")
        print("-" * 17)

    def display_dice(self, player: PlayerCharacter):
        print("\n--- Your Dice ---")
        print("Loadout:")
        if not player.dice_loadout:
            print("  Empty")
        else:
            for i, die in enumerate(player.dice_loadout):
                print(f"  Slot {i+1}: {die}") # Uses die.__str__
        print("\nCollection:")
        if not player.dice_collection:
             print("  Empty")
        else:
             # Group identical dice?
             counts = {}
             for die in player.dice_collection:
                  counts[str(die)] = counts.get(str(die), 0) + 1
             for die_str, count in counts.items():
                  print(f"  {die_str} x{count}")
        print("-" * 17)

    def display_items(self, player: PlayerCharacter):
        print("\n--- Your Items ---")
        print("Equipment:")
        equipped_something = False
        for i, item in enumerate(player.equipment):
            if item:
                print(f"  Slot {i+1}: {item}") # Uses item.__str__
                equipped_something = True
        if not equipped_something:
            print("  None Equipped")

        print("\nConsumables:")
        if not player.consumables:
            print("  None")
        else:
            for name, quantity in player.consumables.items():
                # Find the item object to display its description
                item_obj = next((item for item in player.item_collection if item.name == name), None)
                desc = item_obj.description if item_obj else "???"
                print(f"  {name} x{quantity} - {desc}")
        print("-" * 18)

    def display_shop_inventory(self, shop: Shop):
        print("\n--- Shop Inventory ---")
        print("Cards for Sale:")
        if not shop.inventory_cards: print("  None")
        # TODO: Display cards with prices

        print("\nItems for Sale:")
        if not shop.inventory_items:
            print("  None")
        else:
            for i, item in enumerate(shop.inventory_items):
                 cost = getattr(item, 'cost', 'N/A')
                 print(f"  {i+1}. {item} (Cost: {cost})")

        print("\nDice for Sale:")
        if not shop.inventory_dice: print("  None")
        # TODO: Display dice with prices

        print(f"\nCard Enhancement Cost: {shop.card_enhancement_cost} Currency (approx)")

    def display_available_patients(self, patients: list[Patient]):
         # This is handled by get_player_choice in the CLI version
         # But a GUI would need this data to render buttons/options
         pass # No direct rendering needed here for CLI

    def display_omen_options(self, text: str, options: list[str]):
         # This is handled by get_player_choice in the CLI version
         pass # No direct rendering needed here for CLI

    def display_dice_roll(self, roll_values: list[int]):
        print(f"Rolled: {roll_values}")

    def display_dice_scores(self, possible_scores: list):
        # This is handled within the dice game input loop for CLI
        pass # No direct rendering needed here for CLI
