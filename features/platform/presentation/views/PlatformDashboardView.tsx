'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { LogOutIcon } from '@/components/ui/icons';
import { usePlatformDashboard } from '../hooks/usePlatformDashboard';
import { MEMBERSHIP_ROLES, type MembershipRole, type PlatformOrganization } from '@/features/platform';

export function PlatformDashboardView() {
  const { logout } = useAuth();
  const {
    organizations,
    loading,
    actionPending,
    error,
    lastTemporaryPassword,
    dismissTemporaryPassword,
    provisionOrganization,
    provisionTeamMember,
  } = usePlatformDashboard();

  return (
    <div className="flex h-full min-h-screen flex-col bg-app">
      <header className="flex h-[var(--topbar-height)] shrink-0 items-center justify-between border-b border-border bg-surface px-[var(--space-9)]">
        <h1 className="text-xl font-bold text-ink">Admin de plataforma</h1>
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-[var(--space-3)] rounded-md px-3 py-2 text-sm font-semibold text-secondary hover:bg-app hover:text-ink"
        >
          <LogOutIcon className="size-[18px]" />
          Cerrar sesión
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-[var(--space-9)]">
        <div className="mx-auto flex max-w-3xl flex-col gap-[var(--space-9)]">
          {lastTemporaryPassword && (
            <TemporaryPasswordBanner password={lastTemporaryPassword} onDismiss={dismissTemporaryPassword} />
          )}

          {error && (
            <p className="rounded-md border border-danger/30 bg-danger-bg px-[var(--space-6)] py-[var(--space-5)] text-sm text-danger">
              {error}
            </p>
          )}

          <section className="flex flex-col gap-[var(--space-5)]">
            <h2 className="text-sm font-semibold uppercase text-muted">Nueva organización</h2>
            <NewOrganizationForm actionPending={actionPending} onSubmit={provisionOrganization} />
          </section>

          <section className="flex flex-col gap-[var(--space-5)]">
            <h2 className="text-sm font-semibold uppercase text-muted">Organizaciones</h2>
            {loading ? (
              <p className="text-sm text-secondary">Cargando...</p>
            ) : organizations.length === 0 ? (
              <p className="text-sm text-secondary">Todavía no hay organizaciones creadas.</p>
            ) : (
              <div className="flex flex-col gap-[var(--space-6)]">
                {organizations.map((organization) => (
                  <OrganizationRow
                    key={organization.id}
                    organization={organization}
                    actionPending={actionPending}
                    onAddTeamMember={(payload) => provisionTeamMember(organization.id, payload)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function TemporaryPasswordBanner({ password, onDismiss }: { password: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-lg border border-warning/40 bg-warning-bg p-[var(--space-8)]">
      <p className="mb-[var(--space-4)] text-sm font-semibold text-ink">
        Contraseña temporal — cópiala ahora, no se volverá a mostrar
      </p>
      <div className="flex items-center gap-[var(--space-5)]">
        <code className="flex-1 rounded-md border border-border bg-surface px-[var(--space-6)] py-[var(--space-4)] text-sm text-ink">
          {password}
        </code>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-border bg-surface px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app"
        >
          {copied ? 'Copiada' : 'Copiar'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-secondary hover:text-ink"
        >
          Ocultar
        </button>
      </div>
      <p className="mt-[var(--space-4)] text-xs text-secondary">
        Compártela por un canal seguro (WhatsApp, llamada). Se pedirá cambiarla en el primer inicio de sesión.
      </p>
    </div>
  );
}

function NewOrganizationForm({
  actionPending,
  onSubmit,
}: {
  actionPending: boolean;
  onSubmit: (payload: {
    ownerName: string;
    ownerEmail: string;
    organizationName: string;
    organizationSlug: string;
    timezone: string;
  }) => Promise<unknown>;
}) {
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [timezone, setTimezone] = useState('America/Bogota');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({ ownerName, ownerEmail, organizationName, organizationSlug, timezone });
    setOwnerName('');
    setOwnerEmail('');
    setOrganizationName('');
    setOrganizationSlug('');
  }

  const inputClass =
    'w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-[var(--space-6)] rounded-lg border border-border bg-surface p-[var(--space-8)] sm:grid-cols-2"
    >
      <Field label="Nombre del dueño">
        <input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Email del dueño">
        <input
          required
          type="email"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Nombre de la organización">
        <input
          required
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Slug (identificador único)">
        <input
          required
          value={organizationSlug}
          onChange={(e) => setOrganizationSlug(e.target.value)}
          placeholder="ej. dinamo-fitness"
          className={inputClass}
        />
      </Field>
      <Field label="Zona horaria">
        <input required value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass} />
      </Field>
      <div className="flex items-end sm:col-span-2">
        <button
          type="submit"
          disabled={actionPending}
          className="rounded-md bg-brand px-[var(--space-7)] py-[var(--space-5)] text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Crear organización
        </button>
      </div>
    </form>
  );
}

function OrganizationRow({
  organization,
  actionPending,
  onAddTeamMember,
}: {
  organization: PlatformOrganization;
  actionPending: boolean;
  onAddTeamMember: (payload: { name: string; email: string; role: MembershipRole }) => Promise<unknown>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MembershipRole>('ADVISOR');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onAddTeamMember({ name, email, role });
    setName('');
    setEmail('');
    setRole('ADVISOR');
    setExpanded(false);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-[var(--space-7)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{organization.name}</p>
          <p className="text-xs text-secondary">
            {organization.slug} · {organization.status}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app"
        >
          {expanded ? 'Cancelar' : 'Agregar asesor'}
        </button>
      </div>

      {expanded && (
        <form
          onSubmit={handleSubmit}
          className="mt-[var(--space-6)] grid grid-cols-1 gap-[var(--space-5)] border-t border-border pt-[var(--space-6)] sm:grid-cols-4"
        >
          <input
            required
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand sm:col-span-1"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand sm:col-span-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as MembershipRole)}
            className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand sm:col-span-1"
          >
            {MEMBERSHIP_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={actionPending}
            className="rounded-md bg-brand px-[var(--space-6)] py-[var(--space-4)] text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1"
          >
            Crear
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}
