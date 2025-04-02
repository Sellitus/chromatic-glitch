import BaseScreen from './BaseScreen.js';
import Panel from '../components/Panel.js';
import Button from '../components/Button.js';
// import GridLayout from '../layout/GridLayout.js'; // Potentially useful

/**
 * The crafting screen where players combine items to create new ones.
 */
export default class CraftingScreen extends BaseScreen {
  constructor(options = {}) {
    super({ ...options, className: 'crafting-screen' });

    // Placeholder components
    this.recipeListPanel = null;
    this.ingredientSlotsPanel = null;
    this.resultSlotPanel = null;
    this.actionPanel = null;
    this.selectedRecipe = null;

    this.initializeUI();
  }

  initializeUI() {
    // --- Main Layout (e.g., Columns for Recipes, Crafting Area, Actions) ---

    // --- Recipe List Panel ---
    this.recipeListPanel = new Panel({ id: 'recipe-list', className: 'recipe-list-panel' });
    this.recipeListPanel.element.innerHTML = '<h4>Recipes</h4><p>(List of known recipes)</p>'; // Placeholder
    this.recipeListPanel.addEventListener('click', (event) => this.handleRecipeSelect(event));
    this.addChild(this.recipeListPanel);

    // --- Crafting Area (Ingredients + Result) ---
    const craftingArea = new Panel({ id: 'crafting-area', className: 'crafting-area-panel' });
    this.addChild(craftingArea);

    this.ingredientSlotsPanel = new Panel({ id: 'ingredient-slots', className: 'ingredient-slots' });
    this.ingredientSlotsPanel.element.innerHTML = '<h5>Ingredients</h5><p>(Slots for ingredients)</p>'; // Placeholder
    // TODO: Add logic to drag/drop or select items from inventory into slots
    craftingArea.addChild(this.ingredientSlotsPanel);

    this.resultSlotPanel = new Panel({ id: 'result-slot', className: 'result-slot' });
    this.resultSlotPanel.element.innerHTML = '<h5>Result</h5><p>(Crafted item appears here)</p>'; // Placeholder
    craftingArea.addChild(this.resultSlotPanel);

    // --- Action Panel ---
    this.actionPanel = new Panel({ id: 'crafting-actions', className: 'action-panel' });
    this.addChild(this.actionPanel);

    const craftButton = new Button({ text: 'Craft', onClick: () => this.handleCraft(), disabled: true });
    this.actionPanel.addChild(craftButton);
    this.craftButton = craftButton; // Keep reference

    const backButton = new Button({ text: 'Back', onClick: () => this.handleBack() });
    this.actionPanel.addChild(backButton);
  }

  onEnter() {
    super.onEnter();
    // TODO: Subscribe to inventory and recipe state updates
    // TODO: Populate recipe list based on known recipes
    console.log('CraftingScreen entered.');
    this.updateRecipeList([{ id: 'recipe_med_adv', name: 'Advanced Medkit' }, { id: 'recipe_food_hearty', name: 'Hearty Meal' }]); // Example
    this.updateCraftingArea(null); // Clear area initially
  }

  onExit() {
    super.onExit();
    // TODO: Unsubscribe from state updates
    console.log('CraftingScreen exited.');
  }

  // --- Placeholder State Update Handlers ---

  updateRecipeList(recipes) {
    if (this.recipeListPanel) {
      let listHtml = '<h4>Recipes</h4>';
      if (recipes.length > 0) {
        listHtml += '<ul>';
        recipes.forEach(recipe => {
          // Add data attributes to identify recipes on click
          listHtml += `<li class="recipe-item" data-recipe-id="${recipe.id}">${recipe.name}</li>`;
        });
        listHtml += '</ul>';
      } else {
        listHtml += '<p>No recipes known.</p>';
      }
      this.recipeListPanel.element.innerHTML = listHtml;
    }
  }

  updateCraftingArea(recipeData) {
    this.selectedRecipe = recipeData;
    if (this.ingredientSlotsPanel && this.resultSlotPanel) {
      let ingredientsHtml = '<h5>Ingredients</h5>';
      let resultHtml = '<h5>Result</h5>';

      if (recipeData) {
        // TODO: Display required ingredients based on recipeData
        ingredientsHtml += '<p>Required: (List ingredients)</p>';
        // TODO: Display potential result based on recipeData
        resultHtml += `<p>Output: ${recipeData.outputName || 'Unknown'}</p>`;
        // Enable craft button if recipe is selected (and maybe if ingredients are present)
        this.craftButton.enable(); // Add logic for ingredient check later
      } else {
        ingredientsHtml += '<p>(Select a recipe)</p>';
        resultHtml += '<p>(Select a recipe)</p>';
        // Disable craft button
        this.craftButton.disable();
      }
      this.ingredientSlotsPanel.element.innerHTML = ingredientsHtml;
      this.resultSlotPanel.element.innerHTML = resultHtml;
    }
  }

  // --- Event Handlers ---

  handleRecipeSelect(event) {
    const recipeElement = event.target.closest('.recipe-item');
    if (recipeElement && recipeElement.dataset.recipeId) {
      const recipeId = recipeElement.dataset.recipeId;
      console.log('Recipe selected:', recipeId);
      // TODO: Fetch full recipe details based on recipeId
      const mockRecipeData = {
        id: recipeId,
        name: recipeElement.textContent,
        ingredients: [{ item: 'med_basic', qty: 2 }, { item: 'scrap_metal', qty: 1 }],
        outputName: 'Advanced Medkit' // Example output
      };
      this.updateCraftingArea(mockRecipeData);
    }
  }

  // --- Action Handlers ---

  handleCraft() {
    if (this.selectedRecipe) {
      console.log(`Action: Craft ${this.selectedRecipe.name}`);
      // TODO: Check if player has required ingredients in inventory
      // TODO: Dispatch craft action (consume ingredients, add result item)
      // TODO: Update UI (inventory, potentially clear crafting area)
      this.updateCraftingArea(null); // Clear selection after crafting attempt
    } else {
      console.warn('Craft clicked but no recipe selected.');
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
