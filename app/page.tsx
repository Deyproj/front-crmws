import { AppShell } from '@/components/layout/AppShell';
import { ConversationsView } from '@/features/conversations/presentation/views/ConversationsView';

export default function Home() {
  return (
    <AppShell>
      <ConversationsView />
    </AppShell>
  );
}
