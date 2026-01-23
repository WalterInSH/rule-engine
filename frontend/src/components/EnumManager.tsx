'use client';

import { useState, useEffect, useCallback } from 'react';
import { EnumDefinition } from '@/types/DataModel';
import { getSpaceApiUrl } from '@/utils/apiConfig';

export default function EnumManager() {
  const [enums, setEnums] = useState<EnumDefinition[]>([]);
  const [selectedEnum, setSelectedEnum] = useState<EnumDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
    fetchEnums();

    const handleSpaceChange = () => {
        fetchEnums();
    };

    window.addEventListener('spaceChanged', handleSpaceChange);
    return () => {
        window.removeEventListener('spaceChanged', handleSpaceChange);
    };
  }, [fetchEnums]);

  const handleCreateEnum = () => {
    setSelectedEnum({
      name: '',
      description: '',
      values: []
    });
    setIsEditing(true);
  };

  const handleEditEnum = (enumDef: EnumDefinition) => {
    setSelectedEnum({ ...enumDef });
    setIsEditing(true);
  };

  const handleDeleteEnum = async (name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await fetch(`${getSpaceApiUrl('enums')}/${name}`, { method: 'DELETE' });
      fetchEnums();
      if (selectedEnum?.name === name) {
        setSelectedEnum(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to delete enum', error);
    }
  };

  const handleSaveEnum = async () => {
    if (!selectedEnum || !selectedEnum.name) return;
    try {
      const res = await fetch(getSpaceApiUrl('enums'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedEnum),
      });
      if (res.ok) {
        fetchEnums();
        setIsEditing(false);
        setSelectedEnum(null);
      }
    } catch (error) {
      console.error('Failed to save enum', error);
    }
  };

  const handleAddValue = () => {
    if (!selectedEnum) return;
    setSelectedEnum({
      ...selectedEnum,
      values: [...selectedEnum.values, '']
    });
  };

  const handleValueChange = (index: number, value: string) => {
    if (!selectedEnum) return;
    const newValues = [...selectedEnum.values];
    newValues[index] = value;
    setSelectedEnum({ ...selectedEnum, values: newValues });
  };

  const handleDeleteValue = (index: number) => {
    if (!selectedEnum) return;
    const newValues = selectedEnum.values.filter((_, i) => i !== index);
    setSelectedEnum({ ...selectedEnum, values: newValues });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Enumerations</h1>
        <button
          onClick={handleCreateEnum}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Create New Enum
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* List Column */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Enums List</h2>
          <ul>
            {enums.map((enumDef) => (
              <li
                key={enumDef.name}
                className={`p-3 border-b dark:border-slate-800 last:border-b-0 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  selectedEnum?.name === enumDef.name ? 'bg-blue-50 dark:bg-slate-800' : ''
                }`}
                onClick={() => handleEditEnum(enumDef)}
              >
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {enumDef.name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate w-32">{enumDef.description}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteEnum(enumDef.name); }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </li>
            ))}
            {enums.length === 0 && (
              <li className="text-slate-400 text-center py-4">No enums found.</li>
            )}
          </ul>
        </div>

        {/* Editor Column */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 shadow rounded-lg p-6">
          {isEditing && selectedEnum ? (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
                {selectedEnum.name ? 'Edit Enum' : 'New Enum'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Enum Name</label>
                  <input
                    type="text"
                    value={selectedEnum.name}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                      setSelectedEnum({ ...selectedEnum, name: val });
                    }}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 dark:bg-slate-950"
                    placeholder="e.g., TransactionStatus"
                    title="Only alphanumeric characters are allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={selectedEnum.description}
                    onChange={(e) => setSelectedEnum({ ...selectedEnum, description: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 dark:bg-slate-950"
                    placeholder="Description of this enum"
                  />
                </div>

                <div className="mt-8">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-lg font-medium text-slate-700 dark:text-slate-200">Values</label>
                    <button
                      onClick={handleAddValue}
                      className="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-1 px-3 rounded border border-slate-300 dark:border-slate-700"
                    >
                      + Add Value
                    </button>
                  </div>
                  
                  {selectedEnum.values.length === 0 && (
                    <p className="text-slate-400 italic">No values defined.</p>
                  )}

                  <div className="space-y-3">
                    {selectedEnum.values.map((value, index) => (
                      <div key={index} className="flex gap-3 items-center bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleValueChange(index, e.target.value)}
                          className="flex-1 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-900"
                          placeholder="Enum Value"
                        />
                        <button
                          onClick={() => handleDeleteValue(index)}
                          className="text-red-500 hover:text-red-700 px-2"
                          title="Delete Value"
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
                    onClick={handleSaveEnum}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow-sm"
                  >
                    Save Enum
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <span className="text-4xl mb-4">🏷️</span>
              <p>Select an enum to edit or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
