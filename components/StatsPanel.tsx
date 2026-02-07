import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { SimulationResult } from '../types';
import { BrainCircuit, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

const formatPercent = (val: number) => val.toFixed(1) + '%';

// Accessible chart colors with sufficient contrast (WCAG AA)
const CHART_COLORS = {
  win: '#059669',   // emerald-600
  tie: '#d97706',   // amber-600
  loss: '#dc2626',  // red-600
  barPrimary: '#2563eb',
  barSecondary: '#3b82f6',
};

interface StatsPanelProps {
  results: SimulationResult | null;
  loading: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ results, loading }) => {
  const [viewMode, setViewMode] = useState<'equity' | 'hands'>('equity');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setProgress(100);
      return;
    }
    setProgress(0);
    const start = Date.now();
    const duration = 2500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(90, (elapsed / duration) * 90);
      setProgress(p);
      if (p < 90) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [loading]);

  if (loading) {
    return (
        <div className="h-64 flex flex-col justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300 p-4" data-testid="stats-panel-loading">
             <div className="flex flex-col items-center gap-3 w-full">
                <BrainCircuit className="text-emerald-500 animate-spin-slow" size={28} aria-hidden />
                <span className="text-slate-600 dark:text-slate-300 font-mono text-sm font-medium">Simulating hands… {formatPercent(progress)}</span>
                <div className="w-full max-w-xs bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
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
    { name: 'Win', value: results.winRate, color: CHART_COLORS.win },
    { name: 'Tie', value: results.tieEquity, color: CHART_COLORS.tie },
    { name: 'Loss', value: results.villainEquity, color: CHART_COLORS.loss },
  ];

  const chartMargin = { left: 8, right: 48, bottom: 8, top: 8 };
  const handChartMargin = { left: 0, right: 36, bottom: 24, top: 8 };

  return (
    <div className="space-y-4" data-testid="stats-panel">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg relative transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                {viewMode === 'equity' ? 'Equity Distribution' : 'Hand Class Distribution'}
            </h3>
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-md p-1 gap-1 border border-slate-200 dark:border-transparent">
                <button 
                    type="button"
                    onClick={() => setViewMode('equity')}
                    className={`p-1 rounded transition-colors ${viewMode === 'equity' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'}`}
                    title="Equity View"
                >
                    <PieChartIcon size={14} />
                </button>
                <button 
                    type="button"
                    onClick={() => setViewMode('hands')}
                    className={`p-1 rounded transition-colors ${viewMode === 'hands' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'}`}
                    title="Hand Stats View"
                >
                    <BarChart3 size={14} />
                </button>
            </div>
        </div>

        <div className="h-48 w-full min-h-[12rem]">
            <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'equity' ? (
                    <BarChart layout="vertical" data={equityData} margin={chartMargin}>
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={40} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            cursor={{ fill: 'transparent' }}
                            formatter={(value: number) => [formatPercent(value), '']}
                            content={({ active, payload }) => active && payload?.length ? (
                                <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-lg">
                                    <span className="text-slate-300">{payload[0].payload.name}:</span>{' '}
                                    <span className="font-bold text-white">{formatPercent(payload[0].value as number)}</span>
                                </div>
                            ) : null}
                        />
                        <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]}>
                            {equityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <LabelList dataKey="value" position="right" formatter={(v: number) => formatPercent(v)} style={{ fill: '#64748b', fontSize: 11 }} />
                        </Bar>
                    </BarChart>
                ) : (
                    <BarChart data={results.handStats} margin={handChartMargin}>
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            formatter={(value: number) => [formatPercent(value), '']}
                            content={({ active, payload }) => active && payload?.length ? (
                                <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-lg">
                                    <span className="text-slate-300">{payload[0].payload.name}:</span>{' '}
                                    <span className="font-bold text-white">{formatPercent(payload[0].value as number)}</span>
                                </div>
                            ) : null}
                        />
                        <Bar dataKey="value" fill={CHART_COLORS.barPrimary} radius={[4, 4, 0, 0]}>
                             {results.handStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? CHART_COLORS.barPrimary : CHART_COLORS.barSecondary} />
                            ))}
                            <LabelList dataKey="value" position="top" formatter={(v: number) => formatPercent(v)} style={{ fill: '#64748b', fontSize: 11 }} />
                        </Bar>
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>

        {viewMode === 'equity' && (
            <div className="flex justify-between mt-2 px-2 text-sm font-mono font-bold border-t border-slate-200 dark:border-slate-700 pt-2">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Hero Equity</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-lg">{formatPercent(results.heroEquity)}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Villain</span>
                    <span className="text-red-600 dark:text-red-400 text-lg">{formatPercent(results.villainEquity)}</span>
                </div>
            </div>
        )}
        {viewMode === 'hands' && (
             <div className="mt-2 flex flex-wrap gap-2 justify-center">
                {results.handStats.map((stat, i) => (
                    <div key={i} className="text-[10px] bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded border border-slate-200 dark:border-slate-700/50">
                        <span className="text-slate-600 dark:text-slate-400">{stat.name}:</span> <span className="text-blue-600 dark:text-blue-400 font-bold">{formatPercent(stat.value)}</span>
                    </div>
                ))}
             </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(StatsPanel);