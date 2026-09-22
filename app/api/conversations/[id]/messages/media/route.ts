import type { NextRequest } from 'next/server';
import { forwardAuth } from '@/lib/http/forwardAuth';
import { proxyJsonResponse } from '@/lib/http/proxyJsonResponse';

/**
 * Único proxy de app/api/** que reenvía un body multipart/form-data en vez de JSON — se
 * materializa como ArrayBuffer (el límite real, spring.servlet.multipart.max-file-size en
 * api-crmws, es de 20MB) en vez de pasar el stream tal cual, para no depender de `duplex: 'half'`
 * en el fetch de Node. El header Content-Type original (con el boundary que generó el navegador)
 * se reenvía tal cual — a diferencia del resto de rutas proxy, acá NO se fuerza
 * 'application/json'.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiBase = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const contentType = request.headers.get('content-type');
  const body = await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/conversations/${id}/messages/media`, {
      method: 'POST',
      headers: {
        ...(contentType ? { 'Content-Type': contentType } : {}),
        ...forwardAuth(request),
      },
      body,
    });
  } catch (err) {
    console.error('[conversations/[id]/messages/media POST] upstream fetch failed:', err);
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }
  return proxyJsonResponse(upstream, 'conversations/[id]/messages/media');
}
