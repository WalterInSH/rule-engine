import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-slate-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold tracking-tight">
          <Link href="/">Rule Engine Admin</Link>
        </div>
        <div className="space-x-6">
          <Link href="/" className="hover:text-blue-400 transition-colors">Dashboard</Link>
          <Link href="/datamodels/input" className="hover:text-blue-400 transition-colors">Input Models</Link>
          <Link href="/datamodels/output" className="hover:text-blue-400 transition-colors">Output Models</Link>
          <Link href="/rules" className="hover:text-blue-400 transition-colors">Rules</Link>
          <Link href="/simulator" className="hover:text-blue-400 transition-colors">Simulator</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
