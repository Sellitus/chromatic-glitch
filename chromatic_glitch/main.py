# Main game loop and entry point for Chromatic Glitch

from .game_state import GameState
# Import character stuff - now including Lyra
from .characters import PlayerCharacter, get_kaelen_data, get_lyra_data
# Import UI implementations and abstract classes
from .ui.cli_renderer import CLIRenderer
from .ui.cli_input_handler import CLIInputHandler
# from .ui import input_handler # No longer needed directly here
from .phases.omen import handle_omen_phase
from .phases.preparation import handle_preparation_phase
from .phases.treatment import handle_treatment_phase
from .phases.aftermath import handle_aftermath_phase

# Mapping phase names to handler functions
PHASE_HANDLERS = {
    "OMEN": handle_omen_phase,
    "PREPARATION": handle_preparation_phase,
    "TREATMENT": handle_treatment_phase,
    "AFTERMATH": handle_aftermath_phase,
}

def run_game():
    """Initializes and runs the main game loop."""
    print("Starting Chromatic Glitch...")

    # --- UI Selection (Placeholder) ---
    # TODO: Add logic to choose between CLI and GUI
    renderer = CLIRenderer()
    input_handler = CLIInputHandler()
    # ---

    # Pass UI handlers to GameState
    game_state = GameState(renderer, input_handler)

    # --- Character Selection ---
    # Use the injected input handler
    renderer.display_message("\n=== Choose Your Character ===")
    available_characters = {
        "Kaelen": get_kaelen_data(),
        "Lyra": get_lyra_data()
    }
    char_names = list(available_characters.keys())

    # Use the injected input handler
    prompt = "Select your String Singer:"
    # Pass prompt and options directly to the handler method
    choice_index, chosen_name = game_state.input_handler.get_player_choice(prompt, char_names)

    chosen_data = available_characters[chosen_name]
    # Pass UI handlers to PlayerCharacter if needed? For now, assume not.
    player = PlayerCharacter(**chosen_data)
    game_state.player_character = player
    print(f"\nYou have chosen: {player.name}, the {player.archetype}")
    # --- End Character Selection ---

    # Start the first cycle with the Omen phase
    game_state.transition_to_phase("OMEN")

    while game_state.current_phase != "EXIT":
        handler = PHASE_HANDLERS.get(game_state.current_phase)
        if handler:
            handler(game_state)
        else:
            print(f"Error: Unknown game phase '{game_state.current_phase}'. Exiting.")
            break # Exit loop if phase is unknown

        # Add a small pause or input prompt if needed between phases for readability
        # input("Press Enter to continue...") # Optional: uncomment for step-by-step

    print("Exiting Chromatic Glitch.")

# Note: The if __name__ == "__main__": block is removed as the intended
# entry point is run_game.py, which imports and calls this run_game function.
# Keeping it could lead to confusion or duplicate execution if run directly.
