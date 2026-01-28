'use client';

import {useEffect, useState} from 'react';
import {getSpaceApiUrl} from '@/utils/apiConfig';
import {RuleSet} from '@/types/RuleSet';
import {AlertCircle, Calendar, CheckCircle2, ChevronRight, History, Rocket, Server, ShieldCheck, FlaskConical, Trash2} from 'lucide-react';
import {motion} from 'framer-motion';
import NotificationToast from '@/components/rules/NotificationToast';
import ConfirmationModal from '@/components/ConfirmationModal';
import AbTestModal from '@/components/rules/AbTestModal';

interface ProductionConfig {
    ruleSet: string;
    version: string;
    deployedAt: string;
}

interface VersionInfo {
    filename: string;
    tag: string;
    date: string;
    time: string;
}

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
    startedAt?: string;
    endedAt?: string;
}

export default function ProductionPage() {
    const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
    const [config, setConfig] = useState<ProductionConfig | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(false);

    const [selectedRuleSet, setSelectedRuleSet] = useState<RuleSet | null>(null);
    const [versions, setVersions] = useState<VersionInfo[]>([]);
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);

    const [deployingVersion, setDeployingVersion] = useState<string | null>(null);
    const [confirmDeploy, setConfirmDeploy] = useState<{version: VersionInfo, ruleSet: string} | null>(null);

    const [abConfig, setAbConfig] = useState<AbTestConfig | null>(null);
    const [abHistory, setAbHistory] = useState<AbTestConfig[]>([]);
    const [showAbHistory, setShowAbHistory] = useState(false);
    const [isAbModalOpen, setIsAbModalOpen] = useState(false);

    const [notification, setNotification] = useState<{
        message: string,
        type: 'success' | 'error' | 'info'
    } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotification({message, type});
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        fetchInitialData();
        const handleSpaceChange = () => {
            fetchInitialData();
            setSelectedRuleSet(null);
            setVersions([]);
        };
        window.addEventListener('spaceChanged', handleSpaceChange);
        return () => window.removeEventListener('spaceChanged', handleSpaceChange);
    }, []);

    useEffect(() => {
        if (selectedRuleSet) {
            fetchVersions(selectedRuleSet.name);
        }
    }, [selectedRuleSet]);

    const fetchInitialData = async () => {
        setIsLoadingConfig(true);
        try {
            const [rsRes, configRes, abRes, abHistoryRes] = await Promise.all([
                fetch(getSpaceApiUrl('rulesets')),
                fetch(`${getSpaceApiUrl('production')}/status`),
                fetch(`${getSpaceApiUrl('production')}/ab-test`),
                fetch(`${getSpaceApiUrl('production')}/ab-test/history`)
            ]);

            if (rsRes.ok) setRuleSets(await rsRes.json());
            if (configRes.ok) {
                const data = await configRes.json();
                if (data.status === 'not-configured') {
                    setConfig(null);
                } else {
                    setConfig(data);
                }
            }
            if (abRes.ok) {
                setAbConfig(await abRes.json());
            } else {
                setAbConfig(null);
            }
            if (abHistoryRes.ok) {
                setAbHistory(await abHistoryRes.json());
            } else {
                setAbHistory([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingConfig(false);
        }
    };

    const fetchVersions = async (ruleSetName: string) => {
        setIsLoadingVersions(true);
        try {
            const res = await fetch(`${getSpaceApiUrl('rulesets')}/${ruleSetName}/versions`);
            if (res.ok) {
                setVersions(await res.json());
            } else {
                setVersions([]);
            }
        } catch (e) {
            console.error(e);
            setVersions([]);
        } finally {
            setIsLoadingVersions(false);
        }
    };

    const initiateDeploy = (version: VersionInfo) => {
        if (!selectedRuleSet) return;
        setConfirmDeploy({ version, ruleSet: selectedRuleSet.name });
    };

    const executeDeploy = async () => {
        if (!confirmDeploy) return;

        const { version, ruleSet } = confirmDeploy;
        setConfirmDeploy(null);
        setDeployingVersion(version.filename);

        try {
            const res = await fetch(
                `${getSpaceApiUrl('production')}/deploy?ruleSetName=${encodeURIComponent(ruleSet)}&version=${encodeURIComponent(version.filename)}&tag=${encodeURIComponent(version.tag)}`,
                { method: 'POST' }
            );

            if (res.ok) {
                await fetchInitialData();
                showNotification('Deployment successful!', 'success');
            } else {
                showNotification('Deployment failed: ' + await res.text(), 'error');
            }
        } catch (e) {
            console.error(e);
            showNotification('Error deploying version.', 'error');
        } finally {
            setDeployingVersion(null);
        }
    };

    const deployAbTest = async (newConfig: AbTestConfig) => {
        try {
            const res = await fetch(`${getSpaceApiUrl('production')}/ab-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });

            if (res.ok) {
                await fetchInitialData();
                showNotification('A/B Test Started!', 'success');
            } else {
                showNotification('Failed to start A/B test: ' + await res.text(), 'error');
                throw new Error('Failed');
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const stopAbTest = async () => {
        try {
            const res = await fetch(`${getSpaceApiUrl('production')}/ab-test`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setAbConfig(null);
                await fetchInitialData();
                showNotification('A/B Test Stopped.', 'success');
            } else {
                showNotification('Failed to stop test.', 'error');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center gap-3 mb-8">
                <Server className="text-purple-600" size={32} />
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Production Environment</h1>
            </div>

            {/* Status Card */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-green-500" />
                        Current Status
                    </h2>

                    {isLoadingConfig ? (
                        <div className="animate-pulse h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                    ) : config ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-4 rounded-xl">
                                <div className="flex gap-4 items-center">
                                    <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-full text-green-600 dark:text-green-400">
                                        <Rocket size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-green-800 dark:text-green-300 font-medium mb-1">Active Rule Set</div>
                                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">{config.ruleSet}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <div className="text-xs text-green-700 dark:text-green-400 mb-1">Deployed At</div>
                                     <div className="text-sm font-mono text-green-800 dark:text-green-300">
                                         {new Date(config.deployedAt).toLocaleDateString()}<br/>
                                         {new Date(config.deployedAt).toLocaleTimeString()}
                                     </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-amber-800 dark:text-amber-200">
                            <AlertCircle size={24} />
                            <div>
                                <div className="font-bold">No Rules Deployed</div>
                                <div className="text-sm opacity-80">Deploy a snapshot to enable A/B testing.</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* A/B Testing Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <FlaskConical size={20} className="text-purple-500" />
                            A/B Testing
                        </h2>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setShowAbHistory(false)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${!showAbHistory ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                Current
                            </button>
                            <button
                                onClick={() => setShowAbHistory(true)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${showAbHistory ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                History
                            </button>
                        </div>
                    </div>

                    {showAbHistory ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                            {abHistory.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <History size={24} className="mb-2 opacity-50" />
                                    <span className="text-xs">No history available</span>
                                </div>
                            ) : (
                                abHistory.map((h, i) => (
                                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                {h.startedAt ? new Date(h.startedAt).toLocaleDateString() : 'Unknown'}
                                            </div>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                                                Ended: {h.endedAt ? new Date(h.endedAt).toLocaleDateString() : 'Active'}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {h.variants.map((v, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                                        {v.name}
                                                    </span>
                                                    <span className="font-mono text-slate-500">{v.weight}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : abConfig && abConfig.active ? (
                        <div className="flex-1 flex flex-col justify-between">
                            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-purple-900 dark:text-purple-100">Active Experiment</span>
                                        <span className="text-xs px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full font-mono">
                                            Expires: {new Date(abConfig.expiration).toLocaleDateString()}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2 mt-3">
                                        {/* Main */}
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                                Main ({config?.ruleSet})
                                            </span>
                                            <span className="font-mono font-bold">
                                                {100 - abConfig.variants.reduce((sum, v) => sum + v.weight, 0)}%
                                            </span>
                                        </div>
                                        {/* Variants */}
                                        {abConfig.variants.map((v, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                                    {v.name} ({v.ruleSetName})
                                                </span>
                                                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                                                    {v.weight}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={stopAbTest}
                                className="mt-4 w-full py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                            >
                                <Trash2 size={16} /> Stop Experiment
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                             <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 mb-3">
                                <FlaskConical size={24} />
                             </div>
                             <p className="text-sm text-slate-500 mb-4">
                                 Run experiments by splitting traffic between the main rule set and candidate variants.
                             </p>
                             <button
                                onClick={() => setIsAbModalOpen(true)}
                                disabled={!config}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 Create A/B Plan
                             </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[600px]">
                {/* Left: RuleSet Selector */}
                <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Available Rule Sets</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {ruleSets.map(rs => (
                            <button
                                key={rs.name}
                                onClick={() => setSelectedRuleSet(rs)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${
                                    selectedRuleSet?.name === rs.name
                                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium ring-1 ring-purple-200 dark:ring-purple-800'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                {rs.name}
                                {selectedRuleSet?.name === rs.name && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Snapshot List */}
                <div className="md:col-span-8 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">
                            {selectedRuleSet ? `Snapshots for ${selectedRuleSet.name}` : 'Select a Rule Set'}
                        </h3>
                        {selectedRuleSet && versions.length > 0 && (
                            <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">
                                {versions.length} versions
                            </span>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1 p-4">
                        {!selectedRuleSet ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Server size={48} className="mb-4 opacity-20" />
                                <p>Select a rule set to view snapshots</p>
                            </div>
                        ) : isLoadingVersions ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            </div>
                        ) : versions.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                No snapshots found. Go to the Rules page to create a snapshot.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {versions.map((v) => {
                                    const isCurrent = config?.ruleSet === selectedRuleSet.name && config?.version === v.filename;

                                    return (
                                        <motion.div
                                            key={v.filename}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 rounded-xl border flex items-center justify-between ${
                                                isCurrent 
                                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' 
                                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{v.tag}</span>
                                                    {isCurrent && (
                                                        <span className="text-[10px] uppercase font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <CheckCircle2 size={10} /> Active
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                    <span className="flex items-center gap-1"><Calendar size={12}/> {v.date}</span>
                                                    <span className="flex items-center gap-1"><History size={12}/> {v.time}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => initiateDeploy(v)}
                                                disabled={isCurrent || deployingVersion === v.filename || (abConfig?.active ?? false)}
                                                title={abConfig?.active ? "Cannot deploy while A/B test is active" : ""}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                                                    isCurrent
                                                        ? 'bg-transparent text-green-600 cursor-default'
                                                        : deployingVersion === v.filename
                                                            ? 'bg-slate-100 text-slate-400 cursor-wait'
                                                            : abConfig?.active
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 dark:shadow-none'
                                                }`}
                                            >
                                                {isCurrent ? (
                                                    'Deployed'
                                                ) : deployingVersion === v.filename ? (
                                                    'Deploying...'
                                                ) : abConfig?.active ? (
                                                    'A/B Test Active'
                                                ) : (
                                                    <>
                                                        Deploy <Rocket size={14} />
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!confirmDeploy}
                title="Deploy to Production"
                message={
                    <span>
                        Are you sure you want to deploy <strong>{confirmDeploy?.ruleSet}</strong> version <strong>{confirmDeploy?.version.tag}</strong> to <strong>Production</strong>?
                        <br/><br/>
                        This will immediately update the live environment.
                    </span>
                }
                confirmLabel="Deploy Now"
                onConfirm={executeDeploy}
                onCancel={() => setConfirmDeploy(null)}
            />

            <AbTestModal 
                isOpen={isAbModalOpen}
                onClose={() => setIsAbModalOpen(false)}
                onDeploy={deployAbTest}
                ruleSets={ruleSets}
                currentMainRuleSet={config?.ruleSet || 'None'}
            />

            <NotificationToast notification={notification} />
        </div>
    );
}