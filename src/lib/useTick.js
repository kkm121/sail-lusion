import { useEffect, useRef } from 'react';
import { onTick } from './ticker';

export function useTick(fn, order = 5, active = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return undefined;
    return onTick((t, dt) => ref.current(t, dt), order);
  }, [order, active]);
}
