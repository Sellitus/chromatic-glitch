# Defines the Card classes and related logic

class Card:
    """Base class for all cards in the game."""
    def __init__(self, name, cost, card_type, description):
        self.name = name
        self.cost = cost # Action Point cost
        self.card_type = card_type # e.g., "Melody", "Harmony", "Rhythm", "Chant"
        self.description = description

    # Modified execute to accept dice_score and use renderer from game_state
    def execute(self, player, target, game_state, dice_score=0):
        """Executes the card's effect."""
        renderer = game_state.renderer
        renderer.display_message(f"Playing {self.name} (base effect - does nothing).")

    def __str__(self):
        return f"{self.name} ({self.card_type}, Cost: {self.cost}) - {self.description}"

    # Enhance method needs renderer too if it prints
    def enhance(self, renderer):
        """Enhances the card (basic placeholder)."""
        if not self.name.endswith("+"):
            self.name += "+"
            self.description += " (+)"
            renderer.display_message(f"Enhanced {self.name}!")
            return True
        else:
            renderer.display_message(f"{self.name} is already enhanced.")
            return False

# Example Subclasses (will be expanded later)
# Execute methods now use game_state.renderer
class MelodyCard(Card):
    def __init__(self, name, cost, description, soothe_amount):
        super().__init__(name, cost, "Melody", description)
        self.soothe_amount = soothe_amount # "Damage" amount

    def execute(self, player, target, game_state, dice_score=0):
        renderer = game_state.renderer
        from .ailments import Ailment # Import here to break cycle
        if isinstance(target, Ailment): # Use isinstance check
            # Message handled by take_soothe now
            # renderer.display_message(f"Playing {self.name}: Applying {self.soothe_amount} Soothe to {target.name}.")
            target.take_soothe(self.soothe_amount, renderer) # Pass renderer
        else:
            renderer.display_message(f"Error: Cannot apply Soothe to target {target} (not an Ailment?).")

    def enhance(self, renderer): # Pass renderer
        """Enhance Melody: Increase soothe amount."""
        if super().enhance(renderer): # Pass renderer
            self.soothe_amount += 2 # Example enhancement value
            renderer.display_message(f"  Soothe increased to {self.soothe_amount}.")
            return True
        return False

class HarmonyCard(Card):
    def __init__(self, name, cost, description, resonance_amount):
        super().__init__(name, cost, "Harmony", description)
        self.resonance_amount = resonance_amount # "Healing" amount

    def execute(self, player, target, game_state, dice_score=0):
        renderer = game_state.renderer
        if hasattr(target, 'heal'):
            # Message handled by heal now
            # renderer.display_message(f"Playing {self.name}: Applying {self.resonance_amount} Resonance to {target.name}.")
            target.heal(self.resonance_amount, renderer) # Pass renderer
        else:
            renderer.display_message(f"Error: Cannot apply Resonance to target {target} (not a Tool?).")

    def enhance(self, renderer): # Pass renderer
        """Enhance Harmony: Increase resonance amount."""
        if super().enhance(renderer): # Pass renderer
            self.resonance_amount += 2 # Example enhancement value
            renderer.display_message(f"  Resonance increased to {self.resonance_amount}.")
            return True
        return False

class RhythmCard(Card):
    """Base class for Rhythm cards, often applying status effects or manipulating turn order."""
    def __init__(self, name, cost, description):
        super().__init__(name, cost, "Rhythm", description)

    def execute(self, player, target, game_state, dice_score=0):
        renderer = game_state.renderer
        if hasattr(target, 'add_status_effect'):
             renderer.display_message(f"Playing {self.name} on {target.name} (base Rhythm effect).")
             # Subclasses will override to apply specific effects
        else:
             renderer.display_message(f"Error: Cannot target {target} with {self.name} (not an Ailment?).")

    # Base enhance for Rhythm might not do much, subclasses override
    # def enhance(self):
    #     if super().enhance():
    #          # Add specific rhythm enhancements here
    #          return True
    #     return False

# TODO: Add ChantCard subclass
# TODO: Implement execute methods for other card types/specific cards

# --- Specific Card Definitions ---

# Basic Cards
class Strike(MelodyCard):
    def __init__(self):
        # Based on Kaelen's starting deck example
        super().__init__(name="Strike", cost=1, description="Deal 4 Soothe.", soothe_amount=4)

class Mend(HarmonyCard):
    def __init__(self):
        # Based on Lyra's starting deck example (using 4 Resonance heal)
        super().__init__(name="Mend", cost=1, description="Restore 4 Resonance.", resonance_amount=4)

class Guard(HarmonyCard):
    def __init__(self):
        # Applies Guard status for 1 turn (expires after blocking or end of turn)
        super().__init__(name="Guard", cost=1, description="Block the next incoming damage.", resonance_amount=0) # No direct heal
        self.status_effect_name = "Guard"
        self.status_effect_duration = 1 # Lasts until triggered or end of next turn

    def execute(self, player, target, game_state, dice_score=0):
        renderer = game_state.renderer
        if hasattr(target, 'add_status_effect'):
            renderer.display_message(f"Playing {self.name}: Applying {self.status_effect_name} for {self.status_effect_duration} turn to {target.name}.")
            # add_status_effect needs renderer if it prints messages
            target.add_status_effect(self.status_effect_name, self.status_effect_duration, renderer) # Pass renderer
        else:
            renderer.display_message(f"Error: Cannot apply Guard to target {target} (not a Tool?).")

