import React, { useState } from 'react';
import { Search, Loader2, CheckCircle, AlertTriangle, ExternalLink, BarChart3, Layers } from 'lucide-react';
import { analyzeProjectWithGemini } from '../services/geminiService';
import { AnalysisStatus, ProjectAnalysis } from '../types';

const Analyzer: React.FC = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<ProjectAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setStatus(AnalysisStatus.ANALYZING);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeProjectWithGemini(query);
      setResult(data);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err) {
      setError("Failed to analyze project. Please check the name or try again later.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          AI Project Analyzer
        </h2>
        <p className="text-slate-400">
          Enter a project name (e.g., "Monad", "Berachain") to scan for AZ9 signals.
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleAnalyze} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Project Name / Ticker..."
          className="w-full bg-surface border border-slate-700 text-white px-6 py-4 rounded-xl text-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition shadow-xl"
          disabled={status === AnalysisStatus.ANALYZING}
        />
        <button
          type="submit"
          disabled={status === AnalysisStatus.ANALYZING || !query}
          className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-primary/80 text-white px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {status === AnalysisStatus.ANALYZING ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span className="hidden sm:inline">Researching...</span>
            </>
          ) : (
            <>
              <Search size={20} />
              <span className="hidden sm:inline">Analyze</span>
            </>
          )}
        </button>
      </form>

      {/* Loading State */}
      {status === AnalysisStatus.ANALYZING && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative w-24 h-24">
             <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 animate-pulse">Scanning On-Chain Signals & Narratives...</p>
        </div>
      )}

      {/* Error State */}
      {status === AnalysisStatus.ERROR && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-red-200 flex items-center gap-4">
          <AlertTriangle size={24} />
          <p>{error}</p>
        </div>
      )}

      {/* Results View */}
      {status === AnalysisStatus.COMPLETED && result && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-surface border border-slate-700 rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-3xl font-bold text-white">{result.projectName}</h3>
                <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm font-medium border border-slate-600">
                  {result.narrative}
                </span>
              </div>
              <p className="text-slate-400 max-w-xl">{result.verdict}</p>
            </div>
            
            <div className="flex flex-col items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 min-w-[120px]">
              <span className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Potential</span>
              <span className={`text-4xl font-black ${getScoreColor(result.score)}`}>
                {result.score}/10
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Signals Card */}
            <div className="bg-surface border border-slate-700 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="text-secondary" />
                AZ9 Signals
              </h4>
              <div className="space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Smart Money & Backing</p>
                  <p className="text-slate-200">{result.signals.smartMoney}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Community & Sentiment</p>
                  <p className="text-slate-200">{result.signals.community}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Development Stage</p>
                  <p className="text-white font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {result.signals.stage}
                  </p>
                </div>
              </div>
            </div>

            {/* Farming Strategy Card */}
            <div className="bg-surface border border-slate-700 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="text-primary" />
                Farming Strategy
              </h4>
              <ul className="space-y-3">
                {result.strategy.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-slate-300">
                    <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h5 className="text-sm font-semibold text-slate-400 mb-3">Verified Sources</h5>
                <div className="flex flex-wrap gap-2">
                  {result.sources.length > 0 ? (
                    result.sources.map((source, i) => (
                      <a 
                        key={i}
                        href={source.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-xs text-blue-400 px-3 py-1.5 rounded-full transition"
                      >
                        {source.title.substring(0, 20)}... <ExternalLink size={10} />
                      </a>
                    ))
                  ) : (
                    <span className="text-xs text-slate-600">No direct source links found.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analyzer;