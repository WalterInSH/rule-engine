'use client';

import React, { useState, useEffect } from 'react';
import { getBaseUrl } from '../../utils/apiConfig';
import { Trash2, Copy, Check, Key, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  createdAt: number;
  lastUsedAt?: number;
}

interface CreatedApiKey extends ApiKey {
  key?: string;
}

export default function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/settings/keys`);
      if (response.ok) {
        const data = await response.json();
        setKeys(data);
      }
    } catch (error) {
      console.error('Failed to fetch keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch(`${getBaseUrl()}/settings/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedKey(data);
        setNewKeyName('');
        fetchKeys();
      }
    } catch (error) {
      console.error('Failed to create key:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${getBaseUrl()}/settings/keys/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setKeys(keys.filter(k => k.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete key:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-500" />
          API Keys
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          Create and manage API keys to access the Rule Engine API securely. 
          Use these keys in the <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header as <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">Bearer sk-...</code>
        </p>

        <form onSubmit={handleCreateKey} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Enter key name (e.g., Production App)"
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={!newKeyName.trim() || isCreating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Key
          </button>
        </form>

        {createdKey && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">API Key Created</h3>
              <button 
                onClick={() => setCreatedKey(null)}
                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400 mb-3">
              Copy this key now. You won't be able to see it again!
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-slate-950 border border-green-200 dark:border-green-800 p-2 rounded text-sm font-mono break-all text-slate-700 dark:text-slate-300">
                {createdKey.key}
              </code>
              <button
                onClick={() => createdKey.key && copyToClipboard(createdKey.key)}
                className="p-2 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/50 rounded transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Name</th>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Last Used</th>
                <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No API keys found</td>
                </tr>
              ) : (
                keys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{key.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-xs">{key.maskedKey}</td>
                    <td className="px-4 py-3 text-slate-500">{format(key.createdAt, 'MMM d, yyyy HH:mm')}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {key.lastUsedAt ? format(key.lastUsedAt, 'MMM d, yyyy HH:mm') : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
