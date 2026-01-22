export enum RuleActionType {
  PARAM = 'PARAM',
  SCORE = 'SCORE',
  TAG = 'TAG',
  REJECT = 'REJECT',
  PASS = 'PASS'
}

export enum RuleRunType {
  SYNC = 'SYNC',
  ASYNC = 'ASYNC'
}

export interface ConditionDefinition {
  field: string;
  operator: string;
  value: string;
  type: string;
}

export interface ConditionNode {
  type: 'GROUP' | 'LEAF';
  logicalOperator?: 'AND' | 'OR';
  children?: ConditionNode[];
  condition?: ConditionDefinition;
}

export interface Rule {
  id: string;
  priority: number;
  actionType: RuleActionType;
  condition: string;
  action: string;
  conditionNode?: ConditionNode;
  conditions?: ConditionDefinition[]; // Deprecated but kept for type safety during migration if needed
}