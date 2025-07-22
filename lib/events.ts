// Simple event system for cross-component communication
type EventCallback = () => void;

class EventBus {
  private events: Record<string, EventCallback[]> = {};

  // Subscribe to an event
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  // Publish an event
  publish(event: string): void {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}

// Create a singleton instance
export const eventBus = new EventBus();

// Event constants
export const EVENTS = {
  BOOKING_CREATED: 'booking-created',
  BOOKING_UPDATED: 'booking-updated',
  BOOKING_DELETED: 'booking-deleted',
}; 