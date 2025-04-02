import UIComponent from '../core/UIComponent.js';

/**
 * TextField component for text input
 */
export default class TextField extends UIComponent {
  constructor(options = {}) {
    super(options);
    
    // Input configuration
    this.type = options.type || 'text';
    this.value = options.value || '';
    this.label = options.label || '';
    this.placeholder = options.placeholder || '';
    this.errorText = options.errorText || '';
    this.maxLength = options.maxLength || null;
    this.pattern = options.pattern || null;
    this.required = options.required || false;
    this.className = 'ui-textfield ' + (options.className || '');

    // Store references
    this.inputElement = null;
    this.labelElement = null;
    this.errorElement = null;

    // Store input handlers
    this.changeHandlers = new Set();
    this.inputHandlers = new Set();

    // Bind event handlers
    this._handleChange = this._handleChange.bind(this);
    this._handleInput = this._handleInput.bind(this);
    this._handleFocus = this._handleFocus.bind(this);
    this._handleBlur = this._handleBlur.bind(this);
  }

  /**
   * @override
   * Creates the text field element
   */
  createElement() {
    super.createElement();

    // Create field wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'ui-textfield-wrapper';

    // Create label if specified
    if (this.label) {
      this.labelElement = document.createElement('label');
      this.labelElement.className = 'ui-textfield-label';
      this.labelElement.textContent = this.label;
      this.labelElement.htmlFor = this.id + '-input';
      wrapper.appendChild(this.labelElement);
    }

    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'ui-textfield-input-container';

    // Create input element
    this.inputElement = document.createElement('input');
    this.inputElement.className = 'ui-textfield-input';
    this.inputElement.id = this.id + '-input';
    this.inputElement.type = this.type;
    this.inputElement.value = this.value;
    this.inputElement.placeholder = this.placeholder;
    
    if (this.maxLength) {
      this.inputElement.maxLength = this.maxLength;
    }
    if (this.pattern) {
      this.inputElement.pattern = this.pattern;
    }
    if (this.required) {
      this.inputElement.required = true;
    }

    inputContainer.appendChild(this.inputElement);

    // Create error message element
    this.errorElement = document.createElement('div');
    this.errorElement.className = 'ui-textfield-error';
    this.errorElement.setAttribute('aria-live', 'polite');
    wrapper.appendChild(inputContainer);
    wrapper.appendChild(this.errorElement);

    this.element.appendChild(wrapper);

    // Add event listeners
    this.inputElement.addEventListener('change', this._handleChange);
    this.inputElement.addEventListener('input', this._handleInput);
    this.inputElement.addEventListener('focus', this._handleFocus);
    this.inputElement.addEventListener('blur', this._handleBlur);

    this.applyAccessibility();

    // Set initial error state if provided
    if (this.errorText) {
      this.setError(this.errorText);
    }
  }

  /**
   * @override
   * Applies ARIA attributes and other accessibility features
   */
  applyAccessibility() {
    if (this.errorText) {
      this.inputElement.setAttribute('aria-invalid', 'true');
      this.inputElement.setAttribute('aria-describedby', `${this.id}-error`);
      this.errorElement.id = `${this.id}-error`;
    } else {
      this.inputElement.removeAttribute('aria-invalid');
      this.inputElement.removeAttribute('aria-describedby');
    }

    if (this.required) {
      this.inputElement.setAttribute('aria-required', 'true');
    }
  }

  /**
   * Sets the input value
   * @param {string} value - New input value
   * @param {boolean} [notify=true] - Whether to notify change handlers
   */
  setValue(value, notify = true) {
    const oldValue = this.value;
    this.value = value;
    this.inputElement.value = value;

    if (notify && oldValue !== value) {
      this._handleChange({ target: this.inputElement });
    }
  }

  /**
   * Gets the current input value
   * @returns {string}
   */
  getValue() {
    return this.value;
  }

  /**
   * Sets the field's label
   * @param {string} label - New label text
   */
  setLabel(label) {
    this.label = label;
    if (this.labelElement) {
      this.labelElement.textContent = label;
    }
  }

  /**
   * Sets the placeholder text
   * @param {string} placeholder - New placeholder text
   */
  setPlaceholder(placeholder) {
    this.placeholder = placeholder;
    this.inputElement.placeholder = placeholder;
  }

  /**
   * Sets an error message
   * @param {string} error - Error message (empty string to clear)
   */
  setError(error) {
    this.errorText = error;
    this.errorElement.textContent = error;
    this.element.classList.toggle('error', Boolean(error));
    this.applyAccessibility();
  }

  /**
   * Checks if the input is valid
   * @returns {boolean}
   */
  isValid() {
    return this.inputElement.checkValidity();
  }

  /**
   * Reports the input's validity
   */
  reportValidity() {
    const isValid = this.inputElement.reportValidity();
    if (!isValid) {
      this.setError(this.inputElement.validationMessage);
    }
    return isValid;
  }

  /**
   * Change event handler
   * @private
   */
  _handleChange(event) {
    this.value = event.target.value;
    this.changeHandlers.forEach(handler => handler(this.value));
  }

  /**
   * Input event handler
   * @private
   */
  _handleInput(event) {
    this.value = event.target.value;
    this.inputHandlers.forEach(handler => handler(this.value));
  }

  /**
   * Focus event handler
   * @private
   */
  _handleFocus() {
    this.element.classList.add('focused');
  }

  /**
   * Blur event handler
   * @private
   */
  _handleBlur() {
    this.element.classList.remove('focused');
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
   * Adds an input event handler
   * @param {Function} handler - Input event handler function
   */
  onInput(handler) {
    this.inputHandlers.add(handler);
  }

  /**
   * Removes an input event handler
   * @param {Function} handler - Input event handler function to remove
   */
  offInput(handler) {
    this.inputHandlers.delete(handler);
  }

  /**
   * @override
   * Enable the text field
   */
  enable() {
    super.enable();
    this.inputElement.removeAttribute('disabled');
  }

  /**
   * @override
   * Disable the text field
   */
  disable() {
    super.disable();
    this.inputElement.setAttribute('disabled', '');
  }

  /**
   * Focuses the input element
   */
  focus() {
    this.inputElement.focus();
  }

  /**
   * Blurs the input element
   */
  blur() {
    this.inputElement.blur();
  }

  /**
   * Selects all text in the input
   */
  select() {
    this.inputElement.select();
  }

  /**
   * @override
   * Cleanup event listeners on unmount
   */
  onUnmount() {
    this.inputElement.removeEventListener('change', this._handleChange);
    this.inputElement.removeEventListener('input', this._handleInput);
    this.inputElement.removeEventListener('focus', this._handleFocus);
    this.inputElement.removeEventListener('blur', this._handleBlur);
    this.changeHandlers.clear();
    this.inputHandlers.clear();
  }
}
