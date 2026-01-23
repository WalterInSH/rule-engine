'use client';

import { useState, useEffect } from 'react';
import { Space } from '@/types/Space';
import { fetchSpaces, createSpace, deleteSpace } from '@/utils/spaceManager';

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [newSpace, setNewSpace] = useState<Space>({ id: '', name: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    const list = await fetchSpaces();
    setSpaces(list);
  };

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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Space Management</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Create New Space
        </button>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-slate-900 shadow rounded-lg p-6 mb-6 border border-blue-200 dark:border-blue-900">
          <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">New Space</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={newSpace.name}
                onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 dark:bg-slate-950 dark:text-slate-100"
                placeholder="My Project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID (Optional, auto-generated)</label>
              <input
                type="text"
                value={newSpace.id}
                onChange={(e) => setNewSpace({ ...newSpace, id: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 dark:bg-slate-950 dark:text-slate-100"
                placeholder="my-project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={newSpace.description}
                onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Project description"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
            >
              Save Space
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.map((space) => (
          <div key={space.id} className="bg-white dark:bg-slate-900 shadow rounded-lg p-6 border dark:border-slate-800">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{space.name}</h3>
              {space.id !== 'default' && (
                <button
                  onClick={() => handleDelete(space.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mb-2">ID: {space.id}</p>
            <p className="text-slate-600 dark:text-slate-300">{space.description || 'No description'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
