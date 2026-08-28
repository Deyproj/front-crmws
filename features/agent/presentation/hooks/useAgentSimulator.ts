'use client';

import { useState } from 'react';
import { simulateAgent, type SimulatedTurn, type SimulateAgentResult } from '@/features/agent';

export function useAgentSimulator() {
  const [turns, setTurns] = useState<SimulatedTurn[]>([]);
  const [lastResult, setLastResult] = useState<SimulateAgentResult | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    const nextTurns: SimulatedTurn[] = [...turns, { role: 'CUSTOMER', text: trimmed }];
    setTurns(nextTurns);
    try {
      const result = await simulateAgent(nextTurns);
      setLastResult(result);
      if (result.text) {
        setTurns((prev) => [...prev, { role: 'ASSISTANT', text: result.text as string }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo simular la respuesta');
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setTurns([]);
    setLastResult(null);
    setError(null);
  }

  return { turns, lastResult, sending, error, send, reset };
}
