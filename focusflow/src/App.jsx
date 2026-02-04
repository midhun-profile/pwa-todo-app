import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Star, 
  Moon, 
  Sun, 
  Trophy, 
  LayoutGrid,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Zap,
  RotateCcw
} from 'lucide-react';

/**
 * PRODUCTION-READY PWA TASK MANAGER (VERSION 2: HISTORY SUPPORT)
 * * Features:
 * - Date-keyed storage (View any day's list)
 * - Nested Tasks & Progress Tracking
 * - Automatic Streak Calculation
 * - Mobile-first Premium UI
 */

const STORAGE_KEY = 'focusflow_v2_data';
const THEME_KEY = 'focusflow_theme';

const App = () => {
  // --- State ---
  const [tasksByDate, setTasksByDate] = useState({}); // Format: { 'YYYY-MM-DD': [tasks] }
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'settings'
  const [inputValue, setInputValue] = useState('');

  // --- Initialization & Persistence ---
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      setTasksByDate(JSON.parse(savedData));
    }

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksByDate));
  }, [tasksByDate]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Date Helpers ---
  const changeDate = (offset) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const isToday = currentDate === new Date().toISOString().split('T')[0];

  // --- Task Logic ---
  const currentTasks = tasksByDate[currentDate] || [];

  const updateTasks = (newTasks) => {
    setTasksByDate(prev => ({
      ...prev,
      [currentDate]: newTasks
    }));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newTask = {
      id: crypto.randomUUID(),
      text: inputValue,
      completed: false,
      subtasks: []
    };

    updateTasks([newTask, ...currentTasks]);
    setInputValue('');
  };

  const toggleTask = (id) => {
    const updateNode = (list) => list.map(task => {
      if (task.id === id) {
        const newStatus = !task.completed;
        const toggleAll = (nodes) => nodes.map(n => ({ ...n, completed: newStatus, subtasks: toggleAll(n.subtasks) }));
        return { ...task, completed: newStatus, subtasks: toggleAll(task.subtasks) };
      }
      return { ...task, subtasks: updateNode(task.subtasks) };
    });
    updateTasks(updateNode(currentTasks));
  };

  const deleteTask = (id) => {
    const filterNode = (list) => list.filter(t => t.id !== id).map(t => ({ ...t, subtasks: filterNode(t.subtasks) }));
    updateTasks(filterNode(currentTasks));
  };

  const addSubtask = (parentId, text) => {
    const updateNode = (list) => list.map(task => {
      if (task.id === parentId) {
        return { ...task, subtasks: [...task.subtasks, { id: crypto.randomUUID(), text, completed: false, subtasks: [] }] };
      }
      return { ...task, subtasks: updateNode(task.subtasks) };
    });
    updateTasks(updateNode(currentTasks));
  };

  // --- Stats & Streaks ---
  const stats = useMemo(() => {
    const flatten = (list) => {
      let res = [];
      list.forEach(t => { res.push(t); res = res.concat(flatten(t.subtasks)); });
      return res;
    };
    const all = flatten(currentTasks);
    const completed = all.filter(t => t.completed).length;
    const percentage = all.length > 0 ? Math.round((completed / all.length) * 100) : 0;
    let stars = 0;
    if (percentage > 0) stars = 1;
    if (percentage >= 40) stars = 2;
    if (percentage >= 70) stars = 3;
    if (percentage >= 90) stars = 4;
    if (percentage === 100) stars = 5;
    return { total: all.length, completed, percentage, stars };
  }, [currentTasks]);

  const streakCount = useMemo(() => {
    let count = 0;
    let d = new Date();
    while (true) {
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = tasksByDate[dateStr] || [];
      if (dayTasks.length > 0 && dayTasks.every(t => t.completed)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [tasksByDate]);

  // --- Sub-component for individual tasks ---
  const TaskRow = ({ task, depth = 0 }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [subVal, setSubVal] = useState('');

    return (
      <div className={`mt-2 ${depth > 0 ? 'ml-6 border-l-2 border-slate-200 dark:border-slate-800 pl-3' : ''}`}>
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group">
          <button onClick={() => toggleTask(task.id)} className={task.completed ? 'text-green-500' : 'text-slate-300'}>
            {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>
          <span className={`flex-1 text-sm font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
            {task.text}
          </span>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIsAdding(!isAdding)} className="p-1 text-slate-400 hover:text-blue-500"><Plus size={16} /></button>
            <button onClick={() => deleteTask(task.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
          </div>
        </div>
        {isAdding && (
          <form className="mt-2 ml-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); addSubtask(task.id, subVal); setSubVal(''); setIsAdding(false); }}>
            <input autoFocus value={subVal} onChange={e => setSubVal(e.target.value)} placeholder="Subtask..." className="flex-1 text-xs bg-transparent border-b border-blue-500 outline-none dark:text-white" />
            <button type="submit" className="text-xs text-blue-500 font-bold uppercase">Add</button>
          </form>
        )}
        {task.subtasks.map(s => <TaskRow key={s.id} task={s} depth={depth + 1} />)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28 transition-colors duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <LayoutGrid size={20} className="text-blue-600" />
              FocusFlow
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold">
              <Zap size={14} fill="currentColor" /> {streakCount}
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 mt-6">
        {/* Date Selector */}
        <div className="flex items-center justify-between mb-6 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold flex items-center gap-2">
              <CalendarIcon size={14} className="text-blue-500" />
              {isToday ? "Today" : new Date(currentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {!isToday && (
              <button onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])} className="text-[10px] uppercase tracking-tighter text-blue-500 font-bold mt-0.5">
                Back to Today
              </button>
            )}
          </div>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Hero Progress Card */}
        <div className="bg-blue-600 dark:bg-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 mb-8 overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-white/80 text-sm font-medium">Daily Completion</h2>
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4,5].map(s => <Star key={s} size={16} fill={s <= stats.stars ? "#fbbf24" : "transparent"} className={s <= stats.stars ? "text-amber-400" : "text-white/20"} />)}
                </div>
              </div>
              <div className="text-3xl font-black">{stats.percentage}%</div>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div className="bg-white h-full transition-all duration-500" style={{ width: `${stats.percentage}%` }} />
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Input Form */}
        <form onSubmit={addTask} className="mb-8 flex gap-2">
          <input 
            value={inputValue} 
            onChange={e => setInputValue(e.target.value)}
            placeholder="Plan something for this day..."
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/20 transition-all dark:text-white"
          />
          <button type="submit" className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/30">
            <Plus size={24} />
          </button>
        </form>

        {/* Task List */}
        <div className="space-y-2">
          {currentTasks.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <RotateCcw size={32} className="mx-auto mb-2" />
              <p className="text-sm font-medium">No tasks logged for this date.</p>
            </div>
          ) : (
            currentTasks.map(t => <TaskRow key={t.id} task={t} />)
          )}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 py-4 px-10 flex justify-between z-50">
        <button onClick={() => setView('list')} className={`flex flex-col items-center gap-1 ${view === 'list' ? 'text-blue-600' : 'text-slate-400'}`}>
          <LayoutGrid size={22} />
          <span className="text-[10px] font-bold uppercase">Tasks</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}>
          <Settings size={22} />
          <span className="text-[10px] font-bold uppercase">Settings</span>
        </button>
      </nav>

      {/* Settings Modal */}
      {view === 'settings' && (
        <div className="fixed inset-0 z-[60] bg-slate-50 dark:bg-slate-950 p-6 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Preferences</h2>
              <button onClick={() => setView('list')} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full">
                <ChevronLeft size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Data Management</h3>
                <p className="text-sm mb-4 opacity-70">All tasks are saved locally on your device for privacy and offline access.</p>
                <button 
                  onClick={() => { if(confirm('Wipe all data?')) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}}
                  className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Clear All History
                </button>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center gap-3">
                  <Trophy className="text-blue-600" />
                  <div>
                    <h4 className="font-bold">PWA Installable</h4>
                    <p className="text-xs opacity-70">Add this to your home screen for the best experience.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

