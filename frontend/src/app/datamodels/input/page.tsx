'use client';

import DataModelManager from '@/components/DataModelManager';
import {DataModelCategory} from '@/types/DataModel';

export default function InputDataModelsPage() {
  return <DataModelManager category={DataModelCategory.INPUT} />;
}
