import type { NextRequest } from 'next/server';
import { forwardAuth } from '@/lib/http/forwardAuth';
import { proxyJsonResponse } from '@/lib/http/proxyJsonResponse';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; membershipId: string }> }
) {
  const { id, membershipId } = await params;
  const apiBase = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/platform/organizations/${id}/members/${membershipId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...forwardAuth(request) },
    });
  } catch (err) {
    console.error('[platform/organizations/[id]/members/[membershipId]/reset-password] upstream fetch failed:', err);
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }
  return proxyJsonResponse(upstream, 'platform/organizations/[id]/members/[membershipId]/reset-password');
}
