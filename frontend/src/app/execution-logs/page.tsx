'use client';

import {useEffect, useState} from 'react';
import {getSpaceApiUrl} from '@/utils/apiConfig';
import {format} from 'date-fns';
import {Calendar as CalendarIcon, Clock, FileText, Hash, Timer} from 'lucide-react';
import {motion} from 'framer-motion';
import LogDetailModal from '@/components/rules/LogDetailModal';

interface ExecutionLog {
    fileName: string;
    version: string;
    executionId?: string;
    startTime: string;
    durationMs: number;
    abTestId?: string;
    abVariantId?: string;
}

export default function ExecutionLogsPage() {
    const [logs, setLogs] = useState<ExecutionLog[]>([]);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedStorage, setSelectedStorage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState<string | null>(null); // For future detail view
    const [logDetailData, setLogDetailData] = useState<any | null>(null);

    useEffect(() => {
        fetchLogs();
        const handleSpaceChange = () => fetchLogs();
        window.addEventListener('spaceChanged', handleSpaceChange);
        return () => window.removeEventListener('spaceChanged', handleSpaceChange);
    }, [selectedDate, selectedStorage]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            // endpoint: /api/spaces/{spaceId}/rules/logs?date=...&storage=...
            const url = new URL(`${getSpaceApiUrl('rules')}/logs`);
            url.searchParams.append('date', selectedDate);
            if (selectedStorage) {
                url.searchParams.append('storage', selectedStorage);
            }
            
            const res = await fetch(url.toString());
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            } else {
                setLogs([]);
            }
        } catch (e) {
            console.error('Failed to fetch logs', e);
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogClick = async (fileName: string) => {
        setSelectedLog(fileName);
        try {
            const url = new URL(`${getSpaceApiUrl('rules')}/logs/${fileName}`);
            url.searchParams.append('date', selectedDate);
            if (selectedStorage) {
                url.searchParams.append('storage', selectedStorage);
            }

            const res = await fetch(url.toString());
            if (res.ok) {
                const data = await res.json();
                setLogDetailData(data);
            }
        } catch (e) {
            console.error('Failed to fetch log detail', e);
        }
    };

    const closeDetail = () => {
        setSelectedLog(null);
        setLogDetailData(null);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <FileText className="text-blue-600" size={32} />
                        Execution Logs
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                        View history of rule executions.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                        <select
                            value={selectedStorage}
                            onChange={(e) => setSelectedStorage(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 text-sm font-medium"
                        >
                            <option value="">Default (Auto)</option>
                            <option value="local">Local File System</option>
                            <option value="s3">S3 / MinIO</option>
                            <option value="elasticsearch">Elasticsearch</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                        <CalendarIcon className="text-slate-400" size={20} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 font-mono"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 shadow-lg rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {logs.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                            <FileText size={48} className="mb-4 opacity-20" />
                            <p>No execution logs found for this date.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                        <th className="px-6 py-4">Start Time</th>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4">Rule Set Version</th>
                                        <th className="px-6 py-4">Experiment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {logs.map((log, index) => {
                                        // Extract tag from filename: yyyyMMdd_HHmmss_tag.json
                                        let displayVersion = log.version;
                                        try {
                                            const name = displayVersion.replace(/\.json$/, '');
                                            const parts = name.split('_');
                                            if (parts.length >= 3) {
                                                displayVersion = parts.slice(2).join('_');
                                            }
                                        } catch (e) {
                                            // keep original if parse fails
                                        }

                                        return (
                                        <motion.tr
                                            key={log.fileName}
                                            onClick={() => handleLogClick(log.fileName)}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono text-sm whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={16} className="text-slate-400" />
                                                    {log.startTime}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] text-slate-400 font-mono select-all block max-w-[100px] truncate cursor-text" title={log.executionId}>
                                                    {log.executionId || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Timer size={16} className="text-slate-400" />
                                                    {log.durationMs} ms
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium font-mono border border-blue-100 dark:border-blue-900/30">
                                                    <Hash size={12} />
                                                    {displayVersion}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.abTestId && (
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-mono border border-purple-200 dark:border-purple-800">
                                                            ID: {log.abTestId.substring(0, 8)}...
                                                        </span>
                                                        {log.abVariantId && (
                                                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                                Variant: <span className="font-semibold">{log.abVariantId}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <LogDetailModal 
                isOpen={!!selectedLog && !!logDetailData} 
                onClose={closeDetail} 
                data={logDetailData}
                fileName={selectedLog}
            />
        </div>
    );
}
