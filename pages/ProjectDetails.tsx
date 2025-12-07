import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ExternalLink, Activity, Users, Zap, Plus, Save, Loader2, Calendar, Play, RefreshCw, Sparkles } from 'lucide-react';
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
        if (data) {
           setProject(data);
        } else {
           console.error("Project not found");
        }
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

  const handleStartFarming = () => {
    if (!project) return;
    const updated: StoredProject = {
      ...project,
      status: 'farming',
      startDate: project.startDate || new Date().toISOString().split('T')[0]
    };
    handleSave(updated);
  };

  const handleRunAnalysis = async (refresh: boolean = false) => {
    if (!project) return;
    setIsAnalyzing(true);
    try {
      // Pass refresh=true to skip cache
      const analysis = await analyzeProjectWithGemini(project.name, refresh);
      
      const updated: StoredProject = {
        ...project,
        analysis: analysis,
        tier: analysis.score >= 8 ? 'S' : analysis.score >= 6 ? 'A' : 'B'
      };
      
      await handleSave(updated);
    } catch (error) {
      console.error("Analysis update failed", error);
      alert("Failed to update analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !project) return;
    const newTask: FarmingTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      status: 'todo',
      priority: 'medium'
    };
    const updated = {
      ...project,
      tasks: [...project.tasks, newTask]
    };
    handleSave(updated);
    setNewTaskTitle('');
  };

  const toggleTaskStatus = (taskId: string) => {
    if (!project) return;
    
    const updatedTasks = project.tasks.map(t => {
        if (t.id === taskId) {
           const newStatus: 'todo' | 'done' = t.status === 'done' ? 'todo' : 'done';
           return { ...t, status: newStatus };
        }
        return t;
    });

    const updated: StoredProject = {
      ...project,
      tasks: updatedTasks
    };

    handleSave(updated);
  };
  
  const handleDateChange = (field: 'startDate' | 'targetDate', value: string) => {
    if (!project) return;
    const updated = { ...project, [field]: value };
    handleSave(updated);
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (!project) return <div className="p-10 text-center">Project not found.</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="bg-surface border border-slate-700 rounded-xl p-6 md:p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-bold text-white">{project.name}</h1>
              <span className={`px-3 py-1 rounded-lg font-bold text-sm border ${
                project.tier === 'S' ? 'bg-purple-900/50 text-purple-200 border-purple-500' : 
                'bg-blue-900/50 text-blue-200 border-blue-500'
              }`}>
                Tier {project.tier}
              </span>
              <span className={`px-3 py-1 rounded-lg text-sm border font-medium uppercase ${
                project.status === 'farming' 
                  ? 'bg-green-900/30 text-green-400 border-green-800'
                  : 'bg-slate-800 text-slate-300 border-slate-600'
              }`}>
                {project.status}
              </span>
            </div>
            
            {project.analysis ? (
              <div className="flex items-start gap-2 mb-4">
                <p className="text-xl text-slate-300 max-w-2xl">{project.analysis.narrative}</p>
                <button 
                  onClick={() => handleRunAnalysis(true)} 
                  disabled={isAnalyzing}
                  title="Refresh Intelligence with latest news"
                  className="mt-1 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary transition"
                >
                  <RefreshCw size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-slate-400 italic mb-2">Manual entry. Run AI to get insights.</p>
                <button 
                  onClick={() => handleRunAnalysis(false)}
                  disabled={isAnalyzing}
                  className="bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  {isAnalyzing ? 'Analyzing...' : 'Run Initial AI Analysis'}
                </button>
              </div>
            )}
            
            {/* Date & Action Configuration */}
            <div className="flex flex-wrap gap-6 mt-6 items-end">
               <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                     <Calendar size={12} /> Start Date
                  </label>
                  <input 
                     type="date" 
                     className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-primary outline-none"
                     value={project.startDate || ''}
                     onChange={(e) => handleDateChange('startDate', e.target.value)}
                  />
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                     <Calendar size={12} /> Target / Airdrop
                  </label>
                  <input 
                     type="date" 
                     className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-secondary outline-none"
                     value={project.targetDate || ''}
                     onChange={(e) => handleDateChange('targetDate', e.target.value)}
                  />
               </div>
               
               {project.status === 'researching' && (
                 <button 
                   onClick={handleStartFarming}
                   className="bg-primary hover:bg-primary/90 text-white px-5 py-1.5 rounded-lg font-bold shadow-lg shadow-primary/20 transition flex items-center gap-2 h-[34px]"
                 >
                   <Play size={16} className="fill-current" /> Start Farming
                 </button>
               )}

               {isSaving && <div className="text-xs text-slate-400 flex items-center gap-1 mb-2 ml-auto"><Save size={12} className="animate-pulse" /> Saving...</div>}
            </div>
          </div>

          {project.analysis && (
             <div className="flex flex-col items-center justify-center bg-slate-900/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">AZ9 Score</span>
                <span className={`text-5xl font-black ${project.analysis.score >= 8 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {project.analysis.score}
                </span>
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Analysis & Signals */}
        <div className="lg:col-span-2 space-y-6">
           {/* Signals */}
           {project.analysis ? (
             <>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface/50 border border-slate-700 p-4 rounded-xl">
                     <div className="flex items-center gap-2 text-slate-400 mb-2 font-semibold text-sm uppercase">
                       <Users size={16} /> Smart Money
                     </div>
                     <p className="text-sm text-slate-200">{project.analysis.signals.smartMoney}</p>
                  </div>
                  <div className="bg-surface/50 border border-slate-700 p-4 rounded-xl">
                     <div className="flex items-center gap-2 text-slate-400 mb-2 font-semibold text-sm uppercase">
                       <Activity size={16} /> Community
                     </div>
                     <p className="text-sm text-slate-200">{project.analysis.signals.community}</p>
                  </div>
                  <div className="bg-surface/50 border border-slate-700 p-4 rounded-xl">
                     <div className="flex items-center gap-2 text-slate-400 mb-2 font-semibold text-sm uppercase">
                       <Zap size={16} /> Stage
                     </div>
                     <p className="text-sm text-slate-200">{project.analysis.signals.stage}</p>
                  </div>
               </div>

               <div className="bg-surface border border-slate-700 rounded-xl p-6">
                 <h3 className="text-xl font-bold text-white mb-4">Recommended Strategy</h3>
                 <div className="space-y-4">
                   {project.analysis.strategy.map((step, idx) => (
                     <div key={idx} className="flex gap-4 p-3 bg-slate-800/30 rounded-lg">
                       <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                         {idx + 1}
                       </div>
                       <p className="text-slate-300 text-sm">{step}</p>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div className="bg-surface border border-slate-700 rounded-xl p-6">
                 <h3 className="text-xl font-bold text-white mb-2">Researcher Verdict</h3>
                 <p className="text-slate-300 leading-relaxed">{project.analysis.verdict}</p>
               </div>
             </>
           ) : (
             <div className="bg-surface border border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-4">
               <div className="p-4 bg-slate-800 rounded-full text-slate-500">
                  <Sparkles size={32} />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-white">No AI Analysis Yet</h3>
                  <p className="text-slate-400 max-w-md mx-auto mt-2">
                    Click the "Run Initial AI Analysis" button above to let Gemini research this project's narrative, funding, and strategy using the AZ9 methodology.
                  </p>
               </div>
             </div>
           )}
        </div>

        {/* Right Col: Tasks & Notes */}
        <div className="space-y-6">
          <div className="bg-surface border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex justify-between items-center">
              Farming Checklist
              <span className="text-xs font-normal text-slate-400">
                {project.tasks.filter(t => t.status === 'done').length}/{project.tasks.length}
              </span>
            </h3>
            
            <div className="space-y-2 mb-4">
              {project.tasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => toggleTaskStatus(task.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-start gap-3 ${
                    task.status === 'done' 
                    ? 'bg-slate-900/50 border-slate-800 opacity-60' 
                    : 'bg-slate-800/50 border-slate-700 hover:border-primary/50'
                  }`}
                >
                  <div className={`mt-0.5 ${task.status === 'done' ? 'text-green-500' : 'text-slate-600'}`}>
                    <CheckCircle size={18} className={task.status === 'done' ? 'fill-current' : ''} />
                  </div>
                  <span className={`text-sm ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {task.title}
                  </span>
                </div>
              ))}
              
              {project.tasks.length === 0 && (
                <p className="text-center text-slate-500 py-4 text-sm">No tasks yet. Add one below.</p>
              )}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Add new task..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
              <button 
                onClick={handleAddTask}
                className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {project.analysis?.sources && project.analysis.sources.length > 0 && (
            <div className="bg-surface border border-slate-700 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Sources</h3>
              <ul className="space-y-2">
                {project.analysis.sources.map((src, i) => (
                   <li key={i}>
                     <a href={src.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm truncate">
                       <ExternalLink size={14} />
                       <span className="truncate">{src.title}</span>
                     </a>
                   </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;