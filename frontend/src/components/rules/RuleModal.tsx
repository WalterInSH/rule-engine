import { useState, useEffect } from 'react';
import { Rule, RuleActionType, RuleRunType, ConditionNode, ConditionDefinition } from '@/types/Rule';
import { DataModel, FieldType, DataModelCategory } from '@/types/DataModel';
import ConditionTree from './ConditionTree';

interface RuleModalProps {
  isOpen: boolean;
  initialRule: Rule | null;
  dataModels: DataModel[];
  onClose: () => void;
  onSave: (rule: Rule) => void;
}

export default function RuleModal({ isOpen, initialRule, dataModels, onClose, onSave }: RuleModalProps) {
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  // Local state for Action Builder
  const [selectedOutputModel, setSelectedOutputModel] = useState('');
  const [selectedOutputField, setSelectedOutputField] = useState('');
  const [outputValue, setOutputValue] = useState('');

  useEffect(() => {
    if (initialRule) {
      // Initialize with existing conditionNode or create a default root group
      const defaultRoot: ConditionNode = {
          type: 'GROUP',
          logicalOperator: 'AND',
          children: []
      };
      
      setEditingRule({ 
          ...initialRule, 
          conditionNode: initialRule.conditionNode || defaultRoot 
      });

      // Try to parse existing action to pre-fill builder if simple
      // Matches: params.put("key", "value"); or params.put("key", 123);
      // Regex is a best-effort parser
      const match = initialRule.action.match(/params\.put\("([^"]+)",\s*("([^"]+)"|(\d+))\);/);
      if (match) {
        // This is tricky because we don't know the Model from just the key if key is just "field"
        // But if the user follows the new UI, we can try to reverse engineer if needed.
        // For now, let's just leave the builder empty or handle simple "result" keys if common.
        // We will just let the user see the generated action string.
      }

    } else {
        setEditingRule(null);
    }
  }, [initialRule, isOpen]);

  // Update the action string whenever builder state changes
  useEffect(() => {
      if (selectedOutputModel && selectedOutputField && outputValue && editingRule) {
          // Find field type
          const model = dataModels.find(m => m.name === selectedOutputModel);
          const field = model?.fields.find(f => f.name === selectedOutputField);
          
          if (field) {
              let valStr = outputValue;
              if (field.type === FieldType.STRING) {
                  valStr = `"${outputValue}"`;
              }
              // Generate: params.put("Field", "Value");
              // Note: We use just the field name as key, assuming the engine puts all outputs in a flat map or similar.
              // If the engine needs Model.Field, we should change this. Based on previous code: params.put("risk", "high")
              const actionStr = `params.put("${selectedOutputField}", ${valStr});`;
              
              setEditingRule(prev => prev ? ({ ...prev, action: actionStr }) : null);
          }
      }
  }, [selectedOutputModel, selectedOutputField, outputValue, dataModels]);


  if (!isOpen || !editingRule) return null;

  const generateJavaCondition = (node: ConditionNode): string => {
    if (!node) return 'true';
    
    if (node.type === 'LEAF' && node.condition) {
        const c = node.condition;
        const fieldName = c.field.split('.')[1]; // Model.Field -> Field
        const safeStringClass = 'org.apache.commons.lang3.StringUtils';
        
        if (c.type === FieldType.STRING) {
            const val = `"${c.value}"`;
            const param = `params.getString("${fieldName}")`;
            
            switch (c.operator) {
                case 'EQUALS': return `${safeStringClass}.equals(${param}, ${val})`;
                case 'IS_BLANK': return `${safeStringClass}.isBlank(${param})`;
                case 'IS_NOT_BLANK': return `${safeStringClass}.isNotBlank(${param})`;
                case 'STARTS_WITH': return `${safeStringClass}.startsWith(${param}, ${val})`;
                case 'ENDS_WITH': return `${safeStringClass}.endsWith(${param}, ${val})`;
                default: return 'true';
            }
        } else if (c.type === FieldType.NUMBER) {
            const val = c.value || '0';
            const param = `params.getIntValue("${fieldName}")`;
            
            switch (c.operator) {
                case 'EQUALS': return `${param} == ${val}`;
                case 'GT': return `${param} > ${val}`;
                case 'LT': return `${param} < ${val}`;
                default: return 'true';
            }
        }
        return 'true';
    } 
    
    if (node.type === 'GROUP' && node.children && node.children.length > 0) {
        const childConditions = node.children.map(generateJavaCondition);
        const op = node.logicalOperator === 'OR' ? ' || ' : ' && ';
        return `(${childConditions.join(op)})`;
    }
    
    return 'true';
  };

  const handleSave = () => {
      if (!editingRule) return;
      const generatedCondition = generateJavaCondition(editingRule.conditionNode!);
      const ruleToSave = { ...editingRule, condition: generatedCondition };
      onSave(ruleToSave);
  };
  
  const outputModels = dataModels.filter(dm => dm.category === DataModelCategory.OUTPUT);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">Edit Rule</h2>
            
            <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ID</label>
                    <input type="text" value={editingRule.id} onChange={e => setEditingRule({...editingRule, id: e.target.value})} className="w-full border dark:border-slate-700 p-2 rounded dark:bg-slate-950 dark:text-slate-100" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Priority</label>
                    <input type="number" value={editingRule.priority} onChange={e => setEditingRule({...editingRule, priority: parseInt(e.target.value)})} className="w-full border dark:border-slate-700 p-2 rounded dark:bg-slate-950 dark:text-slate-100" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Action Type</label>
                    <select value={editingRule.actionType} onChange={e => setEditingRule({...editingRule, actionType: e.target.value as RuleActionType})} className="w-full border dark:border-slate-700 p-2 rounded dark:bg-slate-950 dark:text-slate-100">
                        {Object.values(RuleActionType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Conditions Tree</label>
                <div className="border dark:border-slate-700 rounded p-2 bg-white dark:bg-slate-900">
                    {editingRule.conditionNode && (
                        <ConditionTree 
                            node={editingRule.conditionNode} 
                            dataModels={dataModels.filter(dm => dm.category === DataModelCategory.INPUT)}
                            isRoot={true}
                            onChange={(newNode) => setEditingRule({...editingRule, conditionNode: newNode})}
                            onRemove={() => {}} // Root cannot be removed
                        />
                    )}
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Action (Set Output)</label>
                <div className="p-4 border dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800">
                    <div className="flex gap-4 items-end flex-wrap">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Output Model</label>
                            <select 
                                value={selectedOutputModel} 
                                onChange={e => { setSelectedOutputModel(e.target.value); setSelectedOutputField(''); }}
                                className="border dark:border-slate-600 rounded p-2 text-sm dark:bg-slate-900 dark:text-slate-100 min-w-[150px]"
                            >
                                <option value="">Select Model...</option>
                                {outputModels.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                            </select>
                        </div>

                        {selectedOutputModel && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Field</label>
                                <select 
                                    value={selectedOutputField} 
                                    onChange={e => setSelectedOutputField(e.target.value)}
                                    className="border dark:border-slate-600 rounded p-2 text-sm dark:bg-slate-900 dark:text-slate-100 min-w-[150px]"
                                >
                                    <option value="">Select Field...</option>
                                    {dataModels.find(m => m.name === selectedOutputModel)?.fields.map(f => (
                                        <option key={f.name} value={f.name}>{f.name} ({f.type})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedOutputField && (
                             <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Value</label>
                                <input 
                                    type="text" 
                                    value={outputValue} 
                                    onChange={e => setOutputValue(e.target.value)}
                                    className="w-full border dark:border-slate-600 rounded p-2 text-sm dark:bg-slate-900 dark:text-slate-100" 
                                    placeholder="Enter value"
                                />
                             </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Rule</button>
            </div>
        </div>
    </div>
  );
}