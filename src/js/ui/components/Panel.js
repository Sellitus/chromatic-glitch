import UIComponent from '../core/UIComponent.js';

/**
 * Panel component for grouping UI elements
 */
export default class Panel extends UIComponent {
  constructor(options = {}) {
    super(options);
    
    // Panel configuration
    this.title = options.title || '';
    this.variant = options.variant || 'default'; // default, bordered, elevated
    this.className = `ui-panel ui-panel-${this.variant} ` + 
      (options.className || '');

    // Content container reference
    this.contentContainer = null;

    // State
    this.isCollapsible = options.collapsible || false;
    this.isCollapsed = options.collapsed || false;

    // Bind event handlers
    this._handleToggleCollapse = this._handleToggleCollapse.bind(this);
  }

  /**
   * @override
   * Creates the panel element
   */
  createElement() {
    super.createElement();

    // Create title if specified
    if (this.title) {
      const headerElement = document.createElement('div');
      headerElement.className = 'ui-panel-header';
      
      if (this.isCollapsible) {
        headerElement.classList.add('collapsible');
        headerElement.addEventListener('click', this._handleToggleCollapse);
        
        const icon = document.createElement('span');
        icon.className = 'ui-panel-collapse-icon';
        headerElement.appendChild(icon);
      }

      const titleElement = document.createElement('h3');
      titleElement.className = 'ui-panel-title';
      titleElement.textContent = this.title;
      headerElement.appendChild(titleElement);

      this.element.appendChild(headerElement);
    }

    // Create content container
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'ui-panel-content';
    if (this.isCollapsed) {
      this.contentContainer.style.display = 'none';
    }
    this.element.appendChild(this.contentContainer);

    this.applyAccessibility();
  }

  /**
   * @override
   * Applies ARIA attributes and other accessibility features
   */
  applyAccessibility() {
    this.element.setAttribute('role', 'region');
    if (this.title) {
      this.element.setAttribute('aria-labelledby', `${this.id}-title`);
    }
    if (this.isCollapsible) {
      this.element.setAttribute('aria-expanded', !this.isCollapsed);
    }
  }

  /**
   * Sets the panel title
   * @param {string} title - Panel title
   */
  setTitle(title) {
    this.title = title;
    const titleElement = this.element.querySelector('.ui-panel-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  /**
   * Sets the panel variant
   * @param {'default'|'bordered'|'elevated'} variant
   */
  setVariant(variant) {
    const validVariants = ['default', 'bordered', 'elevated'];
    if (!validVariants.includes(variant)) {
      throw new Error(`Invalid variant: ${variant}`);
    }

    this.element.classList.remove(`ui-panel-${this.variant}`);
    this.variant = variant;
    this.element.classList.add(`ui-panel-${variant}`);
  }

  /**
   * Toggles panel collapsible state
   * @param {boolean} collapsible - Whether the panel should be collapsible
   */
  setCollapsible(collapsible) {
    this.isCollapsible = collapsible;
    const header = this.element.querySelector('.ui-panel-header');
    
    if (header) {
      if (collapsible) {
        header.classList.add('collapsible');
        header.addEventListener('click', this._handleToggleCollapse);
      } else {
        header.classList.remove('collapsible');
        header.removeEventListener('click', this._handleToggleCollapse);
      }
    }

    this.applyAccessibility();
  }

  /**
   * Expands the panel content
   */
  expand() {
    if (!this.isCollapsible || !this.isCollapsed) return;
    
    this.isCollapsed = false;
    this.contentContainer.style.display = '';
    this.element.classList.remove('collapsed');
    this.applyAccessibility();
  }

  /**
   * Collapses the panel content
   */
  collapse() {
    if (!this.isCollapsible || this.isCollapsed) return;
    
    this.isCollapsed = true;
    this.contentContainer.style.display = 'none';
    this.element.classList.add('collapsed');
    this.applyAccessibility();
  }

  /**
   * Toggle panel collapsed state
   */
  toggle() {
    if (this.isCollapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * @override
   * Adds a child component to the panel's content container
   */
  addChild(child) {
    if (!(child instanceof UIComponent)) {
      throw new Error('Child must be a UIComponent');
    }
    this.children.add(child);
    this.contentContainer.appendChild(child.element);
  }

  /**
   * Internal collapse toggle handler
   * @private
   */
  _handleToggleCollapse() {
    this.toggle();
  }

  /**
   * @override
   * Cleanup event listeners on unmount
   */
  onUnmount() {
    const header = this.element.querySelector('.ui-panel-header');
    if (header) {
      header.removeEventListener('click', this._handleToggleCollapse);
    }
  }
}
