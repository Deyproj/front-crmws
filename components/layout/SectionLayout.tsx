'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SectionNavItem {
  href: string;
  label: string;
}

export interface SectionNavGroup {
  /** Sin título = el grupo se muestra sin encabezado (útil cuando la sección tiene un solo grupo). */
  title?: string;
  items: SectionNavItem[];
}

/**
 * Pantalla con navegación secundaria por rutas (Configuración, Reportes) — reemplazó el 2026-09-16
 * las pestañas anidadas en memoria que tenía `ChannelSettingsView`: cada sección tiene su propia URL
 * (se puede enlazar, recargar y usar Atrás). En lg+ el menú es una columna a la izquierda agrupada;
 * en pantallas más chicas es una fila horizontal con scroll, sin los títulos de grupo.
 *
 * La coincidencia del ítem activo es exacta (no por prefijo): `/settings/agent` y
 * `/settings/agent/knowledge` son ítems hermanos del mismo grupo.
 */
export function SectionLayout({
  title,
  groups,
  children,
}: {
  title: string;
  groups: SectionNavGroup[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = groups.flatMap((group) => group.items);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-surface px-[var(--space-7)] sm:px-[var(--space-9)]">
        <h1 className="text-base font-bold tracking-tight text-ink">{title}</h1>
      </header>

      <nav
        aria-label={`Secciones de ${title.toLowerCase()}`}
        className="flex shrink-0 gap-[var(--space-7)] overflow-x-auto overflow-y-hidden border-b border-border bg-surface px-[var(--space-7)] text-sm sm:px-[var(--space-9)] lg:hidden"
      >
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-[var(--space-2)] py-[var(--space-5)] font-semibold transition-colors ${
                active ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label={`Secciones de ${title.toLowerCase()}`}
          className="hidden w-56 shrink-0 flex-col gap-[var(--space-8)] overflow-y-auto border-r border-border bg-surface p-[var(--space-7)] lg:flex"
        >
          {groups.map((group, index) => (
            <div key={group.title ?? index} className="flex flex-col gap-[var(--space-2)]">
              {group.title && (
                <p className="px-[var(--space-5)] pb-[var(--space-2)] text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-md px-[var(--space-5)] py-[var(--space-4)] text-sm transition-colors ${
                      active ? 'bg-brand/10 font-semibold text-brand' : 'text-secondary hover:bg-app hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="min-w-0 flex-1 overflow-y-auto p-[var(--space-7)] sm:p-[var(--space-9)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-[var(--space-7)]">{children}</div>
        </div>
      </div>
    </div>
  );
}
