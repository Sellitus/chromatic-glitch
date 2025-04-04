# Logic for the Omen Phase (Random Encounters)

import random
# No longer need direct UI imports here
# from ..ui import input_handler, renderer

def trail_shrine_event(game_state):
    """Example Omen Event: Trail Shrine."""
    # Get UI handlers from game_state
    renderer = game_state.renderer
    input_handler = game_state.input_handler

    renderer.display_message("\nYou come across a small, moss-covered shrine offering respite.")
    options = [
        "Offer thanks (Heal one Tool by 15 Resonance)",
        "Offer currency (Pay 50 Currency: Enhance a random card?)", # Enhance TBD
        "Scavenge offerings (Gain 20-40 Currency, small risk?)" # Risk TBD
    ]
    prompt = "What do you do?"
    # Use injected input handler
    choice_index, _ = input_handler.get_player_choice(prompt, options)

    player = game_state.player_character
    if not player: return # Safety check

    if choice_index == 0:
        # Heal one Tool (choose randomly for now)
        target_tool = None
        if player.tools:
             active_tools = [t for t in player.tools if t.current_resonance > 0]
             if active_tools:
                  target_tool = random.choice(active_tools)
        if target_tool:
             healed = target_tool.heal(15, renderer) # Pass renderer
             renderer.display_message(f"You offer thanks. {target_tool.name} feels restored (+{healed} Resonance).")
        else:
             renderer.display_message("You offer thanks, but your tools are already whole or broken.")
    elif choice_index == 1:
        cost = 50
        if player.currency >= cost:
            player.currency -= cost
            renderer.display_message(f"You offer {cost} currency. You feel a subtle shift in your Melodies... (Card Enhance TBD)")
            # TODO: Implement card enhancement logic
        else:
            renderer.display_message(f"You don't have enough currency ({cost} needed). The shrine remains silent.")
    elif choice_index == 2:
        gain = random.randint(20, 40)
        player.currency += gain
        renderer.display_message(f"You scavenge the offerings, finding {gain} currency. You feel a pang of guilt.")
        # TODO: Implement small chance of 'Cursed' status

def cicada_drone_event(game_state):
    """Example Omen Event: Cicada Drone."""
    # Get UI handlers
    renderer = game_state.renderer
    input_handler = game_state.input_handler

    text = "\nAn unnerving, synchronous drone from millions of cicadas fills the air, fraying your focus."
    options = [
        "Push through the sound (Start next combat with 'Distracted' -1 Card Draw first turn?)", # Effect TBD
        "Harmonize with the drone (Attempt Dice Roll - Target 500. Success: +50 Dice Score buff; Fail: 5 damage to all Tools)"
    ]
    prompt = "How do you react?"
    renderer.display_message(text) # Display text separately
    choice_index, _ = input_handler.get_player_choice(prompt, options)

    player = game_state.player_character
    if not player: return

    if choice_index == 0:
        renderer.display_message("You push through the noise, but it leaves you slightly distracted.")
        # Apply 'Distracted' effect for the next combat
        player.next_combat_start_effects["Distracted"] = 1 # Value could represent intensity/duration if needed
    elif choice_index == 1:
        renderer.display_message("You attempt to find harmony within the overwhelming drone...")
        # Need DiceGame access here
        from ..dice import DiceGame # Local import for now
        dice_game = DiceGame(player) # Pass the player object
        # Pass the UI handlers from game_state to play_game
        score = dice_game.play_game(renderer, input_handler)
        target_score = 500
        if score >= target_score:
            renderer.display_message(f"Success! ({score}/{target_score}) You find focus in the pattern. (+50 Dice Score next combat)")
            # Apply 'Focus' effect for the next combat
            player.next_combat_start_effects["Focus"] = 1 # Example: 1 turn duration
        else:
            renderer.display_message(f"Failure! ({score}/{target_score}) The dissonance overwhelms you.")
            damage = 5
            for tool in player.tools:
                 if tool.current_resonance > 0:
                      tool.take_damage(damage)


# List of possible event functions
OMEN_EVENTS = [
    trail_shrine_event,
    cicada_drone_event,
    # Add other event functions here later (lost_child, etc.)
]

def handle_omen_phase(game_state):
    """Handles the logic for the Omen phase."""
    renderer = game_state.renderer
    input_handler = game_state.input_handler

    renderer.display_message("\n--- Omen Phase ---")
    # Choose a random event
    if OMEN_EVENTS:
        event_func = random.choice(OMEN_EVENTS)
        event_func(game_state) # Execute the chosen event, which now uses injected UI handlers
    else:
        renderer.display_message("The path ahead is uneventful...") # Use renderer

    # Use injected input handler for pause
    input_handler.wait_for_acknowledgement()
    game_state.transition_to_phase("PREPARATION")
