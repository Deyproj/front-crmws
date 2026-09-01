import type { NextRequest } from 'next/server';
import { forwardAuth } from '@/lib/http/forwardAuth';

// Sin esto Next.js podría intentar cachear/prerenderizar una respuesta que en
// realidad es un stream infinito (SseEmitter del backend, hasta 30 min por conexión).
export const dynamic = 'force-dynamic';

/**
 * Reenvía el stream SSE de eventos de conversación (ConversationRealtimeController,
 * api-crmws) tal cual — sin materializarlo — para que el navegador use
 * `Authorization: Bearer` (localStorage, ver lib/runtime/tokenStorage.ts) en vez de
 * depender de EventSource nativo, que no permite headers custom.
 */
export async function GET(request: NextRequest) {
  const apiBase = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/conversations/events/stream`, {
      headers: { Accept: 'text/event-stream', ...forwardAuth(request) },
      signal: request.signal,
    });
  } catch (err) {
    console.error('[conversations/events/stream] upstream fetch failed:', err);
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
