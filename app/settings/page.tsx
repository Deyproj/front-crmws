import { AppShell } from '@/components/layout/AppShell';
import { ChannelSettingsView } from '@/features/channel/presentation/views/ChannelSettingsView';

export default function SettingsPage() {
  return (
    <AppShell>
      <ChannelSettingsView />
    </AppShell>
  );
}
