type Listener = () => void;

const listeners = new Set<Listener>();

export function notifyPersistentDataChanged() {
  listeners.forEach(listener => listener());
}

export function subscribeToPersistentDataChanges(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
