import type { NextRequest } from 'next/server';
import { forwardAuth } from '@/lib/http/forwardAuth';
import { proxyJsonResponse } from '@/lib/http/proxyJsonResponse';

export async function GET(request: NextRequest) {
  const apiBase = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/agent/config`, {
      headers: { 'Content-Type': 'application/json', ...forwardAuth(request) },
    });
  } catch (err) {
    console.error('[agent/config GET] upstream fetch failed:', err);
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }
  return proxyJsonResponse(upstream, 'agent/config');
}

export async function PATCH(request: NextRequest) {
  const apiBase = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/agent/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...forwardAuth(request) },
      body,
    });
  } catch (err) {
    console.error('[agent/config PATCH] upstream fetch failed:', err);
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }
  return proxyJsonResponse(upstream, 'agent/config');
}
