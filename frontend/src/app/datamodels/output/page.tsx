'use client';

import DataModelManager from '@/components/DataModelManager';
import { DataModelCategory } from '@/types/DataModel';

export default function OutputDataModelsPage() {
  return <DataModelManager category={DataModelCategory.OUTPUT} />;
}
