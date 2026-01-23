'use client';

import { useState, useEffect } from 'react';
import { getSpaceApiUrl } from '@/utils/apiConfig';

export default function Home() {
  const [modelCount, setModelCount] = useState<number | null>(null);
  const [ruleSetCount, setRuleSetCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();

    const handleSpaceChange = () => {
      fetchCounts();
    };

    window.addEventListener('spaceChanged', handleSpaceChange);
    return () => {
      window.removeEventListener('spaceChanged', handleSpaceChange);
    };
  }, []);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const [modelsRes, ruleSetsRes] = await Promise.all([
        fetch(getSpaceApiUrl('datamodels')),
        fetch(getSpaceApiUrl('rulesets'))
      ]);

      if (modelsRes.ok) {
        const models = await modelsRes.json();
        setModelCount(models.length);
      }
      
      if (ruleSetsRes.ok) {
        const ruleSets = await ruleSetsRes.json();
        setRuleSetCount(ruleSets.length);
      }
    } catch (error) {
      console.error('Failed to fetch counts', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Welcome to Rule Engine Admin</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg">
        Select an option from the navigation bar to get started.
      </p>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 shadow rounded-lg p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Data Models</h2>
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : (
            <p className="text-4xl font-bold text-blue-600">{modelCount !== null ? modelCount : '-'}</p>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Defined Models</p>
        </div>

        <div className="bg-white dark:bg-slate-900 shadow rounded-lg p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Rule Sets</h2>
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : (
            <p className="text-4xl font-bold text-green-600">{ruleSetCount !== null ? ruleSetCount : '-'}</p>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Active Rule Sets</p>
        </div>
      </div>
    </div>
  );
}