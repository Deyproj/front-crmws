import { AutomationToggle } from '@/features/organization/presentation/components/AutomationToggle';
import { AgentConfigForm } from '@/features/agent/presentation/components/AgentConfigForm';

export default function SettingsAgentPage() {
  return (
    <>
      <AutomationToggle />
      <AgentConfigForm />
    </>
  );
}
