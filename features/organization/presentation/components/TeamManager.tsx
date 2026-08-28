'use client';

import { useState } from 'react';
import { MEMBERSHIP_ROLES, type Membership, type MembershipRole } from '@/features/organization';
import { useTeamMembers } from '../hooks/useTeamMembers';

/**
 * Solo lectura/administración de miembros ya existentes (cambiar rol, revocar) — el alta de
 * usuarios nuevos vive exclusivamente en el backoffice del admin de plataforma (/platform),
 * ver docs/06-delivery/mvp-roadmap.md.
 */
export function TeamManager() {
  const { members, loading, actionPending, error, changeRole, revoke } = useTeamMembers();
  const [confirmingRevokeId, setConfirmingRevokeId] = useState<string | null>(null);

  if (loading) return <p className="text-sm text-secondary">Cargando...</p>;

  return (
    <div className="rounded-lg border border-border bg-surface">
      {error && (
        <p className="border-b border-border bg-danger-bg px-[var(--space-6)] py-[var(--space-5)] text-sm text-danger">
          {error}
        </p>
      )}

      {members.length === 0 ? (
        <p className="p-[var(--space-8)] text-sm text-secondary">Sin miembros todavía.</p>
      ) : (
        <ul className="divide-y divide-border">
          {members.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              actionPending={actionPending}
              confirmingRevoke={confirmingRevokeId === member.id}
              onRequestRevoke={() => setConfirmingRevokeId(member.id)}
              onCancelRevoke={() => setConfirmingRevokeId(null)}
              onConfirmRevoke={() => {
                revoke(member.id);
                setConfirmingRevokeId(null);
              }}
              onChangeRole={(role) => changeRole(member.id, role)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamMemberRow({
  member,
  actionPending,
  confirmingRevoke,
  onRequestRevoke,
  onCancelRevoke,
  onConfirmRevoke,
  onChangeRole,
}: {
  member: Membership;
  actionPending: boolean;
  confirmingRevoke: boolean;
  onRequestRevoke: () => void;
  onCancelRevoke: () => void;
  onConfirmRevoke: () => void;
  onChangeRole: (role: MembershipRole) => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-[var(--space-5)] px-[var(--space-7)] py-[var(--space-6)]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{member.name ?? '(sin nombre)'}</p>
        <p className="truncate text-xs text-secondary">{member.email ?? '—'}</p>
      </div>

      <span
        className={`size-2.5 shrink-0 rounded-full ${member.active ? 'bg-success' : 'bg-muted'}`}
        title={member.active ? 'Activo' : 'Revocado'}
      />

      <select
        value={member.role}
        onChange={(e) => onChangeRole(e.target.value as MembershipRole)}
        disabled={actionPending || !member.active}
        className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-3)] text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        {MEMBERSHIP_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>

      {member.active &&
        (confirmingRevoke ? (
          <div className="flex items-center gap-[var(--space-3)]">
            <span className="text-xs text-danger">¿Revocar acceso?</span>
            <button
              type="button"
              onClick={onCancelRevoke}
              disabled={actionPending}
              className="rounded-md border border-border px-[var(--space-4)] py-[var(--space-3)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmRevoke}
              disabled={actionPending}
              className="rounded-md bg-danger px-[var(--space-4)] py-[var(--space-3)] text-xs font-semibold text-on-brand hover:opacity-90 disabled:opacity-50"
            >
              Sí, revocar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onRequestRevoke}
            disabled={actionPending}
            className="rounded-md px-[var(--space-4)] py-[var(--space-3)] text-xs font-semibold text-danger hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
          >
            Revocar
          </button>
        ))}
    </li>
  );
}
