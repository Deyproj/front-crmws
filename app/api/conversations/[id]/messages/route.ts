import type { NextRequest } from 'next/server';
import { forwardAuth } from '@/lib/http/forwardAuth';
import { proxyJsonResponse } from '@/lib/http/proxyJsonResponse';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiBase = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const query = request.nextUrl.search;

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/conversations/${id}/messages${query}`, {
      headers: { 'Content-Type': 'application/json', ...forwardAuth(request) },
    });
  } catch (err) {
    console.error('[conversations/[id]/messages GET] upstream fetch failed:', err);
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }
  return proxyJsonResponse(upstream, 'conversations/[id]/messages');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiBase = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/conversations/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...forwardAuth(request) },
      body,
    });
  } catch (err) {
    console.error('[conversations/[id]/messages POST] upstream fetch failed:', err);
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }
  return proxyJsonResponse(upstream, 'conversations/[id]/messages');
}
