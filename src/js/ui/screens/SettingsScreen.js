import BaseScreen from './BaseScreen.js';
import Panel from '../components/Panel.js';
import Button from '../components/Button.js';
import Slider from '../components/Slider.js';
import Toggle from '../components/Toggle.js';

/**
 * The settings screen for adjusting game options like volume, graphics, etc.
 */
export default class SettingsScreen extends BaseScreen {
  constructor(options = {}) {
    super({ ...options, className: 'settings-screen' });

    // Placeholder components
    this.settingsPanel = null;
    this.actionPanel = null;

    this.initializeUI();
  }

  initializeUI() {
    // --- Settings Panel ---
    this.settingsPanel = new Panel({ id: 'settings-options', className: 'settings-panel' });
    this.settingsPanel.element.innerHTML = '<h3>Settings</h3>'; // Title
    this.addChild(this.settingsPanel);

    // Example Settings (using existing components)
    const masterVolumeSlider = new Slider({
      id: 'master-volume',
      label: 'Master Volume',
      min: 0,
      max: 100,
      value: 80, // TODO: Get initial value from config/state
      onChange: (value) => this.handleSettingChange('masterVolume', value)
    });
    this.settingsPanel.addChild(masterVolumeSlider);

    const musicVolumeSlider = new Slider({
      id: 'music-volume',
      label: 'Music Volume',
      min: 0,
      max: 100,
      value: 60, // TODO: Get initial value from config/state
      onChange: (value) => this.handleSettingChange('musicVolume', value)
    });
    this.settingsPanel.addChild(musicVolumeSlider);
    
    const sfxVolumeSlider = new Slider({
        id: 'sfx-volume',
        label: 'SFX Volume',
        min: 0,
        max: 100,
        value: 75, // TODO: Get initial value from config/state
        onChange: (value) => this.handleSettingChange('sfxVolume', value)
      });
      this.settingsPanel.addChild(sfxVolumeSlider);

    const subtitlesToggle = new Toggle({
      id: 'subtitles-toggle',
      label: 'Enable Subtitles',
      checked: true, // TODO: Get initial value from config/state
      onChange: (checked) => this.handleSettingChange('subtitlesEnabled', checked)
    });
    this.settingsPanel.addChild(subtitlesToggle);

    // --- Action Panel ---
    this.actionPanel = new Panel({ id: 'settings-actions', className: 'action-panel' });
    this.addChild(this.actionPanel);

    const applyButton = new Button({ text: 'Apply', onClick: () => this.handleApply() });
    this.actionPanel.addChild(applyButton); // Apply might not be needed if changes are instant

    const backButton = new Button({ text: 'Back', onClick: () => this.handleBack() });
    this.actionPanel.addChild(backButton);
  }

  onEnter() {
    super.onEnter();
    // TODO: Load current settings from game state/config and update UI elements
    console.log('SettingsScreen entered. Load current settings.');
    // Example: this.masterVolumeSlider.setValue(gameState.settings.masterVolume);
  }

  onExit() {
    super.onExit();
    // Optional: Save settings if not saved on change
    console.log('SettingsScreen exited.');
  }

  // --- Event Handlers ---

  handleSettingChange(settingKey, value) {
    console.log(`Setting changed: ${settingKey} = ${value}`);
    // TODO: Update game state/config immediately or store temporarily until 'Apply'
    // Example: dispatch(updateSettingAction(settingKey, value));
  }

  // --- Action Handlers ---

  handleApply() {
    console.log('Action: Apply Settings');
    // TODO: If changes aren't applied instantly, save them now.
    // Often, changes are applied immediately via handleSettingChange, making Apply redundant.
    // Potentially pop the screen after applying.
    if (this.screenManager) {
        this.screenManager.pop();
    }
  }

  handleBack() {
    console.log('Action: Back');
    // TODO: Potentially discard unsaved changes if not applying instantly.
    if (this.screenManager) {
      this.screenManager.pop();
    }
  }

  // Override render if needed
  // render() {
  //   super.render();
  // }
}
