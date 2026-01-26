import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmationModal({ 
    isOpen, 
    title, 
    message, 
    confirmLabel = 'Confirm', 
    cancelLabel = 'Cancel', 
    onConfirm, 
    onCancel,
    isDestructive = false
}: ConfirmationModalProps) {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 transform transition-all scale-100 opacity-100">
            <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">{title}</h2>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                {message}
            </div>

            <div className="flex justify-end gap-3">
                <button 
                    onClick={onCancel} 
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                >
                    {cancelLabel}
                </button>
                <button 
                    onClick={onConfirm}
                    className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors shadow-sm ${
                        isDestructive 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    </div>
  );
}
