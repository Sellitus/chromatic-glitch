// Core
export { default as UIComponent } from './core/UIComponent.js';

// Layout
export { default as GridLayout } from './layout/GridLayout.js';
export { default as StackLayout } from './layout/StackLayout.js';

// Components
export { default as Button } from './components/Button.js';
export { default as Panel } from './components/Panel.js';
export { default as Slider } from './components/Slider.js';
export { default as Toggle } from './components/Toggle.js';
export { default as ProgressBar } from './components/ProgressBar.js';
export { default as TextField } from './components/TextField.js';

/**
 * UI Component System
 * 
 * A comprehensive set of reusable UI components for game interfaces.
 * Features include:
 * - Base UIComponent class for shared functionality
 * - Layout components (Grid, Stack) for organizing UI elements
 * - Common UI components (Button, Panel, Slider, etc.)
 * - Built-in theming support through CSS variables
 * - Accessibility features (ARIA attributes, keyboard navigation)
 * - Responsive design support
 * - Event handling system
 * 
 * Example usage:
 * ```js
 * import { Button, Panel, TextField } from './ui';
 * 
 * // Create a settings panel
 * const panel = new Panel({
 *   title: 'Settings',
 *   collapsible: true
 * });
 * 
 * // Add a text field
 * const nameField = new TextField({
 *   label: 'Player Name',
 *   placeholder: 'Enter your name'
 * });
 * panel.addChild(nameField);
 * 
 * // Add a button
 * const saveButton = new Button({
 *   text: 'Save',
 *   variant: 'primary'
 * });
 * panel.addChild(saveButton);
 * 
 * // Mount to DOM
 * panel.mount(document.body);
 * ```
 */
