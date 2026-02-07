import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PokerGrid from './components/PokerGrid';
import CardSelector from './components/CardSelector';
import StatsPanel from './components/StatsPanel';
import StrategyPanel from './components/StrategyPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { calculateEquity } from './services/pokerEngine';
import { analyzePokerTable } from './services/geminiService';
import { getScenarios, saveScenario, deleteScenario, exportScenariosToJSON } from './services/storageService';
import { GridSelection, Card, SimulationResult, SavedScenario } from './types';
import { LayoutGrid, Calculator, Info, User, Skull, Camera, Sparkles, Loader2, Save, FolderOpen, Trash2, Download, ChevronRight, Sun, Moon, X, CheckCircle, AlertCircle } from 'lucide-react';

interface SectionInfoProps {
    title: string;
    tooltip: string;
    icon?: React.ReactNode;
}

const SectionInfo: React.FC<SectionInfoProps> = ({ title, tooltip, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="flex flex-col gap-1 mb-2">
            <div className="flex items-center gap-2">
                {icon}
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-sm font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-help flex items-center gap-2 hover:text-emerald-600 dark:hover:text-white transition-colors bg-transparent border-none p-0"
                    aria-expanded={isOpen}
                >
                    {title} <Info size={12} className="text-slate-400 dark:text-slate-500 hover:text-emerald-400" />
                </button>
            </div>
            {isOpen && (
                <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 animate-in slide-in-from-top-1 shadow-sm" role="tooltip">
                    {tooltip}
                </div>
            )}
        </div>
    );
};

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'bg-emerald-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white'
    };

    const icons = {
        success: <CheckCircle size={16} />,
        error: <AlertCircle size={16} />,
        info: <Info size={16} />
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl animate-in slide-in-from-bottom-2 flex items-center gap-3 min-w-[250px] ${styles[type]}`} role="alert">
            {icons[type]}
            <span className="flex-1 font-medium">{message}</span>
            <button onClick={onClose} className="hover:opacity-70 transition-opacity" aria-label="Close notification">
                <X size={16} />
            </button>
        </div>
    );
};

// Debounce utility
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function App() {
  const [heroRange, setHeroRange] = useState<GridSelection>({});
  const [villainRange, setVillainRange] = useState<GridSelection>({});
  const [activeTab, setActiveTab] = useState<'hero' | 'villain'>('hero');

  const [board, setBoard] = useState<Card[]>([]);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // Gemini State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vibeAnalysis, setVibeAnalysis] = useState<string | null>(null);

  // Storage State
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);

  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('vibepoker-theme');
    if (savedTheme === 'dark') setDarkMode(true);

    const savedTab = localStorage.getItem('vibepoker-active-tab') as 'hero' | 'villain' | null;
    if (savedTab) setActiveTab(savedTab);
  }, []);

  // Persist theme preference
  useEffect(() => {
    localStorage.setItem('vibepoker-theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist active tab
  useEffect(() => {
    localStorage.setItem('vibepoker-active-tab', activeTab);
  }, [activeTab]);

  // Load scenarios on mount
  useEffect(() => {
    setTimeout(() => {
      setSavedScenarios(getScenarios());
      setIsLoadingScenarios(false);
    }, 100);
  }, []);

  // Ensure viewport is set correctly
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }
  }, []);

  // Debounced equity calculation
  const debouncedCalculate = useMemo(
    () => debounce((hero: GridSelection, villain: GridSelection, boardCards: Card[]) => {
      const heroHasCards = Object.keys(hero).some(k => hero[k]);
      
      if (heroHasCards) {
        setIsCalculating(true);
        calculateEquity(hero, villain, boardCards)
          .then(res => {
            setResults(res);
            setIsCalculating(false);
          })
          .catch(err => {
            console.error('Equity calculation failed:', err);
            setIsCalculating(false);
            showToast('Calculation failed. Please try again.', 'error');
          });
      } else {
        setResults(null);
        setIsCalculating(false);
      }
    }, 500),
    [showToast]
  );

  useEffect(() => {
    debouncedCalculate(heroRange, villainRange, board);
  }, [heroRange, villainRange, board, debouncedCalculate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      e.target.value = '';
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image too large. Please use an image under 5MB', 'error');
      e.target.value = '';
      return;
    }

    setIsAnalyzing(true);
    setVibeAnalysis(null);
    
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      const result = await analyzePokerTable(base64Data);
      
      if (result.board && result.board.length > 0) {
        setBoard(result.board);
        showToast(`Board detected: ${result.board.length} cards`, 'success');
      }
      
      if (result.vibe) {
        setVibeAnalysis(result.vibe);
      }
    } catch (error) {
      console.error("Analysis Failed", error);
      const message = error instanceof Error ? error.message : "Could not analyze image. Please try again.";
      showToast(message, 'error');
    } finally {
      setIsAnalyzing(false);
      e.target.value = '';
    }
  };

  const handleSaveScenario = useCallback(() => {
    if (!scenarioName.trim()) {
      showToast('Please enter a scenario name', 'error');
      return;
    }
    
    // Check if both ranges are empty
    const heroHasCards = Object.values(heroRange).some(v => v);
    const villainHasCards = Object.values(villainRange).some(v => v);
    
    if (!heroHasCards && !villainHasCards) {
      showToast('Please select at least one range before saving', 'error');
      return;
    }
    
    const updated = saveScenario(scenarioName, heroRange, villainRange);
    setSavedScenarios(updated);
    setScenarioName('');
    setShowLibrary(true);
    showToast('Scenario saved successfully!', 'success');
  }, [scenarioName, heroRange, villainRange, showToast]);

  const handleLoadScenario = useCallback((scenario: SavedScenario) => {
    setHeroRange(scenario.heroRange);
    setVillainRange(scenario.villainRange);
    showToast(`Loaded "${scenario.name}"`, 'success');
  }, [showToast]);

  const handleDeleteScenario = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this scenario?')) {
      return;
    }
    
    const updated = deleteScenario(id);
    setSavedScenarios(updated);
    showToast('Scenario deleted', 'info');
  }, [showToast]);

  const handleExportScenarios = useCallback(() => {
    try {
      exportScenariosToJSON();
      showToast('Scenarios exported successfully', 'success');
    } catch (error) {
      showToast('Export failed', 'error');
    }
  }, [showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (scenarioName.trim()) handleSaveScenario();
      }
      
      // Ctrl/Cmd + L to toggle library
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setShowLibrary(prev => !prev);
      }
      
      // Ctrl/Cmd + D to toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setDarkMode(prev => !prev);
      }

      // 1 for Hero, 2 for Villain tab
      if (e.key === '1' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTab('hero');
      }
      if (e.key === '2' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTab('villain');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [scenarioName, handleSaveScenario]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 pb-20 transition-colors duration-300">
      {/* Skip Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-emerald-500 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 transition-colors duration-300">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-emerald-500 p-1.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Calculator className="text-white dark:text-slate-900" size={20} aria-hidden="true" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                        Vibe<span className="text-emerald-600 dark:text-emerald-500">Poker</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-mono tracking-tighter">RUST ANALYTICS ENGINE</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    title={darkMode ? 'Switch to light mode (Ctrl+D)' : 'Switch to dark mode (Ctrl+D)'}
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Gemini Action */}
                <label className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all border
                    ${isAnalyzing 
                        ? 'bg-slate-100 dark:bg-slate-800 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 cursor-not-allowed' 
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}
                `}>
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        disabled={isAnalyzing}
                        aria-label="Upload poker table image"
                    />
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                    <span className="text-xs font-bold uppercase hidden sm:inline">
                        {isAnalyzing ? 'Analyzing...' : 'Scan Board'}
                    </span>
                </label>
            </div>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto p-4 space-y-6">
        
        {vibeAnalysis && (
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 flex items-start gap-3 animate-in slide-in-from-top-4" role="region" aria-label="AI Analysis Result">
                <div className="bg-indigo-500/10 dark:bg-indigo-500/20 p-2 rounded-lg">
                    <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Gemini Vibe Check</h3>
                    <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed italic">"{vibeAnalysis}"</p>
                </div>
                <button 
                    onClick={() => setVibeAnalysis(null)} 
                    className="ml-auto text-indigo-400 hover:text-indigo-600 dark:hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    aria-label="Close AI analysis"
                >
                    <X size={18} />
                </button>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Block 1: Board Cards — mobile first, desktop right column top */}
            <div className="order-1 lg:order-none lg:col-start-8 lg:col-span-5 lg:row-start-1 space-y-6">
                <ErrorBoundary>
                  <CardSelector 
                      label="Board Cards" 
                      cards={board} 
                      setCards={setBoard} 
                      maxCards={5} 
                  />
                </ErrorBoundary>
            </div>

            {/* Block 2: Hero/Villain range selector — mobile second, desktop left column second row */}
            <div className="order-2 lg:order-none lg:col-span-7 lg:row-start-2 space-y-4">
                <div className="flex p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" role="tablist" aria-label="Range selection">
                    <button 
                        role="tab"
                        aria-selected={activeTab === 'hero'}
                        aria-controls="hero-range-panel"
                        onClick={() => setActiveTab('hero')}
                        className={`
                            flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                            ${activeTab === 'hero' ? 'bg-emerald-500 text-white dark:text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'}
                        `}
                        title="Select Hero range (Press 1)"
                    >
                        <User size={14} aria-hidden="true" /> Hero Range
                    </button>
                    <button 
                        role="tab"
                        aria-selected={activeTab === 'villain'}
                        aria-controls="villain-range-panel"
                        onClick={() => setActiveTab('villain')}
                        className={`
                            flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50
                            ${activeTab === 'villain' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'}
                        `}
                        title="Select Villain range (Press 2)"
                    >
                        <Skull size={14} aria-hidden="true" /> Villain Range
                    </button>
                </div>
                <div 
                    id={`${activeTab}-range-panel`}
                    role="tabpanel"
                    aria-labelledby={`${activeTab}-tab`}
                    className="transition-all duration-300"
                >
                    <ErrorBoundary>
                      <PokerGrid 
                          key={activeTab} 
                          selection={activeTab === 'hero' ? heroRange : villainRange} 
                          setSelection={activeTab === 'hero' ? setHeroRange : setVillainRange}
                          variant={activeTab}
                      />
                    </ErrorBoundary>
                </div>
            </div>

            {/* Block 3: Equity & Hand Stats — mobile third, desktop right column second row */}
            <div className="order-3 lg:order-none lg:col-start-8 lg:col-span-5 lg:row-start-2 space-y-2">
                <SectionInfo 
                    title="Equity & Hand Stats" 
                    icon={<Calculator size={16} className="text-emerald-500" aria-hidden="true" />}
                    tooltip="Real-time equity calculation comparing the selected Hero Range against the Villain Range on the current board."
                />
                <ErrorBoundary>
                  <StatsPanel results={results} loading={isCalculating} />
                </ErrorBoundary>
            </div>

            {/* Block 4: Recommendation (Strategy Panel) — mobile fourth, desktop full width row 3 */}
            <div className="order-4 lg:order-none lg:col-span-12 lg:row-start-3">
                <ErrorBoundary>
                  <StrategyPanel results={results} loading={isCalculating} />
                </ErrorBoundary>
            </div>

            {/* Block 5: Range Config (label + scenario manager) — mobile fifth (below recommendation), desktop left column top */}
            <div className="order-5 lg:order-none lg:col-span-7 lg:row-start-1 space-y-4">
                <SectionInfo 
                    title="Range Configuration" 
                    icon={<LayoutGrid size={16} className="text-emerald-500" aria-hidden="true" />}
                    tooltip="Configure the ranges for both Hero (You) and Villain (Opponent) to see who has the equity advantage. Save and load scenarios for quick analysis."
                />
                <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={scenarioName}
                            onChange={(e) => setScenarioName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && scenarioName.trim()) {
                                handleSaveScenario();
                              }
                            }}
                            placeholder="Save current scenario as..."
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                            aria-label="Scenario name"
                        />
                        <button 
                            onClick={handleSaveScenario}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Save Scenario (Ctrl+S)"
                            aria-label="Save scenario"
                            disabled={!scenarioName.trim()}
                        >
                            <Save size={16} />
                        </button>
                        <button 
                            onClick={() => setShowLibrary(!showLibrary)}
                            className={`p-2 rounded-md transition-colors border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${showLibrary ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            title="Open Library (Ctrl+L)"
                            aria-label="Toggle scenario library"
                            aria-expanded={showLibrary}
                        >
                            <FolderOpen size={16} />
                        </button>
                    </div>
                    {showLibrary && (
                        <div className="animate-in slide-in-from-top-2 fade-in">
                            <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar mb-2">
                                {isLoadingScenarios ? (
                                    <div className="text-center py-4 text-xs text-slate-500">
                                        <Loader2 className="animate-spin mx-auto mb-2" size={16} />
                                        Loading scenarios...
                                    </div>
                                ) : savedScenarios.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-slate-500 italic">No saved scenarios yet.</div>
                                ) : (
                                    savedScenarios.map(scenario => (
                                        <div 
                                            key={scenario.id}
                                            onClick={() => handleLoadScenario(scenario)}
                                            className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer group transition-all focus-within:ring-2 focus-within:ring-emerald-500/50"
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleLoadScenario(scenario);
                                              }
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{scenario.name}</span>
                                                <span className="text-[10px] text-slate-500">{new Date(scenario.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ChevronRight size={14} className="text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                                                <button 
                                                    onClick={(e) => handleDeleteScenario(scenario.id, e)}
                                                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                                    aria-label={`Delete scenario ${scenario.name}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {savedScenarios.length > 0 && (
                                <button 
                                    onClick={handleExportScenarios}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border-t border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/30 rounded-b-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    aria-label="Export all scenarios as JSON"
                                >
                                    <Download size={14} aria-hidden="true" /> Export All as JSON
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

      </main>

      {/* Toast Notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Keyboard Shortcuts Help - Hidden but accessible */}
      <div className="sr-only" role="region" aria-label="Keyboard shortcuts">
        <h2>Keyboard Shortcuts</h2>
        <ul>
          <li>Ctrl/Cmd + S: Save current scenario</li>
          <li>Ctrl/Cmd + L: Toggle scenario library</li>
          <li>Ctrl/Cmd + D: Toggle dark mode</li>
          <li>1: Switch to Hero range</li>
          <li>2: Switch to Villain range</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
