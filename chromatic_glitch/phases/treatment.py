# Logic for the Treatment Phase (Combat Screen)

from ..ailments import CrawlingAnxiety, SensorySpike # Import ailments
# No longer need direct UI imports
# from ..ui import renderer, input_handler
from ..dice import DiceGame # Import the DiceGame class
import time # For potential pauses

def handle_treatment_phase(game_state):
    """Handles the logic for the Treatment phase (combat)."""
    # Get UI handlers
    renderer = game_state.renderer
    input_handler = game_state.input_handler

    renderer.display_message("\n--- Treatment Phase ---")
    player = game_state.player_character
    if not player:
        renderer.display_message("Error: No player character found!")
        game_state.transition_to_phase("EXIT") # Or handle error appropriately
        return

    # --- Combat Setup ---
    # Get ailments from the encounter stored in game_state
    if not hasattr(game_state, 'current_encounter') or not game_state.current_encounter:
         renderer.display_message("Error: No encounter found in game state!")
         # Default to a basic encounter or exit?
         active_ailments = [CrawlingAnxiety()]
         renderer.display_message("Warning: Starting default encounter.")
    else:
         # Important: Create copies or new instances if ailments have state that shouldn't persist
         # For now, assume the prep phase created fresh instances
         active_ailments = game_state.current_encounter
         renderer.display_message(f"Engaging: {[a.name for a in active_ailments]}")
         # Clear the encounter from game_state after starting? Optional.
         # game_state.current_encounter = None

    # Reset player combat state using the new method
    # TODO: Refactor start_combat if it prints messages
    player.start_combat()
    # Tool health persists between combats based on previous decision

    # --- Apply Next Combat Start Effects ---
    initial_draw_amount = 5 # Default draw
    if "Distracted" in player.next_combat_start_effects:
        draw_reduction = player.next_combat_start_effects["Distracted"] # Assuming value is reduction amount
        initial_draw_amount = max(0, initial_draw_amount - draw_reduction)
        renderer.display_message(f"Distracted! Initial draw reduced by {draw_reduction}.")
        # TODO: Apply other start-of-combat effects like Focus, Cursed etc.
        # Example: if "Focus" in player.next_combat_start_effects: player.status_effects["Focus"] = duration...

    # Clear the effects after applying them
    player.next_combat_start_effects = {}
    # --- End Apply Effects ---


    combat_over = False
    player_victory = None

    # --- Main Combat Loop ---
    while not combat_over:
        # -- Player Turn --
        # TODO: Refactor start_turn if it prints messages
        player.start_turn()
        # Tick status effects on player's tools at start of turn
        renderer.display_message("Ticking Tool Effects:") # Use renderer
        for tool in player.tools:
            if tool.current_resonance > 0: # Don't tick broken tools
                # TODO: Refactor tick_status_effects if it prints messages
                tool.tick_status_effects()
        # TODO: Tick player character status effects?

        # TODO: Refactor draw_card if it prints messages
        player.draw_card(initial_draw_amount) # Use potentially modified draw amount

        player_turn_over = False
        while not player_turn_over:
            # Use injected renderer
            renderer.display_combat_state(player, active_ailments)

            # Check if player can act
            if player.current_ap <= 0:
                renderer.display_message("No more Action Points.") # Use renderer
                player_turn_over = True
                continue

            # Pass active_ailments to the input handler for targeting validation
            # Use injected input handler
            action_type, action_data = input_handler.get_combat_action(player, active_ailments)

            if action_type == "PLAY_CARD":
                card_index = action_data["card_index"]
                target_index = action_data["target_index"] # Placeholder for now
                card_to_play = player.hand[card_index]

                if player.current_ap >= card_to_play.cost:
                    player.current_ap -= card_to_play.cost
                    # Card execute methods should handle their own messages via renderer
                    # renderer.display_message(f"Playing {card_to_play.name}...")

                    # Determine target (very basic placeholder)
                    target = None
                    # Check target_index before accessing lists
                    if target_index is not None and target_index >= 0:
                        if card_to_play.card_type == "Melody":
                            if target_index < len(active_ailments):
                                target = active_ailments[target_index]
                            else:
                                renderer.display_message("Invalid Ailment target index.") # Use renderer
                                target = None # Ensure target is None if index invalid
                        elif card_to_play.card_type == "Harmony":
                            if target_index < len(player.tools):
                                target = player.tools[target_index]
                            else:
                                renderer.display_message("Invalid Tool target index.") # Use renderer
                                target = None # Ensure target is None if index invalid
                        # TODO: Add targeting for Chant cards

                    # Check if card triggers dice game
                    dice_score = 0
                    if hasattr(card_to_play, 'triggers_dice_game') and card_to_play.triggers_dice_game:
                        dice_game = DiceGame(player) # Pass the player object
                        # Pass renderer and input_handler to play_game
                        dice_score = dice_game.play_game(renderer, input_handler)
                        # Pause is now handled within play_game if needed by the UI impl
                        # input_handler.wait_for_acknowledgement("Press Enter to continue after Dice Game...")


                    # Handle card execution based on target_index
                    # Card execute methods need refactoring to use game_state.renderer
                    if target_index == -1: # Self / No target selection needed
                         card_to_play.execute(player, None, game_state, dice_score=dice_score)
                         player.discard_pile.append(player.hand.pop(card_index))
                    elif target_index == -2: # AoE / Multi-target
                         if card_to_play.name == "Harmonic Pulse":
                              card_to_play.execute(player, player.tools, game_state, dice_score=dice_score)
                         elif card_to_play.name == "Echoing Shout":
                              card_to_play.execute(player, active_ailments, game_state, dice_score=dice_score)
                         else:
                              renderer.display_message(f"Warning: Automatic targeting for {card_to_play.name} not fully defined.")
                         player.discard_pile.append(player.hand.pop(card_index))
                    elif target: # Valid single target selected
                        card_to_play.execute(player, target, game_state, dice_score=dice_score)
                        player.discard_pile.append(player.hand.pop(card_index))
                    else: # Invalid target selected or required target missing
                        renderer.display_message("Invalid target selected or target became invalid.")
                        # Refund AP
                        player.current_ap += card_to_play.cost
                        renderer.display_message(f"AP refunded (+{card_to_play.cost}).")
                        continue # Let player choose another action

                else:
                    renderer.display_message(f"Not enough AP to play {card_to_play.name} (Cost: {card_to_play.cost}, Have: {player.current_ap})")

            elif action_type == "USE_CONSUMABLE":
                 item_name = action_data["item_name"]
                 item_object = action_data["item_object"]
                 # Using items might cost AP in the future, but not currently
                 # TODO: Refactor item use method if it prints messages
                 if item_object.use(player): # Pass player context
                      # Decrement consumable count
                      player.consumables[item_name] -= 1
                      if player.consumables[item_name] == 0:
                           del player.consumables[item_name]
                 else:
                      renderer.display_message(f"Failed to use {item_name}.") # Use renderer

            elif action_type == "END_TURN":
                player_turn_over = True

            # Check for combat end after player action (card play or item use)
            active_ailments = [a for a in active_ailments if a.current_resonance > 0]
            if not active_ailments:
                combat_over = True
                player_victory = True
                break # Exit inner player turn loop

        player.end_turn()
        if combat_over: break # Exit outer combat loop if player won

        # -- Ailment Turn --
        renderer.display_message("\n--- Ailment Turn ---") # Use renderer
        # Separate ailments based on Slow status
        slowed_ailments = []
        normal_ailments = []
        for ailment in active_ailments:
             if ailment.current_resonance > 0:
                  is_slowed = any(key.startswith("Slow_") for key in ailment.status_effects)
                  if is_slowed:
                       slowed_ailments.append(ailment)
                  else:
                       normal_ailments.append(ailment)

        # Normal ailments act first
        renderer.display_message("--- Normal Ailments Acting ---") # Use renderer
        for ailment in normal_ailments:
            # Pass game_state for renderer access
            ailment.determine_intent(player.tools, game_state) # Ailment decides what to do
            # time.sleep(0.5) # Pauses should be handled by UI layer if needed
            ailment.act(player, game_state) # Ailment performs action
            # time.sleep(0.5) # Pauses should be handled by UI layer if needed

            # Check if player lost after ailment action
            active_tools = [t for t in player.tools if t.current_resonance > 0]
            if not active_tools:
                combat_over = True
                player_victory = False
                break # Exit ailment loop

        if combat_over: break # Exit outer combat loop if player lost

        # Slowed ailments act last
        renderer.display_message("--- Slowed Ailments Acting ---") # Use renderer
        for ailment in slowed_ailments:
             # Re-check resonance in case they were defeated by something else? Unlikely but possible.
             if ailment.current_resonance > 0:
                # Pass game_state for renderer access
                ailment.determine_intent(player.tools, game_state) # Ailment decides what to do
                # time.sleep(0.5) # Pauses should be handled by UI layer if needed
                ailment.act(player, game_state) # Ailment performs action
                # time.sleep(0.5) # Pauses should be handled by UI layer if needed

                # Check if player lost after ailment action
                active_tools = [t for t in player.tools if t.current_resonance > 0]
                if not active_tools:
                    combat_over = True
                    player_victory = False
                    break # Exit ailment loop

        if combat_over: break # Exit outer combat loop if player lost

        # Remove defeated ailments for the next turn display/targeting
        active_ailments = [a for a in active_ailments if a.current_resonance > 0]
        if not active_ailments and not player_victory: # Double check win condition
             combat_over = True
             player_victory = True


    # --- Combat End ---
    renderer.display_message("\n--- Treatment Complete ---") # Use renderer
    if player_victory:
        renderer.display_message("Victory! The Ailments have been Soothed.") # Use renderer
        game_state.transition_to_phase("AFTERMATH")
    else:
        renderer.display_message("Defeat... Your Tools are broken.") # Use renderer
        # TODO: Handle defeat consequences (e.g., end run, penalty?)
        # For now, just proceed to Aftermath anyway
        game_state.transition_to_phase("AFTERMATH")

# Need to import random for shuffling deck - already imported
# import random
