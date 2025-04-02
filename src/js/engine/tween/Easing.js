/**
 * Collection of common easing functions.
 * Functions take a normalized time 't' (0 to 1) and return an eased value (usually 0 to 1).
 * Based on Robert Penner's easing functions (http://robertpenner.com/easing/)
 */
export const Easing = {
  // No easing, no acceleration
  linear: t => t,

  // Accelerating from zero velocity
  easeInQuad: t => t * t,
  // Decelerating to zero velocity
  easeOutQuad: t => t * (2 - t),
  // Acceleration until halfway, then deceleration
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // Accelerating from zero velocity
  easeInCubic: t => t * t * t,
  // Decelerating to zero velocity
  easeOutCubic: t => (--t) * t * t + 1,
  // Acceleration until halfway, then deceleration
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Accelerating from zero velocity
  easeInQuart: t => t * t * t * t,
  // Decelerating to zero velocity
  easeOutQuart: t => 1 - (--t) * t * t * t,
  // Acceleration until halfway, then deceleration
  easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // Accelerating from zero velocity
  easeInQuint: t => t * t * t * t * t,
  // Decelerating to zero velocity
  easeOutQuint: t => 1 + (--t) * t * t * t * t,
  // Acceleration until halfway, then deceleration
  easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

  // Sinusoidal easing
  easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: t => Math.sin(t * Math.PI / 2),
  easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,

  // Exponential easing
  easeInExpo: t => (t === 0) ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: t => (t === 1) ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if ((t /= 0.5) < 1) return 0.5 * Math.pow(2, 10 * (t - 1));
    return 0.5 * (2 - Math.pow(2, -10 * --t));
  },

  // Circular easing
  easeInCirc: t => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: t => Math.sqrt(1 - (--t) * t),
  easeInOutCirc: t => {
    if ((t /= 0.5) < 1) return -0.5 * (Math.sqrt(1 - t * t) - 1);
    return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
  },

  // Elastic easing
  easeInElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const p = 0.3;
    const s = p / 4;
    return -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
  },
  easeOutElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
  },
  easeInOutElastic: t => {
    if ((t /= 0.5) === 2) return 1;
    const p = 0.3 * 1.5;
    const s = p / 4;
    if (t < 1) return -0.5 * (Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
    return Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p) * 0.5 + 1;
  },

  // Back easing (overshooting)
  easeInBack: (t, s = 1.70158) => t * t * ((s + 1) * t - s),
  easeOutBack: (t, s = 1.70158) => (--t) * t * ((s + 1) * t + s) + 1,
  easeInOutBack: (t, s = 1.70158) => {
    if ((t /= 0.5) < 1) return 0.5 * (t * t * (((s *= 1.525) + 1) * t - s));
    return 0.5 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2);
  },

  // Bounce easing
  easeOutBounce: t => {
    if (t < (1 / 2.75)) {
      return 7.5625 * t * t;
    } else if (t < (2 / 2.75)) {
      return 7.5625 * (t -= (1.5 / 2.75)) * t + 0.75;
    } else if (t < (2.5 / 2.75)) {
      return 7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375;
    } else {
      return 7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375;
    }
  },
  easeInBounce: t => 1 - Easing.easeOutBounce(1 - t),
  easeInOutBounce: t => t < 0.5 ? Easing.easeInBounce(t * 2) * 0.5 : Easing.easeOutBounce(t * 2 - 1) * 0.5 + 0.5,
};