class ForcefulNote(MelodyCard):
    def __init__(self):
        super().__init__(name="Forceful Note", cost=1, description="Deal 6 Soothe. Dice Trigger: +Soothe equal to Score/50.", soothe_amount=6)
        self.triggers_dice_game = True

    def execute(self, player, target, game_state, dice_score=0):
        renderer = game_state.renderer
        base_soothe = self.soothe_amount
        renderer.display_message(f"Playing {self.name}: Base Soothe {base_soothe}.")
        bonus_soothe = dice_score // 50
        total_soothe = base_soothe + bonus_soothe
        renderer.display_message(f"Dice Score: {dice_score}. Bonus Soothe: {bonus_soothe}. Total: {total_soothe}")

        if hasattr(target, 'take_soothe'):
            target.take_soothe(total_soothe, renderer) # Pass renderer
        else:
            renderer.display_message(f"Error: Cannot apply Soothe to target {target} (not an Ailment?).")

class SteadyRhythm(Card): # Base Card for now, needs Rhythm subclass later
    def __init__(self):
        super().__init__(name="Steady Rhythm", cost=1, card_type="Rhythm", description="Dice Trigger: If Score > 300, gain +1 Action Point next turn.")
        self.triggers_dice_game = True

    def execute(self, player, target, game_state, dice_score=0):
        renderer = game_state.renderer
        renderer.display_message(f"Playing {self.name}.")
        renderer.display_message(f"Dice Score: {dice_score}.")
        if dice_score > 300:
            renderer.display_message("Score > 300! Gaining +1 AP next turn.")
            current_bonus = player.next_turn_effects.get("BonusAP", 0)
            player.next_turn_effects["BonusAP"] = current_bonus + 1
        else:
            renderer.display_message("Score not high enough for bonus AP.")
        # This card doesn't target directly

class EchoingShout(MelodyCard):
    def __init__(self):
        super().__init__(name="Echoing Shout", cost=1, description="Deal 3 Soothe to front two Ailments.", soothe_amount=3)

    def execute(self, player, target_list, game_state, dice_score=0):
        renderer = game_state.renderer
        renderer.display_message(f"Playing {self.name}...")
        if not isinstance(target_list, list):
             renderer.display_message("Error: Echoing Shout target must be a list of ailments.")
             return

        targets = target_list[:2]
        if not targets:
             renderer.display_message("No ailments to target.")
             return

        renderer.display_message(f"Targeting: {[t.name for t in targets]}")
        for target_ailment in targets:
             if hasattr(target_ailment, 'take_soothe'):
                  # Message handled by take_soothe
                  # renderer.display_message(f"Applying {self.soothe_amount} Soothe to {target_ailment.name}.")
                  target_ailment.take_soothe(self.soothe_amount, renderer) # Pass renderer
             else:
                  renderer.display_message(f"Error: Cannot target {target_ailment} with Soothe.")

class KaelensResolve(HarmonyCard): # Character Specific
    def __init__(self):
        super().__init__(name="Kaelen's Resolve", cost=1, description="Dice Trigger: Heal self for Score/100. Low score (0-100) deals 2 damage to self instead.", resonance_amount=0) # Base heal is 0
        self.triggers_dice_game = True
        self.targets_self = True # This card affects the player/their tools

    def execute(self, player, target, game_state, dice_score=0):
        renderer = game_state.renderer
        target_tool = next((t for t in player.tools if t.current_resonance > 0), None)

        renderer.display_message(f"Playing {self.name}...")
        renderer.display_message(f"Dice Score: {dice_score}.")

        if not target_tool:
            renderer.display_message("No active tools to affect!")
            return

        if dice_score <= 100:
            damage_to_self = 2
            # Message handled by take_damage
            # renderer.display_message(f"Low score! {target_tool.name} takes {damage_to_self} backlash damage.")
            target_tool.take_damage(damage_to_self, renderer) # Pass renderer
        else:
            heal_amount = dice_score // 100
            # Message handled by heal
            # renderer.display_message(f"Healing {target_tool.name} for {heal_amount}.")
            target_tool.heal(heal_amount, renderer) # Pass renderer


class Soothe(MelodyCard):
    """Lyra's basic attack."""
    def __init__(self):
        super().__init__(name="Soothe", cost=1, description="Deal 3 Soothe.", soothe_amount=3)

