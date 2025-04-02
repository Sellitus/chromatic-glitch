import UIComponent from '../core/UIComponent.js';

/**
 * Toggle component for boolean input
 */
export default class Toggle extends UIComponent {
  constructor(options = {}) {
    super(options);
    
    // Toggle configuration
    this.checked = options.checked || false;
    this.label = options.label || '';
    this.className = 'ui-toggle ' + (options.className || '');

    // Bind event handlers
    this._handleClick = this._handleClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    
    // Store change handlers
    this.changeHandlers = new Set();
  }

  /**
   * @override
   * Creates the toggle element
   */
  createElement() {
    super.createElement();

    // Create wrapper for toggle and label
    const wrapper = document.createElement('label');
    wrapper.className = 'ui-toggle-wrapper';
    this.element.appendChild(wrapper);

    // Create switch element
    const switchElement = document.createElement('div');
    switchElement.className = 'ui-toggle-switch';
    switchElement.setAttribute('tabindex', '0');
    switchElement.setAttribute('role', 'switch');
    
    // Create track element
    const track = document.createElement('div');
    track.className = 'ui-toggle-track';
    switchElement.appendChild(track);

    // Create thumb element
    const thumb = document.createElement('div');
    thumb.className = 'ui-toggle-thumb';
    switchElement.appendChild(thumb);

    wrapper.appendChild(switchElement);

    // Create label if specified
    if (this.label) {
      const labelElement = document.createElement('span');
      labelElement.className = 'ui-toggle-label';
      labelElement.textContent = this.label;
      wrapper.appendChild(labelElement);
    }

    // Store reference to switch element
    this.switchElement = switchElement;

    // Add event listeners
    this.switchElement.addEventListener('click', this._handleClick);
    this.switchElement.addEventListener('keydown', this._handleKeyDown);

    // Set initial state
    this.setChecked(this.checked);
    this.applyAccessibility();
  }

  /**
   * @override
   * Applies ARIA attributes and other accessibility features
   */
  applyAccessibility() {
    this.switchElement.setAttribute('aria-checked', this.checked);
    if (this.label) {
      this.switchElement.setAttribute('aria-label', this.label);
    }
  }

  /**
   * Sets the checked state
   * @param {boolean} checked - New checked state
   * @param {boolean} [notify=true] - Whether to notify change handlers
   */
  setChecked(checked, notify = true) {
    const oldValue = this.checked;
    this.checked = checked;

    // Update visual state
    if (checked) {
      this.element.classList.add('checked');
      this.switchElement.setAttribute('aria-checked', 'true');
    } else {
      this.element.classList.remove('checked');
      this.switchElement.setAttribute('aria-checked', 'false');
    }

    // Notify change handlers if value changed
    if (notify && oldValue !== checked) {
      this.changeHandlers.forEach(handler => handler(checked));
    }
  }

  /**
   * Gets the current checked state
   * @returns {boolean}
   */
  isChecked() {
    return this.checked;
  }

  /**
   * Sets the toggle's label
   * @param {string} label - New label text
   */
  setLabel(label) {
    this.label = label;
    const labelElement = this.element.querySelector('.ui-toggle-label');
    if (labelElement) {
      labelElement.textContent = label;
    }
    this.applyAccessibility();
  }

  /**
   * Toggles the checked state
   */
  toggle() {
    this.setChecked(!this.checked);
  }

  /**
   * Click event handler
   * @private
   */
  _handleClick(event) {
    if (!this.isEnabled) {
      event.preventDefault();
      return;
    }

    this.toggle();
  }

  /**
   * Keyboard event handler
   * @private
   */
  _handleKeyDown(event) {
    if (!this.isEnabled) return;

    // Toggle on Space or Enter
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggle();
    }
  }

  /**
   * Adds a change event handler
   * @param {Function} handler - Change event handler function
   */
  onChange(handler) {
    this.changeHandlers.add(handler);
  }

  /**
   * Removes a change event handler
   * @param {Function} handler - Change event handler function to remove
   */
  offChange(handler) {
    this.changeHandlers.delete(handler);
  }

  /**
   * @override
   * Enable the toggle
   */
  enable() {
    super.enable();
    this.switchElement.setAttribute('tabindex', '0');
  }

  /**
   * @override
   * Disable the toggle
   */
  disable() {
    super.disable();
    this.switchElement.setAttribute('tabindex', '-1');
  }

  /**
   * @override
   * Cleanup event listeners on unmount
   */
  onUnmount() {
    this.switchElement.removeEventListener('click', this._handleClick);
    this.switchElement.removeEventListener('keydown', this._handleKeyDown);
    this.changeHandlers.clear();
  }
}
