/** Formato corto tipo bandeja de chat: hora si es hoy, "Ayer" o fecha corta si no. */
export function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}
