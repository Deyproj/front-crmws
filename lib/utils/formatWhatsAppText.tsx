import type { ReactNode } from 'react';

/** Cierre de frase que probablemente no es parte de la URL (paréntesis sin abrir, punto final,
 * coma) — heurística estándar de autolink, no una gramática de URL completa. Sin esto, "mira
 * https://ejemplo.com." se enlazaría con el punto final incluido. */
const URL_TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;

/**
 * Interpreta el formato de texto de WhatsApp (*negrilla*, _cursiva_, ~tachado~,
 * ```monoespaciado```) para que las burbujas del chat se vean como se ven en el propio
 * WhatsApp del contacto, en vez de mostrar los asteriscos/guiones bajos tal cual — el
 * agente y los asesores ya escriben con esa sintaxis (ver systemPrompt en
 * GeminiAiProviderAdapter.java, api-crmws). También convierte URLs en texto plano a enlaces
 * clicables (reportado en vivo 2026-09-27: un link que un asesor compartía se veía como texto
 * inerte, sin forma de abrirlo desde el panel) — va primero en la alternancia para que una URL
 * con "_" (frecuente en query strings) no se interprete por error como cursiva.
 */
export function formatWhatsAppText(text: string): ReactNode[] {
  const pattern = /(https?:\/\/\S+)|```([^`]+)```|\*([^*\n]+)\*|_([^_\n]+)_|~([^~\n]+)~/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, url, mono, bold, italic, strike] = match;
    if (url !== undefined) {
      const trailing = url.match(URL_TRAILING_PUNCTUATION)?.[0] ?? '';
      const href = trailing ? url.slice(0, -trailing.length) : url;
      nodes.push(
        <a key={key++} href={href} target="_blank" rel="noreferrer" className="underline">
          {href}
        </a>
      );
      if (trailing) nodes.push(trailing);
    } else if (mono !== undefined) {
      nodes.push(
        <code key={key++} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em]">
          {mono}
        </code>
      );
    } else if (bold !== undefined) {
      nodes.push(<strong key={key++}>{bold}</strong>);
    } else if (italic !== undefined) {
      nodes.push(<em key={key++}>{italic}</em>);
    } else if (strike !== undefined) {
      nodes.push(<del key={key++}>{strike}</del>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}
