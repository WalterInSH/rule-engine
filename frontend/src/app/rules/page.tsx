'use client';

import {useState, useEffect} from 'react';

import {RuleSet} from '@/types/RuleSet';
import {Rule, RuleActionType, RuleRunType} from '@/types/Rule';
import {DataModel, EnumDefinition, DataModelCategory} from '@/types/DataModel';
import {DropResult} from '@hello-pangea/dnd';

import RuleSetList from '@/components/rules/RuleSetList';
import RuleModal from '@/components/rules/RuleModal';
import VersionsModal from '@/components/rules/VersionsModal';
import SnapshotModal from '@/components/rules/SnapshotModal';
import RuleSetEditor from '@/components/rules/RuleSetEditor';
import NotificationToast from '@/components/rules/NotificationToast';

import {getSpaceApiUrl} from '@/utils/apiConfig';

export default function RulesPage() {

    const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
    const [dataModels, setDataModels] = useState<DataModel[]>([]);
    const [enums, setEnums] = useState<EnumDefinition[]>([]);
    const [selectedRuleSet, setSelectedRuleSet] = useState<RuleSet | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Rule Editing State
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Versioning State
    const [versions, setVersions] = useState<any[]>([]);
    const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
    const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

    // Notifications
    const [notification, setNotification] = useState<{
        message: string,
        type: 'success' | 'error' | 'info'
    } | null>(null);

    // Execution State
    const [execParams, setExecParams] = useState('{\n  \n}');
    const [execResult, setExecResult] = useState<string | null>(null);

    useEffect(() => {
        fetchAll();
        const handleSpaceChange = () => {
            fetchAll();
            setSelectedRuleSet(null);
            setIsEditing(false);
        };
        window.addEventListener('spaceChanged', handleSpaceChange);
        return () => {
            window.removeEventListener('spaceChanged', handleSpaceChange);
        };
    }, []);

    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotification({message, type});
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchAll = () => {
        fetchRuleSets();
        fetchDataModels();
        fetchEnums();
    };

    const fetchRuleSets = async () => {
        try {
            const res = await fetch(getSpaceApiUrl('rulesets'));
            if (res.ok) setRuleSets(await res.json());
        } catch (e) {
            console.error('Failed to fetch rule sets', e);
        }
    };

    const fetchDataModels = async () => {
        try {
            const res = await fetch(getSpaceApiUrl('datamodels'));
            if (res.ok) setDataModels(await res.json());
        } catch (e) {
            console.error('Failed to fetch data models', e);
        }
    };

    const fetchEnums = async () => {
        try {
            const res = await fetch(getSpaceApiUrl('enums'));
            if (res.ok) setEnums(await res.json());
        } catch (e) {
            console.error('Failed to fetch enums', e);
        }
    };

    // Rule Set CRUD
    const handleCreateRuleSet = () => {
        setSelectedRuleSet({name: '', description: '', runType: RuleRunType.SYNC, internalModels: [], rules: []});
        setIsEditing(true);
    };

    const handleEditRuleSet = (rs: RuleSet) => {
        setSelectedRuleSet({...rs, runType: rs.runType || RuleRunType.SYNC, internalModels: rs.internalModels || []});
        setIsEditing(true);
    };

    const handleDeleteRuleSet = async (name: string) => {
        if (!confirm(`Delete rule set ${name}?`)) return;
        await fetch(`${getSpaceApiUrl('rulesets')}/${name}`, {method: 'DELETE'});
        fetchRuleSets();
        if (selectedRuleSet?.name === name) {
            setSelectedRuleSet(null);
            setIsEditing(false);
        }
    };

    const handleSaveRuleSet = async () => {
        if (!selectedRuleSet?.name) return;
        setSaveStatus('saving');
        try {
            await fetch(getSpaceApiUrl('rulesets'), {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(selectedRuleSet)
            });
            fetchRuleSets();
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setSaveStatus('idle');
            showNotification('Failed to save rule set', 'error');
        }
    };

    const handleOpenSnapshotModal = () => {
        setIsSnapshotModalOpen(true);
    };

    const handleCreateSnapshot = async (tag: string) => {
        if (!selectedRuleSet?.name) return;

        try {
            const res = await fetch(`${getSpaceApiUrl('rulesets')}/${selectedRuleSet.name}/snapshot?tag=${encodeURIComponent(tag)}`, {
                method: 'POST'
            });
            if (res.ok) {
                setIsSnapshotModalOpen(false);
                showNotification('Snapshot created successfully!', 'success');
            } else {
                showNotification('Failed to create snapshot.', 'error');
            }
        } catch (e) {
            console.error(e);
            showNotification('Error creating snapshot.', 'error');
        }
    };

    const handleShowVersions = async () => {
        if (!selectedRuleSet?.name) return;
        try {
            const res = await fetch(`${getSpaceApiUrl('rulesets')}/${selectedRuleSet.name}/versions`);
            if (res.ok) {
                setVersions(await res.json());
                setIsVersionsModalOpen(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleRestore = async (versionFilename: string) => {
        if (!selectedRuleSet?.name) return;
        try {
            const res = await fetch(`${getSpaceApiUrl('rulesets')}/${selectedRuleSet.name}/restore?version=${encodeURIComponent(versionFilename)}`, {
                method: 'POST'
            });
            if (res.ok) {
                showNotification('Version restored! Reloading...', 'success');
                await fetchRuleSets();
                const listRes = await fetch(getSpaceApiUrl('rulesets'));
                if (listRes.ok) {
                    const list = await listRes.json();
                    setRuleSets(list);
                    const updated = list.find((r: RuleSet) => r.name === selectedRuleSet.name);
                    if (updated) {
                        setSelectedRuleSet(updated);
                    }
                }
                setIsVersionsModalOpen(false);
            } else {
                showNotification('Failed to restore version.', 'error');
            }
        } catch (e) {
            console.error(e);
            showNotification('Error restoring version.', 'error');
        }
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
        setSelectedRuleSet({...selectedRuleSet, rules: newRules});
        setIsRuleModalOpen(false);
        setEditingRule(null);
    };

    const handleDeleteRule = (id: string) => {
        if (!selectedRuleSet) return;
        const newRules = selectedRuleSet.rules.filter(r => r.id !== id);
        setSelectedRuleSet({...selectedRuleSet, rules: newRules});
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

        const loadRes = await fetch(`${getSpaceApiUrl('rules')}/reload`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(selectedRuleSet)
        });

        if (!loadRes.ok) {
            setExecResult('Failed to load rules: ' + await loadRes.text());
            return;
        }

        try {
            const params = JSON.parse(execParams);
            const execRes = await fetch(`${getSpaceApiUrl('rules')}/execute`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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
                <button onClick={handleCreateRuleSet}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
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
                        <RuleSetEditor
                            ruleSet={selectedRuleSet}
                            onChange={setSelectedRuleSet}
                            onSave={handleSaveRuleSet}
                            onClose={() => setIsEditing(false)}
                            onSnapshot={handleOpenSnapshotModal}
                            onVersions={handleShowVersions}
                            saveStatus={saveStatus}
                            dataModels={dataModels}
                            onAddRule={handleAddRule}
                            onEditRule={handleEditRule}
                            onDeleteRule={handleDeleteRule}
                            onDragEnd={handleDragEnd}
                            execParams={execParams}
                            setExecParams={setExecParams}
                            execResult={execResult}
                            onExecute={handleDeployAndExecute}
                        />
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
                enabledInternalModels={selectedRuleSet?.internalModels || []}
                enums={enums}
                onClose={() => setIsRuleModalOpen(false)}
                onSave={handleSaveRule}
            />

            <VersionsModal
                isOpen={isVersionsModalOpen}
                versions={versions}
                ruleSetName={selectedRuleSet?.name || ''}
                onClose={() => setIsVersionsModalOpen(false)}
                onRestore={handleRestore}
            />

            <SnapshotModal
                isOpen={isSnapshotModalOpen}
                onClose={() => setIsSnapshotModalOpen(false)}
                onCreate={handleCreateSnapshot}
            />

            <NotificationToast notification={notification} />
        </div>
    );
}













