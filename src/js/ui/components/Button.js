import UIComponent from '../core/UIComponent.js';

/**
 * Button component for user interaction
 */
export default class Button extends UIComponent {
  constructor(options = {}) {
    super(options);
    
    // Button configuration
    this.text = options.text || '';
    this.icon = options.icon || null;
    this.variant = options.variant || 'default'; // default, primary, secondary, danger
    this.size = options.size || 'medium'; // small, medium, large
    this.className = `ui-button ui-button-${this.variant} ui-button-${this.size} ` + 
      (options.className || '');

    // Bind event handlers
    this._handleClick = this._handleClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    
    // Store click handlers
    this.clickHandlers = new Set();
  }

  /**
   * @override
   * Creates the button element
   */
  createElement() {
    this.element = document.createElement('button');
    this.element.id = this.id;
    this.element.classList.add(...this.className.split(' ').filter(c => c));
    
    this.updateContent();
    this.applyAccessibility();
    
    // Add event listeners
    this.element.addEventListener('click', this._handleClick);
    this.element.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * @override
   * Applies ARIA attributes and other accessibility features
   */
  applyAccessibility() {
    this.element.setAttribute('role', 'button');
    this.element.setAttribute('tabindex', this.isEnabled ? '0' : '-1');
    
    if (!this.isEnabled) {
      this.element.setAttribute('aria-disabled', 'true');
    }
    
    if (this.text) {
      this.element.setAttribute('aria-label', this.text);
    }
  }

  /**
   * Updates the button's content (text and/or icon)
   */
  updateContent() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Add icon if specified
    if (this.icon) {
      const iconElement = document.createElement('span');
      iconElement.className = 'ui-button-icon';
      iconElement.innerHTML = this.icon;
      this.element.appendChild(iconElement);
    }
    
    // Add text if specified
    if (this.text) {
      const textElement = document.createElement('span');
      textElement.className = 'ui-button-text';
      textElement.textContent = this.text;
      this.element.appendChild(textElement);
    }
  }

  /**
   * Sets the button's text content
   * @param {string} text - Text to display
   */
  setText(text) {
    this.text = text;
    this.updateContent();
    this.applyAccessibility();
  }

  /**
   * Sets the button's icon content
   * @param {string} icon - HTML string for the icon
   */
  setIcon(icon) {
    this.icon = icon;
    this.updateContent();
  }

  /**
   * Sets the button's variant (style)
   * @param {'default'|'primary'|'secondary'|'danger'} variant
   */
  setVariant(variant) {
    const validVariants = ['default', 'primary', 'secondary', 'danger'];
    if (!validVariants.includes(variant)) {
      throw new Error(`Invalid variant: ${variant}`);
    }

    // Remove existing variant class
    this.element.classList.remove(`ui-button-${this.variant}`);
    
    // Add new variant class
    this.variant = variant;
    this.element.classList.add(`ui-button-${variant}`);
  }

  /**
   * Sets the button's size
   * @param {'small'|'medium'|'large'} size
   */
  setSize(size) {
    const validSizes = ['small', 'medium', 'large'];
    if (!validSizes.includes(size)) {
      throw new Error(`Invalid size: ${size}`);
    }

    // Remove existing size class
    this.element.classList.remove(`ui-button-${this.size}`);
    
    // Add new size class
    this.size = size;
    this.element.classList.add(`ui-button-${size}`);
  }

  /**
   * @override
   * Enables the button
   */
  enable() {
    super.enable();
    this.element.removeAttribute('aria-disabled');
    this.element.setAttribute('tabindex', '0');
  }

  /**
   * @override
   * Disables the button
   */
  disable() {
    super.disable();
    this.element.setAttribute('aria-disabled', 'true');
    this.element.setAttribute('tabindex', '-1');
  }

  /**
   * Adds a click event handler
   * @param {Function} handler - Click event handler function
   */
  onClick(handler) {
    this.clickHandlers.add(handler);
  }

  /**
   * Removes a click event handler
   * @param {Function} handler - Click event handler function to remove
   */
  offClick(handler) {
    this.clickHandlers.delete(handler);
  }

  /**
   * Internal click event handler
   * @private
   */
  _handleClick(event) {
    if (!this.isEnabled) {
      event.preventDefault();
      return;
    }

    // Execute all registered click handlers
    this.clickHandlers.forEach(handler => handler(event));
  }

  /**
   * Internal keydown event handler for accessibility
   * @private
   */
  _handleKeyDown(event) {
    if (!this.isEnabled) return;

    // Trigger click on Enter or Space
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this._handleClick(event);
    }
  }

  /**
   * @override
   * Cleanup event listeners on unmount
   */
  onUnmount() {
    this.element.removeEventListener('click', this._handleClick);
    this.element.removeEventListener('keydown', this._handleKeyDown);
    this.clickHandlers.clear();
  }
}
