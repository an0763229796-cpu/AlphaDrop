import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ExternalLink, Activity, Users, Zap, Plus, Save, Loader2, Calendar, Play, RefreshCw, Sparkles, AlertTriangle, Trophy, Share2 } from 'lucide-react';
import { StoredProject, FarmingTask } from '../types';
import { getProjectById, saveProject } from '../services/storageService';
import { analyzeProjectWithGemini } from '../services/geminiService';

const ProjectDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<StoredProject | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (id) {
        const data = await getProjectById(id);
        if (data) setProject(data);
      }
      setLoading(false);
    };
    loadProject();
  }, [id]);

  const handleSave = async (updatedProject: StoredProject) => {
    setIsSaving(true);
    await saveProject(updatedProject);
    setProject(updatedProject);
    setIsSaving(false);
  };

  const handleRunAnalysis = async (refresh: boolean = false) => {
    if (!project) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeProjectWithGemini(project.name, refresh);
      const updated: StoredProject = {
        ...project,
        analysis: analysis,
        tier: analysis.verdict.score >= 8 ? 'S' : analysis.verdict.score >= 6 ? 'A' : 'B',
        notes: analysis.tldr.summary // Auto fill notes with summary
      };
      
      // Auto-populate tasks if empty
      if (project.tasks.length === 0 && analysis.verdict.actionPlan.length > 0) {
        updated.tasks = analysis.verdict.actionPlan.map((step, i) => ({
          id: `auto-${Date.now()}-${i}`,
          title: step,
          status: 'todo',
          priority: i === 0 ? 'high' : 'medium'
        }));
      }

      await handleSave(updated);
    } catch (error) {
      console.error("Analysis update failed", error);
      alert("Analysis failed. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper: Status Badge
  const StatusBadge = ({ status }: { status: string }) => {
    const color = status === 'Live' ? 'bg-green-900 text-green-200' : status === 'Unreleased' ? 'bg-blue-900 text-blue-200' : 'bg-slate-700 text-slate-300';
    return <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${color}`}>{status}</span>;
  };

  // Helper: Score Badge
  const ScoreBadge = ({ score }: { score: number }) => {
    const color = score >= 8 ? 'text-green-400' : score >= 5 ? 'text-yellow-400' : 'text-red-400';
    return <span className={`text-3xl font-black ${color}`}>{score}<span className="text-sm text-slate-500">/10</span></span>;
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (!project) return <div className="p-10 text-center">Project not found.</div>;

  const analysis = project.analysis;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Navigation */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={18} /> Back to Tracker
      </button>

      {/* Header Section */}
      <div className="bg-surface border border-slate-700 rounded-xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-4xl font-bold text-white">{project.name}</h1>
              {analysis && <span className="bg-slate-800 border border-slate-600 px-3 py-1 rounded text-sm text-slate-300">{analysis.overview.category}</span>}
              <span className={`px-3 py-1 rounded text-sm font-bold border ${project.tier === 'S' ? 'border-purple-500 text-purple-300 bg-purple-900/20' : 'border-slate-600 text-slate-400'}`}>Tier {project.tier}</span>
            </div>
            
            {analysis ? (
              <div className="space-y-4">
                 <p className="text-lg text-slate-300 leading-relaxed max-w-3xl">{analysis.tldr.summary}</p>
                 <div className="flex gap-4 text-sm text-slate-400">
                    {analysis.overview.socials.website && <a href={analysis.overview.socials.website} target="_blank" className="hover:text-primary flex items-center gap-1"><ExternalLink size={14}/> Website</a>}
                    {analysis.overview.socials.twitter && <a href={analysis.overview.socials.twitter} target="_blank" className="hover:text-primary flex items-center gap-1"><ExternalLink size={14}/> Twitter</a>}
                 </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">Analysis data pending. Run AI Scan to populate.</p>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => handleRunAnalysis(true)}
                disabled={isAnalyzing}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
                {analysis ? "Update Analysis" : "Run Full Analysis"}
              </button>
            </div>
          </div>

          {/* Score Card */}
          {analysis && (
            <div className="bg-slate-900/50 border border-slate-700 p-6 rounded-xl flex flex-col items-center justify-center min-w-[150px]">
              <span className="text-xs uppercase font-bold text-slate-500 mb-2">Potential</span>
              <ScoreBadge score={analysis.verdict.score} />
              <div className="mt-2 text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">
                {analysis.tldr.quickVerdict} Verdict
              </div>
            </div>
          )}
        </div>
      </div>

      {analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Funding & Backers */}
            <section className="bg-surface border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="text-blue-400" /> Funding & Backers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-bold">Has Tier 1 Backing?</p>
                  <p className={`text-lg font-bold ${analysis.funding.hasTier1Backing ? 'text-green-400' : 'text-slate-400'}`}>
                    {analysis.funding.hasTier1Backing ? "Yes, Confirmed" : "Not Detected"}
                  </p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-bold">Key Investors</p>
                  <p className="text-slate-200">{analysis.funding.keyBackers.join(", ") || "Unknown"}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-400">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-2 rounded-l-lg">Stage</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2 rounded-r-lg">Investors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.funding.rounds.length > 0 ? analysis.funding.rounds.map((round, i) => (
                      <tr key={i} className="border-b border-slate-700/50 last:border-0">
                        <td className="px-4 py-3 font-medium text-white">{round.stage}</td>
                        <td className="px-4 py-3">{round.date || "-"}</td>
                        <td className="px-4 py-3">{round.amount}</td>
                        <td className="px-4 py-3">{round.investors.join(", ")}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-4 py-3 text-center italic">No public funding rounds found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 2. Tokenomics & Airdrop */}
            <section className="bg-surface border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-400" /> Tokenomics & Airdrop Strategy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-800/50 p-3 rounded-lg">
                   <p className="text-xs text-slate-500 uppercase">Token Status</p>
                   <StatusBadge status={analysis.tokenomics.tokenStatus} />
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                   <p className="text-xs text-slate-500 uppercase">Ticker</p>
                   <p className="font-mono text-white">{analysis.tokenomics.ticker || "TBD"}</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                   <p className="text-xs text-slate-500 uppercase">Sentiment</p>
                   <p className={`font-bold ${analysis.sentiment.twitterVibe === 'Positive' ? 'text-green-400' : 'text-slate-300'}`}>{analysis.sentiment.twitterVibe}</p>
                </div>
              </div>
              <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg">
                 <h4 className="font-bold text-blue-200 text-sm mb-2">Airdrop Prediction</h4>
                 <p className="text-slate-300 text-sm leading-relaxed">{analysis.tokenomics.airdropPrediction}</p>
              </div>
            </section>

            {/* 3. Tech & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-surface border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Zap className="text-purple-400"/> Tech</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                   <li><span className="text-slate-500">Chain:</span> {analysis.tech.chain}</li>
                   <li><span className="text-slate-500">Moat:</span> {analysis.tech.differentiation}</li>
                   <li><span className="text-slate-500">TVL:</span> {analysis.metrics.tvl || "N/A"}</li>
                </ul>
              </section>
              <section className="bg-surface border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="text-red-400"/> Risks</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                  {analysis.risks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="space-y-6">
             {/* Verdict & Action */}
             <div className="bg-surface border border-slate-700 rounded-xl p-6 shadow-xl shadow-black/20">
                <h3 className="text-lg font-bold text-white mb-4">Analyst Verdict</h3>
                <p className="text-sm text-slate-300 mb-6 italic">"{analysis.verdict.finalThoughts}"</p>
                
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Action Plan</h4>
                <div className="space-y-3">
                   {analysis.verdict.actionPlan.map((step, i) => (
                     <div key={i} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs border border-slate-600">
                          {i+1}
                        </div>
                        <p className="text-slate-200">{step}</p>
                     </div>
                   ))}
                </div>
             </div>

             {/* Tasks Manager */}
             <div className="bg-surface border border-slate-700 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">My Tasks</h3>
                  <button className="text-slate-400 hover:text-white"><Plus size={18}/></button>
                </div>
                <div className="space-y-2">
                   {project.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded cursor-pointer">
                         <div className={`w-4 h-4 rounded border ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-slate-500'}`}></div>
                         <span className={`text-sm ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{task.title}</span>
                      </div>
                   ))}
                   {project.tasks.length === 0 && <p className="text-sm text-slate-500 text-center">No tasks tracked.</p>}
                </div>
             </div>

             {/* Sources */}
             <div className="bg-surface border border-slate-700 rounded-xl p-6">
               <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Sources</h3>
               <div className="flex flex-wrap gap-2">
                  {analysis.sources.slice(0, 10).map((src, i) => (
                    <a key={i} href={src.uri} target="_blank" className="text-xs bg-slate-800 text-blue-400 px-2 py-1 rounded hover:bg-slate-700 truncate max-w-full block">
                      {src.title}
                    </a>
                  ))}
               </div>
             </div>
          </div>
        </div>
      ) : (
        // Empty State
        <div className="text-center py-20 text-slate-500">
           <p>Analysis details will appear here after running the scan.</p>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;