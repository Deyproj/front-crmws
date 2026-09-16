import { AppShell } from '@/components/layout/AppShell';
import { BroadcastsView } from '@/features/broadcast/presentation/views/BroadcastsView';

export default function BroadcastsPage() {
  return (
    <AppShell>
      <BroadcastsView />
    </AppShell>
  );
}
