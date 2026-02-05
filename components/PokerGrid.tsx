import React, { useState, useEffect } from 'react';
import { RANKS, SKLANSKY_ORDER } from '../constants';
import { GridSelection } from '../types';
import { RotateCcw, MousePointerClick } from 'lucide-react';

interface PokerGridProps {
  selection: GridSelection;
  setSelection: (sel: GridSelection) => void;
  variant?: 'hero' | 'villain';
}

const PokerGrid: React.FC<PokerGridProps> = ({ selection, setSelection, variant = 'hero' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<boolean>(true);
  
  // Initialize slider based on the incoming selection prop to persist visual state across tab switches
  const [sliderValue, setSliderValue] = useState(() => {
    const totalHands = 169;
    const selectedCount = Object.values(selection).filter(Boolean).length;
    return Math.round((selectedCount / totalHands) * 100);
  });

  // Theme configuration based on variant
  const theme = variant === 'hero' ? {
    accent: 'emerald',
    bgSelected: 'bg-emerald-500',
    shadowSelected: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    borderSelected: 'border-transparent',
    sliderAccent: 'accent-emerald-500'
  } : {
    accent: 'rose',
    bgSelected: 'bg-rose-500',
    shadowSelected: 'shadow-[0_0_10px_rgba(244,63,94,0.5)]',
    borderSelected: 'border-transparent',
    sliderAccent: 'accent-rose-500'
  };

  // Sync slider if selection changes externally (e.g. manual clear or preset load)
  useEffect(() => {
    const totalHands = 169;
    const selectedCount = Object.values(selection).filter(Boolean).length;
    
    if (selectedCount === 0 && sliderValue !== 0) {
        setSliderValue(0);
    } 
  }, [selection]);

  const toggleCell = (combo: string, forceState?: boolean) => {
    setSelection({
      ...selection,
      [combo]: forceState !== undefined ? forceState : !selection[combo]
    });
  };

  const handleMouseDown = (combo: string) => {
    setIsDragging(true);
    const newMode = !selection[combo];
    setDragMode(newMode);
    toggleCell(combo, newMode);
  };

  const handleMouseEnter = (combo: string) => {
    if (isDragging) {
      toggleCell(combo, dragMode);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- Touch Support for Mobile Painting ---
  const handleTouchStart = (e: React.TouchEvent, combo: string) => {
    // Prevent default to avoid scrolling on some devices, though specific touch-action css is safer
    // e.preventDefault(); 
    setIsDragging(true);
    const newMode = !selection[combo];
    setDragMode(newMode);
    toggleCell(combo, newMode);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Critical for painting behavior on mobile
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element) {
        const combo = element.getAttribute('data-combo');
        if (combo) {
            // Only toggle if it matches the current drag operation (add vs remove)
            // But for simple painting, we just force the dragMode state
            if (selection[combo] !== dragMode) {
                toggleCell(combo, dragMode);
            }
        }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const clearSelection = () => {
      setSelection({});
      setSliderValue(0);
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSliderValue(val);

    const totalHands = 169;
    const countToSelect = Math.floor((val / 100) * totalHands);
    
    const newSelection: GridSelection = {};
    for (let i = 0; i < countToSelect; i++) {
        if (SKLANSKY_ORDER[i]) {
            newSelection[SKLANSKY_ORDER[i]] = true;
        }
    }
    setSelection(newSelection);
  };

  const renderGrid = () => {
    const grid: React.ReactNode[] = [];
    
    for (let i = 0; i < 13; i++) {
      const row: React.ReactNode[] = [];
      for (let j = 0; j < 13; j++) {
        const rank1 = RANKS[i];
        const rank2 = RANKS[j];
        
        let combo = "";
        let display = "";
        let type = ""; 

        if (i === j) {
          combo = `${rank1}${rank2}`;
          display = `${rank1}${rank2}`;
          type = "pair";
        } else if (i < j) {
          combo = `${rank1}${rank2}s`;
          display = `${rank1}${rank2}s`;
          type = "suited";
        } else {
          combo = `${rank2}${rank1}o`;
          display = `${rank2}${rank1}o`;
          type = "offsuit";
        }

        const isSelected = !!selection[combo];

        let bgClass = "";
        if (isSelected) {
            bgClass = `${theme.bgSelected} ${theme.shadowSelected} z-10 scale-105 ${theme.borderSelected} text-white`;
        } else {
            if (type === 'pair') bgClass = "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400";
            else if (type === 'suited') bgClass = "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-500";
            else bgClass = "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-600";
        }

        row.push(
          <div
            key={combo}
            data-combo={combo}
            onMouseDown={() => handleMouseDown(combo)}
            onMouseEnter={() => handleMouseEnter(combo)}
            onTouchStart={(e) => handleTouchStart(e, combo)}
            title={combo}
            className={`
              w-full h-7 sm:h-9 text-[10px] sm:text-xs font-bold flex items-center justify-center 
              cursor-pointer select-none border border-slate-200 dark:border-slate-950/50 transition-all duration-75
              ${bgClass}
            `}
          >
            {display}
          </div>
        );
      }
      grid.push(<div key={i} className="flex w-full">{row}</div>);
    }
    return grid;
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Slider Control */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col w-full gap-2">
            <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    Quick Select (Top {sliderValue}%)
                </span>
                <button 
                    onClick={clearSelection}
                    className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                    <RotateCcw size={10} /> Reset
                </button>
            </div>
            <input 
            type="range" 
            min="0" 
            max="100" 
            value={sliderValue} 
            onChange={handleSliderChange}
            className={`w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer ${theme.sliderAccent}`}
            />
        </div>
      </div>

      <div className="relative touch-none" onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden shadow-2xl bg-white dark:bg-slate-950">
            {renderGrid()}
        </div>
        
        {!Object.keys(selection).length && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/60 dark:bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2 border border-white/10 animate-pulse">
                    <MousePointerClick size={16} />
                    <span className="text-xs font-medium">Drag to paint</span>
                </div>
            </div>
        )}
      </div>
      
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 px-2 font-mono uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 ${theme.bgSelected} rounded-sm ${theme.shadowSelected}`}></div> 
            Selected
        </div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-200 dark:bg-slate-700/50 rounded-sm"></div> Pairs</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-100 dark:bg-slate-800 rounded-sm"></div> Suited</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800"></div> Offsuit</div>
      </div>
    </div>
  );
};

export default PokerGrid;