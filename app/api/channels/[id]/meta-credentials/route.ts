import type { NextRequest } from 'next/server';
import { forwardAuth } from '@/lib/http/forwardAuth';
import { proxyJsonResponse } from '@/lib/http/proxyJsonResponse';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiBase = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const body = await request.text();
  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/channels/${id}/meta-credentials`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...forwardAuth(request) },
      body,
    });
  } catch (err) {
    console.error('[channels/[id]/meta-credentials PUT] upstream fetch failed:', err);
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }
  return proxyJsonResponse(upstream, 'channels/[id]/meta-credentials');
}
