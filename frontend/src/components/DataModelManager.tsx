'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataModel, FieldDefinition, FieldType, DataModelCategory, DataModelSourceType, EnumDefinition } from '@/types/DataModel';
import { getSpaceApiUrl } from '@/utils/apiConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, Database, Server, FileText, Type, List, Search, X } from 'lucide-react';

interface DataModelManagerProps {
  category: DataModelCategory;
}

export default function DataModelManager({ category }: DataModelManagerProps) {
  const [dataModels, setDataModels] = useState<DataModel[]>([]);
  const [enums, setEnums] = useState<EnumDefinition[]>([]);
  const [selectedModel, setSelectedModel] = useState<DataModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDataModels = useCallback(async () => {
    try {
      const res = await fetch(getSpaceApiUrl('datamodels'));
      if (res.ok) {
        const data: DataModel[] = await res.json();
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

  const filteredModels = dataModels.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
           <Database className="text-blue-600" />
           {category} Data Models
        </h1>
        <button
          onClick={handleCreateModel}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Create New Model
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* List Column */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 shadow-xl rounded-2xl flex flex-col border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
             <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
               <input 
                 type="text" 
                 placeholder="Search models..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-all"
               />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
             <AnimatePresence mode='popLayout'>
                {filteredModels.length > 0 ? (
                    filteredModels.map((model) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={model.name}
                        onClick={() => handleEditModel(model)}
                        className={`
                          group relative p-4 rounded-xl cursor-pointer border transition-all duration-200
                          ${selectedModel?.name === model.name
                            ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' 
                            : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                          }
                        `}
                      >
                        <div className="flex justify-between items-start">
                           <div className="min-w-0">
                             <div className={`font-semibold truncate mb-1 ${selectedModel?.name === model.name ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                               {model.name}
                             </div>
                             <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                               {model.description || 'No description'}
                             </div>
                           </div>
                           <button
                             onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.name); }}
                             className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                             title="Delete"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                            <Search size={18} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">No models found</p>
                    </div>
                )}
             </AnimatePresence>
          </div>
        </div>

        {/* Editor Column */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-6 border border-slate-100 dark:border-slate-800 overflow-y-auto custom-scrollbar">
          {isEditing && selectedModel ? (
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               key={selectedModel.name || 'new'}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {selectedModel.name ? 'Edit Data Model' : 'New Data Model'}
                </h2>
                <div className="flex gap-2">
                   <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                   >
                    Cancel
                   </button>
                   <button
                    onClick={handleSaveModel}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm"
                   >
                    <Save size={16} />
                    Save Model
                   </button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Model Name (ID)</label>
                      <input
                        type="text"
                        value={selectedModel.name}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                          setSelectedModel({ ...selectedModel, name: val });
                        }}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                        placeholder="e.g., Transaction"
                        title="Only alphanumeric characters are allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                      <input
                        type="text"
                        value={selectedModel.description}
                        onChange={(e) => setSelectedModel({ ...selectedModel, description: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                        placeholder="Description of this model"
                      />
                    </div>
                </div>

                {category === DataModelCategory.INTERNAL && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                           <Server size={14} /> Source Type
                        </label>
                        <select
                            value={selectedModel.sourceType || DataModelSourceType.LOCAL_FILE}
                            onChange={(e) => setSelectedModel({ ...selectedModel, sourceType: e.target.value as DataModelSourceType })}
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={DataModelSourceType.LOCAL_FILE}>Local File</option>
                            <option value={DataModelSourceType.REMOTE_API}>Remote REST API</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {selectedModel.sourceType === DataModelSourceType.REMOTE_API ? <Database size={14} /> : <FileText size={14} />}
                          {selectedModel.sourceType === DataModelSourceType.REMOTE_API ? 'Source URL' : 'Source (Local File Path)'}
                      </label>
                      <input
                        type="text"
                        value={selectedModel.source || ''}
                        onChange={(e) => setSelectedModel({ ...selectedModel, source: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-sm"
                        placeholder={selectedModel.sourceType === DataModelSourceType.REMOTE_API ? 'https://api.example.com/data' : '/path/to/local/file.json'}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                        <List size={18} className="text-blue-500" />
                        Fields Definition
                    </label>
                    <button
                      onClick={handleAddField}
                      className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold py-1.5 px-3 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
                    >
                      <Plus size={14} /> Add Field
                    </button>
                  </div>
                  
                  {selectedModel.fields.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        <p className="text-slate-400 text-sm">No fields defined yet.</p>
                        <button onClick={handleAddField} className="text-blue-500 text-xs mt-2 hover:underline">Add your first field</button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                        {selectedModel.fields.map((field, index) => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            key={index} 
                            className="flex gap-3 items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 group hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                          >
                            <div className="flex-1 flex flex-col gap-1">
                                <label className="text-[10px] text-slate-400 font-medium uppercase">Field Name</label>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20">
                                    <Type size={14} className="text-slate-400" />
                                    <input
                                      type="text"
                                      value={field.name}
                                      onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                                      className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                                      placeholder="name"
                                    />
                                </div>
                            </div>
                            
                            <div className="w-32 flex flex-col gap-1">
                                <label className="text-[10px] text-slate-400 font-medium uppercase">Type</label>
                                <select
                                  value={field.type}
                                  onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                                  className="w-full border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                  <option value={FieldType.STRING}>String</option>
                                  <option value={FieldType.NUMBER}>Number</option>
                                  <option value={FieldType.BOOLEAN}>Boolean</option>
                                  <option value={FieldType.ENUM}>Enum</option>
                                </select>
                            </div>
                            
                            {field.type === FieldType.ENUM && (
                                <div className="w-40 flex flex-col gap-1">
                                    <label className="text-[10px] text-slate-400 font-medium uppercase">Enum Type</label>
                                    <select
                                        value={field.enumName || ''}
                                        onChange={(e) => handleFieldChange(index, 'enumName', e.target.value)}
                                        className="w-full border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Select...</option>
                                        {enums.map(e => (
                                        <option key={e.name} value={e.name}>{e.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex flex-col gap-1 justify-end h-full pt-4">
                                <button
                                  onClick={() => handleDeleteField(index)}
                                  className="text-slate-400 hover:text-red-500 bg-white dark:bg-slate-950 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                                  title="Delete Field"
                                >
                                  <X size={14} />
                                </button>
                            </div>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Database size={32} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No Model Selected</p>
              <p className="text-sm text-slate-500 max-w-xs text-center mt-2">Select a model from the list to edit its properties or create a new one.</p>
              <button
                  onClick={handleCreateModel}
                  className="mt-6 text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                >
                  <Plus size={16} /> Create New Model
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
