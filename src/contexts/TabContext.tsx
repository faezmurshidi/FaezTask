'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Project } from '@/types';

interface Tab {
  id: string;
  type: 'project' | 'dashboard' | 'settings' | 'terminal';
  title: string;
  project?: Project;
  isActive: boolean;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (tab: Omit<Tab, 'isActive'>) => void;
  closeTab: (tabId: string) => void;
  switchToTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function useTabContext() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
}

interface TabProviderProps {
  children: ReactNode;
}

export function TabProvider({ children }: TabProviderProps) {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: 'dashboard',
      type: 'dashboard',
      title: 'Dashboard',
      isActive: true,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('dashboard');

  const openTab = (newTab: Omit<Tab, 'isActive'>) => {
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.id === newTab.id);
    if (existingTab) {
      switchToTab(newTab.id);
      return;
    }

    // Add new tab and make it active
    setTabs(prevTabs => 
      prevTabs.map(tab => ({ ...tab, isActive: false })).concat({
        ...newTab,
        isActive: true,
      })
    );
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: string) => {
    // Don't close if it's the only tab
    if (tabs.length <= 1) return;
    
    // Don't close the dashboard tab
    if (tabId === 'dashboard') return;

    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId);
      
      // If we closed the active tab, switch to the last tab
      if (tabId === activeTabId) {
        const newActiveTab = newTabs[newTabs.length - 1];
        setActiveTabId(newActiveTab.id);
        return newTabs.map(tab => ({
          ...tab,
          isActive: tab.id === newActiveTab.id,
        }));
      }
      
      return newTabs;
    });
  };

  const switchToTab = (tabId: string) => {
    setTabs(prevTabs =>
      prevTabs.map(tab => ({
        ...tab,
        isActive: tab.id === tabId,
      }))
    );
    setActiveTabId(tabId);
  };

  const updateTab = (tabId: string, updates: Partial<Tab>) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      )
    );
  };

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTabId,
        openTab,
        closeTab,
        switchToTab,
        updateTab,
      }}
    >
      {children}
    </TabContext.Provider>
  );
}