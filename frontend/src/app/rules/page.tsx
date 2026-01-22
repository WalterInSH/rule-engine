'use client';

import { useState, useEffect } from 'react';
import { RuleSet } from '@/types/RuleSet';
import { Rule, RuleActionType, RuleRunType } from '@/types/Rule';
import { DataModel } from '@/types/DataModel';
import { DropResult } from '@hello-pangea/dnd';

import RuleSetList from '@/components/rules/RuleSetList';
import RuleList from '@/components/rules/RuleList';
import RuleModal from '@/components/rules/RuleModal';
import Simulator from '@/components/rules/Simulator';

const RULESETS_API = 'http://localhost:8080/api/rulesets';
const RULES_EXEC_API = 'http://localhost:8080/api/rules';
const DATAMODELS_API = 'http://localhost:8080/api/datamodels';

export default function RulesPage() {
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [dataModels, setDataModels] = useState<DataModel[]>([]);
  const [selectedRuleSet, setSelectedRuleSet] = useState<RuleSet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Rule Editing State
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  
  // Execution State
  const [execParams, setExecParams] = useState('{\n  \n}');
  const [execResult, setExecResult] = useState<string | null>(null);

  useEffect(() => {
    fetchRuleSets();
    fetchDataModels();
  }, []);

  const fetchRuleSets = async () => {
    try {
      const res = await fetch(RULESETS_API);
      if (res.ok) setRuleSets(await res.json());
    } catch (e) {
      console.error('Failed to fetch rule sets', e);
    }
  };

  const fetchDataModels = async () => {
    try {
      const res = await fetch(DATAMODELS_API);
      if (res.ok) setDataModels(await res.json());
    } catch (e) {
      console.error('Failed to fetch data models', e);
    }
  };

  // Rule Set CRUD
  const handleCreateRuleSet = () => {
    setSelectedRuleSet({ name: '', description: '', runType: RuleRunType.SYNC, rules: [] });
    setIsEditing(true);
  };

  const handleEditRuleSet = (rs: RuleSet) => {
    setSelectedRuleSet({ ...rs, runType: rs.runType || RuleRunType.SYNC });
    setIsEditing(true);
  };

  const handleDeleteRuleSet = async (name: string) => {
    if (!confirm(`Delete rule set ${name}?`)) return;
    await fetch(`${RULESETS_API}/${name}`, { method: 'DELETE' });
    fetchRuleSets();
    if (selectedRuleSet?.name === name) {
      setSelectedRuleSet(null);
      setIsEditing(false);
    }
  };

  const handleSaveRuleSet = async () => {
    if (!selectedRuleSet?.name) return;
    await fetch(RULESETS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedRuleSet)
    });
    fetchRuleSets();
    setIsEditing(false);
    setSelectedRuleSet(null);
  };

  // Rule Management
  const handleAddRule = () => {
    setEditingRule({
      id: crypto.randomUUID().split('-')[0],
      priority: 10,
      actionType: RuleActionType.SCORE,
      condition: '',
      action: '',
      conditionNode: {
          type: 'GROUP',
          logicalOperator: 'AND',
          children: []
      }
    });
    setIsRuleModalOpen(true);
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (updatedRule: Rule) => {
    if (!selectedRuleSet) return;

    const newRules = [...selectedRuleSet.rules];
    const index = newRules.findIndex(r => r.id === updatedRule.id);
    if (index >= 0) {
      newRules[index] = updatedRule;
    } else {
      newRules.push(updatedRule);
    }
    setSelectedRuleSet({ ...selectedRuleSet, rules: newRules });
    setIsRuleModalOpen(false);
    setEditingRule(null);
  };

  const handleDeleteRule = (id: string) => {
    if (!selectedRuleSet) return;
    const newRules = selectedRuleSet.rules.filter(r => r.id !== id);
    setSelectedRuleSet({ ...selectedRuleSet, rules: newRules });
  };
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !selectedRuleSet) return;
    
    const items = Array.from(selectedRuleSet.rules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedRuleSet({
      ...selectedRuleSet,
      rules: items
    });
  };

  // Execution
  const handleDeployAndExecute = async () => {
    if (!selectedRuleSet) return;
    
    // 1. Reload Rules (Send RuleSet now)
    const loadRes = await fetch(`${RULES_EXEC_API}/reload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedRuleSet)
    });
    
    if (!loadRes.ok) {
        setExecResult('Failed to load rules: ' + await loadRes.text());
        return;
    }

    // 2. Execute
    try {
      const params = JSON.parse(execParams);
      const execRes = await fetch(`${RULES_EXEC_API}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const result = await execRes.json();
      setExecResult(JSON.stringify(result, null, 2));
    } catch (e) {
      setExecResult('Error executing rules: ' + String(e));
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Rule Sets</h1>
        <button onClick={handleCreateRuleSet} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
          Create Rule Set
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <RuleSetList 
            ruleSets={ruleSets} 
            selectedRuleSet={selectedRuleSet} 
            onSelect={handleEditRuleSet} 
            onDelete={handleDeleteRuleSet} 
        />

        {/* Editor Column */}
        <div className="md:col-span-9 bg-white dark:bg-slate-900 shadow rounded-lg p-6">
          {isEditing && selectedRuleSet ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {selectedRuleSet.name ? 'Edit Rule Set' : 'New Rule Set'}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white">Cancel</button>
                    <button onClick={handleSaveRuleSet} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded">Save Set</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                    <input type="text" value={selectedRuleSet.name} 
                           onChange={e => setSelectedRuleSet({...selectedRuleSet, name: e.target.value})}
                           className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 dark:bg-slate-950 dark:text-slate-100" placeholder="Rule Set Name" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <input type="text" value={selectedRuleSet.description} 
                           onChange={e => setSelectedRuleSet({...selectedRuleSet, description: e.target.value})}
                           className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 dark:bg-slate-950 dark:text-slate-100" placeholder="Description" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Run Type</label>
                    <select 
                        value={selectedRuleSet.runType} 
                        onChange={e => setSelectedRuleSet({...selectedRuleSet, runType: e.target.value as RuleRunType})}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 dark:bg-slate-950 dark:text-slate-100"
                    >
                        <option value={RuleRunType.SYNC}>Sync</option>
                        <option value={RuleRunType.ASYNC}>Async</option>
                    </select>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Rules ({selectedRuleSet.rules.length})</h3>
                    <button onClick={handleAddRule} className="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-1 px-3 rounded border border-slate-300 dark:border-slate-700">
                        + Add Rule
                    </button>
                </div>
                
                <RuleList 
                    rules={selectedRuleSet.rules} 
                    onEdit={handleEditRule} 
                    onDelete={handleDeleteRule} 
                    onDragEnd={handleDragEnd} 
                />

                <Simulator 
                    execParams={execParams} 
                    setExecParams={setExecParams} 
                    execResult={execResult} 
                    onExecute={handleDeployAndExecute} 
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <span className="text-4xl mb-4">⚖️</span>
              <p>Select a rule set to edit or create a new one.</p>
            </div>
          )}
        </div>
      </div>

      <RuleModal 
        isOpen={isRuleModalOpen}
        initialRule={editingRule}
        dataModels={dataModels}
        onClose={() => setIsRuleModalOpen(false)}
        onSave={handleSaveRule}
      />
    </div>
  );
}