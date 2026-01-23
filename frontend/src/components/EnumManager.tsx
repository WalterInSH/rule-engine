'use client';

import { useState, useEffect, useCallback } from 'react';
import { EnumDefinition } from '@/types/DataModel';
import { getSpaceApiUrl } from '@/utils/apiConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Plus, Trash2, Save, Search, X, Tag } from 'lucide-react';

export default function EnumManager() {
  const [enums, setEnums] = useState<EnumDefinition[]>([]);
  const [selectedEnum, setSelectedEnum] = useState<EnumDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredEnums = enums.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
           <List className="text-blue-600" />
           Enumerations
        </h1>
        <button
          onClick={handleCreateEnum}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Create New Enum
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
                 placeholder="Search enums..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-all"
               />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            <AnimatePresence mode='popLayout'>
                {filteredEnums.length > 0 ? (
                    filteredEnums.map((enumDef) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={enumDef.name}
                        onClick={() => handleEditEnum(enumDef)}
                        className={`
                          group relative p-4 rounded-xl cursor-pointer border transition-all duration-200
                          ${selectedEnum?.name === enumDef.name 
                            ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' 
                            : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                          }
                        `}
                      >
                        <div className="flex justify-between items-start">
                           <div className="min-w-0">
                             <div className={`font-semibold truncate mb-1 ${selectedEnum?.name === enumDef.name ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                               {enumDef.name}
                             </div>
                             <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                               {enumDef.description || 'No description'}
                             </div>
                             <div className="mt-2 flex items-center gap-1">
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                    {enumDef.values.length} Values
                                </span>
                             </div>
                           </div>
                           <button
                             onClick={(e) => { e.stopPropagation(); handleDeleteEnum(enumDef.name); }}
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
                        <p className="text-sm text-slate-500 dark:text-slate-400">No enums found</p>
                    </div>
                )}
            </AnimatePresence>
          </div>
        </div>

        {/* Editor Column */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-6 border border-slate-100 dark:border-slate-800 overflow-y-auto custom-scrollbar">
          {isEditing && selectedEnum ? (
            <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               key={selectedEnum.name || 'new'}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {selectedEnum.name ? 'Edit Enum' : 'New Enum'}
                </h2>
                <div className="flex gap-2">
                   <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                   >
                    Cancel
                   </button>
                   <button
                    onClick={handleSaveEnum}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm"
                   >
                    <Save size={16} />
                    Save Enum
                   </button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Enum Name</label>
                      <input
                        type="text"
                        value={selectedEnum.name}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                          setSelectedEnum({ ...selectedEnum, name: val });
                        }}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                        placeholder="e.g., TransactionStatus"
                        title="Only alphanumeric characters are allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                      <input
                        type="text"
                        value={selectedEnum.description}
                        onChange={(e) => setSelectedEnum({ ...selectedEnum, description: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                        placeholder="Description of this enum"
                      />
                    </div>
                </div>

                <div className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                        <Tag size={18} className="text-blue-500" />
                        Enum Values
                    </label>
                    <button
                      onClick={handleAddValue}
                      className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold py-1.5 px-3 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
                    >
                      <Plus size={14} /> Add Value
                    </button>
                  </div>
                  
                  {selectedEnum.values.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        <p className="text-slate-400 text-sm">No values defined yet.</p>
                        <button onClick={handleAddValue} className="text-blue-500 text-xs mt-2 hover:underline">Add your first value</button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AnimatePresence initial={false}>
                        {selectedEnum.values.map((value, index) => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={index} 
                            className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 group hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                          >
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleValueChange(index, e.target.value)}
                              className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-slate-100 focus:outline-none px-2"
                              placeholder="Value"
                              autoFocus={!value}
                            />
                            <button
                              onClick={() => handleDeleteValue(index)}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Delete Value"
                            >
                              <X size={14} />
                            </button>
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
                 <Tag size={32} className="text-slate-300 dark:text-slate-600" />
               </div>
               <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No Enum Selected</p>
               <p className="text-sm text-slate-500 max-w-xs text-center mt-2">Select an enum from the list to edit its values or create a new one.</p>
               <button
                   onClick={handleCreateEnum}
                   className="mt-6 text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                 >
                   <Plus size={16} /> Create New Enum
               </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}