/**
 * Estado vacío reutilizable — reemplaza las líneas de texto gris sueltas que tenía cada
 * pantalla ("Sin conversaciones.", "Selecciona una conversación", etc.) por un tratamiento
 * consistente con ícono, título y texto de apoyo. Agregado 2026-08-31 (rediseño de
 * personalidad) porque el patrón ya se repetía en 6+ lugares — ver
 * guia_completa_sistema_diseno_frontend.md sobre cuándo sacar algo a un componente.
 */
import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  className = '',
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center gap-[var(--space-6)] p-[var(--space-9)] text-center ${className}`}>
      <div className="flex size-14 items-center justify-center rounded-full bg-app text-secondary">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && <p className="mt-[var(--space-3)] max-w-xs text-xs text-secondary">{description}</p>}
      </div>
    </div>
  );
}
