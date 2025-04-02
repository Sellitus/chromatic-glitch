import BaseScreen from './BaseScreen.js';
import Panel from '../components/Panel.js';
import Button from '../components/Button.js';
import GridLayout from '../layout/GridLayout.js'; // Likely useful for inventory items

/**
 * The inventory screen, displaying player items and allowing interaction.
 */
export default class InventoryScreen extends BaseScreen {
  constructor(options = {}) {
    super({ ...options, className: 'inventory-screen' });

    // Placeholder components
    this.itemGrid = null;
    this.itemDetailsPanel = null;
    this.actionPanel = null;
    this.selectedItem = null;

    this.initializeUI();
  }

  initializeUI() {
    // --- Main Layout (e.g., Grid for items, Panel for details) ---
    // Could use CSS Grid/Flex directly on the screen element, or a layout component

    // --- Item Grid Area ---
    // Using GridLayout might be suitable here
    this.itemGridPanel = new Panel({ id: 'item-grid-panel', className: 'item-grid-area' });
    this.itemGridPanel.element.innerHTML = '<h4>Inventory</h4><p>(Item grid goes here)</p>'; // Placeholder
    // TODO: Instantiate GridLayout and add item components to it
    // this.itemGrid = new GridLayout({ columns: 5, rows: 4 }); // Example
    // this.itemGridPanel.addChild(this.itemGrid);
    this.itemGridPanel.addEventListener('click', (event) => this.handleItemClick(event)); // Delegate clicks
    this.addChild(this.itemGridPanel);


    // --- Item Details Panel ---
    this.itemDetailsPanel = new Panel({ id: 'item-details', className: 'item-details-panel' });
    this.itemDetailsPanel.element.innerHTML = '<h4>Details</h4><p>Select an item...</p>';
    this.addChild(this.itemDetailsPanel);

    // --- Action Panel ---
    this.actionPanel = new Panel({ id: 'inventory-actions', className: 'action-panel' });
    this.addChild(this.actionPanel);

    const useButton = new Button({ text: 'Use', onClick: () => this.handleUse(), disabled: true });
    this.actionPanel.addChild(useButton);
    this.useButton = useButton; // Keep reference

    const dropButton = new Button({ text: 'Drop', onClick: () => this.handleDrop(), disabled: true });
    this.actionPanel.addChild(dropButton);
    this.dropButton = dropButton; // Keep reference

    const backButton = new Button({ text: 'Back', onClick: () => this.handleBack() });
    this.actionPanel.addChild(backButton);
  }

  onEnter() {
    super.onEnter();
    // TODO: Subscribe to inventory state updates
    // TODO: Populate item grid with current inventory
    console.log('InventoryScreen entered.');
    this.updateInventoryGrid([{ id: 'med_basic', name: 'Bandage' }, { id: 'food_canned', name: 'Canned Food' }]); // Example
    this.updateItemDetails(null); // Clear details initially
  }

  onExit() {
    super.onExit();
    // TODO: Unsubscribe from state updates
    console.log('InventoryScreen exited.');
  }

  // --- Placeholder State Update Handlers ---

  updateInventoryGrid(items) {
    if (this.itemGridPanel) { // Later, interact with this.itemGrid directly
      // Example: Replace innerHTML (improve this later with proper components/layout)
      let gridHtml = '<h4>Inventory</h4>';
      if (items.length > 0) {
        gridHtml += '<div class="item-grid-container">'; // Use a container for styling
        items.forEach(item => {
          // Add data attributes to identify items on click
          gridHtml += `<div class="item-placeholder" data-item-id="${item.id}">${item.name}</div>`;
        });
        gridHtml += '</div>';
      } else {
        gridHtml += '<p>Inventory is empty.</p>';
      }
      this.itemGridPanel.element.innerHTML = gridHtml;
    }
  }

  updateItemDetails(itemData) {
     this.selectedItem = itemData; // Store selected item
     if (this.itemDetailsPanel) {
        let detailsHtml = '<h4>Details</h4>';
        if (itemData) {
            detailsHtml += `<p>Name: ${itemData.name}</p>`;
            detailsHtml += `<p>Description: ${itemData.description || 'No description.'}</p>`;
            // Enable buttons
            this.useButton.enable();
            this.dropButton.enable();
        } else {
            detailsHtml += '<p>Select an item...</p>';
             // Disable buttons
            this.useButton.disable();
            this.dropButton.disable();
        }
        this.itemDetailsPanel.element.innerHTML = detailsHtml;
     }
  }

  // --- Event Handlers ---

  handleItemClick(event) {
      // Use event delegation - check if the clicked element is an item placeholder
      const itemElement = event.target.closest('.item-placeholder');
      if (itemElement && itemElement.dataset.itemId) {
          const itemId = itemElement.dataset.itemId;
          console.log('Item clicked:', itemId);
          // TODO: Fetch full item details based on itemId from game data/state
          const mockItemData = {
              id: itemId,
              name: itemElement.textContent, // Get name from placeholder for now
              description: `Details about ${itemElement.textContent}.`
          };
          this.updateItemDetails(mockItemData);
      }
  }

  // --- Action Handlers ---

  handleUse() {
    if (this.selectedItem) {
      console.log(`Action: Use ${this.selectedItem.name}`);
      // TODO: Dispatch use item action with this.selectedItem.id
      // TODO: Update UI (remove item, show effect, etc.)
      this.updateItemDetails(null); // Clear details after use
    }
  }

  handleDrop() {
     if (this.selectedItem) {
        console.log(`Action: Drop ${this.selectedItem.name}`);
        // TODO: Dispatch drop item action with this.selectedItem.id
        // TODO: Update UI (remove item from grid)
        this.updateItemDetails(null); // Clear details after drop
     }
  }

  handleBack() {
    console.log('Action: Back');
    if (this.screenManager) {
      this.screenManager.pop();
    }
  }

  // Override render if needed
  // render() {
  //   super.render();
  // }
}
