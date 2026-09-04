'use client';

import { cloneElement } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { useWaitingConversationsCount } from '@/features/conversations/presentation/hooks/useWaitingConversationsCount';
import { useMineConversationsCount } from '@/features/conversations/presentation/hooks/useMineConversationsCount';
import { MessageSquareIcon, UsersIcon, CalendarIcon, ClockIcon, SettingsIcon, LogOutIcon, XIcon } from '@/components/ui/icons';
import { BASE_PATH } from '@/lib/runtime/basePath';

/**
 * En pantallas <lg es un drawer que se desliza sobre el contenido (controlado por
 * AppShell vía `open`/`onClose`); en lg+ vuelve a ser la columna fija de siempre.
 * Ver docs/07-frontend/00-vision-and-scope.md#responsive.
 */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const waitingCount = useWaitingConversationsCount();
  const mineCount = useMineConversationsCount(user?.membershipId);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[var(--sidebar-width)] shrink-0 -translate-x-full flex-col justify-between bg-sidebar p-[var(--space-8)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-expressive)] lg:static lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : ''
        }`}
      >
        <div className="flex flex-col gap-[var(--space-10)]">
          <div className="flex items-center justify-between gap-[var(--space-5)]">
            <div className="flex items-center gap-[var(--space-5)]">
              <Image src={`${BASE_PATH}/logo-dinamo-fitness.png`} alt="Dinamo Fitness" width={282} height={81} className="h-7 w-auto" priority />
              <p className="text-lg font-bold text-on-dark">Dinabot</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="rounded-md p-2 text-on-dark-muted hover:bg-white/10 hover:text-on-dark lg:hidden"
            >
              <XIcon className="size-[18px]" />
            </button>
          </div>

          <nav className="flex flex-col gap-[var(--space-3)]">
            <NavItem
              href="/"
              icon={<MessageSquareIcon className="size-[18px]" />}
              active={pathname === '/'}
              badges={[
                { count: waitingCount, variant: 'solid', title: `${waitingCount} conversación${waitingCount === 1 ? '' : 'es'} esperando respuesta` },
                { count: mineCount, variant: 'tonal', title: `${mineCount} conversación${mineCount === 1 ? '' : 'es'} asignada${mineCount === 1 ? '' : 's'} a mí` },
              ]}
              onNavigate={onClose}
            >
              Conversaciones
            </NavItem>
            <NavItem href="/contacts" icon={<UsersIcon className="size-[18px]" />} active={pathname === '/contacts'} onNavigate={onClose}>
              Clientes
            </NavItem>
            <NavItem href="/agenda" icon={<CalendarIcon className="size-[18px]" />} active={pathname === '/agenda'} onNavigate={onClose}>
              Agenda
            </NavItem>
            <NavItem href="/followups" icon={<ClockIcon className="size-[18px]" />} active={pathname === '/followups'} onNavigate={onClose}>
              Seguimientos
            </NavItem>
            {user?.role === 'OWNER' && (
              <NavItem href="/settings" icon={<SettingsIcon className="size-[18px]" />} active={pathname === '/settings'} onNavigate={onClose}>
                Configuración
              </NavItem>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-[var(--space-6)]">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-on-brand">
            {(user?.name ?? '?').slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-on-dark">{user?.name ?? ''}</p>
            {/* <p className="truncate text-xs text-on-dark-muted">{user?.organizationId ?? ''}</p> */}
          </div>
          <button
            type="button"
            onClick={() => logout()}
            title="Cerrar sesión"
            className="shrink-0 rounded-md p-2 text-on-dark-muted transition-colors hover:bg-white/10 hover:text-on-dark"
          >
            <LogOutIcon className="size-[18px]" />
          </button>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  href,
  icon,
  active,
  disabled,
  badges,
  onNavigate,
  children,
}: {
  href?: string;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  active?: boolean;
  disabled?: boolean;
  badges?: { count: number; variant: 'solid' | 'tonal'; title: string }[];
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  const className = `flex items-center gap-[var(--space-6)] rounded-md px-[var(--space-6)] py-[var(--space-5)] text-sm font-medium transition-colors ${
    active ? 'bg-brand text-on-dark font-semibold' : 'text-on-dark-muted'
  } ${disabled ? 'cursor-not-allowed opacity-40' : 'hover:text-on-dark'}`;
  // El ítem activo también refuerza el trazo del ícono (no solo el fondo) — parte de la
  // escala de contraste más expresiva del rediseño 2026-08-31.
  const content = (
    <>
      {active ? cloneElement(icon, { strokeWidth: 2.5 }) : icon}
      <span className="flex-1">{children}</span>
      {badges?.filter((b) => b.count > 0).map((b) => (
        <NavBadge key={b.variant} count={b.count} variant={b.variant} title={b.title} />
      ))}
    </>
  );

  if (disabled || !href) {
    return (
      <span className={className} aria-disabled title="Próximamente">
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={className} onClick={onNavigate}>
      {content}
    </Link>
  );
}

/**
 * Contador junto al ítem de navegación. `solid` (rojo, alto contraste) se reserva para
 * lo urgente — "Esperando"; `tonal` (fondo claro, texto de color) es la variante de
 * menor peso visual para indicadores informativos como "Mías", así el ojo va primero
 * a lo que necesita acción.
 */
function NavBadge({ count, variant, title }: { count: number; variant: 'solid' | 'tonal'; title: string }) {
  const variantClass = variant === 'solid' ? 'bg-danger text-on-brand' : 'bg-info-bg text-info';
  return (
    <span
      className={`flex h-5 min-w-5 shrink-0 animate-badge-pop items-center justify-center rounded-full ${variantClass} px-[var(--space-3)] text-[11px] font-bold leading-none`}
      title={title}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
