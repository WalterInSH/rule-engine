import Link from 'next/link';
import SpaceSelector from './SpaceSelector';

const Navbar = () => {
  return (
    <nav className="bg-slate-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold tracking-tight">
          <Link href="/">Rule Engine Admin</Link>
        </div>
        <div className="space-x-6 flex items-center">
          <SpaceSelector />
          <Link href="/" className="hover:text-blue-400 transition-colors">Dashboard</Link>
          <div className="relative group inline-block">
            <button className="hover:text-blue-400 transition-colors flex items-center cursor-pointer">
              Data Models
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute left-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <Link href="/datamodels/input" className="block px-4 py-2 hover:bg-slate-700 hover:text-blue-400 transition-colors first:rounded-t-md">Input Models</Link>
              <Link href="/datamodels/output" className="block px-4 py-2 hover:bg-slate-700 hover:text-blue-400 transition-colors">Output Models</Link>
              <Link href="/datamodels/internal" className="block px-4 py-2 hover:bg-slate-700 hover:text-blue-400 transition-colors">Internal Models</Link>
              <Link href="/datamodels/enums" className="block px-4 py-2 hover:bg-slate-700 hover:text-blue-400 transition-colors last:rounded-b-md">Enums</Link>
            </div>
          </div>
          <Link href="/rules" className="hover:text-blue-400 transition-colors">Rules</Link>
          <Link href="/simulator" className="hover:text-blue-400 transition-colors">Simulator</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
