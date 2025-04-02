import BaseScreen from './BaseScreen.js';
import Panel from '../components/Panel.js';
import Button from '../components/Button.js';
// import StackLayout from '../layout/StackLayout.js'; // Example layout
// import GridLayout from '../layout/GridLayout.js'; // Example layout

/**
 * The main management screen where the player oversees operations.
 * Displays patient queue, resources, time, and action buttons.
 */
export default class ManagementScreen extends BaseScreen {
  constructor(options = {}) {
    super({ ...options, className: 'management-screen' });

    // Placeholder components - these will be fleshed out
    this.patientQueuePanel = null;
    this.resourcePanel = null;
    this.timeIndicator = null;
    this.actionPanel = null;

    this.initializeUI();
  }

  initializeUI() {
    // Main layout container (optional, could use CSS grid/flex on the screen element itself)
    // const mainLayout = new StackLayout({ direction: 'vertical', spacing: '10px' });
    // this.addChild(mainLayout); // Add layout to the screen

    // --- Top Row (Time/Resources) ---
    const topPanel = new Panel({ id: 'management-top-panel', className: 'top-panel' });
    this.addChild(topPanel); // Add directly to screen or to mainLayout

    this.timeIndicator = new Panel({ id: 'time-indicator', content: 'Day: 1 Time: 08:00' });
    topPanel.addChild(this.timeIndicator);

    this.resourcePanel = new Panel({ id: 'resource-display', content: 'Resources: Food: 10, Meds: 5' });
    topPanel.addChild(this.resourcePanel);

    // --- Middle Area (Patient Queue) ---
    this.patientQueuePanel = new Panel({ id: 'patient-queue', className: 'patient-queue-panel' });
    this.patientQueuePanel.element.innerHTML = '<h3>Patient Queue</h3><p>(Patient list goes here)</p>'; // Placeholder content
    this.addChild(this.patientQueuePanel); // Add directly to screen or to mainLayout

    // --- Bottom Area (Actions) ---
    this.actionPanel = new Panel({ id: 'action-panel', className: 'action-panel' });
    this.addChild(this.actionPanel); // Add directly to screen or to mainLayout

    const treatButton = new Button({ text: 'Treat Patient', onClick: () => this.handleTreat() });
    this.actionPanel.addChild(treatButton);

    const craftButton = new Button({ text: 'Crafting', onClick: () => this.handleCraft() });
    this.actionPanel.addChild(craftButton);

    const mapButton = new Button({ text: 'Map', onClick: () => this.handleMap() });
    this.actionPanel.addChild(mapButton);

    const journalButton = new Button({ text: 'Journal', onClick: () => this.handleJournal() });
    this.actionPanel.addChild(journalButton);
  }

  onEnter() {
    super.onEnter();
    // TODO: Subscribe to relevant state updates (patients, resources, time)
    // TODO: Populate UI with current game state
    console.log('ManagementScreen entered. Update UI from state.');
    this.updateResourceDisplay({ food: 10, meds: 5 }); // Example initial update
    this.updateTimeDisplay({ day: 1, hour: 8, minute: 0 }); // Example
    this.updatePatientQueue(['Patient A', 'Patient B']); // Example
  }

  onExit() {
    super.onExit();
    // TODO: Unsubscribe from state updates
    console.log('ManagementScreen exited.');
  }

  // --- Placeholder State Update Handlers ---

  updateResourceDisplay(resources) {
    if (this.resourcePanel) {
      // Basic example, refine formatting later
      this.resourcePanel.setState({ content: `Resources: Food: ${resources.food}, Meds: ${resources.meds}` });
      // Or directly manipulate element if Panel doesn't have content state:
      // this.resourcePanel.element.textContent = `Resources: Food: ${resources.food}, Meds: ${resources.meds}`;
    }
  }

  updateTimeDisplay(time) {
     if (this.timeIndicator) {
       const timeString = `Day: ${time.day} Time: ${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
       this.timeIndicator.setState({ content: timeString });
       // Or directly manipulate element:
       // this.timeIndicator.element.textContent = timeString;
     }
  }

  updatePatientQueue(patients) {
    if (this.patientQueuePanel) {
      // Example: Replace innerHTML (improve this later with proper components)
      let queueHtml = '<h3>Patient Queue</h3>';
      if (patients.length > 0) {
        queueHtml += '<ul>';
        patients.forEach(p => { queueHtml += `<li>${p}</li>`; });
        queueHtml += '</ul>';
      } else {
        queueHtml += '<p>No patients waiting.</p>';
      }
      this.patientQueuePanel.element.innerHTML = queueHtml;
    }
  }


  // --- Action Handlers ---

  handleTreat() {
    console.log('Action: Treat Patient');
    // TODO: Transition to Combat Screen or trigger treatment logic
    // Example: this.screenManager.push(new CombatScreen());
  }

  handleCraft() {
    console.log('Action: Crafting');
    // TODO: Transition to Crafting Screen
    // Example: this.screenManager.push(new CraftingScreen());
  }

  handleMap() {
    console.log('Action: Map');
     // TODO: Transition to Map Screen
     // Example: this.screenManager.push(new MapScreen());
  }

  handleJournal() {
    console.log('Action: Journal');
     // TODO: Transition to Journal Screen
     // Example: this.screenManager.push(new JournalScreen());
  }

  // Override render if needed, but base class + components might suffice
  // render() {
  //   super.render(); // Let components render themselves
  // }
}
