# Defines the Tool class (player instruments)
# Import UI interfaces for type hinting
from .ui.abstract_ui import AbstractRenderer

class Tool:
    """Represents a player's instrument/tool in combat."""
    def __init__(self, name, max_resonance):
        self.name = name
        self.max_resonance = max_resonance # Maximum "health"
        self.current_resonance = max_resonance # Current "health"
        self.status_effects = {} # e.g., {"Tempo": 2} turns remaining
        self.position = 0 # Placeholder for positional logic

    # Modified to accept renderer
    def take_damage(self, amount, renderer: AbstractRenderer):
        """Applies damage (reduces resonance), checking for Guard."""
        if "Guard" in self.status_effects:
            renderer.display_message(f"{self.name} has Guard! Damage blocked.")
            del self.status_effects["Guard"]
            return False

        actual_damage = amount
        if actual_damage < 0: actual_damage = 0

        self.current_resonance -= actual_damage
        renderer.display_message(f"{self.name} takes {actual_damage} damage, {self.current_resonance}/{self.max_resonance} Resonance remaining.")
        if self.current_resonance <= 0:
            self.current_resonance = 0
            renderer.display_message(f"{self.name} is broken!")
        return self.current_resonance <= 0

    # Modified to accept renderer
    def heal(self, amount, renderer: AbstractRenderer):
        """Restores resonance."""
        if self.current_resonance <= 0:
            renderer.display_message(f"{self.name} is broken and cannot be healed.")
            return 0

        actual_heal = amount
        if actual_heal < 0: actual_heal = 0

        healed_amount = min(actual_heal, self.max_resonance - self.current_resonance)
        if healed_amount <= 0:
             # Optionally display message if already full?
             # renderer.display_message(f"{self.name} is already at full Resonance.")
             return 0

        self.current_resonance += healed_amount
        renderer.display_message(f"{self.name} restores {healed_amount} Resonance, now at {self.current_resonance}/{self.max_resonance}.")
        return healed_amount

    # Modified to accept renderer
    def add_status_effect(self, effect_name, duration, renderer: AbstractRenderer):
        """Adds a status effect."""
        # TODO: Handle stacking/refreshing logic
        self.status_effects[effect_name] = duration
        renderer.display_message(f"{self.name} gains {effect_name} for {duration} turns.")

    # Modified to accept renderer
    def tick_status_effects(self, renderer: AbstractRenderer):
        """Processes status effects at the start/end of a turn. Decrements duration."""
        expired_effects = []
        # Use renderer for messages
        # renderer.display_message(f"Ticking status effects for {self.name}:")
        if not self.status_effects:
            # renderer.display_message("  No active effects.")
            return

        for effect, duration in list(self.status_effects.items()):
            if effect.startswith("Resonance_"):
                try:
                    heal_amount = int(effect.split("_")[1])
                    # renderer.display_message(f"  Applying {effect}: Healing for {heal_amount}.")
                    self.heal(heal_amount, renderer) # Pass renderer
                except (IndexError, ValueError):
                    renderer.display_message(f"  Error parsing Resonance effect: {effect}")

            # TODO: Apply other status effect logic (Tempo, Dissonance, etc.)

            if duration > 0:
                self.status_effects[effect] -= 1
                current_duration = self.status_effects[effect]
                # Optionally display tick down message?
                # renderer.display_message(f"  {effect}: {current_duration} turns remaining.")
                if current_duration == 0:
                    expired_effects.append(effect)

        for effect in expired_effects:
            renderer.display_message(f"  {effect} on {self.name} has expired.")
            del self.status_effects[effect]

    def __str__(self):
        # Basic representation, can be enhanced by UI renderer
        status_str = ", ".join([f"{k}:{v}t" for k, v in self.status_effects.items()])
        return f"[{self.name} ({self.current_resonance}/{self.max_resonance} Res) Status: {status_str if status_str else 'None'}]"


# --- Specific Tool Definitions ---

class ResonantGourd(Tool):
    def __init__(self):
        super().__init__(name="Resonant Gourd", max_resonance=50) # Example health value

class SteadyDrum(Tool):
    def __init__(self):
        super().__init__(name="Steady Drum", max_resonance=60) # Slightly higher health example

class TunedPanpipes(Tool):
    def __init__(self):
        super().__init__(name="Tuned Panpipes", max_resonance=45) # Lower health example
        # TODO: Implement enhancement for Harmony cards played through it

# TODO: Define Jaguar Bone Flute, etc.
# TODO: Add special effects/enhancements for specific tools
