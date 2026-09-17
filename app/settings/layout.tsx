import { AppShell } from '@/components/layout/AppShell';
import { SectionLayout, type SectionNavGroup } from '@/components/layout/SectionLayout';

/**
 * Orden = orden de puesta en marcha de una organización nueva: primero el canal y sus plantillas,
 * después el agente, y al final lo que corre solo (automatizaciones) y el equipo. Solo OWNER —
 * lo exige `middleware.ts` para todo `/settings/**`.
 */
const SETTINGS_NAV: SectionNavGroup[] = [
  
  {
    title: 'Agente IA',
    items: [
      { href: '/settings/agent', label: 'General' },
      { href: '/settings/agent/knowledge', label: 'Conocimiento' },
      { href: '/settings/agent/playground', label: 'Probar agente' },
    ],
  },
  {
    title: 'Organización',
    items: [
      { href: '/settings/automations', label: 'Automatizaciones' },
      { href: '/settings/team', label: 'Equipo' },
    ],
  },
  {
    title: 'WhatsApp',
    items: [
      { href: '/settings/whatsapp', label: 'Canales' },
      { href: '/settings/templates', label: 'Plantillas de Meta' },
    ],
  }
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <SectionLayout title="Configuración" groups={SETTINGS_NAV}>
        {children}
      </SectionLayout>
    </AppShell>
  );
}
