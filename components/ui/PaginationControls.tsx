'use client';

/** Anterior / "Página X de Y" / Siguiente — no se muestra si todo cabe en una página. */
export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: {
  /** Base 0, igual que `PageResponse.page` del backend. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (totalPages <= 1) return null;
  const buttonClass =
    'rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <div className="flex items-center justify-end gap-[var(--space-4)] text-sm">
      <button type="button" disabled={disabled || page <= 0} onClick={() => onPageChange(page - 1)} className={buttonClass}>
        Anterior
      </button>
      <span className="text-secondary">
        Página {page + 1} de {totalPages}
      </span>
      <button
        type="button"
        disabled={disabled || page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={buttonClass}
      >
        Siguiente
      </button>
    </div>
  );
}
