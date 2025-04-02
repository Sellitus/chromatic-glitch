impimport BaseScreen from './BaseScreen.js';
import Panel from '../components/Panel.js';
import Button from '../components/Button.js';
// Assuming SettingsScreen is available to be pushed
// import SettingsScreen from './SettingsScreen.js'; 

/**
 * The pause screen, typically shown as an overlay during gameplay.
 */
export default class PauseScreen extends BaseScreen {
  constructor(options = {}) {
    // Add specific class for overlay styling
    super({ ...options, className: 'pause-screen overlay-screen' }); 

    this.initializeUI();
  }

  initializeUI() {
    // --- Background Panel (often semi-transparent) ---
    const backgroundPanel = new Panel({ id: 'pause-background', className: 'pause-panel' });
    backgroundPanel.element.innerHTML = '<h2>Paused</h2>'; // Title
    this.addChild(backgroundPanel);

    // --- Action Buttons ---
    const resumeButton = new Button({ text: 'Resume', onClick: () => this.handleResume() });
    backgroundPanel.addChild(resumeButton);

    const settingsButton = new Button({ text: 'Settings', onClick: () => this.handleSettings() });
    backgroundPanel.addChild(settingsButton);

    const mainMenuButton = new Button({ text: 'Main Menu', onClick: () => this.handleMainMenu() });
    backgroundPanel.addChild(mainMenuButton);

    // Optional: Quit Game button if applicable
    // const quitButton = new Button({ text: 'Quit Game', onClick: () => this.handleQuit() });
    // backgroundPanel.addChild(quitButton);
  }

  onEnter() {
    super.onEnter();
    console.log('PauseScreen entered.');
    // Pause game logic here if not handled elsewhere
    // e.g., gameState.pause();
  }

  onExit() {
    super.onExit();
    console.log('PauseScreen exited.');
    // Resume game logic here if not handled elsewhere
    // e.g., gameState.resume();
  }

  // --- Action Handlers ---

  handleResume() {
    console.log('Action: Resume');
    // Simply pop this screen to return to the previous one
    if (this.screenManager) {
      this.screenManager.pop();
    }
  }

  handleSettings() {
    console.log('Action: Settings');
    // Push the Settings screen onto the stack
    if (this.screenManager) {
       // Need to import SettingsScreen for this to work
       // this.screenManager.push(new SettingsScreen()); 
       console.warn('SettingsScreen push is commented out. Import needed.');
    }
  }

  handleMainMenu() {
    console.log('Action: Main Menu');
    // TODO: Implement logic to return to the main menu
    // This might involve clearing the screen stack and pushing a MainMenuScreen
    // Example: 
    // if (this.screenManager) {
    //    this.screenManager.clearStack(); // Hypothetical method
    //    this.screenManager.push(new MainMenuScreen()); // Hypothetical screen
    // }
    console.warn('Main Menu transition not fully implemented.');
  }

  handleQuit() {
      console.log('Action: Quit Game');
      // TODO: Implement game quitting logic if applicable (for desktop builds)
      // window.close(); // Example for web, though often discouraged/blocked
      console.warn('Quit Game functionality not implemented.');
  }

  // Override render if needed
  // render() {
  //   super.render();
  // }
}
