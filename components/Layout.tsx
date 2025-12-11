import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, ListTodo, Zap, Database, PieChart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/analyzer', label: 'AI Analyzer', icon: <Search size={20} /> },
    { path: '/tracker', label: 'Farm Tracker', icon: <ListTodo size={20} /> },
    { path: '/signals', label: 'Early Signals', icon: <Zap size={20} /> },
    { path: '/funding-dna', label: 'Funding DNA', icon: <PieChart size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-background text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-slate-700 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            AlphaDrop AZ9
          </h1>
          <p className="text-xs text-slate-400 mt-2">Researcher Edition</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 mb-2 text-yellow-500 font-bold">
              <Database size={14} />
              <span>API Connected</span>
            </div>
            <p></p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Mobile Nav (Bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-slate-700 flex justify-around p-4 z-50">
         {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`p-2 rounded-lg ${location.pathname === item.path ? 'text-primary' : 'text-slate-400'}`}
            >
              {item.icon}
            </Link>
         ))}
      </nav>
    </div>
  );
};

export default Layout;
