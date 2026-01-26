import { useState, useEffect } from 'react';
import { Rule, RuleActionType, ConditionNode } from '@/types/Rule';
import { DataModel, FieldType, DataModelCategory, EnumDefinition } from '@/types/DataModel';
import ConditionTree from './ConditionTree';

interface RuleModalProps {
  isOpen: boolean;
  initialRule: Rule | null;
  dataModels: DataModel[];
  enabledInternalModels: string[];
  enums: EnumDefinition[];
  onClose: () => void;
  onSave: (rule: Rule) => void;
}

interface ActionItem {
  id: string;
  modelName: string;
  fieldName: string;
  value: string;
  isString?: boolean; // Track if the original value was quoted
}

export default function RuleModal({ isOpen, initialRule, dataModels, enabledInternalModels, enums, onClose, onSave }: RuleModalProps) {
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

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

      // Parse existing action string into ActionItems
      const items: ActionItem[] = [];
      if (initialRule.action) {
        // Regex to match params.put("key", value) or params.getOutput().put("key", value);
        // Supports string values ("val"), numbers (123, 12.3), and booleans (true, false)
        const regex = /params(?:\.getOutput\(\))?\.put\("([^"]+)",\s*((?:"[^"]*")|(?:\d+(?:\.\d+)?)|(?:true|false))\);/g;
        let match;
        while ((match = regex.exec(initialRule.action)) !== null) {
            const fieldKey = match[1];
            let val = match[2];
            let isString = false;
            
            // Remove quotes if it's a string value
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1);
                isString = true;
            }

            // Try to find the model for this field
            const model = dataModels.find(m => m.category === DataModelCategory.OUTPUT && m.fields.some(f => f.name === fieldKey));
            
            items.push({
                id: crypto.randomUUID(),
                modelName: model ? model.name : '',
                fieldName: fieldKey,
                value: val,
                isString
            });
        }
      }
      
      if (items.length === 0) {
          items.push({ id: crypto.randomUUID(), modelName: '', fieldName: '', value: '', isString: true });
      }
      
      setActionItems(items);

    } else {
        setEditingRule(null);
        setActionItems([]);
    }
  }, [initialRule, isOpen, dataModels]);

  // Reconstruct action string whenever actionItems changes
  useEffect(() => {
      if (!editingRule) return;

      const actions: string[] = [];
      
      actionItems.forEach(item => {
          // Require fieldName and value. We do NOT require modelName to ensure preservation.
          if (item.fieldName && item.value !== '') {
             const model = dataModels.find(m => m.name === item.modelName);
             const field = model?.fields.find(f => f.name === item.fieldName);
             
             let valStr = item.value;
             let shouldQuote = false;

             if (field) {
                 // If we found the field, strictly follow its type
                 if (field.type === FieldType.STRING || field.type === FieldType.ENUM) {
                     shouldQuote = true;
                 }
             } else {
                 // Fallback: use the original parsing hint
                 if (item.isString) {
                     shouldQuote = true;
                 }
             }

             if (shouldQuote) {
                 valStr = `"${item.value}"`;
             }

             actions.push(`params.getOutput().put("${item.fieldName}", ${valStr});`);
          }
      });

      const actionStr = actions.join(' ');
      
      if (editingRule.action !== actionStr) {
          setEditingRule(prev => prev ? ({ ...prev, action: actionStr }) : null);
      }
      
  }, [actionItems, dataModels]); 

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
      // Ensure action string is up to date (logic duplicated from effect for safety, though effect should handle it)
      const actions: string[] = [];
      actionItems.forEach(item => {
          if (item.fieldName && item.value !== '') {
             const model = dataModels.find(m => m.name === item.modelName);
             const field = model?.fields.find(f => f.name === item.fieldName);
             let valStr = item.value;
             let shouldQuote = false;
             if (field) {
                 if (field.type === FieldType.STRING || field.type === FieldType.ENUM) shouldQuote = true;
             } else {
                 if (item.isString) shouldQuote = true;
             }
             if (shouldQuote) valStr = `"${item.value}"`;
             actions.push(`params.getOutput().put("${item.fieldName}", ${valStr});`);
          }
      });
      
      const ruleToSave = { 
          ...editingRule, 
          condition: generatedCondition,
          action: actions.join(' ')
      };
      onSave(ruleToSave);
  };
  
  const outputModels = dataModels.filter(dm => dm.category === DataModelCategory.OUTPUT);

  const handleAddAction = () => {
      setActionItems([...actionItems, { id: crypto.randomUUID(), modelName: '', fieldName: '', value: '', isString: true }]);
  };

  const handleRemoveAction = (id: string) => {
      setActionItems(actionItems.filter(item => item.id !== id));
  };

  const updateActionItem = (id: string, updates: Partial<ActionItem>) => {
      setActionItems(actionItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
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
                            dataModels={[
                                ...dataModels.filter(dm => dm.category === DataModelCategory.INPUT),
                                ...dataModels.filter(dm => dm.category === DataModelCategory.INTERNAL && enabledInternalModels.includes(dm.name))
                            ]}
                            isRoot={true}
                            onChange={(newNode) => setEditingRule({...editingRule, conditionNode: newNode})}
                            onRemove={() => {}} // Root cannot be removed
                        />
                    )}
                </div>
            </div>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Actions (Set Outputs)</label>
                    <button onClick={handleAddAction} className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 rounded">
                        + Add Output
                    </button>
                </div>
                
                <div className="border dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 p-2 space-y-2">
                    {actionItems.map((item, index) => {
                        // Helper to find current field config for this row
                        const currentModel = dataModels.find(m => m.name === item.modelName);
                        const currentField = currentModel?.fields.find(f => f.name === item.fieldName);
                        const currentEnum = currentField?.type === FieldType.ENUM && currentField.enumName 
                                          ? enums.find(e => e.name === currentField.enumName) 
                                          : null;

                        return (
                            <div key={item.id} className="flex gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded border dark:border-slate-700">
                                <div className="w-1/4">
                                    <select 
                                        value={item.modelName} 
                                        onChange={e => updateActionItem(item.id, { modelName: e.target.value, fieldName: '', value: '' })}
                                        className="w-full border dark:border-slate-600 rounded p-1 text-sm dark:bg-slate-950 dark:text-slate-100"
                                    >
                                        <option value="">Select Model...</option>
                                        {outputModels.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                                    </select>
                                </div>

                                <div className="w-1/4">
                                    {/* If model selected, show Field Dropdown. If not, show raw input (or disabled dropdown + text display?) */}
                                    {/* To keep it simple and preserve data, if we can't find the model, we show the fieldName in a simple text input so user sees it exists */}
                                    {item.modelName ? (
                                        <select 
                                            value={item.fieldName} 
                                            onChange={e => updateActionItem(item.id, { fieldName: e.target.value, value: '' })}
                                            className="w-full border dark:border-slate-600 rounded p-1 text-sm dark:bg-slate-950 dark:text-slate-100"
                                        >
                                            <option value="">Select Field...</option>
                                            {currentModel?.fields.map(f => (
                                                <option key={f.name} value={f.name}>{f.name} ({f.type})</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input 
                                            type="text"
                                            value={item.fieldName}
                                            disabled
                                            className="w-full border dark:border-slate-600 rounded p-1 text-sm dark:bg-slate-950 dark:text-slate-400 bg-slate-100 italic"
                                            title="Field name (Model not found)"
                                        />
                                    )}
                                </div>

                                <div className="flex-1">
                                    {currentEnum ? (
                                      <select
                                        value={item.value}
                                        onChange={e => updateActionItem(item.id, { value: e.target.value })}
                                        className="w-full border dark:border-slate-600 rounded p-1 text-sm dark:bg-slate-950 dark:text-slate-100"
                                      >
                                        <option value="">Select {currentEnum.name}...</option>
                                        {currentEnum.values.map(v => (
                                          <option key={v} value={v}>{v}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input 
                                          type="text" 
                                          value={item.value} 
                                          onChange={e => updateActionItem(item.id, { value: e.target.value })}
                                          disabled={!!item.modelName && !item.fieldName} // Disabled if model selected but field not
                                          className="w-full border dark:border-slate-600 rounded p-1 text-sm dark:bg-slate-950 dark:text-slate-100" 
                                          placeholder="Value"
                                      />
                                    )}
                                </div>
                                
                                <button 
                                    onClick={() => handleRemoveAction(item.id)}
                                    className="text-red-500 hover:text-red-700 px-2"
                                    title="Remove Action"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                    
                    {actionItems.length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-2">No actions defined.</p>
                    )}
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
