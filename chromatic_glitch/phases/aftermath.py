# Logic for the Aftermath Phase (Reward System)

import random
# No longer need direct UI imports
# from ..ui import input_handler, renderer
# Import some basic cards to offer as rewards
from ..cards import Strike, Mend, Guard, Soothe

# Simple reward pool for now
BASIC_CARD_REWARDS = [Strike(), Mend(), Guard(), Soothe()]

def handle_aftermath_phase(game_state):
    """Handles the logic for the Aftermath phase."""
    # Get UI handlers
    renderer = game_state.renderer
    input_handler = game_state.input_handler

    renderer.display_message("\n--- Aftermath Phase ---")
    player = game_state.player_character
    if not player:
        renderer.display_message("Error: No player character found for aftermath.")
        game_state.transition_to_phase("OMEN") # Or handle error differently
        return

    # TODO: Check if combat was successful (needs state passed from treatment)
    # Assuming victory for now
    renderer.display_message("The resonance settles. Treatment successful.")

    # --- Grant Currency ---
    currency_reward = random.randint(30, 60) # Example range
    player.currency += currency_reward
    renderer.display_message(f"You gained {currency_reward} Currency (Total: {player.currency}).")

    # --- Offer Card Reward ---
    # TODO: Implement more sophisticated reward generation based on Patient, difficulty etc.
    renderer.display_message("\nYou gained some insight:")
    # Offer 3 random basic cards
    num_choices = 3
    # Create new instances for reward options
    reward_pool = [type(card)() for card in BASIC_CARD_REWARDS]
    reward_options = random.sample(reward_pool, min(num_choices, len(reward_pool)))

    if reward_options:
        option_strings = [str(card) for card in reward_options]
        option_strings.append("Skip card reward") # Add skip option

        prompt = "Choose a card to add to your collection:"
        # Use injected handler
        choice_index, _ = input_handler.get_player_choice(prompt, option_strings)

        if choice_index < len(reward_options): # Check if a card was chosen (not skip)
            chosen_card = reward_options[choice_index]
            # Add to collection (deck management happens in Prep phase)
            player.card_collection.append(chosen_card)
            renderer.display_message(f"Added {chosen_card.name} to your collection.")
        else:
            renderer.display_message("You chose to skip the card reward.")
    else:
        renderer.display_message("No card rewards available this time.")


    # TODO: Offer Dice/Item rewards

    # Use injected handler for pause
    input_handler.wait_for_acknowledgement()
    # Transition back to Omen for the next cycle
    game_state.transition_to_phase("OMEN")
