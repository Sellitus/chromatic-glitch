# Logic for the Shop system

import random
# No longer need direct UI imports
# from .ui import input_handler, renderer
# Import items/cards/dice later when needed for inventory
from .items import SoothingPoultice, ResonatorCrystal, Equipment, Consumable # Import specific items
# from .cards import ... # Import cards later
# from .dice import ... # Import dice later
# Need game_state for UI handlers
# from .game_state import GameState # Avoid direct import if possible

class Shop:
    """Manages the shop inventory and player interactions."""
    def __init__(self):
        self.inventory_cards = []
        self.inventory_items = []
        self.inventory_dice = []
        self.card_enhancement_cost = 100 # Base cost, will scale
        self.refresh_inventory()
        print("Shop initialized.")

    def refresh_inventory(self):
        """Refreshes the shop's inventory (placeholder)."""
        print("Refreshing shop inventory...")
        # TODO: Populate with actual random/curated items/cards/dice
        # TODO: Populate with actual random/curated items/cards/dice
        self.inventory_cards = []
        # Add some basic items for now
        self.inventory_items = [SoothingPoultice() for _ in range(random.randint(1, 3))]
        # Add equipment example
        if random.random() < 0.5: # Chance to have equipment
             self.inventory_items.append(ResonatorCrystal())
        self.inventory_dice = []
        # Don't print here, let renderer handle it
        # print("Shop inventory refreshed.")

    # Removed display_inventory - renderer handles this now

    # Modified handle_shop_visit to accept game_state
    def handle_shop_visit(self, game_state):
        """Handles the main shop interaction loop."""
        renderer = game_state.renderer
        input_handler = game_state.input_handler
        player = game_state.player_character
        if not player: return

        while True:
            # Use renderer to display inventory
            renderer.display_shop_inventory(self)
            renderer.display_player_status(player) # Show currency

            options = ["Buy Card (TBD)", "Buy Item", "Buy Die (TBD)", "Enhance Card", "Sell (TBD)", "Leave Shop"]
            prompt = "What would you like to do?"
            # Use injected input handler
            choice_index, choice_text = input_handler.get_player_choice(prompt, options)

            if choice_text == "Buy Card (TBD)":
                renderer.display_message("Buying cards not yet implemented.")
            elif choice_text == "Buy Item":
                 self.handle_buy_item(game_state) # Pass game_state
            elif choice_text == "Buy Die (TBD)":
                 renderer.display_message("Buying dice not yet implemented.")
            elif choice_text == "Enhance Card":
                 self.handle_enhance_card(game_state) # Pass game_state
            elif choice_text == "Sell (TBD)":
                 renderer.display_message("Selling not yet implemented.")
            elif choice_text == "Leave Shop":
                 renderer.display_message("Leaving the shop.")
                 break
            else:
                 renderer.display_message("Invalid shop action.")

    # Modified handle_buy_item to accept game_state
    def handle_buy_item(self, game_state):
        """Handles buying an item."""
        renderer = game_state.renderer
        input_handler = game_state.input_handler
        player = game_state.player_character
        if not player: return

        renderer.display_message("\n--- Buy Item ---")
        if not self.inventory_items:
            renderer.display_message("There are no items for sale.")
            return

        item_options = [f"{item} (Cost: {getattr(item, 'cost', 'N/A')})" for item in self.inventory_items]
        item_options.append("Cancel")
        prompt = "Which item would you like to buy?"
        # Use injected handler
        choice_index, _ = input_handler.get_player_choice(prompt, item_options)

        if choice_index == len(self.inventory_items): # Cancelled
            renderer.display_message("Purchase cancelled.")
            return

        item_to_buy = self.inventory_items[choice_index]
        cost = getattr(item_to_buy, 'cost', 0)

        if player.currency >= cost:
            # Use injected handler for confirmation
            prompt = f"Buy {item_to_buy.name} for {cost} Currency?"
            if input_handler.confirm_action(prompt):
                player.currency -= cost
                # Add item to player inventory
                if isinstance(item_to_buy, Consumable):
                     current_count = player.consumables.get(item_to_buy.name, 0)
                     player.consumables[item_to_buy.name] = current_count + 1
                     # Ensure the item object is in the collection for later use
                     if not any(isinstance(item, type(item_to_buy)) for item in player.item_collection):
                          player.item_collection.append(item_to_buy)
                     renderer.display_message(f"Purchased {item_to_buy.name}. You now have {player.consumables[item_to_buy.name]}.")
                elif isinstance(item_to_buy, Equipment):
                     player.item_collection.append(item_to_buy)
                     renderer.display_message(f"Purchased {item_to_buy.name}. Equip it during Preparation.")
                else:
                     renderer.display_message(f"Purchased unknown item type: {item_to_buy.name}")

                # Remove item from shop inventory
                self.inventory_items.pop(choice_index)
            else:
                renderer.display_message("Purchase cancelled.")
        else:
            renderer.display_message(f"Not enough currency to buy {item_to_buy.name} (Cost: {cost}).")


    # Modified handle_enhance_card to accept game_state
    def handle_enhance_card(self, game_state):
        """Handles the card enhancement process."""
        renderer = game_state.renderer
        input_handler = game_state.input_handler
        player = game_state.player_character
        if not player: return

        renderer.display_message("\n--- Enhance Card ---")
        if not player.card_collection:
            renderer.display_message("You have no cards in your collection to enhance.")
            return

        renderer.display_message("Select a card from your collection to enhance:")
        # Filter out already enhanced cards? Or let enhance method handle it.
        enhanceable_cards = [card for card in player.card_collection if not card.name.endswith('+')]
        if not enhanceable_cards:
             renderer.display_message("All cards in your collection are already enhanced.")
             return

        card_options = [str(card) for card in enhanceable_cards]
        card_options.append("Cancel")

        # Use injected handler
        choice_index, _ = input_handler.get_player_choice("Card to enhance:", card_options)

        if choice_index == len(enhanceable_cards): # Cancelled
            renderer.display_message("Enhancement cancelled.")
            return

        card_to_enhance = enhanceable_cards[choice_index]

        # Cost calculation might depend on the card later
        cost = self.card_enhancement_cost

        renderer.display_message(f"Enhancing {card_to_enhance.name} costs {cost} Currency.")
        if player.currency >= cost:
            # Use injected handler for confirmation
            if input_handler.confirm_action("Confirm enhancement?"):
                player.currency -= cost
                # Card enhance method already prints messages
                if card_to_enhance.enhance():
                     # renderer.display_message(f"Successfully enhanced {card_to_enhance.name}!") # Enhance method prints
                     pass # Enhance method handles success message
                else:
                     renderer.display_message(f"Could not enhance {card_to_enhance.name}.") # Should not happen if filtered
                     player.currency += cost # Refund if failed unexpectedly
            else:
                renderer.display_message("Enhancement cancelled.")
        else:
            renderer.display_message("Not enough currency to enhance this card.")


def enter_shop(game_state):
    """Entry point for visiting the shop."""
    # TODO: Shop instance should likely persist in game_state for inventory continuity
    shop = Shop() # New shop instance each time for now
    # Pass game_state to handle_shop_visit
    shop.handle_shop_visit(game_state)
