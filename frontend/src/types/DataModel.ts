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

export enum DataModelSourceType {
  LOCAL_FILE = 'LOCAL_FILE',
  REMOTE_API = 'REMOTE_API',
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
  sourceType?: DataModelSourceType;
  source?: string;
  fields: FieldDefinition[];
}

export interface EnumDefinition {
  name: string;
  description: string;
  values: string[];
}