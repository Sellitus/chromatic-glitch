import BaseScreen from './BaseScreen.js';
import Panel from '../components/Panel.js';
import Button from '../components/Button.js';

/**
 * The journal/codex screen, displaying discovered lore, characters, items, etc.
 */
export default class JournalScreen extends BaseScreen {
  constructor(options = {}) {
    super({ ...options, className: 'journal-screen' });

    // Placeholder components
    this.categoryListPanel = null;
    this.entryListPanel = null;
    this.entryContentPanel = null;
    this.actionPanel = null;
    this.selectedEntry = null;

    this.initializeUI();
  }

  initializeUI() {
    // --- Main Layout (e.g., Columns for Categories, Entries, Content) ---

    // --- Category List Panel ---
    this.categoryListPanel = new Panel({ id: 'journal-categories', className: 'category-list-panel' });
    this.categoryListPanel.element.innerHTML = '<h4>Categories</h4><p>(e.g., Lore, People, Items)</p>'; // Placeholder
    this.categoryListPanel.addEventListener('click', (event) => this.handleCategorySelect(event));
    this.addChild(this.categoryListPanel);

    // --- Entry List Panel (for selected category) ---
    this.entryListPanel = new Panel({ id: 'journal-entries', className: 'entry-list-panel' });
    this.entryListPanel.element.innerHTML = '<h5>Entries</h5><p>(Select a category)</p>'; // Placeholder
    this.entryListPanel.addEventListener('click', (event) => this.handleEntrySelect(event));
    this.addChild(this.entryListPanel);

    // --- Entry Content Panel ---
    this.entryContentPanel = new Panel({ id: 'journal-content', className: 'entry-content-panel' });
    this.entryContentPanel.element.innerHTML = '<h4>Entry Details</h4><p>Select an entry...</p>'; // Placeholder
    this.addChild(this.entryContentPanel);

    // --- Action Panel ---
    this.actionPanel = new Panel({ id: 'journal-actions', className: 'action-panel' });
    this.addChild(this.actionPanel);

    const backButton = new Button({ text: 'Back', onClick: () => this.handleBack() });
    this.actionPanel.addChild(backButton);
  }

  onEnter() {
    super.onEnter();
    // TODO: Subscribe to journal/codex state updates
    // TODO: Populate categories based on discovered entries
    console.log('JournalScreen entered.');
    this.updateCategories(['Lore', 'Characters', 'Items']); // Example
    this.updateEntryList(null); // Clear entries initially
    this.updateEntryContent(null); // Clear content initially
  }

  onExit() {
    super.onExit();
    // TODO: Unsubscribe from state updates
    console.log('JournalScreen exited.');
  }

  // --- Placeholder State Update Handlers ---

  updateCategories(categories) {
    if (this.categoryListPanel) {
      let listHtml = '<h4>Categories</h4>';
      if (categories.length > 0) {
        listHtml += '<ul>';
        categories.forEach(category => {
          // Add data attributes
          listHtml += `<li class="category-item" data-category-id="${category.toLowerCase()}">${category}</li>`;
        });
        listHtml += '</ul>';
      } else {
        listHtml += '<p>No categories available.</p>';
      }
      this.categoryListPanel.element.innerHTML = listHtml;
    }
  }

  updateEntryList(category) {
     if (this.entryListPanel) {
        let listHtml = `<h5>Entries${category ? ` (${category})` : ''}</h5>`;
        if (category) {
            // TODO: Fetch entries for the selected category from state/data
            const mockEntries = [
                { id: `${category}_entry1`, title: `${category} Entry 1` },
                { id: `${category}_entry2`, title: `${category} Entry 2` },
            ];
            if (mockEntries.length > 0) {
                listHtml += '<ul>';
                mockEntries.forEach(entry => {
                    listHtml += `<li class="entry-item" data-entry-id="${entry.id}">${entry.title}</li>`;
                });
                listHtml += '</ul>';
            } else {
                listHtml += '<p>No entries in this category.</p>';
            }
        } else {
            listHtml += '<p>(Select a category)</p>';
        }
        this.entryListPanel.element.innerHTML = listHtml;
        this.updateEntryContent(null); // Clear content when category changes
     }
  }

  updateEntryContent(entryData) {
    this.selectedEntry = entryData;
    if (this.entryContentPanel) {
      let contentHtml = '<h4>Entry Details</h4>';
      if (entryData) {
        contentHtml += `<h5>${entryData.title}</h5>`;
        contentHtml += `<p>${entryData.content || 'No content available.'}</p>`;
      } else {
        contentHtml += '<p>Select an entry...</p>';
      }
      this.entryContentPanel.element.innerHTML = contentHtml;
    }
  }

  // --- Event Handlers ---

  handleCategorySelect(event) {
      const categoryElement = event.target.closest('.category-item');
      if (categoryElement && categoryElement.dataset.categoryId) {
          const categoryId = categoryElement.dataset.categoryId;
          console.log('Category selected:', categoryId);
          this.updateEntryList(categoryElement.textContent); // Pass category name for display/fetching
      }
  }

  handleEntrySelect(event) {
      const entryElement = event.target.closest('.entry-item');
      if (entryElement && entryElement.dataset.entryId) {
          const entryId = entryElement.dataset.entryId;
          console.log('Entry selected:', entryId);
          // TODO: Fetch full entry details based on entryId
          const mockEntryData = {
              id: entryId,
              title: entryElement.textContent,
              content: `This is the detailed content for ${entryElement.textContent}. Lorem ipsum dolor sit amet...`
          };
          this.updateEntryContent(mockEntryData);
      }
  }

  // --- Action Handlers ---

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
