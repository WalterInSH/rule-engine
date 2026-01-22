import { Rule, RuleRunType } from './Rule';

export interface RuleSet {
  name: string;
  description: string;
  runType?: RuleRunType;
  rules: Rule[];
}