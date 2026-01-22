'use client';

import { useState, useEffect } from 'react';
import { DataModel, FieldDefinition, FieldType } from '@/types/DataModel';

const API_URL = 'http://localhost:8080/api/datamodels';

export default function DataModelsPage() {
  const [dataModels, setDataModels] = useState<DataModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<DataModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchDataModels();
  }, []);

  const fetchDataModels = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setDataModels(data);
      }
    } catch (error) {
      console.error('Failed to fetch data models', error);
    }
  };

  const handleCreateModel = () => {
    setSelectedModel({
      name: '',
      description: '',
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
      await fetch(`${API_URL}/${name}`, { method: 'DELETE' });
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
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedModel),
      });
      if (res.ok) {
        fetchDataModels();
        setIsEditing(false);
        setSelectedModel(null); // Optional: clear selection or keep it
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
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Data Models</h1>
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
                  <div className="font-medium text-slate-900 dark:text-slate-100">{model.name}</div>
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
              <li className="text-slate-400 text-center py-4">No data models found.</li>
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
                    onChange={(e) => setSelectedModel({ ...selectedModel, name: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 dark:bg-slate-950"
                    placeholder="e.g., Transaction"
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
                        </select>
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