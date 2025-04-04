# Defines the Ailment class (enemies)
# Import UI interfaces for type hinting
from .ui.abstract_ui import AbstractRenderer
# Import other types for hinting
from .characters import PlayerCharacter
from .tools import Tool # For type hinting player_tools

import random # Needed for base intent

class Ailment:
    """Represents an enemy Ailment in combat."""
    def __init__(self, name, max_resonance, description=""):
        self.name = name
        self.max_resonance = max_resonance
        self.current_resonance = max_resonance
        self.status_effects = {} # e.g., {"Fragile": 1}
        self.intent = None # What the ailment plans to do next turn (e.g., "Attack", "Defend")
        self.position = 0 # Placeholder for positional logic
        self.description = description # Flavor text or type description

    # Modified to accept renderer
    def take_soothe(self, amount, renderer: AbstractRenderer):
        """Applies Soothe (damage) to the Ailment, considering Fragile."""
        fragile_modifier = 1.0 # Default multiplier
        fragile_stacks = 0
        # Check for Fragile status (assuming format "Fragile_X")
        for effect_key in list(self.status_effects.keys()): # Iterate over copy
             if effect_key.startswith("Fragile_"):
                  try:
                       stacks = int(effect_key.split("_")[1])
                       # Example: Each stack increases damage by 50%? TBD
                       fragile_modifier += stacks * 0.5
                       fragile_stacks = stacks # Store for message
                       # Consume Fragile? Or let it tick down? Assume tick down for now.
                  except (IndexError, ValueError):
                       renderer.display_message(f"Error parsing Fragile effect: {effect_key}")

        actual_soothe = amount
        if fragile_stacks > 0:
             actual_soothe = int(actual_soothe * fragile_modifier) # Apply multiplier
             renderer.display_message(f"Fragile ({fragile_stacks}) increases Soothe taken!")

        if actual_soothe < 0: actual_soothe = 0

        self.current_resonance -= actual_soothe
        message = f"{self.name} takes {actual_soothe} Soothe."
        if self.current_resonance <= 0:
            self.current_resonance = 0
            message += f" ({self.current_resonance}/{self.max_resonance} Res) - Soothed!"
        else:
            message += f" ({self.current_resonance}/{self.max_resonance} Res remaining)."
        renderer.display_message(message)
        return self.current_resonance <= 0

    # Modified to accept renderer
    def add_status_effect(self, effect_name, duration, renderer: AbstractRenderer):
        """Adds a status effect."""
        # TODO: Handle stacking/refreshing logic
        self.status_effects[effect_name] = duration
        renderer.display_message(f"{self.name} gains {effect_name} for {duration} turns.")

    # Modified to accept game_state (for renderer access)
    def determine_intent(self, player_tools: list[Tool], game_state):
        """Determines the Ailment's action for the next turn."""
        renderer = game_state.renderer # Get renderer from game_state
        # Placeholder: Always intends to attack the first tool
        target = None
        valid_targets = [t for t in player_tools if t.current_resonance > 0]
        if valid_targets:
            target = random.choice(valid_targets) # Attack random valid tool

        if target:
            self.intent = ("Attack", target)
            renderer.display_message(f"{self.name} intends to Attack {target.name}.")
        else:
            self.intent = ("Idle", None)
            renderer.display_message(f"{self.name} has no valid targets and idles.")
        # TODO: Implement more complex AI/intent logic based on ailment type

    # Accepts game_state for renderer access
    def act(self, player_character: PlayerCharacter, game_state):
        """Executes the Ailment's action based on its intent."""
        renderer = game_state.renderer # Get renderer
        # renderer.display_message(f"\n--- {self.name}'s Turn ---") # Maybe redundant if phase handler announces turn
        if not self.intent:
            renderer.display_message(f"{self.name} has no intent and does nothing.")
            return

        action_type, target = self.intent
        if action_type == "Attack":
            if target and target.current_resonance > 0:
                damage = 5 # Basic damage value
                renderer.display_message(f"{self.name} attacks {target.name}!")
                # Pass renderer to take_damage
                target.take_damage(damage, renderer)
            else:
                renderer.display_message(f"{self.name} tries to attack, but the target is invalid or broken.")
        # TODO: Implement other actions (Defend, Buff, Debuff)
        else:
            renderer.display_message(f"{self.name} performs unknown action: {action_type}")

        # Clear intent after acting
        self.intent = None
        # Pass renderer to tick_status_effects
        self.tick_status_effects(renderer) # Tick effects after acting

    # Modified to accept renderer
    def tick_status_effects(self, renderer: AbstractRenderer):
        """Processes status effects at the start/end of a turn. Decrements duration."""
        expired_effects = []
        # renderer.display_message(f"Ticking status effects for {self.name}:") # Optional verbosity
        if not self.status_effects:
            # renderer.display_message("  No active effects.")
            return

        for effect, duration in list(self.status_effects.items()): # Use list() for safe iteration
            # TODO: Apply actual effect logic here (e.g., Fragile increasing damage taken)
            if duration > 0:
                self.status_effects[effect] -= 1
                # Optionally display tick down?
                # renderer.display_message(f"  {effect} on {self.name}: {self.status_effects[effect]} turns remaining.")
                if self.status_effects[effect] == 0:
                    expired_effects.append(effect)

        for effect in expired_effects:
            renderer.display_message(f"  {effect} on {self.name} has expired.")
            del self.status_effects[effect]

    def __str__(self):
        # Basic representation
        status_str = ", ".join([f"{k}:{v}t" for k, v in self.status_effects.items()])
        intent_str = f"Intent: {self.intent[0]} {self.intent[1].name}" if self.intent and self.intent[1] else "Intent: None"
        return f"[{self.name} ({self.current_resonance}/{self.max_resonance} Res) Status: {status_str if status_str else 'None'} | {intent_str}]"


