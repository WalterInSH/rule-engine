import React from 'react';

interface VersionInfo {
  filename: string;
  tag: string;
  date?: string;
  time?: string;
}

interface VersionsModalProps {
  isOpen: boolean;
  versions: VersionInfo[];
  ruleSetName: string;
  onClose: () => void;
  onRestore: (versionFilename: string) => void;
}

export default function VersionsModal({ isOpen, versions, ruleSetName, onClose, onRestore }: VersionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold dark:text-slate-100">Versions for {ruleSetName}</h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xl">
                    &times;
                </button>
            </div>
            
            <div className="border dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Tag</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {versions.map((v) => (
                            <tr key={v.filename} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">{v.tag}</td>
                                <td className="px-4 py-3">{v.date}</td>
                                <td className="px-4 py-3 text-slate-500">{v.time}</td>
                                <td className="px-4 py-3 text-right">
                                    <button 
                                        onClick={() => {
                                            if (confirm(`Are you sure you want to restore version "${v.tag}"? Current unsaved changes might be lost.`)) {
                                                onRestore(v.filename);
                                            }
                                        }}
                                        className="text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-800 dark:text-amber-100 px-3 py-1 rounded border border-amber-300 dark:border-amber-700"
                                    >
                                        Restore
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {versions.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-slate-500 italic">
                                    No versions found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded">
                    Close
                </button>
            </div>
        </div>
    </div>
  );
}
