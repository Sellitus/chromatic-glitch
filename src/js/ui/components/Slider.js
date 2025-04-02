import UIComponent from '../core/UIComponent.js';

/**
 * Slider component for numeric input
 */
export default class Slider extends UIComponent {
  constructor(options = {}) {
    super(options);
    
    // Slider configuration
    this.min = options.min || 0;
    this.max = options.max || 100;
    this.step = options.step || 1;
    this.value = this.clampValue(options.value || this.min);
    this.label = options.label || '';
    this.showValue = options.showValue !== undefined ? options.showValue : true;
    this.className = 'ui-slider ' + (options.className || '');

    // State
    this.isDragging = false;
    this.trackElement = null;
    this.thumbElement = null;
    this.valueElement = null;

    // Bind event handlers
    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    
    // Store value change handlers
    this.changeHandlers = new Set();
  }

  /**
   * @override
   * Creates the slider element
   */
  createElement() {
    super.createElement();

    // Create label if specified
    if (this.label) {
      const labelElement = document.createElement('label');
      labelElement.className = 'ui-slider-label';
      labelElement.textContent = this.label;
      labelElement.htmlFor = this.id + '-input';
      this.element.appendChild(labelElement);
    }

    // Create slider container
    const container = document.createElement('div');
    container.className = 'ui-slider-container';
    this.element.appendChild(container);

    // Create track
    this.trackElement = document.createElement('div');
    this.trackElement.className = 'ui-slider-track';
    container.appendChild(this.trackElement);

    // Create thumb
    this.thumbElement = document.createElement('div');
    this.thumbElement.className = 'ui-slider-thumb';
    this.thumbElement.setAttribute('tabindex', '0');
    container.appendChild(this.thumbElement);

    // Create value display if enabled
    if (this.showValue) {
      this.valueElement = document.createElement('div');
      this.valueElement.className = 'ui-slider-value';
      this.element.appendChild(this.valueElement);
    }

    // Add event listeners
    this.thumbElement.addEventListener('mousedown', this._handleMouseDown);
    this.thumbElement.addEventListener('keydown', this._handleKeyDown);
    
    this.updateValue(this.value);
    this.applyAccessibility();
  }

  /**
   * @override
   * Applies ARIA attributes and other accessibility features
   */
  applyAccessibility() {
    this.thumbElement.setAttribute('role', 'slider');
    this.thumbElement.setAttribute('aria-valuemin', this.min);
    this.thumbElement.setAttribute('aria-valuemax', this.max);
    this.thumbElement.setAttribute('aria-valuenow', this.value);
    
    if (this.label) {
      this.thumbElement.setAttribute('aria-label', this.label);
    }
  }

  /**
   * Clamps a value to the slider's min/max range and step size
   * @private
   */
  clampValue(value) {
    // Clamp to min/max
    value = Math.min(Math.max(value, this.min), this.max);
    // Round to nearest step
    value = Math.round(value / this.step) * this.step;
    // Fix floating point precision issues
    return Number(value.toFixed(10));
  }

  /**
   * Converts a pixel position to a slider value
   * @private
   */
  positionToValue(position) {
    const rect = this.trackElement.getBoundingClientRect();
    const percentage = (position - rect.left) / rect.width;
    const value = this.min + (this.max - this.min) * percentage;
    return this.clampValue(value);
  }

  /**
   * Converts a slider value to a percentage for positioning
   * @private
   */
  valueToPercentage(value) {
    return ((value - this.min) / (this.max - this.min)) * 100;
  }

  /**
   * Updates the slider's value and position
   * @param {number} newValue - New slider value
   * @param {boolean} [notify=true] - Whether to notify change handlers
   */
  updateValue(newValue, notify = true) {
    const oldValue = this.value;
    this.value = this.clampValue(newValue);

    // Update thumb position
    const percentage = this.valueToPercentage(this.value);
    this.thumbElement.style.left = `${percentage}%`;

    // Update value display
    if (this.valueElement) {
      this.valueElement.textContent = this.value;
    }

    // Update ARIA attributes
    this.thumbElement.setAttribute('aria-valuenow', this.value);

    // Notify change handlers if value changed
    if (notify && oldValue !== this.value) {
      this.changeHandlers.forEach(handler => handler(this.value));
    }
  }

  /**
   * Mouse down event handler
   * @private
   */
  _handleMouseDown(event) {
    if (!this.isEnabled) return;

    this.isDragging = true;
    this.element.classList.add('dragging');
    
    // Add temporary event listeners
    document.addEventListener('mousemove', this._handleMouseMove);
    document.addEventListener('mouseup', this._handleMouseUp);
    
    // Update value based on click position
    this._handleMouseMove(event);
  }

  /**
   * Mouse move event handler
   * @private
   */
  _handleMouseMove(event) {
    if (!this.isDragging) return;
    
    event.preventDefault();
    const newValue = this.positionToValue(event.clientX);
    this.updateValue(newValue);
  }

  /**
   * Mouse up event handler
   * @private
   */
  _handleMouseUp() {
    this.isDragging = false;
    this.element.classList.remove('dragging');
    
    // Remove temporary event listeners
    document.removeEventListener('mousemove', this._handleMouseMove);
    document.removeEventListener('mouseup', this._handleMouseUp);
  }

  /**
   * Keyboard event handler
   * @private
   */
  _handleKeyDown(event) {
    if (!this.isEnabled) return;

    let newValue = this.value;
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue -= this.step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        newValue += this.step;
        break;
      case 'Home':
        newValue = this.min;
        break;
      case 'End':
        newValue = this.max;
        break;
      case 'PageDown':
        newValue -= (this.max - this.min) * 0.1;
        break;
      case 'PageUp':
        newValue += (this.max - this.min) * 0.1;
        break;
      default:
        return;
    }
    
    event.preventDefault();
    this.updateValue(newValue);
  }

  /**
   * Sets the slider's value
   * @param {number} value - New value
   */
  setValue(value) {
    this.updateValue(value);
  }

  /**
   * Sets the slider's minimum value
   * @param {number} min - New minimum value
   */
  setMin(min) {
    this.min = min;
    this.applyAccessibility();
    this.updateValue(this.value);
  }

  /**
   * Sets the slider's maximum value
   * @param {number} max - New maximum value
   */
  setMax(max) {
    this.max = max;
    this.applyAccessibility();
    this.updateValue(this.value);
  }

  /**
   * Sets the slider's step size
   * @param {number} step - New step size
   */
  setStep(step) {
    this.step = step;
    this.updateValue(this.value);
  }

  /**
   * Adds a value change handler
   * @param {Function} handler - Change event handler function
   */
  onChange(handler) {
    this.changeHandlers.add(handler);
  }

  /**
   * Removes a value change handler
   * @param {Function} handler - Change event handler function to remove
   */
  offChange(handler) {
    this.changeHandlers.delete(handler);
  }

  /**
   * @override
   * Cleanup event listeners on unmount
   */
  onUnmount() {
    this.thumbElement.removeEventListener('mousedown', this._handleMouseDown);
    this.thumbElement.removeEventListener('keydown', this._handleKeyDown);
    document.removeEventListener('mousemove', this._handleMouseMove);
    document.removeEventListener('mouseup', this._handleMouseUp);
    this.changeHandlers.clear();
  }
}
