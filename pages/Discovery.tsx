import React, { useState } from 'react';
import { Twitter, ArrowUpRight, ShieldCheck, Zap, ExternalLink, RefreshCw, PlusCircle, Loader2 } from 'lucide-react';
import { batchEvaluateProjects } from '../services/geminiService';
import { DiscoverySignal } from '../types';
import { useNavigate } from 'react-router-dom';
import { saveProject } from '../services/storageService';

const Discovery: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [signals, setSignals] = useState<DiscoverySignal[]>([
    {
      id: '1',
      name: "Nebula Protocol",
      handle: "@Nebula_L3",
      source: "AresLabs",
      rawNarrative: "New L3 chain on Arbitrum",
    },
    {
      id: '2',
      name: "Void Finance",
      handle: "@VoidFi_Build",
      source: "Lobster DAO",
      rawNarrative: "Privacy DEX",
    },
    {
      id: '3',
      name: "Kelp DAO",
      handle: "@KelpDAO",
      source: "Mochi",
      rawNarrative: "Restaking",
    },
    {
      id: '4',
      name: "SuperRare",
      handle: "@SuperRare",
      source: "Web3Pack",
      rawNarrative: "NFT Marketplace (Old)",
    },
    {
      id: '5',
      name: "Zircuit",
      handle: "@ZircuitL2",
      source: "Fomo Sapiens",
      rawNarrative: "ZK Rollup AI",
    }
  ]);

  const runAIScan = async () => {
    setIsScanning(true);
    // Prepare data for AI
    const candidates = signals.map(s => ({
      name: s.name,
      context: s.rawNarrative
    }));

    try {
      const results = await batchEvaluateProjects(candidates);
      
      // Merge results back into signals
      const updatedSignals = signals.map(sig => {
        const aiRes = results.find((r: any) => r.name.toLowerCase().includes(sig.name.toLowerCase()) || sig.name.toLowerCase().includes(r.name.toLowerCase()));
        return aiRes ? { ...sig, az9Analysis: aiRes } : sig;
      });
      
      setSignals(updatedSignals);
    } catch (e) {
      console.error("Scan failed", e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleResearch = (name: string) => {
    navigate('/analyzer', { state: { query: name } });
  };

  const addToTracker = async (signal: DiscoverySignal) => {
    const newProject = {
      id: Date.now().toString(),
      name: signal.name,
      status: 'researching' as const,
      tier: (signal.az9Analysis?.score && signal.az9Analysis.score >= 8 ? 'S' : 'B') as any,
      addedAt: Date.now(),
      tasks: [
        { id: '1', title: 'Follow on Twitter', status: 'todo' as const, priority: 'medium' as const },
        { id: '2', title: 'Join Discord', status: 'todo' as const, priority: 'medium' as const }
      ],
      notes: `Source: ${signal.source}. Narrative: ${signal.rawNarrative}`
    };
    
    await saveProject(newProject);
    navigate('/tracker');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Alpha Signals Scanner</h2>
          <p className="text-slate-400">Discover & filter projects using AZ9 criteria (Narrative, Backing, Newness).</p>
        </div>
        
        <button 
          onClick={runAIScan}
          disabled={isScanning}
          className="bg-secondary hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-900/20 flex items-center gap-2 transition disabled:opacity-50"
        >
          {isScanning ? <Loader2 className="animate-spin" /> : <Zap className="fill-current" />}
          {isScanning ? "AI Scanning..." : "Scan for AZ9 Gems"}
        </button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3 text-amber-200">
        <ShieldCheck className="flex-shrink-0" />
        <p className="text-sm">
          <strong>Methodology:</strong> The scanner uses Google Search to cross-reference these names with "Smart Money" movements and "Hot Narratives" to assign an AZ9 potential score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feed Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-white">Signal Feed</h3>
            <span className="text-xs text-slate-500">Source: Simulated Twitter/DAO feeds</span>
          </div>
          
          {signals.map((item) => {
            const isMatch = item.az9Analysis?.isMatch;
            const score = item.az9Analysis?.score || 0;
            
            return (
              <div 
                key={item.id} 
                className={`border rounded-xl p-5 transition relative overflow-hidden group ${
                  isMatch 
                    ? 'bg-slate-800/80 border-green-500/50 hover:border-green-400' 
                    : 'bg-surface border-slate-700 hover:border-slate-500'
                }`}
              >
                {/* Background glow for matches */}
                {isMatch && <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>}

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-slate-500 font-bold border border-slate-700">
                      {item.name[0]}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        {item.name}
                        <span className="text-sm font-normal text-slate-500">{item.handle}</span>
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-slate-900 text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-700">
                          {item.rawNarrative}
                        </span>
                        <span className="bg-slate-900 text-blue-300 text-xs px-2 py-0.5 rounded border border-slate-700">
                          {item.source}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {item.az9Analysis ? (
                    <div className="text-right">
                       <div className={`text-2xl font-black ${score >= 7 ? 'text-green-400' : 'text-yellow-500'}`}>
                         {score}/10
                       </div>
                       <span className="text-xs text-slate-500 uppercase font-bold">AZ9 Score</span>
                    </div>
                  ) : (
                    <span className="text-xs bg-slate-800 text-slate-500 px-2 py-1 rounded">Unverified</span>
                  )}
                </div>

                {item.az9Analysis && (
                  <div className="mt-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <p className="text-sm text-slate-300 italic">"{item.az9Analysis.reason}"</p>
                  </div>
                )}
                
                <div className="mt-4 flex justify-end items-center border-t border-slate-700/50 pt-3 gap-3">
                  <button 
                    onClick={() => handleResearch(item.name)}
                    className="text-slate-300 hover:text-white text-sm flex items-center gap-1 transition"
                  >
                    <ArrowUpRight size={16} /> Deep Analysis
                  </button>
                  <button 
                    onClick={() => addToTracker(item)}
                    className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                  >
                    <PlusCircle size={16} /> Add to Tracker
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tools Column */}
        <div className="space-y-6">
          <div className="bg-surface border border-slate-700 p-6 rounded-xl sticky top-6">
            <h3 className="text-lg font-bold text-white mb-2">Checklist for Manual Entry</h3>
            <p className="text-sm text-slate-400 mb-4">
               If you find a project on Twitter, check these before adding:
            </p>
            <ul className="list-none space-y-3">
              {[
                 { label: "New Twitter Account", desc: "Created < 3 months ago?" },
                 { label: "Hot Narrative", desc: "Is it L2, Restaking, or AI?" },
                 { label: "Smart Follows", desc: "Does Paradigm/Cobie follow?" },
                 { label: "Active Event", desc: "Testnet or Points live?" }
              ].map((c, i) => (
                <li key={i} className="flex gap-3 items-start">
                   <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-xs text-slate-500 mt-0.5">{i+1}</div>
                   <div>
                     <p className="text-slate-200 text-sm font-medium">{c.label}</p>
                     <p className="text-xs text-slate-500">{c.desc}</p>
                   </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discovery;
