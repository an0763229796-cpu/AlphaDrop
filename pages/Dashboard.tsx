import React from 'react';
import { TrendingUp, Activity, DollarSign, Award, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white">Market Overview</h2>
        <p className="text-slate-400 mt-2">AZ9 Methodology Dashboard</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Hot Narrative', value: 'Restaking / AI', icon: <TrendingUp className="text-secondary" />, sub: 'High Priority' },
          { label: 'Upcoming Events', value: '12 Major', icon: <Activity className="text-blue-400" />, sub: 'This Week' },
          { label: 'Avg Airdrop Value', value: '$2,400', icon: <DollarSign className="text-green-400" />, sub: 'Last Quarter' },
          { label: 'Active Farms', value: '5 Projects', icon: <Award className="text-yellow-400" />, sub: 'Tracking' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-surface/50 backdrop-blur border border-slate-700 p-5 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 text-sm font-medium">{stat.label}</span>
              <div className="p-2 bg-slate-800 rounded-lg">{stat.icon}</div>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Narrative Watch */}
        <section className="bg-surface/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-secondary rounded-full"></span>
            Trending Narratives (Dune)
          </h3>
          <div className="space-y-4">
            <div className="group p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-primary transition cursor-pointer">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-white">Liquid Restaking (LRT)</h4>
                <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">Hot</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">EigenLayer ecosystem is booming. Focus on Puffer, Kelp, Renzo.</p>
            </div>
            <div className="group p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-primary transition cursor-pointer">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-white">Modular Blockchains</h4>
                <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded">Warm</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">Celestia/Dymension ecosystem followers. Look for DA layers.</p>
            </div>
            <div className="group p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-primary transition cursor-pointer">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-white">Parallel EVM</h4>
                <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">Emerging</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">Monad, Sei v2. High performance execution layers.</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 border border-indigo-700 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Research New Project</h3>
              <p className="text-indigo-200 mb-6">Found a new ticker or handle? Run the AI analysis to get a comprehensive report.</p>
              <Link to="/analyzer" className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition shadow-lg inline-block">
                Start Analysis &rarr;
              </Link>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-10 translate-y-10">
               <Search size={150} />
            </div>
          </div>

          <div className="bg-surface/50 border border-slate-700 rounded-xl p-6">
             <h3 className="text-xl font-bold mb-4">AZ9 Methodology Quick Check</h3>
             <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center text-xs">1</div>
                   <span>Check AresLabs for new Twitter creations</span>
                </li>
                <li className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center text-xs">2</div>
                   <span>Verify Smart Money follow via Mochi</span>
                </li>
                <li className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center text-xs">3</div>
                   <span>Check Governance Proposals (EIPs)</span>
                </li>
             </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;