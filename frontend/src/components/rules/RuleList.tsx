import { Rule, ConditionNode } from '@/types/Rule';
import { DataModel, DataModelCategory } from '@/types/DataModel';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface RuleListProps {
  rules: Rule[];
  dataModels: DataModel[];
  onEdit: (rule: Rule) => void;
  onDelete: (id: string) => void;
  onDragEnd: (result: DropResult) => void;
}

export default function RuleList({ rules, dataModels, onEdit, onDelete, onDragEnd }: RuleListProps) {
  
  const formatNode = (node?: ConditionNode): string => {
    if (!node) return '';

    if (node.type === 'LEAF' && node.condition) {
        const c = node.condition;
        // Parse "Model.Field:Type" or "Model.Field"
        const parts = c.field.split('.');
        let displayName = c.field;
        
        if (parts.length > 1) {
            const model = parts[0];
            const field = parts[1].split(':')[0];
            displayName = `${model}.${field}`;
        }

        let op = c.operator;
        if (op === 'EQUALS') op = '=';
        if (op === 'GT') op = '>';
        if (op === 'LT') op = '<';
        if (op === 'IS_BLANK') return `${displayName} is blank`;
        if (op === 'IS_NOT_BLANK') return `${displayName} is not blank`;
        
        return `${displayName} ${op} ${c.value}`;
    }

    if (node.type === 'GROUP' && node.children && node.children.length > 0) {
        const childrenStr = node.children.map(formatNode).join(` ${node.logicalOperator} `);
        return node.children.length > 1 ? `(${childrenStr})` : childrenStr;
    }

    return 'True';
  };

  const getRuleDescription = (rule: Rule) => {
      if (rule.conditionNode) {
          return formatNode(rule.conditionNode);
      }
      return rule.condition || 'True';
  };

  const getActionDescription = (action: string) => {
    // Parse params.put("key", "value"); or params.put("key", 123);
    const match = action.match(/params\.put\("([^"]+)",\s*("([^"]+)"|(\d+))\);/);
    if (match) {
        const key = match[1];
        // match[3] is string value without quotes, match[4] is number
        const value = match[3] || match[4]; 
        
        // Find model for this field key (assuming key is field name)
        // Look in OUTPUT models first, or all models
        const model = dataModels.find(dm => 
            dm.category === DataModelCategory.OUTPUT && 
            dm.fields.some(f => f.name === key)
        );

        if (model) {
            return `${model.name}.${key} = ${value}`;
        }

        return `${key} = ${value}`;
    }
    return action;
  };

  return (
    <div className="flex-1 border dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 overflow-y-auto max-h-64 mb-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="rules-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {rules.map((rule, idx) => (
                <Draggable key={rule.id} draggableId={rule.id} index={idx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`p-3 border-b dark:border-slate-700 flex justify-between items-start ${snapshot.isDragging ? 'bg-blue-50 dark:bg-slate-700 shadow-lg' : 'bg-white dark:bg-slate-900'}`}
                      style={{ ...provided.draggableProps.style }}
                    >
                      <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">ID: {rule.id} <span className="text-slate-400 font-normal">| Priority: {rule.priority}</span></div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">IF {getRuleDescription(rule)}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">THEN {getActionDescription(rule.action)}</div>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => onEdit(rule)} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                          <button onClick={() => onDelete(rule.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
