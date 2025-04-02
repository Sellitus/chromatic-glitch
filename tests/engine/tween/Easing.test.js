import { Easing } from '../../../src/js/engine/tween/Easing.js';

// Helper to test easing functions at key points (start, mid, end)
// and check if values are generally within the expected 0-1 range (for standard easings)
function testEasingFunction(name, func) {
  describe(`Easing.${name}`, () => {
    it('should return 0 for t=0', () => {
      expect(func(0)).toBeCloseTo(0);
    });

    it('should return 1 for t=1', () => {
      // Allow for slight floating point inaccuracies, especially with complex functions
      expect(func(1)).toBeCloseTo(1, 5);
    });

    it('should return values generally between 0 and 1 for t in (0, 1)', () => {
      // Test a few points within the range
      const tValues = [0.1, 0.25, 0.5, 0.75, 0.9];
      tValues.forEach(t => {
        const result = func(t);
        // Standard easing functions stay within 0-1 range
        // Back and Elastic easings can go outside this range, so skip this check for them
        if (!name.includes('Back') && !name.includes('Elastic')) {
           expect(result).toBeGreaterThanOrEqual(-0.0001); // Allow small negative due to float issues
           expect(result).toBeLessThanOrEqual(1.0001);    // Allow small positive due to float issues
        }
        // Basic check: should not be NaN
        expect(result).not.toBeNaN();
      });
    });

    // Add specific value checks for known points if necessary
    if (name === 'linear') {
      it('should return t for linear', () => {
        expect(func(0.5)).toBeCloseTo(0.5);
        expect(func(0.25)).toBeCloseTo(0.25);
      });
    }

    if (name === 'easeInQuad') {
        it('should return t*t for easeInQuad', () => {
            expect(func(0.5)).toBeCloseTo(0.25);
        });
    }

     if (name === 'easeOutQuad') {
        it('should return correct value for easeOutQuad', () => {
            expect(func(0.5)).toBeCloseTo(0.75); // 0.5 * (2 - 0.5) = 0.75
        });
    }

     if (name === 'easeInOutQuad') {
        it('should return correct value for easeInOutQuad', () => {
            expect(func(0.25)).toBeCloseTo(2 * 0.25 * 0.25); // 0.125
            expect(func(0.75)).toBeCloseTo(-1 + (4 - 2 * 0.75) * 0.75); // -1 + (2.5 * 0.75) = 0.875
        });
    }

    // Add more specific checks for other easing types if desired
  });
}

// Iterate over all functions in the Easing object and generate tests
for (const easeName in Easing) {
  if (typeof Easing[easeName] === 'function') {
    testEasingFunction(easeName, Easing[easeName]);
  }
}
