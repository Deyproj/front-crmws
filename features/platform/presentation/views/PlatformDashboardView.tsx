'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { LogOutIcon, PlusIcon, UsersIcon, ZapIcon } from '@/components/ui/icons';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { usePlatformDashboard } from '../hooks/usePlatformDashboard';
import { AiUsageSection } from '../components/AiUsageSection';
import { AiModelPricesManager } from '../components/AiModelPricesManager';
import {
  MEMBERSHIP_ROLES,
  ORGANIZATION_STATUSES,
  type MembershipRole,
  type OrganizationAiPlanPayload,
  type OrganizationStatus,
  type PlatformMember,
  type PlatformOrganization,
  type PlatformOrganizationUsage,
} from '@/features/platform';

const DETAIL_TABS = [
  { id: 'team', label: 'Equipo' },
  { id: 'usage', label: 'Consumo IA' },
];

export function PlatformDashboardView() {
  const { logout } = useAuth();
  const router = useRouter();
  const {
    organizations,
    organizationsUsage,
    loading,
    actionPending,
    error,
    lastTemporaryPassword,
    dismissTemporaryPassword,
    provisionOrganization,
    provisionTeamMember,
    loadMembers,
    changeRole,
    revoke,
    activate,
    resetPassword,
    changeStatus,
    saveAiPlan,
  } = usePlatformDashboard();
  const [creatingOrganization, setCreatingOrganization] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  const kpis = useMemo(() => {
    const usageEntries = Object.values(organizationsUsage);
    const active = organizations.filter((o) => o.status === 'ACTIVE').length;
    const withPlan = usageEntries.filter((entry) => entry.usage.planConfigured).length;
    const totalInteractions = usageEntries.reduce((sum, entry) => sum + entry.usage.usedInteractions, 0);
    return { total: organizations.length, active, withPlan, totalInteractions };
  }, [organizations, organizationsUsage]);

  return (
    // dvh, no screen: 100vh no descuenta la barra de direcciones en móvil (ver LoginView.tsx)
    <div className="flex h-full min-h-dvh flex-col bg-app">
      <header className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-y-[var(--space-3)] border-b border-border bg-surface px-[var(--space-7)] py-[var(--space-3)] sm:px-[var(--space-9)]">
        <h1 className="text-base font-bold tracking-tight text-ink">Admin de plataforma</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-[var(--space-3)] rounded-md px-3 py-2 text-sm font-semibold text-secondary hover:bg-app hover:text-ink"
        >
          <LogOutIcon className="size-[18px]" />
          Cerrar sesión
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-[var(--space-9)]">
        <div className="mx-auto flex max-w-4xl flex-col gap-[var(--space-9)]">
          {lastTemporaryPassword && (
            <TemporaryPasswordBanner password={lastTemporaryPassword} onDismiss={dismissTemporaryPassword} />
          )}

          {error && (
            <p className="rounded-md border border-danger/30 bg-danger-bg px-[var(--space-6)] py-[var(--space-5)] text-sm text-danger">
              {error}
            </p>
          )}

          {!loading && organizations.length > 0 && (
            <div className="grid grid-cols-2 gap-[var(--space-6)] sm:grid-cols-4">
              <KpiCard label="Organizaciones" value={kpis.total} />
              <KpiCard label="Activas" value={kpis.active} />
              <KpiCard label="Con paquete de IA" value={kpis.withPlan} />
              <KpiCard label="Interacciones IA (período)" value={kpis.totalInteractions.toLocaleString('es-CO')} />
            </div>
          )}

          <section className="flex flex-col gap-[var(--space-5)]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase text-muted">Organizaciones</h2>
              {!creatingOrganization && (
                <button
                  type="button"
                  onClick={() => setCreatingOrganization(true)}
                  className="flex items-center gap-[var(--space-3)] rounded-md bg-brand px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-on-brand hover:bg-brand-hover"
                >
                  <PlusIcon className="size-[14px]" />
                  Nueva organización
                </button>
              )}
            </div>

            {creatingOrganization && (
              <NewOrganizationForm
                actionPending={actionPending}
                onSubmit={async (payload) => {
                  const result = await provisionOrganization(payload);
                  setCreatingOrganization(false);
                  return result;
                }}
                onCancel={() => setCreatingOrganization(false)}
              />
            )}

            {loading ? (
              <p className="text-sm text-secondary">Cargando...</p>
            ) : organizations.length === 0 ? (
              <EmptyState
                icon={<UsersIcon className="size-[22px]" />}
                title="Todavía no hay organizaciones creadas"
                description="Crea la primera organización para dar de alta a su dueño y empezar a operar."
              />
            ) : (
              <div className="flex flex-col gap-[var(--space-6)]">
                {organizations.map((organization) => (
                  <OrganizationRow
                    key={organization.id}
                    organization={organization}
                    usage={organizationsUsage[organization.id]}
                    actionPending={actionPending}
                    onAddTeamMember={(payload) => provisionTeamMember(organization.id, payload)}
                    onLoadMembers={() => loadMembers(organization.id)}
                    onChangeRole={(membershipId, role) => changeRole(organization.id, membershipId, role)}
                    onRevoke={(membershipId) => revoke(organization.id, membershipId)}
                    onActivate={(membershipId) => activate(organization.id, membershipId)}
                    onResetPassword={(membershipId) => resetPassword(organization.id, membershipId)}
                    onChangeStatus={(status) => changeStatus(organization.id, status)}
                    onSaveAiPlan={(payload) => saveAiPlan(organization.id, payload)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-[var(--space-5)]">
            <h2 className="text-sm font-semibold uppercase text-muted">Precios de modelos de IA</h2>
            <div className="rounded-xl border border-border bg-surface p-[var(--space-8)]">
              <AiModelPricesManager />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-[var(--space-7)]">
      <p className="text-2xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs text-secondary">{label}</p>
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
    <div className="rounded-xl border border-warning/40 bg-warning-bg p-[var(--space-8)]">
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
  onCancel,
}: {
  actionPending: boolean;
  onSubmit: (payload: {
    ownerName: string;
    ownerEmail: string;
    organizationName: string;
    organizationSlug: string;
    timezone: string;
  }) => Promise<unknown>;
  onCancel: () => void;
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
      className="grid grid-cols-1 gap-[var(--space-6)] rounded-xl border border-border bg-surface p-[var(--space-8)] sm:grid-cols-2"
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
      <div className="flex items-end gap-[var(--space-4)] sm:col-span-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={actionPending}
          className="rounded-md border border-border px-[var(--space-7)] py-[var(--space-5)] text-sm font-semibold text-ink hover:bg-app disabled:opacity-50"
        >
          Cancelar
        </button>
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
  usage,
  actionPending,
  onAddTeamMember,
  onLoadMembers,
  onChangeRole,
  onRevoke,
  onActivate,
  onResetPassword,
  onChangeStatus,
  onSaveAiPlan,
}: {
  organization: PlatformOrganization;
  usage: PlatformOrganizationUsage | undefined;
  actionPending: boolean;
  onAddTeamMember: (payload: { name: string; email: string; role: MembershipRole }) => Promise<unknown>;
  onLoadMembers: () => Promise<PlatformMember[]>;
  onChangeRole: (membershipId: string, role: MembershipRole) => Promise<unknown>;
  onRevoke: (membershipId: string) => Promise<unknown>;
  onActivate: (membershipId: string) => Promise<unknown>;
  onResetPassword: (membershipId: string) => Promise<unknown>;
  onChangeStatus: (status: OrganizationStatus) => Promise<unknown>;
  onSaveAiPlan: (payload: OrganizationAiPlanPayload) => Promise<unknown>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detailTab, setDetailTab] = useState(DETAIL_TABS[0].id);
  const [members, setMembers] = useState<PlatformMember[] | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MembershipRole>('ADVISOR');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    title: string;
    description: string;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  async function refreshMembers() {
    setMembersLoading(true);
    setMembersError(null);
    try {
      setMembers(await onLoadMembers());
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'No se pudieron cargar los miembros');
    } finally {
      setMembersLoading(false);
    }
  }

  async function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    if (next && members === null) {
      await refreshMembers();
    }
  }

  async function handleRoleChange(membershipId: string, newRole: MembershipRole) {
    setMembersError(null);
    try {
      await onChangeRole(membershipId, newRole);
      await refreshMembers();
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'No se pudo cambiar el rol');
    }
  }

  function handleRevoke(membershipId: string) {
    setPendingConfirmation({
      title: 'Revocar acceso',
      description: '¿Revocar el acceso de este miembro a la organización?',
      destructive: true,
      onConfirm: () => runRevoke(membershipId),
    });
  }

  async function runRevoke(membershipId: string) {
    setPendingConfirmation(null);
    setMembersError(null);
    try {
      await onRevoke(membershipId);
      await refreshMembers();
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'No se pudo revocar el miembro');
    }
  }

  function handleStatusChange(newStatus: OrganizationStatus) {
    if (newStatus !== 'ACTIVE') {
      setPendingConfirmation({
        title: 'Cambiar estado de la organización',
        description: `¿Cambiar la organización a ${newStatus}? Todos sus miembros perderán acceso de inmediato, incluida cualquier sesión ya iniciada.`,
        destructive: true,
        onConfirm: () => runStatusChange(newStatus),
      });
      return;
    }
    runStatusChange(newStatus);
  }

  async function runStatusChange(newStatus: OrganizationStatus) {
    setPendingConfirmation(null);
    setStatusError(null);
    try {
      await onChangeStatus(newStatus);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'No se pudo cambiar el estado');
    }
  }

  function handleResetPassword(membershipId: string) {
    setPendingConfirmation({
      title: 'Resetear contraseña',
      description: '¿Resetear la contraseña de este miembro? Su contraseña actual dejará de funcionar.',
      destructive: true,
      onConfirm: () => runResetPassword(membershipId),
    });
  }

  async function runResetPassword(membershipId: string) {
    setPendingConfirmation(null);
    setMembersError(null);
    try {
      await onResetPassword(membershipId);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'No se pudo resetear la contraseña');
    }
  }

  async function handleActivate(membershipId: string) {
    setMembersError(null);
    try {
      await onActivate(membershipId);
      await refreshMembers();
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'No se pudo reactivar el miembro');
    }
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onAddTeamMember({ name, email, role });
    setName('');
    setEmail('');
    setRole('ADVISOR');
    setAddingMember(false);
    await refreshMembers();
  }

  const usagePercentage = usage?.usage.planConfigured ? usage.usage.usagePercentage : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-[var(--space-7)]">
      {statusError && <p className="mb-[var(--space-4)] text-sm text-danger">{statusError}</p>}
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-5)]">
        <div className="flex min-w-0 items-center gap-[var(--space-5)]">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-on-brand">
            {organization.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{organization.name}</p>
            <div className="flex flex-wrap items-center gap-x-[var(--space-4)] gap-y-1">
              <p className="text-xs text-secondary">{organization.slug}</p>
              {usagePercentage !== null && <UsagePill percentage={usagePercentage} />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[var(--space-4)]">
          <select
            value={organization.status}
            disabled={actionPending}
            onChange={(e) => handleStatusChange(e.target.value as OrganizationStatus)}
            className={`rounded-md border px-[var(--space-4)] py-[var(--space-3)] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50 ${
              organization.status === 'ACTIVE'
                ? 'border-border bg-app text-ink'
                : 'border-danger/30 bg-danger-bg text-danger'
            }`}
          >
            {ORGANIZATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleExpanded}
            className="rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app"
          >
            {expanded ? 'Ocultar detalle' : 'Ver detalle'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-[var(--space-6)] flex flex-col gap-[var(--space-6)] border-t border-border pt-[var(--space-6)]">
          <Tabs tabs={DETAIL_TABS} activeId={detailTab} onChange={setDetailTab} size="sm" label="Detalle de la organización" />

          {detailTab === 'usage' && (
            <AiUsageSection usage={usage?.usage} actionPending={actionPending} onSavePlan={onSaveAiPlan} />
          )}

          {detailTab === 'team' && (
            <div className="flex flex-col gap-[var(--space-5)]">
              {membersError && <p className="text-sm text-danger">{membersError}</p>}

              {membersLoading ? (
                <p className="text-sm text-secondary">Cargando miembros...</p>
              ) : members && members.length > 0 ? (
                <ul className="flex flex-col gap-[var(--space-4)]">
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className={`flex flex-wrap items-center justify-between gap-[var(--space-4)] rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] ${
                        member.active ? '' : 'opacity-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-[var(--space-3)]">
                          <p className="text-sm font-medium text-ink">{member.name ?? '—'}</p>
                          {!member.active && (
                            <span className="rounded-full border border-danger/30 bg-danger-bg px-[var(--space-3)] py-[2px] text-[10px] font-semibold uppercase text-danger">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondary">{member.email ?? '—'}</p>
                      </div>
                      {member.active ? (
                        <div className="flex items-center gap-[var(--space-4)]">
                          <select
                            value={member.role}
                            disabled={actionPending}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as MembershipRole)}
                            className="rounded-md border border-border bg-surface px-[var(--space-4)] py-[var(--space-3)] text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand"
                          >
                            {MEMBERSHIP_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={actionPending}
                            onClick={() => handleResetPassword(member.id)}
                            className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Resetear contraseña
                          </button>
                          <button
                            type="button"
                            disabled={actionPending}
                            onClick={() => handleRevoke(member.id)}
                            className="rounded-md border border-danger/30 px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-danger hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Revocar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-[var(--space-4)]">
                          <p className="text-xs text-secondary">Sin acceso — revocado</p>
                          <button
                            type="button"
                            disabled={actionPending}
                            onClick={() => handleActivate(member.id)}
                            className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reactivar
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<UsersIcon className="size-[18px]" />}
                  title="Todavía no hay miembros en esta organización"
                  className="p-[var(--space-6)]"
                />
              )}

              {addingMember ? (
                <form
                  onSubmit={handleAddSubmit}
                  className="grid grid-cols-1 gap-[var(--space-5)] border-t border-border pt-[var(--space-6)] sm:grid-cols-4"
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
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingMember(true)}
                  className="self-start rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app"
                >
                  Agregar asesor
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        open={pendingConfirmation !== null}
        title={pendingConfirmation?.title ?? ''}
        description={pendingConfirmation?.description}
        destructive={pendingConfirmation?.destructive}
        confirmLabel="Confirmar"
        onConfirm={() => pendingConfirmation?.onConfirm()}
        onCancel={() => setPendingConfirmation(null)}
      />
    </div>
  );
}

/** Vistazo rápido del consumo de IA sin tener que abrir el detalle — solo cuando hay plan configurado. */
function UsagePill({ percentage }: { percentage: number }) {
  const variantClass =
    percentage > 100 ? 'bg-danger-bg text-danger' : percentage >= 90 ? 'bg-warning-bg text-warning' : 'bg-info-bg text-info';
  return (
    <span className={`flex items-center gap-1 rounded-full px-[var(--space-3)] py-[1px] text-[10px] font-semibold ${variantClass}`}>
      <ZapIcon className="size-[10px]" />
      {percentage.toFixed(0)}% del paquete IA
    </span>
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
