# Concrete CLI implementation of the AbstractInputHandler

from .abstract_ui import AbstractInputHandler
from ..items import Consumable # Import Consumable class
# Import other types if needed for hints
from ..characters import PlayerCharacter
from ..ailments import Ailment

class CLIInputHandler(AbstractInputHandler):
    """Handles user input from the command line."""

    def get_player_choice(self, prompt: str, options: list[str]) -> tuple[int, str]:
        """Gets a choice from the player based on a list of numbered options."""
        while True:
            print(prompt)
            for i, option in enumerate(options):
                print(f"  {i+1}. {option}")
            choice = input("Enter the number of your choice: ")
            try:
                choice_index = int(choice) - 1
                if 0 <= choice_index < len(options):
                    return choice_index, options[choice_index]
                else:
                    print("Invalid choice number. Please try again.")
            except ValueError:
                print("Invalid input. Please enter a number.")

    def get_combat_action(self, player: PlayerCharacter, active_ailments: list[Ailment]) -> tuple[str, dict]:
        """Gets the player's action choice during combat."""
        options = ["Play Card", "Use Consumable", "End Turn"]
        prompt = "Choose your action:"

        while True:
            print(prompt)
            for i, option in enumerate(options):
                print(f"  {i+1}. {option}")
            choice = input("Enter the number of your choice: ")

            if choice == '1': # Play Card
                if not player.hand:
                    print("Your hand is empty!")
                    continue

                card_index = self.get_target_index("Choose card to play (number):", len(player.hand))
                if card_index is None: continue # User cancelled

                selected_card = player.hand[card_index]

                target_index = None
                skip_targeting = False

                if hasattr(selected_card, 'targets_self') and selected_card.targets_self:
                    print(f"Playing {selected_card.name} (targets self).")
                    skip_targeting = True
                    target_index = -1
                elif selected_card.name in ["Steady Rhythm", "Harmonic Pulse", "Echoing Shout"]:
                    print(f"Playing {selected_card.name} (targets automatically).")
                    skip_targeting = True
                    target_index = -2

                if not skip_targeting:
                    if selected_card.card_type == "Melody":
                        print("Choose Ailment target:")
                        num_ailments = len(active_ailments)
                        if num_ailments == 0:
                            print("No Ailments to target!")
                            continue
                        target_index = self.get_target_index("Enter target number", num_ailments)
                    elif selected_card.card_type == "Harmony":
                        print("Choose Tool target:")
                        num_tools = len(player.tools)
                        if num_tools == 0:
                            print("No Tools to target!")
                            continue
                        target_index = self.get_target_index_alpha("Enter target letter", num_tools)
                    elif selected_card.card_type == "Rhythm":
                        print("Choose Ailment target:")
                        num_ailments = len(active_ailments)
                        if num_ailments == 0:
                            print("No Ailments to target!")
                            continue
                        target_index = self.get_target_index("Enter target number", num_ailments)

                if not skip_targeting and target_index is None:
                    print("Target selection cancelled.")
                    continue

                return "PLAY_CARD", {"card_index": card_index, "target_index": target_index}

            elif choice == '2': # Use Consumable
                if not player.consumables:
                    print("You have no consumables.")
                    continue

                consumable_names = list(player.consumables.keys())
                consumable_options = [f"{name} (x{player.consumables[name]})" for name in consumable_names]
                consumable_options.append("Cancel")

                prompt = "Choose consumable to use:"
                choice_index, _ = self.get_player_choice(prompt, consumable_options)

                if choice_index == len(consumable_names): continue # Cancelled

                chosen_consumable_name = consumable_names[choice_index]
                item_object = next((item for item in player.item_collection if item.name == chosen_consumable_name), None)

                if item_object and isinstance(item_object, Consumable):
                    return "USE_CONSUMABLE", {"item_name": chosen_consumable_name, "item_object": item_object}
                else:
                    print(f"Error: Could not find usable item object for {chosen_consumable_name}")
                    continue

            elif choice == '3': # End Turn
                return "END_TURN", {}
            else:
                print("Invalid choice number. Please try again.")

    def get_target_index(self, prompt: str, max_index: int, allow_cancel=True) -> int | None:
        """Gets a valid numeric target index (0-based) from the user."""
        while True:
            cancel_prompt = " (or 'c' to cancel)" if allow_cancel else ""
            full_prompt = f"{prompt}{cancel_prompt}: "
            choice = input(full_prompt).lower()

            if allow_cancel and choice == 'c':
                return None

            try:
                index = int(choice) - 1
                if 0 <= index < max_index:
                    return index
                else:
                    print(f"Invalid index. Please enter a number between 1 and {max_index}.")
            except ValueError:
                print("Invalid input. Please enter a number.")

    def get_target_index_alpha(self, prompt: str, max_count: int, allow_cancel=True) -> int | None:
        """Gets a valid 0-based index based on letter input (A=0, B=1...)."""
        while True:
            cancel_prompt = " (or 'c' to cancel)" if allow_cancel else ""
            full_prompt = f"{prompt}{cancel_prompt}: "
            choice = input(full_prompt).lower()

            if allow_cancel and choice == 'c':
                return None

            if len(choice) == 1 and 'a' <= choice <= 'z':
                index = ord(choice) - ord('a')
                if 0 <= index < max_count:
                    return index
                else:
                    print(f"Invalid target letter. Please enter a letter between A and {chr(ord('A') + max_count - 1)}.")
            else:
                print("Invalid input. Please enter a single letter.")

    def confirm_action(self, prompt: str) -> bool:
        """Asks the user for a simple yes/no confirmation."""
        while True:
            choice = input(f"{prompt} (y/n): ").lower().strip()
            if choice == 'y':
                return True
            elif choice == 'n':
                return False
            else:
                print("Invalid input. Please enter 'y' or 'n'.")

    def wait_for_acknowledgement(self, prompt: str = "Press Enter to continue..."):
        """Pauses execution until the user acknowledges (e.g., presses Enter)."""
        input(prompt)

    def get_dice_to_set_aside(self, possible_scores: list, can_reroll: bool, reroll_options: list) -> tuple[str, dict | None]:
        """Handles the complex input for the dice game selection phase (CLI version)."""
        # This logic is complex and was previously embedded in DiceGame._play_round
        # We need to replicate the choice presentation and parsing here.

        print("Possible Actions:")
        action_options = []
        option_counter = 1

        # Add scoring combos
        for i, (combo, score, desc) in enumerate(possible_scores):
            print(f"  {option_counter}. Set Aside: {desc} {combo} (+{score})")
            action_options.append({"type": "set_aside", "combo_index": i, "combo": combo, "score": score, "desc": desc})
            option_counter += 1

        # Add reroll option if available
        if can_reroll:
            print(f"  {option_counter}. Use Obsidian Focus Die (Re-roll 2 or 3)")
            # We need the actual indices of the dice that can be rerolled
            # This requires passing more context (the current roll values/indices)
            # For now, let's assume the caller handles the reroll target selection
            action_options.append({"type": "reroll"}) # Simplified for now
            option_counter += 1

        print("Enter the number of your action, or 'd' when done setting aside for this roll:")

        while True: # Loop for valid input
            choice = input("> ").lower().strip()

            if choice == 'd':
                # Caller needs to check if at least one die was set aside before accepting 'd'
                return "stop", None # Signal to stop selecting for this roll

            if not choice.isdigit():
                print("Invalid input. Please enter a number or 'd'.")
                continue

            try:
                selection_index = int(choice) - 1 # User enters 1-based index

                if not (0 <= selection_index < len(action_options)):
                    print("Invalid action number.")
                    continue

                selected_action = action_options[selection_index]

                if selected_action["type"] == "set_aside":
                    # Return the chosen combo details
                    return "set_aside", selected_action
                elif selected_action["type"] == "reroll":
                    # Signal to initiate reroll - caller needs to handle target selection
                    return "reroll", None

            except ValueError:
                print("Invalid input. Please enter a number or 'd'.")
            except Exception as e:
                 print(f"An unexpected error occurred during input processing: {e}")


    def get_dice_reroll_choice(self) -> bool:
        """Asks the player if they want to roll remaining dice again."""
        while True:
            # The prompt needs context (how many dice remaining) - add later if needed
            roll_again_choice = input(f"Roll remaining dice? (y/n): ").lower().strip()
            if roll_again_choice == 'y':
                return True
            elif roll_again_choice == 'n':
                return False
            else:
                print("Invalid input. Please enter 'y' or 'n'.")
