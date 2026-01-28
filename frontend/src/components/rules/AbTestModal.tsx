'use client';

import { useState, useEffect } from 'react';
import { RuleSet } from '@/types/RuleSet';
import { getSpaceApiUrl } from '@/utils/apiConfig';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AbVariant {
    id?: string;
    name: string;
    ruleSetName: string;
    version: string;
    tag: string;
    weight: number;
}

interface AbTestConfig {
    variants: AbVariant[];
    expiration: string;
    active: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onDeploy: (config: AbTestConfig) => Promise<void>;
    ruleSets: RuleSet[];
    currentMainRuleSet: string;
}

export default function AbTestModal({ isOpen, onClose, onDeploy, ruleSets, currentMainRuleSet }: Props) {
    const [variants, setVariants] = useState<AbVariant[]>([]);
    const [expiration, setExpiration] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cache versions for rule sets to avoid repeated fetching
    const [versionsCache, setVersionsCache] = useState<Record<string, any[]>>({});

    const addVariant = () => {
        if (variants.length >= 2) return;
        setVariants([...variants, { name: `Variant ${String.fromCharCode(65 + variants.length)}`, ruleSetName: '', version: '', tag: '', weight: 20 }]);
    };

    const removeVariant = (index: number) => {
        const newVariants = [...variants];
        newVariants.splice(index, 1);
        setVariants(newVariants);
    };

    const updateVariant = (index: number, field: keyof AbVariant, value: any) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        
        // Reset version if ruleset changes
        if (field === 'ruleSetName') {
            newVariants[index].version = '';
            newVariants[index].tag = '';
            fetchVersions(value);
        }
        
        // If version changes, find tag
        if (field === 'version') {
            const cache = versionsCache[newVariants[index].ruleSetName] || [];
            const v = cache.find((c: any) => c.filename === value);
            if (v) newVariants[index].tag = v.tag;
        }

        setVariants(newVariants);
    };

    const fetchVersions = async (rsName: string) => {
        if (!rsName || versionsCache[rsName]) return;
        try {
            const res = await fetch(`${getSpaceApiUrl('rulesets')}/${rsName}/versions`);
            if (res.ok) {
                const data = await res.json();
                setVersionsCache(prev => ({ ...prev, [rsName]: data }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const totalWeight = variants.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);
    const mainWeight = 100 - totalWeight;

    const handleSubmit = async () => {
        setError(null);
        if (variants.length === 0) {
            setError('At least one variant is required.');
            return;
        }
        if (variants.some(v => !v.ruleSetName || !v.version)) {
            setError('All variants must have a rule set and version selected.');
            return;
        }
        if (totalWeight >= 100) {
            setError('Total variant weight must be less than 100%.');
            return;
        }
        if (!expiration) {
             setError('Expiration time is required.');
             return;
        }

        setIsLoading(true);
        try {
            const config: AbTestConfig = {
                variants,
                expiration: new Date(expiration).toISOString(),
                active: true
            };
            await onDeploy(config);
            onClose();
        } catch (e) {
            setError('Failed to deploy.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Setup A/B Test</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Main Plan Info */}
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Main: {currentMainRuleSet}</span>
                            <span className={`font-bold ${mainWeight < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {mainWeight}% Traffic
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${mainWeight < 0 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${Math.max(0, mainWeight)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">The main plan receives all remaining traffic.</p>
                    </div>

                    {/* Variants */}
                    <div className="space-y-4">
                        {variants.map((variant, idx) => (
                            <div key={idx} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 relative">
                                <button 
                                    onClick={() => removeVariant(idx)}
                                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                                
                                <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Variant {idx + 1}</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Rule Set</label>
                                        <select 
                                            className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                                            value={variant.ruleSetName}
                                            onChange={e => updateVariant(idx, 'ruleSetName', e.target.value)}
                                        >
                                            <option value="">Select Rule Set</option>
                                            {ruleSets.map(rs => (
                                                <option key={rs.name} value={rs.name}>{rs.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Version</label>
                                        <select 
                                            className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                                            value={variant.version}
                                            onChange={e => updateVariant(idx, 'version', e.target.value)}
                                            disabled={!variant.ruleSetName}
                                        >
                                            <option value="">Select Version</option>
                                            {(versionsCache[variant.ruleSetName] || []).map((v: any) => (
                                                <option key={v.filename} value={v.filename}>{v.tag} ({v.date})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Traffic Weight (%)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="99" 
                                        value={variant.weight}
                                        onChange={e => updateVariant(idx, 'weight', parseInt(e.target.value))}
                                        className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                                    />
                                </div>
                            </div>
                        ))}

                        {variants.length < 2 && (
                            <button 
                                onClick={addVariant}
                                className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={20} /> Add Variant
                            </button>
                        )}
                    </div>

                    {/* Expiration */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">End Date & Time</label>
                        <input 
                            type="datetime-local" 
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                            value={expiration}
                            onChange={e => setExpiration(e.target.value)}
                        />
                         <p className="text-xs text-slate-500 mt-1">When the test expires, all traffic will revert to the Main plan.</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isLoading || variants.length === 0}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? 'Deploying...' : 'Start A/B Test'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
