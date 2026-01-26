'use client';

import {useEffect, useState} from 'react';
import {Space} from '@/types/Space';
import {createSpace, deleteSpace, fetchSpaces} from '@/utils/spaceManager';
import {AnimatePresence, motion} from 'framer-motion';
import {Box, Fingerprint, LayoutGrid, Plus, Save, Trash2, X} from 'lucide-react';

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [newSpace, setNewSpace] = useState<Space>({ id: '', name: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  const loadSpaces = async () => {
    const list = await fetchSpaces();
    setSpaces(list);
  };

  useEffect(() => {
    loadSpaces();
  }, []);

  const handleCreate = async () => {
    if (!newSpace.name) return;

    // Auto-generate ID if empty from name
    const spaceToSave = { ...newSpace };
    if (!spaceToSave.id) {
        spaceToSave.id = spaceToSave.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    const created = await createSpace(spaceToSave);
    if (created) {
      loadSpaces();
      setIsCreating(false);
      setNewSpace({ id: '', name: '', description: '' });
    }
  };

  const handleDelete = async (id: string) => {
    if (id === 'default') {
        alert("Cannot delete default space");
        return;
    }
    if (confirm(`Are you sure you want to delete space ${id}?`)) {
      const success = await deleteSpace(id);
      if (success) loadSpaces();
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <LayoutGrid className="text-blue-600" size={32} />
            Space Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Organize your rules and models into isolated workspaces.
          </p>
        </div>
        {!isCreating && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus size={20} />
            Create New Space
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 40 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                   <Box className="text-blue-500" /> New Space
                 </h2>
                 <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                   <X size={24} />
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Name</label>
                  <input
                    type="text"
                    value={newSpace.name}
                    onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g. My Awesome Project"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
                    ID <span className="text-xs font-normal text-slate-400 normal-case">(Optional, auto-generated)</span>
                  </label>
                  <div className="relative">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={newSpace.id}
                      onChange={(e) => setNewSpace({ ...newSpace, id: e.target.value })}
                      className="w-full pl-10 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="my-awesome-project"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Description</label>
                  <input
                    type="text"
                    value={newSpace.description}
                    onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Brief description of the workspace"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newSpace.name}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-8 rounded-lg shadow-lg shadow-blue-500/30 transition-all"
                >
                  <Save size={18} />
                  Save Space
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.map((space, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={space.id}
            className="group bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800 relative transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
               {space.id !== 'default' && (
                <button
                  onClick={() => handleDelete(space.id)}
                  className="text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 transition-all"
                  title="Delete Space"
                >
                  <Trash2 size={18} />
                </button>
               )}
            </div>

            <div className="flex items-start justify-between mb-4">
               <div className={`p-3 rounded-xl ${space.id === 'default' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                 <Box size={24} />
               </div>
               {space.id === 'default' && (
                 <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-900/30">
                   Default
                 </span>
               )}
            </div>

            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{space.name}</h3>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-4 bg-slate-50 dark:bg-slate-950 w-fit px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
               <Fingerprint size={12} /> {space.id}
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
               {space.description || <span className="italic text-slate-400">No description provided.</span>}
            </p>
          </motion.div>
        ))}

        {spaces.length === 0 && !isCreating && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                <Box size={48} className="mb-4 opacity-20" />
                <p>No spaces found. Create one to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
}
