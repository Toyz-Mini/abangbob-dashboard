'use client';

import { useState, createContext, useContext, ReactNode, useCallback, useId } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: 'default' | 'pills';
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

interface TabsProps {
  children: ReactNode;
  defaultTab?: string;
  variant?: 'default' | 'pills';
  onChange?: (tabId: string) => void;
  className?: string;
}

export default function Tabs({ 
  children, 
  defaultTab, 
  variant = 'default',
  onChange,
  className = '' 
}: TabsProps) {
  const [activeTab, setActiveTabState] = useState(defaultTab || '');

  const setActiveTab = useCallback((id: string) => {
    setActiveTabState(id);
    onChange?.(id);
  }, [onChange]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant }}>
      <div className={`tabs ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  const { variant } = useTabsContext();
  return (
    <div 
      className={`tabs-list ${variant === 'pills' ? 'tabs-list-pills' : ''} ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabTriggerProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function TabTrigger({ id, children, disabled = false, className = '' }: TabTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === id;
  const tabId = useId();

  return (
    <button
      id={`tab-${tabId}`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${tabId}`}
      data-state={isActive ? 'active' : 'inactive'}
      className={`tab-trigger ${className}`}
      onClick={() => !disabled && setActiveTab(id)}
      disabled={disabled}
      tabIndex={isActive ? 0 : -1}
    >
      {children}
    </button>
  );
}

interface TabContentProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function TabContent({ id, children, className = '' }: TabContentProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === id;
  const panelId = useId();

  return (
    <div
      id={`panel-${panelId}`}
      role="tabpanel"
      aria-labelledby={`tab-${panelId}`}
      data-state={isActive ? 'active' : 'inactive'}
      className={`tab-panel ${className}`}
      hidden={!isActive}
    >
      {isActive && (
        <div className="tab-content">
          {children}
        </div>
      )}
    </div>
  );
}

// Convenience component for simple tabs
interface SimpleTabsProps {
  tabs: Array<{
    id: string;
    label: ReactNode;
    content: ReactNode;
    disabled?: boolean;
  }>;
  defaultTab?: string;
  variant?: 'default' | 'pills';
  onChange?: (tabId: string) => void;
  className?: string;
}

export function SimpleTabs({ tabs, defaultTab, variant, onChange, className }: SimpleTabsProps) {
  const defaultId = defaultTab || tabs[0]?.id;

  return (
    <Tabs defaultTab={defaultId} variant={variant} onChange={onChange} className={className}>
      <TabsList>
        {tabs.map(tab => (
          <TabTrigger key={tab.id} id={tab.id} disabled={tab.disabled}>
            {tab.label}
          </TabTrigger>
        ))}
      </TabsList>
      {tabs.map(tab => (
        <TabContent key={tab.id} id={tab.id}>
          {tab.content}
        </TabContent>
      ))}
    </Tabs>
  );
}




