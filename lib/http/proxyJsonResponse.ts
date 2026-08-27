/**
 * Reenvía al cliente la respuesta JSON de un backend sin volver a materializarla
 * (evita el ciclo text() → JSON.parse → Response.json en cada route handler proxy).
 * Mismo patrón que front-guardian (lib/http/proxyResponse.ts).
 */
export function proxyJsonResponse(upstream: Response, context: string): Promise<Response> | Response {
  const contentType = upstream.headers.get('Content-Type') ?? '';

  // 202/204 sin cuerpo (p. ej. connect/reconnect/disconnect/session de channel) y respuestas
  // JSON (incluye application/problem+json, el ProblemDetail de Spring en errores 4xx/409).
  const emptyBody = upstream.status === 202 || upstream.status === 204;
  if (emptyBody || contentType.includes('json')) {
    return new Response(emptyBody ? null : upstream.body, {
      status: upstream.status,
      headers: contentType ? { 'Content-Type': contentType } : undefined,
    });
  }

  return upstream.text().then((text) => {
    console.error(`[${context}] upstream non-JSON response:`, text.slice(0, 200));
    return Response.json({ error: 'Invalid upstream response' }, { status: 502 });
  });
}
