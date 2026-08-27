import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const apiBase = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[auth/logout] upstream fetch failed:', err);
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }

  const text = await upstream.text();
  return new Response(text || null, { status: upstream.status });
}
