type EventHandler = (payload?: any) => void;

const listeners: Record<string, Set<EventHandler>> = {};

export const on = (event: string, handler: EventHandler) => {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(handler);
  return () => off(event, handler);
};

export const off = (event: string, handler: EventHandler) => {
  if (!listeners[event]) return;
  listeners[event].delete(handler);
};

export const emit = (event: string, payload?: any) => {
  const set = listeners[event];
  if (!set) return;
  for (const h of Array.from(set)) {
    try {
      h(payload);
    } catch (err) {
      // swallow to avoid breaking other listeners
      console.error('Event handler error for', event, err);
    }
  }
};
