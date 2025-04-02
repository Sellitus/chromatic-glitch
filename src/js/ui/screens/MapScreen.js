import BaseScreen from './BaseScreen.js';
import Panel from '../components/Panel.js';
import Button from '../components/Button.js';

/**
 * The map screen for selecting locations to visit or interact with.
 */
export default class MapScreen extends BaseScreen {
  constructor(options = {}) {
    super({ ...options, className: 'map-screen' });

    // Placeholder components
    this.mapDisplay = null;
    this.locationInfoPanel = null;
    this.actionPanel = null;

    this.initializeUI();
  }

  initializeUI() {
    // --- Map Display Area ---
    this.mapDisplay = new Panel({ id: 'map-display', className: 'map-area' });
    // TODO: Load map image or render map dynamically
    this.mapDisplay.element.innerHTML = '<p>(Map visualization goes here - e.g., an image or canvas)</p>';
    this.mapDisplay.addEventListener('click', (event) => this.handleMapClick(event));
    this.addChild(this.mapDisplay);

    // --- Location Info Panel ---
    this.locationInfoPanel = new Panel({ id: 'location-info', className: 'location-info-panel' });
    this.locationInfoPanel.element.innerHTML = '<h4>Location Info</h4><p>Click on the map...</p>';
    this.addChild(this.locationInfoPanel);

    // --- Action Panel ---
    this.actionPanel = new Panel({ id: 'map-actions', className: 'action-panel' });
    this.addChild(this.actionPanel);

    const travelButton = new Button({ text: 'Travel', onClick: () => this.handleTravel(), disabled: true });
    this.actionPanel.addChild(travelButton);
    this.travelButton = travelButton; // Keep reference to enable/disable

    const backButton = new Button({ text: 'Back', onClick: () => this.handleBack() });
    this.actionPanel.addChild(backButton);
  }

  onEnter() {
    super.onEnter();
    // TODO: Subscribe to map/location state if needed
    // TODO: Load map data, mark current location, available locations etc.
    console.log('MapScreen entered.');
    this.updateLocationInfo(null); // Clear info initially
  }

  onExit() {
    super.onExit();
    // TODO: Unsubscribe from state updates
    console.log('MapScreen exited.');
  }

  // --- Placeholder State Update Handlers ---

  updateLocationInfo(locationData) {
    if (this.locationInfoPanel) {
      let infoHtml = '<h4>Location Info</h4>';
      if (locationData) {
        infoHtml += `<p>Name: ${locationData.name}</p>`;
        infoHtml += `<p>Description: ${locationData.description || 'No details available.'}</p>`;
        // Enable travel button if location is valid
        this.travelButton.enable();
      } else {
        infoHtml += '<p>Click on the map...</p>';
        // Disable travel button if no location selected
        this.travelButton.disable();
      }
      this.locationInfoPanel.element.innerHTML = infoHtml;
    }
     // Store selected location data if needed
     this.selectedLocation = locationData;
  }

  // --- Event Handlers ---

  handleMapClick(event) {
    // Placeholder: Simulate selecting a location based on click coordinates
    // In a real implementation, this would involve hit detection on map elements/regions
    console.log('Map clicked at:', event.offsetX, event.offsetY);
    // Simulate finding a location
    const mockLocation = {
        id: 'loc_hospital',
        name: 'Old Hospital',
        description: 'Rumors of supplies, but likely dangerous.'
    };
    this.updateLocationInfo(mockLocation);
  }

  // --- Action Handlers ---

  handleTravel() {
    if (this.selectedLocation) {
        console.log(`Action: Travel to ${this.selectedLocation.name}`);
        // TODO: Dispatch travel action, potentially update game state, time passes etc.
        // TODO: Maybe transition back to ManagementScreen or a travel event screen
        // Example: this.screenManager.replace(new ManagementScreen()); 
    } else {
        console.warn('Travel clicked but no location selected.');
    }
  }

  handleBack() {
    console.log('Action: Back');
    // Typically pop back to the previous screen (e.g., ManagementScreen)
    if (this.screenManager) {
      this.screenManager.pop();
    }
  }

  // Override render if needed
  // render() {
  //   super.render();
  // }
}
