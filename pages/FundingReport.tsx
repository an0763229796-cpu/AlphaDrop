import React, { useState } from 'react';
import { Search, Loader2, DollarSign, TrendingUp, PieChart, Calendar, Award, AlertTriangle, CheckCircle2, XCircle, Scale, ExternalLink } from 'lucide-react';
import { generateFundingReport } from '../services/geminiService';
import { CryptoRankReport } from '../types';

// Helper to detect undefined/null/N/A and style gracefully
const DataValue = ({ value, prefix = '', suffix = '', isLink = false }: { value: string | undefined, prefix?: string, suffix?: string, isLink?: boolean }) => {
  if (!value || value === 'N/A' || value === 'null' || value.toLowerCase() === 'undisclosed') {
    return <span className="text-gray-500 text-sm italic">Undisclosed</span>;
  }
  return <span className="font-medium text-gray-100">{prefix}{value}{suffix}</span>;
};

// Helper to generate Google Search link for investors
const InvestorLink = ({ name, projectName }: { name: string, projectName: string }) => {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${name} investment in ${projectName} crypto`)}`;
  return (
    <a 
      href={searchUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group flex items-center gap-1 bg-[#283141] hover:bg-[#374151] border border-[#374151] hover:border-blue-500/50 px-3 py-1.5 rounded text-sm text-gray-300 hover:text-white transition cursor-pointer"
      title="Verify on Google"
    >
      {name}
      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
    </a>
  );
}

const FundingReport: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CryptoRankReport | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setReport(null);
    try {
      const data = await generateFundingReport(query);
      setReport(data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate funding report');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Undervalued': return 'text-[#10b981] border-[#10b981] bg-[#10b981]/10';
      case 'Fair Value': return 'text-[#3b82f6] border-[#3b82f6] bg-[#3b82f6]/10';
      case 'Overvalued': return 'text-[#f59e0b] border-[#f59e0b] bg-[#f59e0b]/10';
      case 'High Risk': return 'text-[#ef4444] border-[#ef4444] bg-[#ef4444]/10';
      default: return 'text-slate-400 border-slate-500 bg-slate-900/20';
    }
  };

  return (
    <div className="min-h-screen text-gray-200 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <PieChart className="text-blue-500" size={32} />
              Funding DNA
            </h2>
            <p className="text-gray-500 text-sm mt-1">Deep dive into financial rounds, valuation & vesting.</p>
          </div>
          
          <div className="w-full md:w-[400px]">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {loading ? <Loader2 className="animate-spin text-blue-500" size={18} /> : <Search className="text-gray-500 group-focus-within:text-blue-500" size={18} />}
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Ticker or Project..."
                className="block w-full pl-10 pr-3 py-2.5 border border-[#374151] rounded-lg leading-5 bg-[#1f2937] text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-[#111827] focus:border-blue-500 sm:text-sm transition-colors"
                disabled={loading}
              />
            </form>
          </div>
        </div>

        {report && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Top Metrics Row - CryptoRank Style */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: "Total Raised", value: report.totalRaised, icon: null },
                 { label: "Category", value: report.category, icon: null },
                 { label: "FDV (Valuation)", value: report.tokenomics.fullyDilutedValuation, icon: null },
                 { label: "Tier 1 Backers", value: report.investorAnalysis.tier1Count.toString(), icon: <Award size={14} className="text-yellow-500"/> }
               ].map((metric, i) => (
                 <div key={i} className="bg-[#1f2937] border border-[#374151] p-4 rounded-lg flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                      {metric.label} {metric.icon}
                    </span>
                    <div className="text-xl font-bold text-white truncate">
                      <DataValue value={metric.value} />
                    </div>
                 </div>
               ))}
            </div>

            {/* Investment Verdict (Objective Analysis) */}
            <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-[#374151] pb-3">
                 <Scale className="text-blue-500" size={20} />
                 <h3 className="text-lg font-bold text-white">Investment Verdict</h3>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-8">
                 {/* Rating Box */}
                 <div className={`flex flex-col items-center justify-center px-8 py-6 rounded-lg border-2 min-w-[200px] ${getRatingColor(report.investmentVerdict.rating)}`}>
                    <span className="text-xs font-bold uppercase mb-1 opacity-70">Rating</span>
                    <span className="text-2xl font-black text-center leading-tight">{report.investmentVerdict.rating}</span>
                    <div className="mt-3 px-3 py-1 bg-black/40 rounded text-xs font-semibold">
                       Risk: {report.investmentVerdict.riskLevel}
                    </div>
                 </div>

                 <div className="flex-1 space-y-4">
                    <p className="text-base text-gray-300 italic leading-relaxed">
                      "{report.investmentVerdict.summary}"
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                       <div className="space-y-2">
                          <h4 className="text-[#10b981] text-sm font-bold flex items-center gap-2"><CheckCircle2 size={14}/> Bullish Drivers</h4>
                          <ul className="space-y-1">
                             {report.investmentVerdict.pros.map((pro, i) => (
                               <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                 <span className="mt-1.5 w-1 h-1 rounded-full bg-[#10b981]"></span>
                                 {pro}
                               </li>
                             ))}
                          </ul>
                       </div>
                       <div className="space-y-2">
                          <h4 className="text-[#ef4444] text-sm font-bold flex items-center gap-2"><XCircle size={14}/> Bearish Risks</h4>
                          <ul className="space-y-1">
                             {report.investmentVerdict.cons.map((con, i) => (
                               <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                 <span className="mt-1.5 w-1 h-1 rounded-full bg-[#ef4444]"></span>
                                 {con}
                               </li>
                             ))}
                          </ul>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Funding Rounds Table - The Core Data */}
            <div className="bg-[#1f2937] border border-[#374151] rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-[#374151] flex justify-between items-center bg-[#252f3e]">
                 <div className="flex items-center gap-2">
                    <DollarSign className="text-green-500" size={18} />
                    <h3 className="text-lg font-bold text-white">Funding Rounds</h3>
                 </div>
                 <span className="text-xs text-gray-500 bg-[#1f2937] px-2 py-1 rounded border border-[#374151]">Data Source: CryptoRank / Crunchbase</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#111827] text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Round Type</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Raised</th>
                      <th className="px-6 py-4">Valuation (FDV)</th>
                      <th className="px-6 py-4 text-center">ROI</th>
                      <th className="px-6 py-4">Vesting</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-[#374151] bg-[#1f2937]">
                    {report.rounds.map((round, idx) => (
                      <tr key={idx} className="hover:bg-[#374151]/50 transition duration-150">
                        <td className="px-6 py-4">
                          <span className="font-bold text-white">{round.type}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                           <DataValue value={round.date} />
                        </td>
                        <td className="px-6 py-4 font-mono text-yellow-500">
                           <DataValue value={round.price} />
                        </td>
                        <td className="px-6 py-4 text-gray-200">
                           <DataValue value={round.raised} />
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                           <DataValue value={round.valuation} />
                        </td>
                        <td className="px-6 py-4 text-center">
                           {round.roi && round.roi !== 'N/A' ? (
                             <span className="text-[#10b981] font-bold bg-[#10b981]/10 px-2 py-1 rounded">{round.roi}</span>
                           ) : <span className="text-gray-600">-</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400 max-w-[250px]">
                           <DataValue value={round.unlockTerms} />
                        </td>
                      </tr>
                    ))}
                    {report.rounds.length === 0 && (
                      <tr><td colSpan={7} className="p-8 text-center text-gray-500 italic">No public funding round data found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Grid: Investors & Tokenomics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Investors List */}
              <div className="lg:col-span-2 bg-[#1f2937] border border-[#374151] rounded-lg p-6">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <Award className="text-yellow-500" size={20} /> Smart Money & Backers
                 </h3>
                 
                 <div className="mb-6 p-4 bg-[#111827] rounded border border-[#374151]">
                    <p className="text-sm text-gray-400 italic">
                      <span className="font-bold text-blue-400">AI Analysis:</span> {report.investorAnalysis.commentary}
                    </p>
                 </div>

                 <div className="space-y-6">
                    {report.rounds.map((round, i) => (
                      round.investors && round.investors.length > 0 && (
                        <div key={i}>
                          <p className="text-xs text-gray-500 uppercase font-bold mb-3 pl-1 border-l-2 border-blue-500">{round.type} Investors</p>
                          <div className="flex flex-wrap gap-2">
                            {round.investors.map((inv, k) => (
                              <InvestorLink key={k} name={inv} projectName={report.projectName} />
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                 </div>
              </div>

              {/* Tokenomics Side Panel */}
              <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-6">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <PieChart className="text-purple-500" size={20} /> Tokenomics
                 </h3>
                 <div className="space-y-4">
                   <div className="flex justify-between items-center py-2 border-b border-[#374151]">
                      <span className="text-gray-500 text-sm">Initial Supply</span>
                      <span className="text-gray-200 font-mono text-sm"><DataValue value={report.tokenomics.initialSupply}/></span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b border-[#374151]">
                      <span className="text-gray-500 text-sm">Max Supply</span>
                      <span className="text-gray-200 font-mono text-sm"><DataValue value={report.tokenomics.totalSupply}/></span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b border-[#374151]">
                      <span className="text-gray-500 text-sm">Initial M.Cap</span>
                      <span className="text-gray-200 font-mono text-sm"><DataValue value={report.tokenomics.initialMarketCap}/></span>
                   </div>
                   
                   <div className="pt-4">
                      <span className="text-gray-500 text-sm block mb-2">Lead Investors</span>
                      <div className="flex flex-wrap gap-2">
                        {report.investorAnalysis.leadInvestors.map((lead, i) => (
                           <span key={i} className="text-xs font-bold text-purple-300 bg-purple-900/30 border border-purple-800 px-2 py-1 rounded">
                             {lead}
                           </span>
                        ))}
                      </div>
                   </div>
                 </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default FundingReport;