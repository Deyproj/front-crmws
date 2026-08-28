import { AppShell } from '@/components/layout/AppShell';
import { AgendaView } from '@/features/appointments/presentation/views/AgendaView';

export default function AgendaPage() {
  return (
    <AppShell>
      <AgendaView />
    </AppShell>
  );
}
