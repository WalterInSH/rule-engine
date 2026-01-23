'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataModel, FieldDefinition, FieldType, DataModelCategory, DataModelSourceType, EnumDefinition } from '@/types/DataModel';
import { getSpaceApiUrl } from '@/utils/apiConfig';

interface DataModelManagerProps {
  category: DataModelCategory;
}

export default function DataModelManager({ category }: DataModelManagerProps) {
  const [dataModels, setDataModels] = useState<DataModel[]>([]);
  const [enums, setEnums] = useState<EnumDefinition[]>([]);
  const [selectedModel, setSelectedModel] = useState<DataModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchDataModels = useCallback(async () => {
    try {
      const res = await fetch(getSpaceApiUrl('datamodels'));
      if (res.ok) {
        const data: DataModel[] = await res.json();
        // Filter models by category
        setDataModels(data.filter(model => model.category === category));
      }
    } catch (error) {
      console.error('Failed to fetch data models', error);
    }
  }, [category]);

  const fetchEnums = useCallback(async () => {
    try {
      const res = await fetch(getSpaceApiUrl('enums'));
      if (res.ok) {
        const data: EnumDefinition[] = await res.json();
        setEnums(data);
      }
    } catch (error) {
      console.error('Failed to fetch enums', error);
    }
  }, []);

  useEffect(() => {
    fetchDataModels();
    fetchEnums();

    const handleSpaceChange = () => {
        fetchDataModels();
        fetchEnums();
    };

    window.addEventListener('spaceChanged', handleSpaceChange);
    return () => {
        window.removeEventListener('spaceChanged', handleSpaceChange);
    };
  }, [fetchDataModels, fetchEnums]);

  const handleCreateModel = () => {
    setSelectedModel({
      name: '',
      description: '',
      category: category,
      sourceType: DataModelSourceType.LOCAL_FILE,
      source: '',
      fields: []
    });
    setIsEditing(true);
  };

  const handleEditModel = (model: DataModel) => {
    setSelectedModel({ ...model });
    setIsEditing(true);
  };

  const handleDeleteModel = async (name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await fetch(`${getSpaceApiUrl('datamodels')}/${name}`, { method: 'DELETE' });
      fetchDataModels();
      if (selectedModel?.name === name) {
        setSelectedModel(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to delete model', error);
    }
  };

  const handleSaveModel = async () => {
    if (!selectedModel || !selectedModel.name) return;
    try {
      const res = await fetch(getSpaceApiUrl('datamodels'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedModel),
      });
      if (res.ok) {
        fetchDataModels();
        setIsEditing(false);
        setSelectedModel(null);
      }
    } catch (error) {
      console.error('Failed to save model', error);
    }
  };

  const handleAddField = () => {
    if (!selectedModel) return;
    const newField: FieldDefinition = { name: '', type: FieldType.STRING };
    setSelectedModel({
      ...selectedModel,
      fields: [...selectedModel.fields, newField]
    });
  };

  const handleFieldChange = (index: number, key: keyof FieldDefinition, value: string) => {
    if (!selectedModel) return;
    const newFields = [...selectedModel.fields];
    newFields[index] = { ...newFields[index], [key]: value };
    
    // If type changes to something other than ENUM, clear enumName
    if (key === 'type' && value !== FieldType.ENUM) {
       delete newFields[index].enumName;
    }

    setSelectedModel({ ...selectedModel, fields: newFields });
  };

  const handleDeleteField = (index: number) => {
    if (!selectedModel) return;
    const newFields = selectedModel.fields.filter((_, i) => i !== index);
    setSelectedModel({ ...selectedModel, fields: newFields });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{category} Data Models</h1>
        <button
          onClick={handleCreateModel}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Create New Model
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* List Column */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Models List</h2>
          <ul>
            {dataModels.map((model) => (
              <li
                key={model.name}
                className={`p-3 border-b dark:border-slate-800 last:border-b-0 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  selectedModel?.name === model.name ? 'bg-blue-50 dark:bg-slate-800' : ''
                }`}
                onClick={() => handleEditModel(model)}
              >
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {model.name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate w-32">{model.description}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.name); }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </li>
            ))}
            {dataModels.length === 0 && (
              <li className="text-slate-400 text-center py-4">No {category.toLowerCase()} data models found.</li>
            )}
          </ul>
        </div>

        {/* Editor Column */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 shadow rounded-lg p-6">
          {isEditing && selectedModel ? (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
                {selectedModel.name ? 'Edit Data Model' : 'New Data Model'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Model Name (ID)</label>
                  <input
                    type="text"
                    value={selectedModel.name}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                      setSelectedModel({ ...selectedModel, name: val });
                    }}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 dark:bg-slate-950"
                    placeholder="e.g., Transaction"
                    title="Only alphanumeric characters are allowed (a-z, A-Z, 0-9)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={selectedModel.description}
                    onChange={(e) => setSelectedModel({ ...selectedModel, description: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 dark:bg-slate-950"
                    placeholder="Description of this model"
                  />
                </div>

                {category === DataModelCategory.INTERNAL && (
                  <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source Type</label>
                        <select
                            value={selectedModel.sourceType || DataModelSourceType.LOCAL_FILE}
                            onChange={(e) => setSelectedModel({ ...selectedModel, sourceType: e.target.value as DataModelSourceType })}
                            className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        >
                            <option value={DataModelSourceType.LOCAL_FILE}>Local File</option>
                            <option value={DataModelSourceType.REMOTE_API}>Remote REST API</option>
                        </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {selectedModel.sourceType === DataModelSourceType.REMOTE_API ? 'Source URL' : 'Source (Local File Path)'}
                      </label>
                      <input
                        type="text"
                        value={selectedModel.source || ''}
                        onChange={(e) => setSelectedModel({ ...selectedModel, source: e.target.value })}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 dark:bg-slate-950"
                        placeholder={selectedModel.sourceType === DataModelSourceType.REMOTE_API ? 'https://api.example.com/data' : '/path/to/local/file.json'}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-lg font-medium text-slate-700 dark:text-slate-200">Fields</label>
                    <button
                      onClick={handleAddField}
                      className="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-1 px-3 rounded border border-slate-300 dark:border-slate-700"
                    >
                      + Add Field
                    </button>
                  </div>
                  
                  {selectedModel.fields.length === 0 && (
                    <p className="text-slate-400 italic">No fields defined.</p>
                  )}

                  <div className="space-y-3">
                    {selectedModel.fields.map((field, index) => (
                      <div key={index} className="flex gap-3 items-center bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                          className="flex-1 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-900"
                          placeholder="Field Name"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                          className="w-32 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
                        >
                          <option value={FieldType.STRING}>String</option>
                          <option value={FieldType.NUMBER}>Number</option>
                          <option value={FieldType.BOOLEAN}>Boolean</option>
                          <option value={FieldType.ENUM}>Enum</option>
                        </select>
                        
                        {field.type === FieldType.ENUM && (
                          <select
                            value={field.enumName || ''}
                            onChange={(e) => handleFieldChange(index, 'enumName', e.target.value)}
                            className="w-40 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
                          >
                            <option value="">Select Enum...</option>
                            {enums.map(e => (
                              <option key={e.name} value={e.name}>{e.name}</option>
                            ))}
                          </select>
                        )}

                        <button
                          onClick={() => handleDeleteField(index)}
                          className="text-red-500 hover:text-red-700 px-2"
                          title="Delete Field"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveModel}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow-sm"
                  >
                    Save Model
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <span className="text-4xl mb-4">🗂️</span>
              <p>Select a model to edit or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}