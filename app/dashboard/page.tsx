import { AppShell } from '@/components/layout/AppShell';
import { DashboardView } from '@/features/dashboard/presentation/views/DashboardView';

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  );
}
