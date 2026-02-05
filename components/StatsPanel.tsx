import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SimulationResult } from '../types';
import { BrainCircuit, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface StatsPanelProps {
  results: SimulationResult | null;
  loading: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ results, loading }) => {
  const [viewMode, setViewMode] = useState<'equity' | 'hands'>('equity');

  if (loading) {
    return (
        <div className="h-64 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
             <div className="animate-pulse flex flex-col items-center">
                <BrainCircuit className="text-emerald-500 mb-2 animate-spin-slow" />
                <span className="text-slate-500 dark:text-slate-400 font-mono text-sm">Running 100k Monte Carlo Sims...</span>
             </div>
        </div>
    );
  }

  if (!results) {
    return (
        <div className="h-64 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
             <span className="text-slate-400 dark:text-slate-500 text-sm">Select Range & Board to Calculate</span>
        </div>
    );
  }

  const equityData = [
    { name: 'Win', value: results.winRate, color: '#10b981' },
    { name: 'Tie', value: results.tieEquity, color: '#f59e0b' },
    { name: 'Loss', value: results.villainEquity, color: '#ef4444' },
  ];

  return (
    <div className="space-y-4">
      {/* Analytics Chart Card */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg relative transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                {viewMode === 'equity' ? 'Equity Distribution' : 'Hand Class Distribution'}
            </h3>
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-md p-1 gap-1 border border-slate-200 dark:border-transparent">
                <button 
                    onClick={() => setViewMode('equity')}
                    className={`p-1 rounded transition-colors ${viewMode === 'equity' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'}`}
                    title="Equity View"
                >
                    <PieChartIcon size={14} />
                </button>
                <button 
                    onClick={() => setViewMode('hands')}
                    className={`p-1 rounded transition-colors ${viewMode === 'hands' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'}`}
                    title="Hand Stats View"
                >
                    <BarChart3 size={14} />
                </button>
            </div>
        </div>

        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'equity' ? (
                    <BarChart layout="vertical" data={equityData} margin={{ left: 10, right: 30, bottom: 0, top: 0 }}>
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={40} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            cursor={{fill: 'transparent'}}
                        />
                        <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]}>
                            {equityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                ) : (
                    <BarChart data={results.handStats} margin={{ left: 0, right: 0, bottom: 0, top: 0 }}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                             {results.handStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                            ))}
                        </Bar>
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>

        {viewMode === 'equity' && (
            <div className="flex justify-between mt-2 px-2 text-sm font-mono font-bold border-t border-slate-100 dark:border-slate-700/50 pt-2">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Hero Equity</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-lg">{results.heroEquity}%</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Villain</span>
                    <span className="text-red-500 dark:text-red-400 text-lg">{results.villainEquity}%</span>
                </div>
            </div>
        )}
        {viewMode === 'hands' && (
             <div className="mt-2 flex flex-wrap gap-2 justify-center">
                {results.handStats.slice(0, 3).map((stat, i) => (
                    <div key={i} className="text-[10px] bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded border border-slate-200 dark:border-slate-700/50">
                        <span className="text-slate-500 dark:text-slate-400">{stat.name}:</span> <span className="text-blue-600 dark:text-blue-400 font-bold">{stat.value}%</span>
                    </div>
                ))}
             </div>
        )}
      </div>
    </div>
  );
};

export default StatsPanel;