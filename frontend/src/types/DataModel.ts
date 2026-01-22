export enum FieldType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
}

export interface DataModel {
  name: string;
  description: string;
  fields: FieldDefinition[];
}