# --- Specific Ailment Definitions ---

class CrawlingAnxiety(Ailment):
    def __init__(self):
        super().__init__(name="Crawling Anxiety", max_resonance=15, description="Low health, attacks frequently for small damage.")
        self.base_damage = 3 # Example damage value

    # Modified to accept game_state for renderer access
    def determine_intent(self, player_tools: list[Tool], game_state):
        """Crawling Anxiety always tries to attack the tool with the lowest current resonance."""
        renderer = game_state.renderer # Get renderer
        target = None
        if player_tools:
            # Find the tool with the lowest current health that is not broken
            valid_targets = [t for t in player_tools if t.current_resonance > 0]
            if valid_targets:
                target = min(valid_targets, key=lambda tool: tool.current_resonance)

        # determine_intent should use renderer now
        renderer = game_state.renderer # Need game_state passed here? Or just renderer? Let's assume renderer for now.
        if target:
            self.intent = ("Attack", target)
            renderer.display_message(f"{self.name} intends to Attack {target.name}.")
        else:
            self.intent = ("Idle", None) # No valid targets
            renderer.display_message(f"{self.name} has no valid targets and idles.")

    # Accepts game_state for renderer access
    def act(self, player_character: PlayerCharacter, game_state):
        """Executes the Ailment's action based on its intent."""
        renderer = game_state.renderer
        # renderer.display_message(f"\n--- {self.name}'s Turn ---") # Redundant?
        if not self.intent or self.intent[0] == "Idle":
            renderer.display_message(f"{self.name} idles.")
            self.intent = None
            self.tick_status_effects(renderer) # Still tick effects even if idle
            return

        action_type, target = self.intent
        if action_type == "Attack":
            if target and target.current_resonance > 0:
                renderer.display_message(f"{self.name} attacks {target.name}!")
                target.take_damage(self.base_damage, renderer) # Pass renderer
                # TODO: Add 'Jittery' debuff application
            else:
                renderer.display_message(f"{self.name} tries to attack, but the target is invalid or broken.")
        else:
            renderer.display_message(f"{self.name} performs unknown action: {action_type}")

        # Clear intent after acting
        self.intent = None
        self.tick_status_effects(renderer) # Tick effects after acting


class SensorySpike(Ailment):
    def __init__(self):
        super().__init__(name="Sensory Spike", max_resonance=30, description="Charges up a powerful attack. Vulnerable while charging.")
        self.charge_turns = 0 # How many turns spent charging
        self.max_charge = 2 # Turns needed to charge fully
        self.attack_damage = 15 # Damage when attack fires

    # Modified to accept game_state for renderer access
    def determine_intent(self, player_tools: list[Tool], game_state):
        """Charges up, then attacks."""
        renderer = game_state.renderer # Get renderer
        if self.charge_turns < self.max_charge:
            self.intent = ("Charge", None)
            renderer.display_message(f"{self.name} is gathering energy ({self.charge_turns + 1}/{self.max_charge})...")
        else:
            # Attack the tool with the highest current resonance
            target = None
            if player_tools:
                valid_targets = [t for t in player_tools if t.current_resonance > 0]
                if valid_targets:
                    target = max(valid_targets, key=lambda tool: tool.current_resonance)

            if target:
                self.intent = ("Attack", target)
                renderer.display_message(f"{self.name} intends to unleash a Sensory Spike on {target.name}!")
            else:
                self.intent = ("Idle", None)
                renderer.display_message(f"{self.name} has no valid targets and idles.")

    # Accepts game_state for renderer access
    def act(self, player_character: PlayerCharacter, game_state):
        """Executes the Ailment's action based on its intent."""
        renderer = game_state.renderer
        # renderer.display_message(f"\n--- {self.name}'s Turn ---") # Redundant?
        if not self.intent:
            renderer.display_message(f"{self.name} has no intent and does nothing.")
            self.tick_status_effects(renderer) # Still tick effects
            return

        action_type, target = self.intent
        if action_type == "Charge":
            self.charge_turns += 1
            renderer.display_message(f"{self.name} continues charging...")
            # TODO: Apply 'Vulnerable' status while charging?
        elif action_type == "Attack":
            if target and target.current_resonance > 0:
                renderer.display_message(f"{self.name} unleashes its attack on {target.name}!")
                target.take_damage(self.attack_damage, renderer) # Pass renderer
                self.charge_turns = 0 # Reset charge after attacking
            else:
                renderer.display_message(f"{self.name} tries to attack, but the target is invalid or broken.")
                self.charge_turns = 0 # Reset charge even if attack fails? TBD
        elif action_type == "Idle":
             renderer.display_message(f"{self.name} idles.")
             self.charge_turns = 0 # Reset charge if idling? TBD
        else:
            renderer.display_message(f"{self.name} performs unknown action: {action_type}")

        # Clear intent after acting
        self.intent = None
        self.tick_status_effects(renderer) # Tick effects after acting

# TODO: Define Fragmented Thought, Deepening Shadow, etc.
