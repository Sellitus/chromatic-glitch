# Defines Dice and the Dice Resonance Game logic

import random
# Import UI interfaces for type hinting
from .ui.abstract_ui import AbstractRenderer, AbstractInputHandler
# Import other types for hinting using forward references (strings)
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .characters import PlayerCharacter
# from .dice import ObsidianFocusDie # No longer needed here, used below

class Die:
    """Base class for dice."""
    def __init__(self, name, description="A standard six-sided die."):
        self.name = name
        self.description = description
        self.sides = 6

    def roll(self):
        """Rolls the die."""
        return random.randint(1, self.sides)

    def get_effect_description(self):
        """Returns the description of any special effect."""
        return "Standard Die" # Override in subclasses

    def __str__(self):
        return f"{self.name} ({self.get_effect_description()})"


# --- Specific Dice Definitions ---

class ObsidianFocusDie(Die):
    """Kaelen's starting die."""
    def __init__(self):
        super().__init__(name="Obsidian Focus Die", description="When setting aside dice, you may re-roll one '2' or '3' once per round.")

    def get_effect_description(self):
        return "Re-roll one '2' or '3' once per round when setting aside."

class RiverPearlDie(Die):
    """Lyra's starting die."""
    def __init__(self):
        super().__init__(name="River Pearl Die", description="Counts '5's as 60 points instead of 50.")

    def get_effect_description(self):
        return "Counts '5's as 60 points."

# TODO: Add Lucky Tooth Die, Cursed Idol Die, etc.


# --- Dice Game Scoring Logic ---

# Define base scores
SCORE_MAP = {
    1: 100,
    5: 50,
}
TRIPLE_SCORES = {
    1: 1000,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
    6: 600,
}
STRAIGHT_SCORE = 1500

def calculate_score(dice_values, dice_objects=None):
    """
    Calculates the score for a given set of dice values.
    Returns a list of valid scoring combinations (value_list, score, description).
    Handles basic KCD scoring rules.
    `dice_objects` can be provided to handle special dice effects (e.g., River Pearl).
    """
    scores = []
    counts = {i: dice_values.count(i) for i in range(1, 7)}
    remaining_dice = list(dice_values) # Copy to modify

    # Check for Straight 1-6
    if all(counts[i] >= 1 for i in range(1, 7)) and len(remaining_dice) == 6:
        scores.append(((1, 2, 3, 4, 5, 6), STRAIGHT_SCORE, "Straight 1-6"))
        return scores # Straight is exclusive

    # Check for Triples
    triples_found = []
    temp_remaining_dice = list(remaining_dice) # Work on a copy for triple checking
    for value, score in TRIPLE_SCORES.items():
        if counts[value] >= 3:
            triples_found.append((tuple([value]*3), score, f"Triple {value}s"))
            # Remove three instances of the value from temp_remaining_dice
            removed_count = 0
            new_temp_remaining = []
            for die in temp_remaining_dice:
                if die == value and removed_count < 3:
                    removed_count += 1
                else:
                    new_temp_remaining.append(die)
            temp_remaining_dice = new_temp_remaining

    scores.extend(triples_found)
    remaining_dice = temp_remaining_dice # Update remaining_dice after finding all triples

    # Check for Single 1s and 5s from the *remaining* dice
    singles_found = []
    is_river_pearl_present = any(isinstance(d, RiverPearlDie) for d in (dice_objects or []))

    for die_value in remaining_dice: # Iterate through values directly
        score_value = 0
        desc = ""
        if die_value == 1:
            score_value = SCORE_MAP[1]
            desc = "Single 1"
        elif die_value == 5:
            if is_river_pearl_present: # Simplified check
                 score_value = 60
                 desc = "Single 5 (River Pearl)"
            else:
                 score_value = SCORE_MAP[5]
                 desc = "Single 5"

        if score_value > 0:
            # Represent single die combo as a tuple containing one element
            singles_found.append(((die_value,), score_value, desc))

    scores.extend(singles_found)
    return scores


