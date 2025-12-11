import React, { useState, useEffect } from 'react';
import { Search, Loader2, PlusCircle, History, Clock, BarChart3, Layers, ExternalLink } from 'lucide-react';
import { analyzeProjectWithGemini } from '../services/geminiService';
import { AnalysisStatus, ProjectAnalysis, SearchHistoryItem, StoredProject } from '../types';
import { useNavigate } from 'react-router-dom';
import { saveProject, getSearchHistory, addToSearchHistory } from '../services/storageService';

const Analyzer: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<ProjectAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isAddingToTracker, setIsAddingToTracker] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getSearchHistory();
    setHistory(data);
  };

  const performAnalysis = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setStatus(AnalysisStatus.ANALYZING);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeProjectWithGemini(searchQuery);
      setResult(data);
      setStatus(AnalysisStatus.COMPLETED);
      await addToSearchHistory(data.projectName, data.verdict.score);
      loadHistory();
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleAddToTracker = async () => {
    if (!result) return;
    setIsAddingToTracker(true);
    const newProject: StoredProject = {
      id: Date.now().toString(),
      name: result.projectName,
      tier: result.verdict.score >= 8 ? 'S' : result.verdict.score >= 6 ? 'A' : 'B',
      status: 'researching',
      addedAt: Date.now(),
      analysis: result,
      tasks: result.verdict.actionPlan.map((step, index) => ({
        id: `task-${Date.now()}-${index}`,
        title: step,
        status: 'todo',
        priority: index === 0 ? 'high' : 'medium'
      })),
      notes: result.tldr.summary
    };
    await saveProject(newProject);
    setIsAddingToTracker(false);
    navigate(`/project/${newProject.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          AI Deep Dive Analyzer
        </h2>
        <p className="text-slate-400">
          Enter a project name to run a 3-segment Surf AI Analysis (Tech, Finance, Market).
        </p>
      </div>

      <div className="relative z-10">
        <form onSubmit={(e) => { e.preventDefault(); performAnalysis(query); }} className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Monad, Berachain, Hyperliquid..."
            className="w-full bg-surface border border-slate-700 text-white px-6 py-4 rounded-xl text-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition shadow-xl"
            disabled={status === AnalysisStatus.ANALYZING}
          />
          <button
            type="submit"
            disabled={status === AnalysisStatus.ANALYZING || !query}
            className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-primary/80 text-white px-6 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {status === AnalysisStatus.ANALYZING ? <Loader2 className="animate-spin" /> : <Search />}
            {status === AnalysisStatus.ANALYZING ? "Scanning..." : "Analyze"}
          </button>
        </form>

        {history.length > 0 && status !== AnalysisStatus.COMPLETED && (
          <div className="flex flex-wrap gap-2 mt-2">
            {history.map((item, idx) => (
              <button
                key={idx}
                onClick={() => performAnalysis(item.query)}
                className="bg-surface border border-slate-700 hover:border-slate-500 text-slate-300 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 transition"
              >
                <Clock size={12} /> {item.query}
              </button>
            ))}
          </div>
        )}
      </div>

      {status === AnalysisStatus.ANALYZING && (
        <div className="text-center py-20 space-y-4">
          <Loader2 className="animate-spin mx-auto text-primary" size={48} />
          <p className="text-slate-400">Running segmented analysis (Core, Finance, Market)...</p>
        </div>
      )}

      {status === AnalysisStatus.COMPLETED && result && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Card */}
          <div className="bg-surface border border-slate-700 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1 space-y-2">
              <h3 className="text-3xl font-bold text-white">{result.projectName}</h3>
              <p className="text-slate-300">{result.tldr.summary}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-blue-300">{result.overview.category}</span>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-purple-300">{result.tech.chain}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="text-center bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className={`text-3xl font-black ${result.verdict.score >= 8 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {result.verdict.score}/10
                </div>
                <div className="text-xs text-slate-500 uppercase">Potential</div>
              </div>
              <button 
                onClick={handleAddToTracker}
                disabled={isAddingToTracker}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
              >
                {isAddingToTracker ? <Loader2 className="animate-spin" size={16}/> : <PlusCircle size={16}/>} Track Project
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strategy */}
            <div className="bg-surface border border-slate-700 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Layers className="text-secondary"/> Strategy</h4>
              <ul className="space-y-2 text-slate-300 text-sm">
                {result.verdict.actionPlan.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-slate-500 font-mono">{i+1}.</span> {step}
                  </li>
                ))}
              </ul>
            </div>
            {/* Funding */}
            <div className="bg-surface border border-slate-700 rounded-xl p-6">
               <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart3 className="text-green-400"/> Funding</h4>
               <p className="text-sm text-slate-300 mb-2">
                 <span className="text-slate-500">Tier 1 Backing:</span> {result.funding.hasTier1Backing ? "Yes" : "No"}
               </p>
               <p className="text-sm text-slate-300 mb-2">
                 <span className="text-slate-500">Key Investors:</span> {result.funding.keyBackers.join(", ")}
               </p>
               <p className="text-sm text-slate-300">
                 <span className="text-slate-500">Token Status:</span> {result.tokenomics.tokenStatus}
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analyzer;