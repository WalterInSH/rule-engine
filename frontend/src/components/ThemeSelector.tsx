'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8" />; // Placeholder to prevent layout shift
  }

  return (
    <div className="relative group inline-block ml-4">
      <button 
        className="p-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors focus:outline-none"
        aria-label="Toggle theme"
      >
        {theme === 'light' && <Sun className="w-5 h-5" />}
        {theme === 'dark' && <Moon className="w-5 h-5" />}
        {theme === 'system' && <Monitor className="w-5 h-5" />}
      </button>

      <div className="absolute right-0 mt-2 w-36 bg-slate-800 border border-slate-700 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
        <div className="py-1">
          <button
            onClick={() => setTheme('light')}
            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-700 transition-colors ${
              theme === 'light' ? 'text-blue-400' : 'text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </div>
            {theme === 'light' && <Check className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-700 transition-colors ${
              theme === 'dark' ? 'text-blue-400' : 'text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </div>
            {theme === 'dark' && <Check className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-700 transition-colors ${
              theme === 'system' ? 'text-blue-400' : 'text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span>System</span>
            </div>
            {theme === 'system' && <Check className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}