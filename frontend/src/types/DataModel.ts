export enum FieldType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  ENUM = 'ENUM',
}

export enum DataModelCategory {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
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
  fields: FieldDefinition[];
}

export interface EnumDefinition {
  name: string;
  description: string;
  values: string[];
}