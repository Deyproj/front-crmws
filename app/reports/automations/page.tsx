import { AUTOMATION_KINDS } from '@/features/automation';
import { AutomationHistoryView } from '@/features/automation/presentation/views/AutomationHistoryView';

/** `?kind=` llega desde el enlace "Ver envíos en Reportes" de cada tarjeta de Configuración → Automatizaciones. */
export default async function ReportsAutomationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { kind } = await searchParams;
  const initialKind = AUTOMATION_KINDS.find((k) => k === kind) ?? null;
  return <AutomationHistoryView key={initialKind ?? 'all'} initialKind={initialKind} />;
}
