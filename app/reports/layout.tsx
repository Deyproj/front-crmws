import { AppShell } from '@/components/layout/AppShell';
import { SectionLayout, type SectionNavGroup } from '@/components/layout/SectionLayout';

/**
 * Reportes (2026-09-16): lo que antes eran pestañas de solo lectura dentro de Configuración
 * (Encuestas, Consumo IA, Transferencias y el historial de automatizaciones) — Configuración quedó
 * solo para lo que se ajusta. Solo OWNER — lo exige `middleware.ts` para todo `/reports/**`.
 */
const REPORTS_NAV: SectionNavGroup[] = [
  {
    items: [
      { href: '/reports/usage', label: 'Consumo IA' },
      { href: '/reports/automations', label: 'Automatizaciones' },
      { href: '/reports/surveys', label: 'Encuestas' },
      { href: '/reports/transfers', label: 'Transferencias' },
    ],
  },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <SectionLayout title="Reportes" groups={REPORTS_NAV}>
        {children}
      </SectionLayout>
    </AppShell>
  );
}
