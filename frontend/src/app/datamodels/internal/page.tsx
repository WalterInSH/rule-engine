'use client';

import DataModelManager from '@/components/DataModelManager';
import { DataModelCategory } from '@/types/DataModel';

export default function InternalDataModelsPage() {
  return <DataModelManager category={DataModelCategory.INTERNAL} />;
}
