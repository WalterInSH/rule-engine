import React from 'react';
import { RuleSet } from '@/types/RuleSet';
import { Rule, RuleRunType } from '@/types/Rule';
import { DataModel, DataModelCategory } from '@/types/DataModel';
import { DropResult } from '@hello-pangea/dnd';
import { Check, Loader2 } from 'lucide-react';
import RuleList from './RuleList';
import Simulator from './Simulator';

interface RuleSetEditorProps {
    ruleSet: RuleSet;
    onChange: (rs: RuleSet) => void;
    onSave: () => void;
    onClose: () => void;
    onSnapshot: () => void;
    onVersions: () => void;
    saveStatus: 'idle' | 'saving' | 'saved';
    dataModels: DataModel[];
    onAddRule: () => void;
    onEditRule: (rule: Rule) => void;
    onDeleteRule: (id: string) => void;
    onDragEnd: (result: DropResult) => void;
    execParams: string;
    setExecParams: (params: string) => void;
    execResult: string | null;
    onExecute: () => void;
}

export default function RuleSetEditor({
    ruleSet,
    onChange,
    onSave,
    onClose,
    onSnapshot,
    onVersions,
    saveStatus,
    dataModels,
    onAddRule,
    onEditRule,
    onDeleteRule,
    onDragEnd,
    execParams,
    setExecParams,
    execResult,
    onExecute
}: RuleSetEditorProps) {
    return (
        <div className="h-full flex flex-col">
             {/* Header */}
             <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {ruleSet.name ? 'Edit Rule Set' : 'New Rule Set'}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={onSnapshot} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold" title="Create a version tag">Snapshot</button>
                    <button onClick={onVersions} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded font-semibold" title="View version history">Versions</button>
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white">Close</button>
                    <button 
                        onClick={onSave} 
                        disabled={saveStatus !== 'idle'}
                        className={`font-semibold py-2 px-6 rounded flex items-center justify-center gap-2 transition-all min-w-[130px] ${
                            saveStatus === 'saved' 
                                ? 'bg-green-600 text-white' 
                                : saveStatus === 'saving'
                                    ? 'bg-blue-400 text-white cursor-wait'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saveStatus === 'saved' && <Check className="w-4 h-4" />}
                        {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'saving' ? 'Saving...' : 'Save Set'}
                    </button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                    <input type="text" value={ruleSet.name} 
                           onChange={e => onChange({...ruleSet, name: e.target.value})}
                           className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 dark:bg-slate-950 dark:text-slate-100" placeholder="Rule Set Name" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <input type="text" value={ruleSet.description} 
                           onChange={e => onChange({...ruleSet, description: e.target.value})}
                           className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 dark:bg-slate-950 dark:text-slate-100" placeholder="Description" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Run Type</label>
                    <select 
                        value={ruleSet.runType} 
                        onChange={e => onChange({...ruleSet, runType: e.target.value as RuleRunType})}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 dark:bg-slate-950 dark:text-slate-100"
                    >
                        <option value={RuleRunType.SYNC}>Sync</option>
                        <option value={RuleRunType.ASYNC}>Async</option>
                    </select>
                </div>
              </div>
              
              {/* Internal Models Selection */}
              <div className="mb-6">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Enabled Internal Models (Pre-load Data)</label>
                 <div className="border border-slate-200 dark:border-slate-700 rounded p-3 bg-slate-50 dark:bg-slate-950 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {dataModels.filter(dm => dm.category === DataModelCategory.INTERNAL).map(model => (
                        <label key={model.name} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded">
                            <input 
                                type="checkbox" 
                                checked={ruleSet.internalModels?.includes(model.name) || false}
                                onChange={(e) => {
                                    const current = ruleSet.internalModels || [];
                                    if (e.target.checked) {
                                        onChange({ ...ruleSet, internalModels: [...current, model.name] });
                                    } else {
                                        onChange({ ...ruleSet, internalModels: current.filter(n => n !== model.name) });
                                    }
                                }}
                                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate" title={model.name}>{model.name}</span>
                        </label>
                    ))}
                    {dataModels.filter(dm => dm.category === DataModelCategory.INTERNAL).length === 0 && (
                        <p className="text-sm text-slate-400 italic">No internal models defined.</p>
                    )}
                 </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Rules ({ruleSet.rules.length})</h3>
                    <button onClick={onAddRule} className="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-1 px-3 rounded border border-slate-300 dark:border-slate-700">
                        + Add Rule
                    </button>
                </div>
                
                <RuleList 
                    rules={ruleSet.rules} 
                    dataModels={dataModels}
                    onEdit={onEditRule} 
                    onDelete={onDeleteRule} 
                    onDragEnd={onDragEnd} 
                />

                <Simulator 
                    execParams={execParams} 
                    setExecParams={setExecParams} 
                    execResult={execResult} 
                    onExecute={onExecute} 
                />
              </div>
        </div>
    );
}
