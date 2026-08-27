'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { MessageSquareIcon, UsersIcon, SettingsIcon, LogOutIcon } from '@/components/ui/icons';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MEMBER: 'Asesor',
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-[var(--sidebar-width)] shrink-0 flex-col justify-between bg-sidebar p-[var(--space-8)]">
      <div className="flex flex-col gap-[var(--space-10)]">
        <div className="flex items-center gap-[var(--space-5)]">
          <div className="flex size-8 items-center justify-center rounded-md bg-brand text-on-brand font-bold">C</div>
          <p className="text-lg font-bold text-on-dark">CRMWS</p>
        </div>

        <nav className="flex flex-col gap-[var(--space-3)]">
          <NavItem href="/" icon={<MessageSquareIcon className="size-[18px]" />} active={pathname === '/'}>
            Conversaciones
          </NavItem>
          <NavItem href="/contacts" icon={<UsersIcon className="size-[18px]" />} active={pathname === '/contacts'}>
            Clientes
          </NavItem>
          <NavItem href="/settings" icon={<SettingsIcon className="size-[18px]" />} active={pathname === '/settings'}>
            Configuración
          </NavItem>
        </nav>
      </div>

      <div className="flex items-center gap-[var(--space-6)]">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-on-brand">
          {(user?.role ?? '?').slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-on-dark">{user ? (ROLE_LABELS[user.role] ?? user.role) : ''}</p>
          <p className="truncate text-xs text-on-dark-muted">{user?.organizationId ?? ''}</p>
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
  );
}

function NavItem({
  href,
  icon,
  active,
  disabled,
  children,
}: {
  href?: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const className = `flex items-center gap-[var(--space-6)] rounded-md px-[var(--space-6)] py-[var(--space-5)] text-sm font-medium transition-colors ${
    active ? 'bg-brand text-on-dark font-semibold' : 'text-on-dark-muted'
  } ${disabled ? 'cursor-not-allowed opacity-40' : 'hover:text-on-dark'}`;

  if (disabled || !href) {
    return (
      <span className={className} aria-disabled title="Próximamente">
        {icon}
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      {icon}
      {children}
    </Link>
  );
}
