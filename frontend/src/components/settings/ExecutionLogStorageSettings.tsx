'use client';

import { useEffect, useState } from 'react';
import { getBaseUrl } from '@/utils/apiConfig';
import { Save, Server, HardDrive, Cloud, Search, AlertCircle } from 'lucide-react';

interface LogConfig {
    local: { enabled: boolean };
    s3: { enabled: boolean; bucket?: string; region?: string; accessKey?: string; secretKey?: string; endpoint?: string };
    kafka: { enabled: boolean; brokers?: string; topic?: string };
    elasticsearch: { enabled: boolean; hosts?: string; username?: string; password?: string; index?: string };
}

export default function ExecutionLogStorageSettings() {
    const [config, setConfig] = useState<LogConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${getBaseUrl()}/execution-logs/config`);
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (e) {
            console.error('Failed to fetch log config', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`${getBaseUrl()}/execution-logs/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Configuration saved successfully' });
            } else {
                setMessage({ type: 'error', text: 'Failed to save configuration' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Error saving configuration' });
        } finally {
            setIsSaving(false);
        }
    };

    const updateConfig = (section: keyof LogConfig, key: string, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            [section]: {
                ...config[section],
                [key]: value
            }
        });
    };

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (!config) return <div className="p-4">Failed to load configuration</div>;

    return (
        <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Server className="text-blue-600" />
                Execution Log Storage
            </h2>

            <div className="space-y-8">
                {/* Local Storage */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <HardDrive className="text-slate-500" size={20} />
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Local File System</h3>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={config.local.enabled} onChange={(e) => updateConfig('local', 'enabled', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">Store logs as JSON files on the local server disk.</p>
                </div>

                {/* S3 Storage */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Cloud className="text-orange-500" size={20} />
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Amazon S3 / MinIO</h3>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={config.s3.enabled} onChange={(e) => updateConfig('s3', 'enabled', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {config.s3.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Bucket Name" value={config.s3.bucket} onChange={(v) => updateConfig('s3', 'bucket', v)} />
                            <Input label="Region" value={config.s3.region} onChange={(v) => updateConfig('s3', 'region', v)} />
                            <Input label="Access Key" value={config.s3.accessKey} onChange={(v) => updateConfig('s3', 'accessKey', v)} />
                            <Input label="Secret Key" type="password" value={config.s3.secretKey} onChange={(v) => updateConfig('s3', 'secretKey', v)} />
                            <Input label="Endpoint (Optional)" value={config.s3.endpoint} onChange={(v) => updateConfig('s3', 'endpoint', v)} placeholder="http://localhost:9000" />
                        </div>
                    )}
                </div>

                {/* Kafka */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Server className="text-purple-500" size={20} />
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Apache Kafka</h3>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={config.kafka.enabled} onChange={(e) => updateConfig('kafka', 'enabled', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {config.kafka.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Bootstrap Servers" value={config.kafka.brokers} onChange={(v) => updateConfig('kafka', 'brokers', v)} placeholder="localhost:9092" />
                            <Input label="Topic" value={config.kafka.topic} onChange={(v) => updateConfig('kafka', 'topic', v)} />
                        </div>
                    )}
                </div>

                {/* Elasticsearch */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Search className="text-green-500" size={20} />
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Elasticsearch 9</h3>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={config.elasticsearch.enabled} onChange={(e) => updateConfig('elasticsearch', 'enabled', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {config.elasticsearch.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Hosts" value={config.elasticsearch.hosts} onChange={(v) => updateConfig('elasticsearch', 'hosts', v)} placeholder="http://localhost:9200" />
                            <Input label="Index Name" value={config.elasticsearch.index} onChange={(v) => updateConfig('elasticsearch', 'index', v)} />
                            <Input label="Username (Optional)" value={config.elasticsearch.username} onChange={(v) => updateConfig('elasticsearch', 'username', v)} />
                            <Input label="Password (Optional)" type="password" value={config.elasticsearch.password} onChange={(v) => updateConfig('elasticsearch', 'password', v)} />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-4">
                {message && (
                    <div className={`text-sm flex items-center gap-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message.type === 'error' && <AlertCircle size={16} />}
                        {message.text}
                    </div>
                )}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );
}

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string, value?: string, onChange: (v: string) => void, type?: string, placeholder?: string }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
        </div>
    );
}
