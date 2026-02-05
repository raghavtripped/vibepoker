import React, { useState, useEffect } from 'react';
import PokerGrid from './components/PokerGrid';
import CardSelector from './components/CardSelector';
import StatsPanel from './components/StatsPanel';
import StrategyPanel from './components/StrategyPanel';
import { calculateEquity } from './services/pokerEngine';
import { analyzePokerTable } from './services/geminiService';
import { getScenarios, saveScenario, deleteScenario, exportScenariosToJSON } from './services/storageService';
import { GridSelection, Card, SimulationResult, SavedScenario } from './types';
import { LayoutGrid, Calculator, Info, User, Skull, Camera, Sparkles, Loader2, Save, FolderOpen, Trash2, Download, ChevronRight, Sun, Moon } from 'lucide-react';

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
                >
                    {title} <Info size={12} className="text-slate-400 dark:text-slate-500 hover:text-emerald-400" />
                </button>
            </div>
            {isOpen && (
                <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 animate-in slide-in-from-top-1 shadow-sm">
                    {tooltip}
                </div>
            )}
        </div>
    );
};

function App() {
  const [heroRange, setHeroRange] = useState<GridSelection>({});
  const [villainRange, setVillainRange] = useState<GridSelection>({});
  const [activeTab, setActiveTab] = useState<'hero' | 'villain'>('hero');

  const [board, setBoard] = useState<Card[]>([]);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(true);

  // Gemini State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vibeAnalysis, setVibeAnalysis] = useState<string | null>(null);

  // Storage State
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    // Load scenarios on mount
    setSavedScenarios(getScenarios());
  }, []);

  // Sync Dark Mode with DOM
  useEffect(() => {
    if (darkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (Object.keys(heroRange).some(k => heroRange[k])) {
            setIsCalculating(true);
            calculateEquity(heroRange, villainRange, board).then(res => {
                setResults(res);
                setIsCalculating(false);
            });
        } else {
            setResults(null);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [heroRange, villainRange, board]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setVibeAnalysis(null);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        // Strip prefix "data:image/jpeg;base64,"
        const base64Data = base64.split(',')[1];
        
        try {
            const result = await analyzePokerTable(base64Data);
            if (result.board && result.board.length > 0) {
                setBoard(result.board);
            }
            if (result.vibe) {
                setVibeAnalysis(result.vibe);
            }
        } catch (error) {
            console.error("Analysis Failed", error);
            alert("Could not analyze image. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
      };
    } catch (e) {
        console.error(e);
        setIsAnalyzing(false);
    }
  };

  const handleSaveScenario = () => {
      const updated = saveScenario(scenarioName, heroRange, villainRange);
      setSavedScenarios(updated);
      setScenarioName('');
      setShowLibrary(true); // Open library to show confirmation implicitly
  };

  const handleLoadScenario = (scenario: SavedScenario) => {
      setHeroRange(scenario.heroRange);
      setVillainRange(scenario.villainRange);
      // Optional: Flash a toast or something, but the grid updates immediately
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = deleteScenario(id);
      setSavedScenarios(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 pb-20 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 transition-colors duration-300">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-emerald-500 p-1.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Calculator className="text-white dark:text-slate-900" size={20} />
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
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Gemini Action */}
                <label className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all border
                    ${isAnalyzing 
                        ? 'bg-slate-100 dark:bg-slate-800 border-emerald-500/50 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}
                `}>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isAnalyzing} />
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    <span className="text-xs font-bold uppercase hidden sm:inline">
                        {isAnalyzing ? 'Analyzing...' : 'Scan Board'}
                    </span>
                </label>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        
        {vibeAnalysis && (
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 flex items-start gap-3 animate-in slide-in-from-top-4">
                <div className="bg-indigo-500/10 dark:bg-indigo-500/20 p-2 rounded-lg">
                    <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Gemini Vibe Check</h3>
                    <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed italic">"{vibeAnalysis}"</p>
                </div>
                <button onClick={() => setVibeAnalysis(null)} className="ml-auto text-indigo-400 hover:text-indigo-600 dark:hover:text-white">
                    <span className="sr-only">Close</span>
                    ×
                </button>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-7 space-y-4">
                <SectionInfo 
                    title="Range Configuration" 
                    icon={<LayoutGrid size={16} className="text-emerald-500" />}
                    tooltip="Configure the ranges for both Hero (You) and Villain (Opponent) to see who has the equity advantage."
                />

                {/* Scenario Manager */}
                <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={scenarioName}
                            onChange={(e) => setScenarioName(e.target.value)}
                            placeholder="Save current scenario as..."
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        />
                        <button 
                            onClick={handleSaveScenario}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-md transition-colors shadow-sm"
                            title="Save Scenario"
                        >
                            <Save size={16} />
                        </button>
                        <button 
                            onClick={() => setShowLibrary(!showLibrary)}
                            className={`p-2 rounded-md transition-colors border border-slate-300 dark:border-slate-700 ${showLibrary ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            title="Open Library"
                        >
                            <FolderOpen size={16} />
                        </button>
                    </div>

                    {showLibrary && (
                        <div className="animate-in slide-in-from-top-2 fade-in">
                             <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar mb-2">
                                {savedScenarios.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-slate-500 italic">No saved scenarios yet.</div>
                                ) : (
                                    savedScenarios.map(scenario => (
                                        <div 
                                            key={scenario.id}
                                            onClick={() => handleLoadScenario(scenario)}
                                            className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer group transition-all"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{scenario.name}</span>
                                                <span className="text-[10px] text-slate-500">{new Date(scenario.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                 <ChevronRight size={14} className="text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                 <button 
                                                    onClick={(e) => handleDeleteScenario(scenario.id, e)}
                                                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                                    onClick={exportScenariosToJSON}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border-t border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/30 rounded-b-md transition-colors"
                                >
                                    <Download size={14} /> Export All as JSON
                                </button>
                             )}
                        </div>
                    )}
                </div>

                <div className="flex p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('hero')}
                        className={`
                            flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-all
                            ${activeTab === 'hero' ? 'bg-emerald-500 text-white dark:text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'}
                        `}
                    >
                        <User size={14} /> Hero Range
                    </button>
                    <button 
                        onClick={() => setActiveTab('villain')}
                        className={`
                            flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-all
                            ${activeTab === 'villain' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'}
                        `}
                    >
                        <Skull size={14} /> Villain Range
                    </button>
                </div>

                <div className="transition-all duration-300">
                    <PokerGrid 
                        key={activeTab} 
                        selection={activeTab === 'hero' ? heroRange : villainRange} 
                        setSelection={activeTab === 'hero' ? setHeroRange : setVillainRange}
                        variant={activeTab}
                    />
                </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
                <CardSelector 
                    label="Board Cards" 
                    cards={board} 
                    setCards={setBoard} 
                    maxCards={5} 
                />
                
                <div className="space-y-2">
                    <SectionInfo 
                        title="Equity & Hand Stats" 
                        icon={<Calculator size={16} className="text-emerald-500" />}
                        tooltip="Real-time equity calculation comparing the selected Hero Range against the Villain Range on the current board."
                    />
                    <StatsPanel results={results} loading={isCalculating} />
                </div>
            </div>
        </div>

        {/* Strategy Panel moved to bottom */}
        <StrategyPanel results={results} loading={isCalculating} />

      </main>
    </div>
  );
}

export default App;