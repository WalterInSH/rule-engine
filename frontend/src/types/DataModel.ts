export enum FieldType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  ENUM = 'ENUM',
}

export enum DataModelCategory {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
  INTERNAL = 'INTERNAL',
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
  enumName?: string;
}

export interface DataModel {
  name: string;
  description: string;
  category?: DataModelCategory;
  source?: string;
  fields: FieldDefinition[];
}

export interface EnumDefinition {
  name: string;
  description: string;
  values: string[];
}