import React, { useState, useEffect } from 'react';

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (tag: string) => void;
}

export default function SnapshotModal({ isOpen, onClose, onCreate }: SnapshotModalProps) {
  const [tag, setTag] = useState('');

  // Reset tag when modal opens
  useEffect(() => {
    if (isOpen) {
        setTag('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-slate-100">Create Snapshot</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Enter a tag name for this version (e.g., &quot;v1.0&quot;, &quot;release-candidate&quot;).
            </p>
            
            <input 
                type="text" 
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Tag name"
                className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 mb-6 dark:bg-slate-950 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && tag.trim()) {
                        onCreate(tag);
                    }
                }}
            />

            <div className="flex justify-end gap-3">
                <button 
                    onClick={onClose} 
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => {
                        if (tag.trim()) onCreate(tag);
                    }}
                    disabled={!tag.trim()}
                    className={`px-4 py-2 rounded font-semibold text-white ${
                        tag.trim() 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'bg-purple-300 cursor-not-allowed'
                    }`}
                >
                    Create Snapshot
                </button>
            </div>
        </div>
    </div>
  );
}
