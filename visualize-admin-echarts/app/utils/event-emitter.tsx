// @ts-ignore We use StrictEventEmitter to type EventEmitter
import EventEmitter from "microee";
import { createContext, PropsWithChildren, useContext, useEffect, useRef } from "react";
import StrictEventEmitter from "strict-event-emitter-types";

/**
 * These are the types that the global event emitter can emit.
 */
interface Events {
  "dataset-added": {
    datasetIri: string;
  };
  "metadata-panel-opened": {
    datasetIri: string;
  };
}

type GlobalEventEmitter = StrictEventEmitter<EventEmitter, Events>;

const globalEventEmitter: GlobalEventEmitter = new EventEmitter();

const EventEmitterContext =
  createContext<GlobalEventEmitter>(globalEventEmitter);

export const EventEmitterProvider = ({ children }: PropsWithChildren<{}>) => {
  return (
    <EventEmitterContext.Provider value={globalEventEmitter}>
      {children}
    </EventEmitterContext.Provider>
  );
};

type EventEmitterHandler<T extends keyof Events> = (ev: Events[T]) => void;

export const useEventEmitter = <T extends keyof Events>(
  event?: T,
  callback?: EventEmitterHandler<T>
) => {
  const eventEmitterCtx = useContext(EventEmitterContext);
  const eventEmitter = eventEmitterCtx;
  // Use ref to store the callback to avoid dependency issues
  const callbackRef = useRef(callback);
  // Track whether listener was registered to prevent cleanup race conditions
  const isRegisteredRef = useRef(false);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!eventEmitter || !event || !callbackRef.current) {
      return;
    }

    // Wrapper to use the latest callback
    const handler: EventEmitterHandler<T> = (ev) => {
      callbackRef.current?.(ev);
    };

    eventEmitter.on(event as unknown as keyof Events, handler);
    isRegisteredRef.current = true;

    return () => {
      // Only remove if we successfully registered
      if (isRegisteredRef.current) {
        eventEmitter.removeListener(event, handler);
        isRegisteredRef.current = false;
      }
    };
  }, [eventEmitter, event]);

  return eventEmitter;
};
