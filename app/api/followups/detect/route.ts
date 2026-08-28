import type { NextRequest } from 'next/server';
import { forwardAuth } from '@/lib/http/forwardAuth';
import { proxyJsonResponse } from '@/lib/http/proxyJsonResponse';

export async function POST(request: NextRequest) {
  const apiBase = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/followups/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...forwardAuth(request) },
    });
  } catch (err) {
    console.error('[followups/detect POST] upstream fetch failed:', err);
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }
  return proxyJsonResponse(upstream, 'followups/detect');
}
