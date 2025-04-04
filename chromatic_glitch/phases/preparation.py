 # Logic for the Preparation Phase (Management Screen)

import random
# No longer need direct UI imports
# from ..ui import input_handler, renderer
from ..ailments import CrawlingAnxiety, SensorySpike # Import specific ailments
from ..shop import enter_shop # Import the shop entry function
from ..game_state import Patient # Import the Patient class
from ..items import Equipment # Need Equipment class

# --- Patient Generation ---
# This function doesn't need UI handlers
def generate_patient():
    """Generates a random patient encounter (placeholder)."""
    # TODO: Implement more varied patient generation based on progress/difficulty
    ailment1 = CrawlingAnxiety()
    ailment2 = SensorySpike()
    # Ensure new instances are created each time
    encounter_ailments = [type(ailment1)(), type(ailment2)()]
    name = random.choice(["Disturbed Villager", "Frightened Child", "Weary Elder"])
    description = random.choice([
        "Murmurs incoherently, clutching their head.",
        "Stares blankly, occasionally twitching.",
        "Seems lost in a waking nightmare."
    ])
    difficulty = random.choice(["Easy", "Medium"]) # Example
    reward_focus = random.choice(["Card", "Currency", "Item (TBD)"]) # Example
    ailment_types = [type(a).__name__ for a in encounter_ailments] # Get class names

    return Patient(name, description, ailment_types, encounter_ailments, difficulty, reward_focus)

def handle_preparation_phase(game_state):
    """Handles the logic for the Preparation phase."""
    # Get UI handlers
    renderer = game_state.renderer
    input_handler = game_state.input_handler

    renderer.display_message("\n--- Preparation Phase ---")
    player = game_state.player_character
    if not player: return

    # Display Player Status (Initial)
    renderer.display_message("Your Status:")
    renderer.display_player_status(player) # Use injected renderer
    renderer.display_message("Tools:")
    for tool in player.tools:
        renderer.display_message(f"  - {tool}") # Use injected renderer

    # --- Generate Patient Options ---
    num_patient_options = 3
    game_state.available_patients = [generate_patient() for _ in range(num_patient_options)]

    renderer.display_message("\n--- Available Patients ---")
    patient_options_str = [str(p) for p in game_state.available_patients]
    prompt = "Choose a patient to treat:"
    # Use injected input handler
    choice_index, _ = input_handler.get_player_choice(prompt, patient_options_str)

    selected_patient = game_state.available_patients[choice_index]
    game_state.current_patient = selected_patient
    game_state.current_encounter = selected_patient.ailment_instances # Set the encounter for Treatment phase
    renderer.display_message(f"\nYou have chosen to treat {selected_patient.name}.")
    # --- End Patient Selection ---


    # --- Prep Menu Loop ---
    while True:
        # Display status again in case it changed (e.g., after shop/equip)
        renderer.display_message("\n--- Preparation Options ---")
        renderer.display_player_status(player)
        renderer.display_message("Tools:")
        for tool in player.tools:
            renderer.display_message(f"  - {tool}")
        renderer.display_message("Equipment:")
        for i, item in enumerate(player.equipment):
            renderer.display_message(f"  Slot {i+1}: {item.name if item else 'Empty'}")


        options = ["View Deck", "View Dice", "View Items", "Equip Item", "Manage Dice Loadout", "Visit Shop", "Start Treatment"]
        prompt = "Prepare yourself:"
        # Use injected input handler
        choice_index, choice_text = input_handler.get_player_choice(prompt, options)

        if choice_text == "View Deck":
            renderer.display_deck(player)
            input_handler.wait_for_acknowledgement() # Use handler
        elif choice_text == "View Dice":
            renderer.display_dice(player)
            input_handler.wait_for_acknowledgement() # Use handler
        elif choice_text == "View Items":
            renderer.display_items(player)
            input_handler.wait_for_acknowledgement() # Use handler
        elif choice_text == "Equip Item":
            handle_equip_item(game_state)
        elif choice_text == "Manage Dice Loadout":
            handle_manage_dice(game_state) # Call new function
        elif choice_text == "Visit Shop":
            # enter_shop needs refactoring to use injected UI handlers
            enter_shop(game_state) # Assuming enter_shop is refactored later
        elif choice_text == "Start Treatment":
            renderer.display_message("\nYou gather your resolve and prepare for the treatment.")
            game_state.transition_to_phase("TREATMENT")
            break # Exit prep loop
        else:
            renderer.display_message("Invalid prep action.")


