import { ConditionNode, ConditionDefinition } from '@/types/Rule';
import { DataModel, FieldType } from '@/types/DataModel';
import { useState } from 'react';

interface ConditionTreeProps {
  node: ConditionNode;
  dataModels: DataModel[];
  onChange: (node: ConditionNode) => void;
  onRemove: () => void;
  isRoot?: boolean;
}

export default function ConditionTree({ node, dataModels, onChange, onRemove, isRoot = false }: ConditionTreeProps) {
  
  // Local state for the "Add Leaf" form within a group
  const [selectedModel, setSelectedModel] = useState('');
  const [addField, setAddField] = useState('');
  const [addOperator, setAddOperator] = useState('');
  const [addValue, setAddValue] = useState('');

  const handleToggleOperator = () => {
    if (node.type === 'GROUP') {
      onChange({ ...node, logicalOperator: node.logicalOperator === 'AND' ? 'OR' : 'AND' });
    }
  };

  const handleAddGroup = () => {
    if (node.type !== 'GROUP') return;
    const newGroup: ConditionNode = {
      type: 'GROUP',
      logicalOperator: 'AND',
      children: []
    };
    onChange({
      ...node,
      children: [...(node.children || []), newGroup]
    });
  };

  const handleAddLeaf = () => {
    if (node.type !== 'GROUP' || !addField || !addOperator) return;
    
    const [fullFieldName, type] = addField.split(':');
    
    const newLeaf: ConditionNode = {
      type: 'LEAF',
      condition: {
        field: fullFieldName,
        operator: addOperator,
        value: addValue,
        type: type
      }
    };

    onChange({
      ...node,
      children: [...(node.children || []), newLeaf]
    });
    
    setAddValue('');
  };

  const handleChildChange = (index: number, updatedChild: ConditionNode) => {
    if (node.type !== 'GROUP' || !node.children) return;
    const newChildren = [...node.children];
    newChildren[index] = updatedChild;
    onChange({ ...node, children: newChildren });
  };

  const handleChildRemove = (index: number) => {
    if (node.type !== 'GROUP' || !node.children) return;
    const newChildren = node.children.filter((_, i) => i !== index);
    onChange({ ...node, children: newChildren });
  };

  if (node.type === 'LEAF' && node.condition) {
    const c = node.condition;
    return (
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded border dark:border-slate-700 shadow-sm">
        <div className="text-sm dark:text-slate-200">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{c.field.split('.')[0]}.</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{c.field.split('.')[1].split(':')[0]}</span> 
            <span className="mx-2 text-slate-400 font-mono text-xs">{c.operator}</span> 
            {!c.operator.includes('BLANK') && <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-800 dark:text-slate-200">{c.value}</span>}
        </div>
        <button onClick={onRemove} className="text-red-500 hover:text-red-700 text-xs font-semibold px-2">✕</button>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded border dark:border-slate-700 ${isRoot ? 'bg-slate-50 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-700 ml-4 mt-2'}`}>
      <div className="flex items-center gap-3 mb-3">
        <button 
          onClick={handleToggleOperator}
          className={`font-bold text-xs px-2 py-1 rounded transition-colors ${
            node.logicalOperator === 'AND' 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
              : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
          }`}
          title="Click to toggle AND/OR"
        >
          {node.logicalOperator}
        </button>
        
        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Group</span>
        
        {!isRoot && (
           <button onClick={onRemove} className="ml-auto text-red-500 hover:text-red-700 text-xs">Remove Group</button>
        )}
      </div>

      <div className="space-y-2">
        {node.children?.map((child, idx) => (
          <ConditionTree 
            key={idx} 
            node={child} 
            dataModels={dataModels} 
            onChange={(updated) => handleChildChange(idx, updated)}
            onRemove={() => handleChildRemove(idx)}
          />
        ))}
        {(!node.children || node.children.length === 0) && (
            <div className="text-xs text-slate-400 italic p-2 text-center">Empty Group (True)</div>
        )}
      </div>

      {/* Add New Item Form */}
      <div className="mt-3 pt-3 border-t dark:border-slate-600">
        <div className="flex gap-2 items-center flex-wrap">
            <select
                value={selectedModel}
                onChange={e => {
                    setSelectedModel(e.target.value);
                    setAddField('');
                    setAddOperator('');
                    setAddValue('');
                }}
                className="text-xs border dark:border-slate-600 rounded p-1 dark:bg-slate-800 dark:text-slate-200 max-w-[150px]"
            >
                <option value="">+ Add Condition (Model)...</option>
                {dataModels.map(dm => (
                    <option key={dm.name} value={dm.name}>{dm.name}</option>
                ))}
            </select>

            {selectedModel && (
                <select 
                    value={addField} 
                    onChange={e => { setAddField(e.target.value); setAddOperator(''); }}
                    className="text-xs border dark:border-slate-600 rounded p-1 dark:bg-slate-800 dark:text-slate-200 max-w-[150px]"
                >
                    <option value="">Select Field...</option>
                    {dataModels.find(dm => dm.name === selectedModel)?.fields.map(f => (
                        <option key={`${selectedModel}-${f.name}`} value={`${selectedModel}.${f.name}:${f.type}`}>
                            {f.name}
                        </option>
                    ))}
                </select>
            )}
            
            {addField && (
                <>
                    <select 
                        value={addOperator} 
                        onChange={e => setAddOperator(e.target.value)}
                        className="text-xs border dark:border-slate-600 rounded p-1 dark:bg-slate-800 dark:text-slate-200"
                    >
                        <option value="">Op...</option>
                        {addField.endsWith('STRING') && (
                            <>
                                <option value="EQUALS">=</option>
                                <option value="IS_BLANK">Blank</option>
                                <option value="IS_NOT_BLANK">!Blank</option>
                                <option value="STARTS_WITH">Starts</option>
                                <option value="ENDS_WITH">Ends</option>
                            </>
                        )}
                        {addField.endsWith('NUMBER') && (
                            <>
                                <option value="EQUALS">=</option>
                                <option value="GT">&gt;</option>
                                <option value="LT">&lt;</option>
                            </>
                        )}
                    </select>

                    <input 
                        type={addField.endsWith('NUMBER') ? "number" : "text"}
                        value={addValue}
                        onChange={e => setAddValue(e.target.value)}
                        className="text-xs border dark:border-slate-600 rounded p-1 w-20 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50"
                        disabled={!addOperator || addOperator.includes('BLANK')}
                        placeholder="Val"
                    />

                    <button 
                        onClick={handleAddLeaf}
                        disabled={!addOperator}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Add
                    </button>
                </>
            )}

            <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>

            <button 
                onClick={handleAddGroup}
                className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-2 py-1 rounded hover:bg-slate-300 dark:hover:bg-slate-500"
            >
                + (Group)
            </button>
        </div>
      </div>
    </div>
  );
}
