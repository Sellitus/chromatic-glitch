import UIComponent from '../core/UIComponent.js';

/**
 * StackLayout component for arranging child elements in a stack (vertical or horizontal)
 */
export default class StackLayout extends UIComponent {
  constructor(options = {}) {
    super(options);
    
    // Stack configuration
    this.direction = options.direction || 'vertical';
    this.spacing = options.spacing || '0';
    this.alignment = options.alignment || 'start';
    this.distribution = options.distribution || 'start';
    this.className = 'ui-stack-layout ' + (options.className || '');
    
    // Initialize wrapped items tracking
    this.wrappedItems = new Map(); // Maps child components to their flex configs
  }

  /**
   * @override
   * Creates the stack container element
   */
  createElement() {
    super.createElement();
    this.element.style.display = 'flex';
    this.element.style.flexWrap = 'nowrap';
    this.updateLayout();
  }

  /**
   * Updates the stack's layout configuration
   */
  updateLayout() {
    // Set flex direction
    this.element.style.flexDirection = this.direction === 'vertical' ? 'column' : 'row';
    
    // Set gap between items
    this.element.style.gap = this.spacing;
    
    // Set alignment (cross-axis)
    this.element.style.alignItems = this.getAlignmentValue();
    
    // Set distribution (main-axis)
    this.element.style.justifyContent = this.getDistributionValue();
  }

  /**
   * Maps alignment keywords to CSS values
   * @private
   */
  getAlignmentValue() {
    const alignmentMap = {
      'start': 'flex-start',
      'end': 'flex-end',
      'center': 'center',
      'stretch': 'stretch',
    };
    return alignmentMap[this.alignment] || 'flex-start';
  }

  /**
   * Maps distribution keywords to CSS values
   * @private
   */
  getDistributionValue() {
    const distributionMap = {
      'start': 'flex-start',
      'end': 'flex-end',
      'center': 'center',
      'space-between': 'space-between',
      'space-around': 'space-around',
      'space-evenly': 'space-evenly',
    };
    return distributionMap[this.distribution] || 'flex-start';
  }

  /**
   * Sets the stack direction
   * @param {'vertical'|'horizontal'} direction - Direction of the stack
   */
  setDirection(direction) {
    if (direction !== 'vertical' && direction !== 'horizontal') {
      throw new Error('Direction must be either "vertical" or "horizontal"');
    }
    this.direction = direction;
    this.updateLayout();
  }

  /**
   * Sets the spacing between stack items
   * @param {string} spacing - CSS gap value (e.g., '10px' or '1rem')
   */
  setSpacing(spacing) {
    this.spacing = spacing;
    this.updateLayout();
  }

  /**
   * Sets the cross-axis alignment of stack items
   * @param {'start'|'end'|'center'|'stretch'} alignment - Alignment value
   */
  setAlignment(alignment) {
    this.alignment = alignment;
    this.updateLayout();
  }

  /**
   * Sets the main-axis distribution of stack items
   * @param {'start'|'end'|'center'|'space-between'|'space-around'|'space-evenly'} distribution
   */
  setDistribution(distribution) {
    this.distribution = distribution;
    this.updateLayout();
  }

  /**
   * Configures a child component's flex behavior
   * @param {UIComponent} child - Child component to configure
   * @param {Object} config - Flex configuration
   * @param {number} [config.grow] - Flex grow factor
   * @param {number} [config.shrink] - Flex shrink factor
   * @param {string} [config.basis] - Flex basis value
   * @param {string} [config.align] - Individual alignment override
   */
  configureItem(child, config = {}) {
    if (!(child instanceof UIComponent)) {
      throw new Error('Child must be a UIComponent');
    }

    // Apply flex configuration
    if (config.grow !== undefined) {
      child.element.style.flexGrow = config.grow;
    }
    if (config.shrink !== undefined) {
      child.element.style.flexShrink = config.shrink;
    }
    if (config.basis !== undefined) {
      child.element.style.flexBasis = config.basis;
    }
    if (config.align !== undefined) {
      child.element.style.alignSelf = this.getAlignmentValue(config.align);
    }

    // Store configuration
    this.wrappedItems.set(child, config);
  }

  /**
   * @override
   * Adds a child component to the stack
   */
  addChild(child) {
    super.addChild(child);
    
    // Initialize with default flex configuration if not already configured
    if (!this.wrappedItems.has(child)) {
      this.configureItem(child);
    }
  }

  /**
   * @override
   * Removes a child component and its flex configuration
   */
  removeChild(child) {
    this.wrappedItems.delete(child);
    super.removeChild(child);
  }
}
