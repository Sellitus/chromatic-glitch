import UIComponent from '../core/UIComponent.js';

/**
 * ProgressBar component for showing progress or loading states
 */
export default class ProgressBar extends UIComponent {
  constructor(options = {}) {
    super(options);
    
    // Progress configuration
    this.value = this.clampValue(options.value || 0);
    this.max = options.max || 100;
    this.showValue = options.showValue !== undefined ? options.showValue : false;
    this.variant = options.variant || 'default'; // default, primary, secondary, danger
    this.label = options.label || '';
    this.indeterminate = options.indeterminate || false;
    this.className = `ui-progress ui-progress-${this.variant} ` + 
      (options.className || '');

    // Store references
    this.barElement = null;
    this.labelElement = null;
    this.valueElement = null;
  }

  /**
   * @override
   * Creates the progress bar element
   */
  createElement() {
    super.createElement();

    // Create outer progress bar container
    const container = document.createElement('div');
    container.className = 'ui-progress-container';
    
    // Create label if specified
    if (this.label) {
      this.labelElement = document.createElement('div');
      this.labelElement.className = 'ui-progress-label';
      this.labelElement.textContent = this.label;
      container.appendChild(this.labelElement);
    }

    // Create track and bar
    const track = document.createElement('div');
    track.className = 'ui-progress-track';

    this.barElement = document.createElement('div');
    this.barElement.className = 'ui-progress-bar';
    track.appendChild(this.barElement);
    container.appendChild(track);

    // Create value display if enabled
    if (this.showValue) {
      this.valueElement = document.createElement('div');
      this.valueElement.className = 'ui-progress-value';
      container.appendChild(this.valueElement);
    }

    this.element.appendChild(container);

    // Set initial state
    if (this.indeterminate) {
      this.setIndeterminate(true);
    } else {
      this.setValue(this.value);
    }

    this.applyAccessibility();
  }

  /**
   * @override
   * Applies ARIA attributes and other accessibility features
   */
  applyAccessibility() {
    this.element.setAttribute('role', 'progressbar');
    this.element.setAttribute('aria-valuemin', '0');
    this.element.setAttribute('aria-valuemax', this.max);
    
    if (!this.indeterminate) {
      this.element.setAttribute('aria-valuenow', this.value);
      this.element.setAttribute('aria-valuetext', `${Math.round((this.value / this.max) * 100)}%`);
    }
    
    if (this.label) {
      this.element.setAttribute('aria-label', this.label);
    }
  }

  /**
   * Clamps a value to the valid range (0 to max)
   * @private
   */
  clampValue(value) {
    return Math.min(Math.max(value, 0), this.max);
  }

  /**
   * Sets the progress value
   * @param {number} value - New progress value
   */
  setValue(value) {
    if (this.indeterminate) return;

    this.value = this.clampValue(value);
    const percentage = (this.value / this.max) * 100;

    // Update progress bar width
    this.barElement.style.width = `${percentage}%`;

    // Update value display
    if (this.valueElement) {
      this.valueElement.textContent = `${Math.round(percentage)}%`;
    }

    this.applyAccessibility();
  }

  /**
   * Gets the current progress value
   * @returns {number}
   */
  getValue() {
    return this.value;
  }

  /**
   * Sets the maximum value
   * @param {number} max - New maximum value
   */
  setMax(max) {
    if (max <= 0) {
      throw new Error('Maximum value must be greater than 0');
    }
    this.max = max;
    this.setValue(this.value); // Recalculate percentage with new max
  }

  /**
   * Sets the progress bar's label
   * @param {string} label - New label text
   */
  setLabel(label) {
    this.label = label;
    if (this.labelElement) {
      this.labelElement.textContent = label;
    }
    this.applyAccessibility();
  }

  /**
   * Sets the progress bar variant
   * @param {'default'|'primary'|'secondary'|'danger'} variant
   */
  setVariant(variant) {
    const validVariants = ['default', 'primary', 'secondary', 'danger'];
    if (!validVariants.includes(variant)) {
      throw new Error(`Invalid variant: ${variant}`);
    }

    this.element.classList.remove(`ui-progress-${this.variant}`);
    this.variant = variant;
    this.element.classList.add(`ui-progress-${variant}`);
  }

  /**
   * Toggles value display
   * @param {boolean} show - Whether to show the value
   */
  setShowValue(show) {
    this.showValue = show;
    if (show && !this.valueElement) {
      this.valueElement = document.createElement('div');
      this.valueElement.className = 'ui-progress-value';
      this.element.querySelector('.ui-progress-container').appendChild(this.valueElement);
      this.setValue(this.value); // Update displayed value
    } else if (!show && this.valueElement) {
      this.valueElement.remove();
      this.valueElement = null;
    }
  }

  /**
   * Sets the indeterminate state
   * @param {boolean} indeterminate - Whether the progress is indeterminate
   */
  setIndeterminate(indeterminate) {
    this.indeterminate = indeterminate;

    if (indeterminate) {
      this.element.classList.add('indeterminate');
      this.element.removeAttribute('aria-valuenow');
      this.element.removeAttribute('aria-valuetext');
      if (this.valueElement) {
        this.valueElement.textContent = '';
      }
    } else {
      this.element.classList.remove('indeterminate');
      this.setValue(this.value);
    }
  }
}