# --- Helper function for Equip Item ---
# Modified to accept game_state for UI access
def handle_equip_item(game_state):
    """Handles the process of equipping an item."""
    renderer = game_state.renderer
    input_handler = game_state.input_handler
    player = game_state.player_character
    if not player: return

    renderer.display_message("\n--- Equip Item ---")

    # Filter player's collection for equippable items
    equippable_items = [item for item in player.item_collection if isinstance(item, Equipment)]

    if not equippable_items:
        renderer.display_message("You have no equipment items in your collection.")
        input_handler.wait_for_acknowledgement()
        return

    renderer.display_message("Select item to equip:")
    item_options = [str(item) for item in equippable_items]
    item_options.append("Cancel")
    # Use injected handler
    item_choice_index, _ = input_handler.get_player_choice("Item:", item_options)

    if item_choice_index == len(equippable_items): # Cancelled
        renderer.display_message("Equipping cancelled.")
        return

    item_to_equip = equippable_items[item_choice_index]

    renderer.display_message("\nSelect slot to equip into:")
    slot_options = [f"Slot {i+1}: {player.equipment[i].name if player.equipment[i] else 'Empty'}" for i in range(player.max_equipment_slots)]
    slot_options.append("Cancel")
    # Use injected handler
    slot_choice_index, _ = input_handler.get_player_choice("Slot:", slot_options)

    if slot_choice_index == player.max_equipment_slots: # Cancelled
        renderer.display_message("Equipping cancelled.")
        return

    # Attempt to equip (equip_item method uses renderer now)
    player.equip_item(item_to_equip, slot_choice_index, renderer) # Pass renderer
    # Use injected handler
    input_handler.wait_for_acknowledgement()


# --- Helper function for Dice Loadout ---
from ..dice import Die # Need Die class

def handle_manage_dice(game_state):
    """Handles the process of managing the dice loadout."""
    renderer = game_state.renderer
    input_handler = game_state.input_handler
    player = game_state.player_character
    if not player: return

    while True:
        renderer.display_message("\n--- Manage Dice Loadout ---")
        renderer.display_dice(player) # Show current loadout and collection

        options = ["Equip Die", "Unequip Die (TBD)", "Done"]
        prompt = "Dice action:"
        choice_index, choice_text = input_handler.get_player_choice(prompt, options)

        if choice_text == "Equip Die":
            # Select die from collection
            available_dice = player.dice_collection
            if not available_dice:
                 renderer.display_message("Your dice collection is empty.")
                 continue

            renderer.display_message("Select die from collection to equip:")
            dice_options = [str(d) for d in available_dice]
            dice_options.append("Cancel")
            die_choice_idx, _ = input_handler.get_player_choice("Die:", dice_options)

            if die_choice_idx == len(available_dice): continue # Cancelled

            die_to_equip = available_dice[die_choice_idx]

            # Select slot in loadout
            renderer.display_message("Select loadout slot to equip into:")
            slot_options = [f"Slot {i+1}: {player.dice_loadout[i]}" for i in range(len(player.dice_loadout))]
            slot_options.append("Cancel")
            slot_choice_idx, _ = input_handler.get_player_choice("Slot:", slot_options)

            if slot_choice_idx == len(player.dice_loadout): continue # Cancelled

            # Basic swap: Put chosen die in slot, put old die (if any) back in collection?
            # For simplicity, just overwrite the slot for now.
            # A better implementation would handle swapping/duplicates.
            old_die = player.dice_loadout[slot_choice_idx]
            player.dice_loadout[slot_choice_idx] = die_to_equip
            renderer.display_message(f"Equipped {die_to_equip.name} into slot {slot_choice_idx + 1} (replaced {old_die.name}).")
            # TODO: Ensure collection management is correct (duplicates, removing equipped?)

        elif choice_text == "Unequip Die (TBD)":
            renderer.display_message("Unequipping dice not yet implemented.")
            # TODO: Implement unequip logic

        elif choice_text == "Done":
            break # Exit dice management loop
