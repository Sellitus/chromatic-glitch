export class EventSystem {
  constructor() {
    this.listeners = new Map();
    this.queuedEvents = [];
  }

  init() {
    // Any initial setup needed
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(eventName);
        }
      }
    };
  }

  emit(eventName, data = {}) {
    // Queue event for next update cycle to avoid side effects during current update
    this.queuedEvents.push({ eventName, data });
  }

  emitImmediate(eventName, data = {}) {
    // Emit event immediately (use with caution)
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  update() {
    // Process queued events
    const events = [...this.queuedEvents];
    this.queuedEvents = [];

    events.forEach(({ eventName, data }) => {
      this.emitImmediate(eventName, data);
    });
  }

  clear() {
    this.listeners.clear();
    this.queuedEvents = [];
  }

  // Helper method to get number of listeners for testing/debugging
  listenerCount(eventName) {
    return this.listeners.has(eventName) ? this.listeners.get(eventName).size : 0;
  }
}
