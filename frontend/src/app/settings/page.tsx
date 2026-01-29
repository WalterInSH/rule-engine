'use client';

import { useState } from 'react';
import ApiKeyManager from '../../components/settings/ApiKeyManager';
import ExecutionLogStorageSettings from '../../components/settings/ExecutionLogStorageSettings';
import { Shield, Server, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabId = 'security' | 'logs';

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
  description: string;
}

const tabs: Tab[] = [
  { 
    id: 'security', 
    label: 'Security & Access', 
    icon: Shield,
    description: 'Manage API keys and access credentials.'
  },
  { 
    id: 'logs', 
    label: 'Log Storage', 
    icon: Server,
    description: 'Configure where execution logs are stored.'
  }
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('security');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your workspace configuration and security credentials.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="space-y-1 sticky top-6">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium ring-1 ring-blue-200 dark:ring-blue-800' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <tab.icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                 <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                    {tabs.find(t => t.id === activeTab)?.label}
                 </h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {tabs.find(t => t.id === activeTab)?.description}
                 </p>
              </div>

              {activeTab === 'security' && <ApiKeyManager />}
              {activeTab === 'logs' && <ExecutionLogStorageSettings />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}