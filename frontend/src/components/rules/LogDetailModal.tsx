import React from 'react';
import { X, Clock, FileText, Timer } from 'lucide-react';

interface InternalModelEntry {
    name: string;
    model: Record<string, unknown>;
}

interface RuleExecutionResult {
    input: Record<string, unknown>;
    internalModels?: InternalModelEntry[];
    loadedModels?: InternalModelEntry[];
    output: Record<string, unknown>;
    executionId?: string;
}

interface LogDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: RuleExecutionResult | null;
    fileName: string | null;
}

export default function LogDetailModal({ isOpen, onClose, data, fileName }: LogDetailModalProps) {
    if (!isOpen || !data) return null;

    const internalData = data.internalModels || data.loadedModels || [];

    // Extract meta from output if available
    const out = data.output || {};
    const startTime = (out._startTime as string) || '';
    const duration = (out._durationMs as number) || 0;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <FileText className="text-blue-600" size={24} />
                            Execution Detail
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {data.executionId && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                <span className="text-slate-400 select-none">ID:</span>
                                <span className="select-all">{data.executionId}</span>
                            </div>
                        )}
                        {startTime && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                <Clock size={14} />
                                {startTime}
                            </div>
                        )}
                        {duration > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                <Timer size={14} />
                                {duration} ms
                            </div>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-4">
                    <div className="grid grid-cols-2 gap-4 h-full">

                        {/* Left: Input */}
                        <div className="flex flex-col h-full overflow-hidden">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Input Data</h3>
                            <div className="flex-1 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-950 overflow-auto p-3">
                                <pre className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {JSON.stringify(data.input, null, 2)}
                                </pre>
                            </div>
                        </div>

                        {/* Right: Output & Internals */}
                        <div className="flex flex-col h-full overflow-hidden">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Execution Result</h3>

                            <div className="flex-1 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-950 overflow-auto p-3 space-y-4">

                                {/* Output */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 border-b border-slate-200 dark:border-slate-800 pb-1">Output Models</h4>
                                    <pre className="font-mono text-xs text-green-700 dark:text-green-400 whitespace-pre-wrap">
                                        {JSON.stringify(data.output, null, 2)}
                                    </pre>
                                </div>

                                {/* Internal Models */}
                                {internalData.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 border-b border-slate-200 dark:border-slate-800 pb-1 mt-4">Internal Models (Loaded)</h4>
                                        <div className="space-y-2 mt-2">
                                            {internalData.map((item, idx) => (
                                                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-2">
                                                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{item.name}</div>
                                                    <pre className="font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                                        {JSON.stringify(item.model, null, 2)}
                                                    </pre>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
