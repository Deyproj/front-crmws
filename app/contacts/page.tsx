import { AppShell } from '@/components/layout/AppShell';
import { ContactsView } from '@/features/contacts/presentation/views/ContactsView';

export default function ContactsPage() {
  return (
    <AppShell>
      <ContactsView />
    </AppShell>
  );
}
