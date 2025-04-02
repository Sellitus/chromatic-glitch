import BaseScreen from '../../../src/js/ui/screens/BaseScreen.js';
import UIComponent from '../../../src/js/ui/core/UIComponent.js';

// Mock the console methods to prevent test output clutter and allow spying
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('BaseScreen', () => {
  let screen;
  let mockScreenManager;

  beforeEach(() => {
    // Reset spies before each test
    consoleLogSpy.mockClear();
    consoleWarnSpy.mockClear();
    
    // Mock a screen manager (optional, but good practice)
    mockScreenManager = {
      push: jest.fn(),
      pop: jest.fn(),
      replace: jest.fn(),
    };
    
    screen = new BaseScreen({ id: 'test-screen', className: 'extra-class', screenManager: mockScreenManager });
  });

  afterAll(() => {
    // Restore console spies after all tests
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test('should extend UIComponent', () => {
    expect(screen).toBeInstanceOf(UIComponent);
    expect(screen).toBeInstanceOf(BaseScreen);
  });

  test('should initialize with options', () => {
    expect(screen.id).toBe('test-screen');
    expect(screen.screenManager).toBe(mockScreenManager);
  });

  test('createElement should create a div with base and custom classes', () => {
    screen.createElement();
    expect(screen.element).toBeInstanceOf(HTMLDivElement);
    expect(screen.element.id).toBe('test-screen');
    expect(screen.element.classList.contains('ui-component')).toBe(true);
    expect(screen.element.classList.contains('screen')).toBe(true);
    expect(screen.element.classList.contains('extra-class')).toBe(true);
    // Should be hidden initially by default style in createElement
    expect(screen.element.style.display).toBe('none');
  });
  
  test('createElement should handle options without className', () => {
      const screenNoClass = new BaseScreen({ id: 'no-class-screen' });
      screenNoClass.createElement();
      expect(screenNoClass.element.classList.contains('screen')).toBe(true);
      // Ensure no undefined or extra space is added if className is missing
      expect(screenNoClass.element.className).toBe('ui-component screen'); 
  });

  test('onEnter should log entering message', () => {
    screen.onEnter();
    expect(console.log).toHaveBeenCalledWith('Entering screen: BaseScreen (test-screen)');
  });

  test('onExit should log exiting message', () => {
    screen.onExit();
    expect(console.log).toHaveBeenCalledWith('Exiting screen: BaseScreen (test-screen)');
  });

  test('update should exist but do nothing by default', () => {
    expect(() => screen.update(16)).not.toThrow();
  });

  test('render should exist but do nothing by default', () => {
    expect(() => screen.render()).not.toThrow();
  });
  
  test('show should make element visible', () => {
      screen.createElement(); // Need the element first
      screen.hide(); // Ensure it's hidden
      screen.show();
      expect(screen.isVisible).toBe(true);
      expect(screen.element.style.display).toBe('');
  });

  test('hide should make element invisible', () => {
      screen.createElement(); // Need the element first
      screen.show(); // Ensure it's visible
      screen.hide();
      expect(screen.isVisible).toBe(false);
      expect(screen.element.style.display).toBe('none');
  });
});
