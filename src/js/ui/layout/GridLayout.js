import UIComponent from '../core/UIComponent.js';

/**
 * GridLayout component for arranging child elements in a grid pattern
 */
export default class GridLayout extends UIComponent {
  constructor(options = {}) {
    super(options);
    
    // Grid configuration
    this.columns = options.columns || 'auto';
    this.rows = options.rows || 'auto';
    this.gap = options.gap || '0';
    this.className = 'ui-grid-layout ' + (options.className || '');
    
    // Track grid items and their positions
    this.gridItems = new Map(); // Maps child components to their grid positions
  }

  /**
   * @override
   * Creates the grid container element
   */
  createElement() {
    super.createElement();
    this.element.style.display = 'grid';
    this.updateGridTemplate();
  }

  /**
   * Updates the grid's template columns and rows
   */
  updateGridTemplate() {
    if (Array.isArray(this.columns)) {
      this.element.style.gridTemplateColumns = this.columns.join(' ');
    } else {
      this.element.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
    }

    if (Array.isArray(this.rows)) {
      this.element.style.gridTemplateRows = this.rows.join(' ');
    } else if (this.rows !== 'auto') {
      this.element.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
    }

    this.element.style.gap = this.gap;
  }

  /**
   * Sets the number or configuration of columns
   * @param {number|string|Array<string>} columns - Number of columns or template definition
   */
  setColumns(columns) {
    this.columns = columns;
    this.updateGridTemplate();
  }

  /**
   * Sets the number or configuration of rows
   * @param {number|string|Array<string>} rows - Number of rows or template definition
   */
  setRows(rows) {
    this.rows = rows;
    this.updateGridTemplate();
  }

  /**
   * Sets the gap between grid items
   * @param {string} gap - CSS gap value (e.g., '10px' or '1rem')
   */
  setGap(gap) {
    this.gap = gap;
    this.element.style.gap = gap;
  }

  /**
   * Places a child component at a specific grid position
   * @param {UIComponent} child - Child component to position
   * @param {Object} position - Grid position configuration
   * @param {number|string} [position.column] - Grid column start
   * @param {number|string} [position.row] - Grid row start
   * @param {number} [position.columnSpan] - Number of columns to span
   * @param {number} [position.rowSpan] - Number of rows to span
   */
  placeItem(child, position) {
    if (!(child instanceof UIComponent)) {
      throw new Error('Child must be a UIComponent');
    }

    // Add child if not already added
    if (!this.children.has(child)) {
      this.addChild(child);
    }

    // Apply grid position
    if (position.column !== undefined) {
      child.element.style.gridColumn = position.columnSpan ? 
        `${position.column} / span ${position.columnSpan}` : 
        position.column.toString();
    }

    if (position.row !== undefined) {
      child.element.style.gridRow = position.rowSpan ? 
        `${position.row} / span ${position.rowSpan}` : 
        position.row.toString();
    }

    this.gridItems.set(child, position);
  }

  /**
   * Clears all grid positioning for a child component
   * @param {UIComponent} child - Child component to clear positioning for
   */
  clearItemPosition(child) {
    if (this.gridItems.has(child)) {
      child.element.style.gridColumn = '';
      child.element.style.gridRow = '';
      this.gridItems.delete(child);
    }
  }

  /**
   * @override
   * Adds a child component at the next available grid position
   */
  addChild(child) {
    super.addChild(child);
    
    // If no explicit position set, will flow naturally in grid
    if (!this.gridItems.has(child)) {
      this.gridItems.set(child, {});
    }
  }

  /**
   * @override
   * Removes a child component and its grid positioning
   */
  removeChild(child) {
    this.clearItemPosition(child);
    super.removeChild(child);
  }
}
