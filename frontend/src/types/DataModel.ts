export enum FieldType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
}

export enum DataModelCategory {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
}

export interface DataModel {
  name: string;
  description: string;
  category?: DataModelCategory;
  fields: FieldDefinition[];
}
