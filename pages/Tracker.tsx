import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Square, Eye, Calendar, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StoredProject } from '../types';
import { getProjects, saveProject, deleteProject } from '../services/storageService';

const Tracker: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTier, setNewProjectTier] = useState<'S' | 'A' | 'B'>('B');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchProjects = async () => {
    setLoading(true);
    const data = await getProjects();
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const toggleTask = async (projectId: string, taskId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedTasks = project.tasks.map(t => {
      if (t.id === taskId) {
        const newStatus: 'todo' | 'done' = t.status === 'done' ? 'todo' : 'done';
        return { ...t, status: newStatus };
      }
      return t;
    });

    const updatedProject: StoredProject = {
      ...project,
      tasks: updatedTasks
    };

    // Optimistic update
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    
    // Persist
    await saveProject(updatedProject);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm('Stop tracking this project?')) {
      await deleteProject(id);
      fetchProjects();
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject: StoredProject = {
      id: Date.now().toString(),
      name: newProjectName,
      tier: newProjectTier,
      status: 'farming',
      startDate: newStartDate,
      addedAt: Date.now(),
      tasks: [
        { id: '1', title: 'Follow on Twitter', status: 'todo', priority: 'medium' },
        { id: '2', title: 'Join Discord', status: 'todo', priority: 'medium' }
      ],
      notes: 'Added manually via Tracker'
    };

    await saveProject(newProject);
    setIsAddModalOpen(false);
    setNewProjectName('');
    fetchProjects();
  };

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'S': return 'bg-purple-900 text-purple-200 border-purple-700';
      case 'A': return 'bg-blue-900 text-blue-200 border-blue-700';
      case 'B': return 'bg-green-900 text-green-200 border-green-700';
      default: return 'bg-slate-800 text-slate-300';
    }
  };

  const viewProject = (project: StoredProject) => {
    navigate(`/project/${project.id}`, { state: { project } });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Farm Tracker</h2>
          <p className="text-slate-400">Manage your daily interactions and qualify for drops.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition border border-slate-600"
          >
            <Plus size={18} /> Manual Add
          </button>
          <button 
            onClick={() => navigate('/analyzer')}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={18} /> New Analysis
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-slate-700 rounded-xl border-dashed">
          <p className="text-slate-400 mb-4">No projects being tracked yet.</p>
          <div className="flex justify-center gap-4">
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="text-white hover:text-primary transition font-medium"
            >
                Add Manually
            </button>
            <span className="text-slate-600">|</span>
            <button 
                onClick={() => navigate('/analyzer')}
                className="text-primary font-bold hover:underline"
            >
                Go to Analyzer
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-surface border border-slate-700 rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <h3 
                    className="text-xl font-bold text-white cursor-pointer hover:text-primary transition"
                    onClick={() => viewProject(project)}
                  >
                    {project.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded border font-bold ${getTierColor(project.tier)}`}>
                    Tier {project.tier}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => viewProject(project)}
                    className="text-slate-400 hover:text-white p-1" title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, project.id)}
                    className="text-slate-400 hover:text-red-400 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="mb-4">
                   {project.targetDate && (
                     <div className="flex items-center gap-2 text-xs text-yellow-400 mb-2 bg-yellow-400/10 px-2 py-1 rounded w-fit">
                        <Calendar size={12} />
                        Target: {new Date(project.targetDate).toLocaleDateString()}
                     </div>
                   )}
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round((project.tasks.filter(t => t.status === 'done').length / Math.max(project.tasks.length, 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-secondary h-full transition-all duration-500" 
                      style={{ width: `${(project.tasks.filter(t => t.status === 'done').length / Math.max(project.tasks.length, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {project.tasks.slice(0, 3).map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => toggleTask(project.id, task.id)}
                      className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition group"
                    >
                      <div className={`text-slate-500 group-hover:text-primary transition ${task.status === 'done' ? 'text-green-500' : ''}`}>
                        {task.status === 'done' ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                      <span className={`text-sm ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {project.tasks.length > 3 && (
                     <p className="text-xs text-center text-slate-500 italic">+{project.tasks.length - 3} more tasks</p>
                  )}
                </div>
                
                <div className="mt-auto">
                  <button 
                      onClick={() => viewProject(project)}
                      className="w-full py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:border-primary hover:text-primary transition"
                  >
                      Open Project Details & AI Intel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add Manual Farm</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Project Name</label>
                <input 
                  type="text" 
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="e.g. Monad"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm text-slate-400 mb-1">Estimated Tier</label>
                    <select 
                      value={newProjectTier}
                      onChange={(e: any) => setNewProjectTier(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                    >
                      <option value="S">Tier S (High Conviction)</option>
                      <option value="A">Tier A (Strong)</option>
                      <option value="B">Tier B (Speculative)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm text-slate-400 mb-1">Start Date</label>
                    <input 
                      type="date"
                      value={newStartDate}
                      onChange={e => setNewStartDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg mt-4 transition"
              >
                Add to Tracker
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;