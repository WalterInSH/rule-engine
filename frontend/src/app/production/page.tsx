'use client';

import {useEffect, useState} from 'react';
import {getSpaceApiUrl} from '@/utils/apiConfig';
import {RuleSet} from '@/types/RuleSet';
import {AlertCircle, Calendar, CheckCircle2, ChevronRight, History, Rocket, Server, ShieldCheck} from 'lucide-react';
import {motion} from 'framer-motion';
import NotificationToast from '@/components/rules/NotificationToast';
import ConfirmationModal from '@/components/ConfirmationModal';

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

export default function ProductionPage() {
    const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
    const [config, setConfig] = useState<ProductionConfig | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(false);

    const [selectedRuleSet, setSelectedRuleSet] = useState<RuleSet | null>(null);
    const [versions, setVersions] = useState<VersionInfo[]>([]);
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);

    const [deployingVersion, setDeployingVersion] = useState<string | null>(null);
    const [confirmDeploy, setConfirmDeploy] = useState<{version: VersionInfo, ruleSet: string} | null>(null);

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
            const [rsRes, configRes] = await Promise.all([
                fetch(getSpaceApiUrl('rulesets')),
                fetch(`${getSpaceApiUrl('production')}/status`)
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
            // POST /api/spaces/{spaceId}/production/deploy?ruleSetName=...&version=...&tag=...
            const res = await fetch(
                `${getSpaceApiUrl('production')}/deploy?ruleSetName=${encodeURIComponent(ruleSet)}&version=${encodeURIComponent(version.filename)}&tag=${encodeURIComponent(version.tag)}`,
                { method: 'POST' }
            );

            if (res.ok) {
                // Refresh Status
                const configRes = await fetch(`${getSpaceApiUrl('production')}/status`);
                if (configRes.ok) {
                    setConfig(await configRes.json());
                }
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

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center gap-3 mb-8">
                <Server className="text-purple-600" size={32} />
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Production Environment</h1>
            </div>

            {/* Status Card */}
            <div className="mb-8 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-green-500" />
                    Current Status
                </h2>

                {isLoadingConfig ? (
                    <div className="animate-pulse h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                ) : config ? (
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-4 rounded-xl">
                        <div className="flex gap-4 items-center">
                            <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-full text-green-600 dark:text-green-400">
                                <Rocket size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-green-800 dark:text-green-300 font-medium mb-1">Active Rule Set</div>
                                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{config.ruleSet}</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                                <History size={14} />
                                Deployed: {new Date(config.deployedAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-amber-800 dark:text-amber-200">
                        <AlertCircle size={24} />
                        <div>
                            <div className="font-bold">No Rules Deployed</div>
                            <div className="text-sm opacity-80">The production environment is currently empty. Select a snapshot below to deploy.</div>
                        </div>
                    </div>
                )}
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
                                                disabled={isCurrent || deployingVersion === v.filename}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                                                    isCurrent
                                                        ? 'bg-transparent text-green-600 cursor-default'
                                                        : deployingVersion === v.filename
                                                            ? 'bg-slate-100 text-slate-400 cursor-wait'
                                                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 dark:shadow-none'
                                                }`}
                                            >
                                                {isCurrent ? (
                                                    'Deployed'
                                                ) : deployingVersion === v.filename ? (
                                                    'Deploying...'
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

            <NotificationToast notification={notification} />
        </div>
    );
}
