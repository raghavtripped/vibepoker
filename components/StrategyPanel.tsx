import React, { useState } from 'react';
import { SimulationResult } from '../types';
import { TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, BookOpen, BrainCircuit } from 'lucide-react';
import { POKER_GLOSSARY } from '../constants';

const TRUNCATE_LENGTH = 500;

interface StrategyPanelProps {
  results: SimulationResult | null;
  loading: boolean;
}

const StrategyPanel: React.FC<StrategyPanelProps> = ({ results, loading }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
     return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex items-center justify-center gap-3 animate-pulse shadow-sm">
            <BrainCircuit className="text-emerald-500 animate-spin-slow" size={20} />
            <span className="text-sm font-mono text-slate-500 dark:text-slate-400">Analyzing Range Strategy...</span>
        </div>
     );
  }

  if (!results) return null;

  const shouldTruncate = results.detailedAnalysis.length > TRUNCATE_LENGTH;

  const relevantTerms = Object.keys(POKER_GLOSSARY).filter(term => {
    const textToCheck = (results.detailedAnalysis + results.insights.join(' ') + results.recommendation).toLowerCase();
    return textToCheck.includes(term.toLowerCase());
  });

  return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden transition-opacity duration-300" data-testid="strategy-panel">
        {/* Horizontal Header Bar */}
        <div className="p-4 md:px-6 md:py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8">
            
            {/* Recommendation - Left Side */}
            <div className="flex items-center gap-4 min-w-[240px]">
                <div className={`p-3 rounded-xl border shadow-lg shrink-0 ${results.heroEquity > 50 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <h4 className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Recommendation</h4>
                    <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{results.recommendation}</p>
                </div>
            </div>

            {/* Vertical Divider (Hidden on mobile) */}
            <div className="hidden md:block w-px h-12 bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>

            {/* Insights - Middle */}
            <div className="flex-1 w-full md:w-auto space-y-2">
                 <h4 className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={12} className="text-blue-500 dark:text-blue-400" /> Model Insights
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {results.insights.map((insight, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700/50 shadow-sm">
                            <AlertTriangle size={12} className="text-yellow-600 dark:text-yellow-500" />
                            {insight}
                        </div>
                    ))}
                </div>
            </div>

            {/* Action - Right */}
            <button 
                onClick={() => setShowDetails(!showDetails)}
                className={`
                    w-full md:w-auto mt-2 md:mt-0 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all border
                    ${showDetails 
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 border-slate-200 dark:border-slate-700 hover:border-emerald-500/30'
                    }
                `}
            >
                {showDetails ? 'Close Analysis' : 'Deep Dive'}
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
        </div>
        
        {/* Expandable Content */}
        {showDetails && (
            <div className="border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30 p-4 md:p-6 transition-opacity duration-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                    {/* Main Analysis Text */}
                    <div className="md:col-span-8 space-y-3">
                         <h4 className="text-xs text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                            Engine Reasoning
                         </h4>
                         <div className="text-sm text-slate-700 dark:text-slate-300 leading-7 font-medium p-4 bg-white dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-inner relative">
                            <p className={!isExpanded && shouldTruncate ? 'line-clamp-4' : ''}>
                              {results.detailedAnalysis}
                            </p>
                            {shouldTruncate && (
                              <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded"
                              >
                                {isExpanded ? 'Show less' : 'Read more'}
                              </button>
                            )}
                         </div>
                    </div>

                    {/* Glossary Side Panel */}
                    <div className="md:col-span-4 space-y-3">
                        {relevantTerms.length > 0 && (
                            <>
                                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                                    <BookOpen size={12} /> Key Terminology
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1" data-testid="strategy-glossary">
                                    {relevantTerms.map(term => (
                                        <div key={term} className="text-xs bg-white dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/40 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold block mb-1">{term}</span> 
                                            <span className="text-slate-600 dark:text-slate-400 leading-snug">{POKER_GLOSSARY[term]}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
  );
};

export default React.memo(StrategyPanel);