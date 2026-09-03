'use client';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  size?: 'md' | 'sm';
  label: string;
}

export function Tabs({ tabs, activeId, onChange, size = 'md', label }: TabsProps) {
  const isSmall = size === 'sm';
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`flex gap-[var(--space-7)] overflow-x-auto overflow-y-hidden border-b border-border ${isSmall ? 'text-xs' : 'text-sm'}`}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-[var(--space-2)] font-semibold transition-colors ${
              isSmall ? 'py-[var(--space-4)]' : 'py-[var(--space-5)]'
            } ${active ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
