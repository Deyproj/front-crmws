import type { NextRequest } from 'next/server';
import { forwardAuth } from '@/lib/http/forwardAuth';
import { proxyJsonResponse } from '@/lib/http/proxyJsonResponse';

export async function POST(request: NextRequest) {
  const apiBase = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/agent/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...forwardAuth(request) },
      body,
    });
  } catch (err) {
    console.error('[agent/simulate POST] upstream fetch failed:', err);
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }
  return proxyJsonResponse(upstream, 'agent/simulate');
}
