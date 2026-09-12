'use client';

import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { DashboardStatCards } from '../components/DashboardStatCards';
import { RecentConversationsCard } from '../components/RecentConversationsCard';
import { LifecycleFunnelCard } from '../components/LifecycleFunnelCard';
import { AutomationDeliveryCountsCard } from '@/features/automation/presentation/components/AutomationDeliveryCountsCard';
import { UsageProgressCard } from '@/features/usage/presentation/components/UsageProgressCard';

export function DashboardView() {
  const { contactStats, conversationStats, appointmentStats, recentConversations, aiUsage, loading, error } =
    useDashboardOverview();

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-surface px-[var(--space-7)] sm:px-[var(--space-9)]">
        <h1 className="text-base font-bold tracking-tight text-ink">Dashboard</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-[var(--space-9)]">
        {loading ? (
          <p className="text-sm text-secondary">Cargando...</p>
        ) : (
          <div className="flex flex-col gap-[var(--space-8)]">
            {error && (
              <p className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
            )}
            <DashboardStatCards
              contactStats={contactStats}
              conversationStats={conversationStats}
              appointmentStats={appointmentStats}
            />
            <div className="grid grid-cols-1 gap-[var(--space-8)] lg:grid-cols-2">
              <RecentConversationsCard items={recentConversations} />
              <LifecycleFunnelCard stats={contactStats} />
            </div>
            <div className="grid grid-cols-1 gap-[var(--space-8)] lg:grid-cols-2">
              <AutomationDeliveryCountsCard />
              {aiUsage && <UsageProgressCard usage={aiUsage} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
