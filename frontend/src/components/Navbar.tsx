import Link from 'next/link';
import SpaceSelector from './SpaceSelector';
import ThemeSelector from './ThemeSelector';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-200">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="flex items-center gap-8">
          <div className="text-xl font-bold tracking-tight">
            <Link href="/" className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Rule Engine Admin
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            >
              Dashboard
            </Link>

            <div className="relative group inline-block">
              <button className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center cursor-pointer">
                Data Models
                <svg className="w-4 h-4 ml-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute left-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 ring-1 ring-black/5">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Models</div>
                  <Link href="/datamodels/input" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Input Models</Link>
                  <Link href="/datamodels/output" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Output Models</Link>
                  <Link href="/datamodels/internal" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Internal Models</Link>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
                  <Link href="/datamodels/enums" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Enumerations</Link>
                </div>
              </div>
            </div>

            <Link
              href="/rules"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            >
              Rules
            </Link>
            <Link
              href="/production"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
            >
              Production
            </Link>
            <Link
              href="/execution-logs"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            >
              Execution Logs
            </Link>
            <Link
              href="/settings"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            >
              Settings
            </Link>
          </div>
        </div>
        <div className="flex items-center">
          <SpaceSelector />
          <ThemeSelector />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
