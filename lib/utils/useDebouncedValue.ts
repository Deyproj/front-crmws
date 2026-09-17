'use client';

import { useEffect, useState } from 'react';

/** Devuelve `value` solo cuando dejó de cambiar durante `delayMs` — p. ej. esperar a que el usuario deje de escribir antes de consultar al backend. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