class DiceGame:
    """Manages the Dice Resonance game mechanics."""
    # Use string hint for PlayerCharacter to break cycle
    def __init__(self, player: 'PlayerCharacter'):
        self.player = player
        self.dice_loadout = player.dice_loadout
        self.current_dice_objects = []
        self.current_roll_values = []
        self.round_banked_score = 0
        self.total_score = 0
        self.current_round = 1
        self.can_reroll_special = True

    # Modified to accept UI handlers
    def play_game(self, renderer: AbstractRenderer, input_handler: AbstractInputHandler) -> int:
        """Plays the two rounds of the dice game."""
        renderer.display_message("\n--- Dice Resonance Game ---")
        start_bonus = getattr(self.player, 'dice_score_bonus', 0)
        if start_bonus > 0:
            renderer.display_message(f"Applying starting bonus: +{start_bonus} points!")
        self.total_score = start_bonus

        for r in range(1, 3):
            self.current_round = r
            renderer.display_message(f"\nRound {self.current_round}:")
            # Pass UI handlers to the round logic
            self.round_banked_score = self._play_round(renderer, input_handler)
            renderer.display_message(f"Round {self.current_round} Banked Score: {self.round_banked_score}")
            self.total_score += self.round_banked_score
            if self.round_banked_score == 0:
                 renderer.display_message("Busted!")
                 if r == 1:
                      self.total_score = start_bonus
                 break
            if self.current_round == 1:
                 input_handler.wait_for_acknowledgement("Press Enter for Round 2...")

        renderer.display_message(f"--- Dice Game End ---")
        renderer.display_message(f"Total Score: {self.total_score}")
        return self.total_score

    # Modified to accept UI handlers
    def _roll_dice(self, dice_objects_to_roll: list[Die], renderer: AbstractRenderer):
        """Rolls the specified dice objects and updates internal state."""
        self.current_dice_objects = dice_objects_to_roll
        self.current_roll_values = [die.roll() for die in self.current_dice_objects]
        renderer.display_dice_roll(self.current_roll_values) # Use renderer

    # Modified to accept UI handlers
    def _play_round(self, renderer: AbstractRenderer, input_handler: AbstractInputHandler) -> int:
        """Plays a single round of setting aside dice."""
        round_score = 0
        current_roll_dice_objects = list(self.dice_loadout)
        self.can_reroll_special = True

        while True:
            self._roll_dice(current_roll_dice_objects, renderer)
            roll_values = self.current_roll_values
            roll_objects = self.current_dice_objects

            initial_possible_scores = calculate_score(roll_values, roll_objects)
            # Original bust check location - keep it here for now
            # Original bust check location - keep it here for now
            # if not initial_possible_scores:
            #     renderer.display_message("No scoring dice! Busted this round.")
            #     return 0

            chosen_indices_this_roll = set()
            current_selection_score = 0
            trigger_outer_loop_restart = False

            while True: # Inner loop for selecting dice from the current roll
                renderer.display_message("\nCurrent Roll:",) # Use renderer
                available_indices_in_roll = [i for i in range(len(roll_values)) if i not in chosen_indices_this_roll]
                available_dice_str = [f"({i+1}: {roll_values[i]})" for i in available_indices_in_roll]
                renderer.display_message(" ".join(available_dice_str)) # Use renderer

                available_values_for_scoring = [roll_values[i] for i in available_indices_in_roll]
                available_objects_for_scoring = [roll_objects[i] for i in available_indices_in_roll]
                current_possible_scores = calculate_score(available_values_for_scoring, available_objects_for_scoring)

                obsidian_present = any(isinstance(d, ObsidianFocusDie) for d in self.dice_loadout)
                rerollable_indices_options = [i for i in available_indices_in_roll if roll_values[i] in [2, 3]]
                can_offer_reroll = obsidian_present and self.can_reroll_special and rerollable_indices_options

                # Decide action based on possible scores and reroll availability
                if not current_possible_scores:
                    if can_offer_reroll:
                        # No scores, but can reroll -> force reroll path
                        renderer.display_message("No scoring dice left; Obsidian Focus reroll available.")
                        action_type = "reroll"
                        action_data = None # Reroll logic below will handle selection
                    else:
                        # No scores, no reroll -> end selection for this roll
                        if not chosen_indices_this_roll:
                             renderer.display_message("No scoring dice available in this roll.")
                        else:
                             renderer.display_message("No further scoring combinations available with remaining dice.")
                        break # Exit inner selection loop
                else:
                    # Scores are possible -> get player choice (set aside, reroll, or stop)
                    action_type, action_data = input_handler.get_dice_to_set_aside(
                        current_possible_scores, can_offer_reroll, rerollable_indices_options
                    )

                if action_type == "stop":
                    if not chosen_indices_this_roll:
                         renderer.display_message("You must set aside at least one scoring die/combo.")
                         continue
                    break # Done selecting for this roll

                elif action_type == "set_aside":
                    combo_values = action_data["combo"]
                    score = action_data["score"]
                    desc = action_data["desc"]

                    indices_to_add_this_combo = set()
                    temp_available_indices = list(available_indices_in_roll)
                    possible_to_select = True
                    for val_needed in combo_values:
                        found_idx_for_val = -1
                        for check_idx in temp_available_indices:
                            if roll_values[check_idx] == val_needed:
                                found_idx_for_val = check_idx
                                break
                        if found_idx_for_val != -1:
                            indices_to_add_this_combo.add(found_idx_for_val)
                            temp_available_indices.remove(found_idx_for_val)
                        else:
                            renderer.display_message(f"Error: Could not find index for value {val_needed} in combo {combo_values} among available dice.")
                            possible_to_select = False
                            break

                    # Check if the combo was successfully selected
                    if possible_to_select and len(indices_to_add_this_combo) == len(combo_values):
                        # Check if any of the required dice were already set aside this roll
                        if any(idx in chosen_indices_this_roll for idx in indices_to_add_this_combo):
                            renderer.display_message("Error: One or more dice for this combo already set aside this turn.")
                        else:
                            # Valid selection, update score and state
                            indices_str = str({i+1 for i in indices_to_add_this_combo})
                            renderer.display_message(f"Setting aside: {desc} {combo_values} (+{score}) using roll indices: {indices_str}")
                            chosen_indices_this_roll.update(indices_to_add_this_combo)
                            print(f"DEBUG: Adding score {score} to current_selection_score {current_selection_score}") # DEBUG
                            current_selection_score += score
                            print(f"DEBUG: current_selection_score is now {current_selection_score}") # DEBUG
                            renderer.display_message(f"Score added this selection: {score}. Total set aside this roll: {current_selection_score}")
                            available_indices_in_roll = [i for i in available_indices_in_roll if i not in chosen_indices_this_roll]
                    elif possible_to_select: # This case means indices were found, but not enough for the combo length (shouldn't happen with current logic)
                         renderer.display_message(f"Error: Mismatch finding indices for combo {combo_values}. Found {len(indices_to_add_this_combo)}.")

                elif action_type == "reroll":
                    # Need to ask WHICH die to reroll
                    renderer.display_message("Available 2s/3s to re-roll:")
                    reroll_display_options = []
                    for i, idx in enumerate(rerollable_indices_options):
                         reroll_display_options.append(f"Die at roll position {idx+1} (Value: {roll_values[idx]})")

                    # Use get_player_choice for selection
                    reroll_choice_idx, _ = input_handler.get_player_choice("Choose number to re-roll:", reroll_display_options)

                    if reroll_choice_idx is not None and 0 <= reroll_choice_idx < len(rerollable_indices_options):
                        target_reroll_index_in_roll = rerollable_indices_options[reroll_choice_idx]
                        target_die_object = roll_objects[target_reroll_index_in_roll]

                        renderer.display_message(f"Re-rolling die at roll position {target_reroll_index_in_roll + 1} ({target_die_object.name})...")
                        new_value = target_die_object.roll()
                        renderer.display_message(f"New value: {new_value}")
                        self.current_roll_values[target_reroll_index_in_roll] = new_value
                        self.can_reroll_special = False
                        trigger_outer_loop_restart = True
                        break # Exit selection loop to trigger reroll
                    else:
                         renderer.display_message("Invalid reroll choice.")


            # --- End selection loop for this roll ---
            if trigger_outer_loop_restart:
                 continue # Go back to the start of the outer while loop

            if not chosen_indices_this_roll:
                 renderer.display_message("Error: No dice were set aside this roll. Treating as bust.")
                 return 0

            round_score += current_selection_score
            renderer.display_message(f"Score this roll: {current_selection_score}. Round total: {round_score}")

            new_dice_available_objects = []
            for i, die_obj in enumerate(current_roll_dice_objects):
                 if i not in chosen_indices_this_roll:
                      new_dice_available_objects.append(die_obj)

            if not new_dice_available_objects:
                renderer.display_message("Hot Dice! Rolling all 6 again.")
                current_roll_dice_objects = list(self.dice_loadout)
            else:
                current_roll_dice_objects = new_dice_available_objects
                # Use injected handler
                if input_handler.get_dice_reroll_choice():
                    continue # Continue outer loop for next roll
                else:
                    renderer.display_message("Stopping round.")
                    return round_score # Bank score and end round

        # Should not be reached
        return round_score
