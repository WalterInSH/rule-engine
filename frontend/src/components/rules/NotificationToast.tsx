import React from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

interface NotificationToastProps {
    notification: { message: string, type: 'success' | 'error' | 'info' } | null;
}

export default function NotificationToast({ notification }: NotificationToastProps) {
    if (!notification) return null;

    return (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded shadow-lg flex items-center gap-2 z-[60] animate-in fade-in slide-in-from-bottom-2 ${
            notification.type === 'success' ? 'bg-green-600 text-white' :
            notification.type === 'error' ? 'bg-red-600 text-white' :
            'bg-slate-800 text-white'
        }`}>
            {notification.type === 'success' && <Check className="w-5 h-5" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {notification.type === 'info' && <Info className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
        </div>
    );
}