class FlowingChord(HarmonyCard):
    def __init__(self):
        super().__init__(name="Flowing Chord", cost=1, description="Grant 'Resonance 2' (Heals 2 for 2 turns) to one Tool.", resonance_amount=0) # Initial heal is 0
        self.status_effect_name = "Resonance"
        self.status_effect_value = 2 # Heal amount per turn
        self.status_effect_duration = 2 # Turns

    def execute(self, player, target, game_state, dice_score=0): # Add dice_score default
        renderer = game_state.renderer
        if hasattr(target, 'add_status_effect'):
            effect_key = f"{self.status_effect_name}_{self.status_effect_value}"
            renderer.display_message(f"Playing {self.name}: Applying {effect_key} for {self.status_effect_duration} turns to {target.name}.")
            # add_status_effect needs renderer if it prints messages
            target.add_status_effect(effect_key, self.status_effect_duration, renderer) # Pass renderer
        else:
            renderer.display_message(f"Error: Cannot apply Resonance effect to target {target} (not a Tool?).")

class EntanglingTune(RhythmCard): # Inherit from RhythmCard
    def __init__(self):
        super().__init__(name="Entangling Tune", cost=1, description="Apply 'Slow 1' (Acts last next turn) to one Ailment.")
        self.status_effect_name = "Slow"
        self.status_effect_value = 1 # Potentially store magnitude if Slow can stack/have levels
        self.status_effect_duration = 1 # Lasts for 1 turn cycle

    def execute(self, player, target, game_state, dice_score=0):
        renderer = game_state.renderer
        if hasattr(target, 'add_status_effect'):
            effect_key = f"{self.status_effect_name}_{self.status_effect_value}"
            renderer.display_message(f"Playing {self.name}: Applying {effect_key} for {self.status_effect_duration} turn to {target.name}.")
            # add_status_effect needs renderer if it prints messages
            target.add_status_effect(effect_key, self.status_effect_duration, renderer) # Pass renderer
        else:
             renderer.display_message(f"Error: Cannot target {target} with {self.name} (not an Ailment?).")

class HarmonicPulse(HarmonyCard):
    def __init__(self):
        super().__init__(name="Harmonic Pulse", cost=1, description="Restore 2 Resonance to all Tools.", resonance_amount=2)

    def execute(self, player, target_list, game_state, dice_score=0):
        renderer = game_state.renderer
        renderer.display_message(f"Playing {self.name}...")
        # target_list should be player.tools passed from treatment phase
        targets = [t for t in target_list if hasattr(t, 'current_resonance') and t.current_resonance > 0]

        if not targets:
            renderer.display_message("No active tools to heal.")
            return

        renderer.display_message(f"Targeting: {[t.name for t in targets]}")
        for target_tool in targets:
             if hasattr(target_tool, 'heal'):
                  # Message handled by heal
                  # renderer.display_message(f"Applying {self.resonance_amount} Resonance to {target_tool.name}.")
                  target_tool.heal(self.resonance_amount, renderer) # Pass renderer
             else:
                  renderer.display_message(f"Error: Cannot apply Resonance to {target_tool}.")

class LyrasInsight(HarmonyCard): # Character Specific
    def __init__(self):
        super().__init__(name="Lyra's Insight", cost=1, description="Draw 1 card. If the target Tool has a positive status effect, draw 2 cards instead.", resonance_amount=0) # No direct heal
        self.targets_self = True # Affects player's hand/deck

    def execute(self, player, target, game_state, dice_score=0):
        renderer = game_state.renderer
        renderer.display_message(f"Playing {self.name}...")
        has_positive_effect = False
        for tool in player.tools:
            if any(k.startswith("Resonance_") or k == "Guard" for k in tool.status_effects):
                 has_positive_effect = True
                 break

        draw_amount = 1
        if has_positive_effect:
            renderer.display_message("A tool has a positive effect! Drawing extra card.")
            draw_amount = 2
        else:
            renderer.display_message("No positive effects found on tools.")

        # Pass renderer to draw_card
        player.draw_card(draw_amount, renderer)


# TODO: Define advanced cards
class StutteringBeat(RhythmCard):
    def __init__(self):
        super().__init__(name="Stuttering Beat", cost=1, description="Apply 'Slow 1' and 'Fragile 1' to target Ailment. If target already had 'Slow', draw 1 card.")
        self.slow_effect = "Slow_1"
        self.fragile_effect = "Fragile_1"
        self.status_duration = 1

    def execute(self, player, target, game_state, dice_score=0):
        renderer = game_state.renderer
        if not hasattr(target, 'add_status_effect'):
             renderer.display_message(f"Error: Cannot target {target} with {self.name} (not an Ailment?).")
             return

        # Check if target already has Slow
        already_slowed = any(k.startswith("Slow_") for k in target.status_effects)

        # Apply Slow
        renderer.display_message(f"Applying {self.slow_effect} for {self.status_duration} turn to {target.name}.")
        target.add_status_effect(self.slow_effect, self.status_duration, renderer)

        # Apply Fragile
        renderer.display_message(f"Applying {self.fragile_effect} for {self.status_duration} turn to {target.name}.")
        target.add_status_effect(self.fragile_effect, self.status_duration, renderer)

        # Conditional draw
        if already_slowed:
            renderer.display_message(f"{target.name} was already Slowed! Drawing 1 card.")
            player.draw_card(1, renderer)


# TODO: Implement Echoing Shout multi-target (Done)
# TODO: Implement Harmonic Pulse AoE (Done)
