import { AudioManager } from './audioManager';
import { EventSystem } from './eventSystem';
import { GameState } from './gameState';
import { CardSystem } from '../systems/cardSystem';
import { DiceSystem } from '../systems/diceSystem';
import { CombatSystem } from '../systems/combatSystem';
import { PatientSystem } from '../systems/patientSystem';

export class GameInitializer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // Initialize core systems
    this.audioManager = new AudioManager();
    this.eventSystem = new EventSystem();
    this.gameState = new GameState();
    
    // Initialize game systems
    this.cardSystem = new CardSystem(this.eventSystem);
    this.diceSystem = new DiceSystem(this.eventSystem);
    this.combatSystem = new CombatSystem(this.eventSystem);
    this.patientSystem = new PatientSystem(this.eventSystem);
  }

  start() {
    // Initialize game systems
    this.audioManager.init();
    this.eventSystem.init();
    this.gameState.init();
    
    // Start game loop
    this.gameLoop();
  }

  gameLoop() {
    // Basic game loop
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    
    loop();
  }

  update() {
    // Update game systems
    this.cardSystem.update();
    this.diceSystem.update();
    this.combatSystem.update();
    this.patientSystem.update();
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render game systems
    this.cardSystem.render(this.ctx);
    this.diceSystem.render(this.ctx);
    this.combatSystem.render(this.ctx);
    this.patientSystem.render(this.ctx);
  }
}
