'use client';

import { useEffect, useMemo, useState } from 'react';
import { listContacts, mergeContacts, type Contact } from '@/features/contacts';
import { XIcon, SearchIcon } from '@/components/ui/icons';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

/**
 * Fusiona otro contacto dentro de `contact` (el que se conserva) — caso real: el mismo
 * cliente de WhatsApp quedó dividido en dos contactos porque su primer mensaje llegó
 * identificado solo por LID, sin teléfono (ver BR-026, business-rules.md). Se busca sobre
 * la lista completa de contactos (mismo límite de `listContacts()` que el resto de la
 * bandeja — sin "cargar más" todavía) y se filtra en el cliente, igual que la búsqueda de
 * `ConversationListPanel`.
 */
export function MergeContactDialog({
  contact,
  open,
  onClose,
  onMerged,
}: {
  contact: Contact;
  open: boolean;
  onClose: () => void;
  onMerged: (merged: Contact) => void;
}) {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<Contact | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery('');
    setTarget(null);
    setError(null);
    setLoading(true);
    listContacts()
      .then((all) => setContacts(all.filter((c) => c.id !== contact.id)))
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los contactos'))
      .finally(() => setLoading(false));
  }, [open, contact.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => (c.name?.toLowerCase().includes(q) ?? false) || c.phone.toLowerCase().includes(q));
  }, [contacts, query]);

  if (!open) return null;

  async function handleConfirm() {
    if (!target) return;
    setPending(true);
    setError(null);
    try {
      const merged = await mergeContacts(contact.id, target.id);
      onMerged(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo fusionar el contacto');
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[var(--space-8)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-contact-title"
        className="flex max-h-[80vh] w-full max-w-sm animate-dialog-pop flex-col gap-[var(--space-6)] rounded-xl bg-surface p-[var(--space-8)] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p id="merge-contact-title" className="text-sm font-semibold text-ink">
            Fusionar con otro contacto
          </p>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-secondary hover:text-ink">
            <XIcon className="size-4" />
          </button>
        </div>
        <p className="text-xs text-secondary">
          Se conserva <strong>{contact.name || contact.phone}</strong>. El contacto que elijas se fusiona dentro de este
          (sus conversaciones, oportunidades, citas y seguimientos pasan a este contacto) y desaparece.
        </p>

        <div className="flex items-center gap-[var(--space-4)] rounded-md bg-app p-[var(--space-4)]">
          <SearchIcon className="size-[14px] text-secondary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full bg-transparent text-xs text-ink placeholder-secondary focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="p-[var(--space-4)] text-xs text-secondary">Cargando contactos...</p>}
          {!loading && filtered.length === 0 && (
            <p className="p-[var(--space-4)] text-xs text-secondary">Sin coincidencias.</p>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setTarget(c)}
              className="flex w-full flex-col gap-[2px] rounded-md px-[var(--space-4)] py-[var(--space-4)] text-left hover:bg-app"
            >
              <span className="text-sm font-semibold text-ink">{c.name || 'Contacto sin nombre'}</span>
              <span className="text-xs text-secondary">{c.phone}</span>
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>

      <ConfirmDialog
        open={target !== null}
        title="Fusionar contactos"
        description={
          target
            ? `¿Fusionar "${target.name || target.phone}" dentro de "${contact.name || contact.phone}"? Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Fusionar"
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
