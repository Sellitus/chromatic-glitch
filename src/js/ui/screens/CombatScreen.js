import BaseScreen from './BaseScreen.js';
import Panel from '../components/Panel.js';
import Button from '../components/Button.js';
import ProgressBar from '../components/ProgressBar.js';
// import CardComponent from './components/CardComponent.js'; // Example future component
// import DiceDisplay from './components/DiceDisplay.js'; // Example future component

/**
 * The combat screen where the player engages with diseases using cards and dice.
 */
export default class CombatScreen extends BaseScreen {
  constructor(options = {}) {
    super({ ...options, className: 'combat-screen' });

    // Placeholder components
    this.patientVisualization = null;
    this.energyMeter = null;
    this.strainMeter = null;
    this.cardHandArea = null;
    this.diceArea = null;
    this.actionPanel = null;

    this.initializeUI();
  }

  initializeUI() {
    // --- Top Area (Patient Visualization, Meters) ---
    const topPanel = new Panel({ id: 'combat-top-panel', className: 'top-panel' });
    this.addChild(topPanel);

    this.patientVisualization = new Panel({ id: 'patient-viz', content: '(Patient/Disease Visualization)' });
    topPanel.addChild(this.patientVisualization);

    const metersPanel = new Panel({ id: 'meters-panel', className: 'meters' });
    topPanel.addChild(metersPanel);

    this.energyMeter = new ProgressBar({ id: 'energy-meter', label: 'Energy', value: 80, max: 100 });
    metersPanel.addChild(this.energyMeter);

    this.strainMeter = new ProgressBar({ id: 'strain-meter', label: 'Strain', value: 20, max: 100 });
    metersPanel.addChild(this.strainMeter);

    // --- Middle Area (Dice) ---
    this.diceArea = new Panel({ id: 'dice-area', className: 'dice-area' });
    this.diceArea.element.innerHTML = '<h4>Dice</h4><p>(Dice display goes here)</p>'; // Placeholder
    this.addChild(this.diceArea);

    // --- Bottom Area (Card Hand, Actions) ---
    const bottomPanel = new Panel({ id: 'combat-bottom-panel', className: 'bottom-panel' });
    this.addChild(bottomPanel);

    this.cardHandArea = new Panel({ id: 'card-hand', className: 'card-hand-area' });
    this.cardHandArea.element.innerHTML = '<h4>Hand</h4><p>(Cards go here)</p>'; // Placeholder
    bottomPanel.addChild(this.cardHandArea);

    this.actionPanel = new Panel({ id: 'combat-actions', className: 'action-panel' });
    bottomPanel.addChild(this.actionPanel);

    const endTurnButton = new Button({ text: 'End Turn', onClick: () => this.handleEndTurn() });
    this.actionPanel.addChild(endTurnButton);
    
    const fleeButton = new Button({ text: 'Flee', onClick: () => this.handleFlee() });
    this.actionPanel.addChild(fleeButton);
  }

  onEnter() {
    super.onEnter();
    // TODO: Subscribe to combat state updates
    // TODO: Populate UI with current combat state (enemy, hand, dice, etc.)
    console.log('CombatScreen entered. Initialize combat UI.');
    this.updateMeters({ energy: 80, strain: 20 }); // Example
    this.updateCardHand(['Card 1', 'Card 2', 'Card 3']); // Example
    this.updateDiceArea(['Dice 1: 4', 'Dice 2: 6']); // Example
  }

  onExit() {
    super.onExit();
    // TODO: Unsubscribe from combat state updates
    console.log('CombatScreen exited.');
  }

  // --- Placeholder State Update Handlers ---

  updateMeters(meters) {
    if (this.energyMeter) this.energyMeter.setValue(meters.energy);
    if (this.strainMeter) this.strainMeter.setValue(meters.strain);
  }

  updateCardHand(cards) {
     if (this.cardHandArea) {
        // Example: Replace innerHTML (improve this later with proper components)
        let handHtml = '<h4>Hand</h4>';
        if (cards.length > 0) {
          handHtml += '<div class="cards">'; // Use a container for styling
          cards.forEach(c => { handHtml += `<div class="card-placeholder">${c}</div>`; });
          handHtml += '</div>';
        } else {
          handHtml += '<p>No cards in hand.</p>';
        }
        this.cardHandArea.element.innerHTML = handHtml;
     }
  }
  
  updateDiceArea(dice) {
      if (this.diceArea) {
          let diceHtml = '<h4>Dice</h4>';
          if (dice.length > 0) {
              diceHtml += '<div class="dice">';
              dice.forEach(d => { diceHtml += `<div class="dice-placeholder">${d}</div>`; });
              diceHtml += '</div>';
          } else {
              diceHtml += '<p>No dice rolled.</p>';
          }
          this.diceArea.element.innerHTML = diceHtml;
      }
  }

  // --- Action Handlers ---

  handleEndTurn() {
    console.log('Action: End Turn');
    // TODO: Dispatch end turn action to combat system/state
  }
  
  handleFlee() {
      console.log('Action: Flee');
      // TODO: Implement flee logic - maybe pop screen or dispatch action
      // Example: this.screenManager.pop(); 
  }

  // Override render if needed
  // render() {
  //   super.render();
  // }
}
