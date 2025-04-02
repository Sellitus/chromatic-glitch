/**
 * Base class for all UI components
 */
export default class UIComponent {
  constructor(options = {}) {
    // Element management
    this.element = null;
    this.parent = null;
    this.children = new Set();
    this.id = options.id || crypto.randomUUID();
    
    // State management
    this.isVisible = true;
    this.isEnabled = true;
    this.state = {};
    
    // Event handling
    this.eventListeners = new Map();
    
    // Styling
    this.className = options.className || '';
  }

  /**
   * Creates the DOM element for this component
   * @protected
   */
  createElement() {
    this.element = document.createElement('div');
    this.element.id = this.id;
    // Add base class first
    this.element.classList.add('ui-component');
    // Add any additional classes provided in options, splitting by space
    if (this.className) {
        this.className.split(' ').forEach(cls => {
            if (cls) { // Avoid adding empty strings if there are multiple spaces
                this.element.classList.add(cls);
            }
        });
    }
    this.applyAccessibility();
  }

  /**
   * Applies ARIA attributes and other accessibility features
   * @protected
   */
  applyAccessibility() {
    this.element.setAttribute('role', 'generic');
    // Derived classes should override to add specific ARIA attributes
  }

  /**
   * Mounts the component to the DOM
   * @param {HTMLElement|UIComponent} parent - Parent element or component to mount to
   */
  mount(parent) {
    if (!this.element) {
      this.createElement();
    }

    if (parent instanceof UIComponent) {
      parent.addChild(this);
      this.parent = parent;
    } else if (parent instanceof HTMLElement) {
      parent.appendChild(this.element);
      this.parent = parent;
    }

    this.onMount();
  }

  /**
   * Unmounts the component from the DOM
   */
  unmount() {
    this.onUnmount();
    this.removeAllEventListeners();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    if (this.parent instanceof UIComponent) {
      this.parent.removeChild(this);
    }
    this.parent = null;
  }

  /**
   * Adds a child component
   * @param {UIComponent} child - Child component to add
   */
  addChild(child) {
    if (!(child instanceof UIComponent)) {
      throw new Error('Child must be a UIComponent');
    }
    this.children.add(child);
    this.element.appendChild(child.element);
  }

  /**
   * Removes a child component
   * @param {UIComponent} child - Child component to remove
   */
  removeChild(child) {
    if (this.children.has(child)) {
      this.children.delete(child);
      if (child.element && child.element.parentNode === this.element) {
        this.element.removeChild(child.element);
      }
    }
  }

  /**
   * Updates the component state
   * @param {Object} newState - New state to merge with existing state
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.onStateChange(this.state);
  }

  /**
   * Adds an event listener to the component
   * @param {string} eventType - DOM event type to listen for
   * @param {Function} handler - Event handler function
   */
  addEventListener(eventType, handler) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType).add(handler);
    this.element.addEventListener(eventType, handler);
  }

  /**
   * Removes an event listener from the component
   * @param {string} eventType - DOM event type to remove
   * @param {Function} handler - Event handler function to remove
   */
  removeEventListener(eventType, handler) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).delete(handler);
      this.element.removeEventListener(eventType, handler);
    }
  }

  /**
   * Removes all event listeners from the component
   */
  removeAllEventListeners() {
    this.eventListeners.forEach((handlers, eventType) => {
      handlers.forEach(handler => {
        this.element.removeEventListener(eventType, handler);
      });
    });
    this.eventListeners.clear();
  }

  /**
   * Shows the component
   */
  show() {
    this.isVisible = true;
    this.element.style.display = '';
  }

  /**
   * Hides the component
   */
  hide() {
    this.isVisible = false;
    this.element.style.display = 'none';
  }

  /**
   * Enables the component
   */
  enable() {
    this.isEnabled = true;
    this.element.removeAttribute('disabled');
    this.element.classList.remove('disabled');
  }

  /**
   * Disables the component
   */
  disable() {
    this.isEnabled = false;
    this.element.setAttribute('disabled', '');
    this.element.classList.add('disabled');
  }

  // Lifecycle hooks
  onMount() {} // Called after mounting
  onUnmount() {} // Called before unmounting
  onStateChange(newState) {} // Called when state changes
}
