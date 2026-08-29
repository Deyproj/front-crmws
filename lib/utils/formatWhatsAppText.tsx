import type { ReactNode } from 'react';

/**
 * Interpreta el formato de texto de WhatsApp (*negrilla*, _cursiva_, ~tachado~,
 * ```monoespaciado```) para que las burbujas del chat se vean como se ven en el propio
 * WhatsApp del contacto, en vez de mostrar los asteriscos/guiones bajos tal cual — el
 * agente y los asesores ya escriben con esa sintaxis (ver systemPrompt en
 * GeminiAiProviderAdapter.java, api-crmws).
 */
export function formatWhatsAppText(text: string): ReactNode[] {
  const pattern = /```([^`]+)```|\*([^*\n]+)\*|_([^_\n]+)_|~([^~\n]+)~/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, mono, bold, italic, strike] = match;
    if (mono !== undefined) {
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
