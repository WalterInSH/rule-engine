'use client';

import { useState, useEffect } from 'react';
import { getSpaceApiUrl } from '@/utils/apiConfig';
import { motion } from 'framer-motion';
import { Database, FolderPlus, Zap } from 'lucide-react';

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

  const steps = [
    {
      title: "1. Define Models",
      description: "Create data models to structure your inputs and internal data sources.",
      icon: Database,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    },
    {
      title: "2. Create Rule Set",
      description: "Initialize a rule set to group your logic and define execution parameters.",
      icon: FolderPlus,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
    },
    {
      title: "3. Add Rules",
      description: "Build powerful logical rules using the visual editor and test them instantly.",
      icon: Zap,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
    }
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Welcome to Rule Engine Admin</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg max-w-2xl">
          Manage your decision logic with ease. Define structures, build rules, and simulate outcomes in one place.
        </p>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 shadow-lg rounded-xl p-8 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800"
        >
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Data Models</h2>
          {loading ? (
            <div className="animate-pulse h-10 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
          ) : (
            <p className="text-5xl font-bold text-blue-600">{modelCount !== null ? modelCount : '-'}</p>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Defined Models</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 shadow-lg rounded-xl p-8 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800"
        >
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Rule Sets</h2>
          {loading ? (
            <div className="animate-pulse h-10 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
          ) : (
            <p className="text-5xl font-bold text-green-600">{ruleSetCount !== null ? ruleSetCount : '-'}</p>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Active Rule Sets</p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-20"
      >
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-10 text-center">Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 dark:bg-slate-800 -z-10"></div>

          {steps.map((step, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -5 }}
              className="flex flex-col items-center text-center group"
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-md transition-colors ${step.color} bg-opacity-100 z-10`}>
                <step.icon size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">{step.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 px-4 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
