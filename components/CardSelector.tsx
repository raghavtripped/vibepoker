import React, { useState, useEffect, useCallback } from 'react';
import { Card, Rank, Suit } from '../types';
import { SUITS, RANKS, SUIT_COLORS, SUIT_SYMBOLS } from '../constants';
import { X, Trash2, HelpCircle, RefreshCcw } from 'lucide-react';

interface CardSelectorProps {
  cards: Card[];
  setCards: (cards: Card[]) => void;
  maxCards?: number;
  label: string;
}

const CardSelector: React.FC<CardSelectorProps> = ({ cards, setCards, maxCards = 5, label }) => {
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  const handleRankSelect = useCallback((rank: Rank) => {
    if (cards.length >= maxCards && editingIndex === null) return;
    setSelectedRank(rank);
  }, [cards.length, maxCards, editingIndex]);

  const handleSuitSelect = useCallback((suit: Suit) => {
    if (!selectedRank) return;

    if (cards.some((c, idx) => idx !== editingIndex && c.rank === selectedRank && c.suit === suit)) {
      setDuplicateError(true);
      setTimeout(() => setDuplicateError(false), 500);
      return;
    }

    const newCards = [...cards];
    if (editingIndex !== null) {
      newCards[editingIndex] = { rank: selectedRank, suit };
      setEditingIndex(null);
    } else {
      newCards.push({ rank: selectedRank, suit });
    }
    setCards(newCards);
    setSelectedRank(null);
  }, [selectedRank, cards, editingIndex, setCards]);

  const removeCard = useCallback((index: number) => {
    setRemovingIndex(index);
    setTimeout(() => {
      setCards(prev => {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });
      setRemovingIndex(null);
      setEditingIndex(prev => (prev === index ? null : prev));
    }, 200);
  }, [setCards]);

  const handleSlotClick = (index: number) => {
      // Toggle editing mode for this slot
      if (editingIndex === index) {
          setEditingIndex(null);
          setSelectedRank(null);
      } else {
          setEditingIndex(index);
          setSelectedRank(null); // Reset rank when switching slots
      }
  };

  const clearAll = () => {
    setCards([]);
    setSelectedRank(null);
    setEditingIndex(null);
  };

  // Keyboard navigation: number keys and A,K,Q,J,T for ranks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keypadVisible = cards.length < maxCards || editingIndex !== null;
      const target = e.target as HTMLElement;
      if (!keypadVisible || target.closest('input, textarea, [contenteditable]')) return;
      if (e.repeat) return;

      const rankKey = e.key.toUpperCase();
      if (RANKS.includes(rankKey as Rank)) {
        e.preventDefault();
        handleRankSelect(rankKey as Rank);
        return;
      }
      // Suit shortcuts: 1=Spades, 2=Hearts, 3=Diamonds, 4=Clubs (when rank selected)
      if (selectedRank && ['1', '2', '3', '4'].includes(e.key)) {
        const suitMap: Record<string, Suit> = { '1': Suit.Spades, '2': Suit.Hearts, '3': Suit.Diamonds, '4': Suit.Clubs };
        e.preventDefault();
        handleSuitSelect(suitMap[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards.length, maxCards, editingIndex, selectedRank, handleRankSelect, handleSuitSelect]);

  // Render the 5 slots (Flop, Turn, River)
  const renderSlots = () => {
    const slots = [];
    for (let i = 0; i < maxCards; i++) {
        const card = cards[i];
        const isNext = !card && (i === 0 || cards[i - 1]);
        const isEditing = editingIndex === i;
        
        let slotContent = null;
        let slotClass = "border-slate-300 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/50";
        let label = "";

        // Label logic for Flop/Turn/River
        if (i === 0) label = "Flop";
        if (i === 3) label = "Turn";
        if (i === 4) label = "River";

        if (card) {
            const isRemoving = removingIndex === i;
            slotContent = (
                <div
                  data-testid={`board-card-${i}`}
                  className={`flex flex-col items-center justify-center w-full h-full bg-white text-slate-900 rounded shadow-md relative group border border-slate-200 dark:border-transparent transition-all duration-200 ${isRemoving ? 'opacity-0 scale-75' : 'animate-in zoom-in duration-200'}`}
                >
                     <span className={`text-lg font-bold leading-none ${SUIT_COLORS[card.suit]}`}>{card.rank}</span>
                     <span className={`text-xl leading-none ${SUIT_COLORS[card.suit]}`}>{SUIT_SYMBOLS[card.suit]}</span>
                     {/* Overlay for actions - min touch target 44px */}
                     <div className={`absolute inset-0 bg-slate-900/60 opacity-0 ${isEditing ? 'opacity-100' : 'group-hover:opacity-100'} flex items-center justify-center rounded transition-opacity gap-1`}>
                        <button type="button" className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 bg-slate-200 rounded-full hover:bg-white text-slate-900 cursor-pointer shadow-lg touch-manipulation" onClick={(e) => { e.stopPropagation(); removeCard(i); }} aria-label={`Remove card ${i + 1}`}>
                            <X size={12} />
                        </button>
                        <div className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 bg-emerald-500 rounded-full hover:bg-emerald-400 text-white cursor-pointer shadow-lg touch-manipulation">
                            <RefreshCcw size={12} />
                        </div>
                     </div>
                </div>
            );
            slotClass = isEditing 
                ? "border-emerald-500 ring-2 ring-emerald-500/50 scale-105 z-10" 
                : "border-transparent bg-transparent p-0 overflow-visible";
        } else if (isNext) {
             slotClass = "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)] ring-2 ring-emerald-500/20";
             slotContent = <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>;
        }

        slots.push(
            <div key={i} className="flex flex-col items-center gap-1">
                <button
                    onClick={() => card ? handleSlotClick(i) : null}
                    disabled={!card && !isNext}
                    className={`
                        w-12 h-16 sm:w-14 sm:h-20 rounded-lg border-2 flex items-center justify-center transition-all relative
                        ${slotClass}
                    `}
                >
                    {slotContent}
                </button>
                {label && <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-600">{label}</span>}
            </div>
        );
    }
    return slots;
  };

  return (
    <div className="w-full space-y-4" data-testid="card-selector">
      {/* Header & Slots */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">{label}</h3>
                <button onClick={() => setShowHelp(!showHelp)} className="text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                    <HelpCircle size={14} />
                </button>
            </div>
            {cards.length > 0 && (
                <button onClick={clearAll} className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors">
                    <Trash2 size={12} /> Clear
                </button>
            )}
        </div>

        {showHelp && (
            <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-lg text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-2 animate-in slide-in-from-top-1">
                <p>1. Tap a slot to edit.</p>
                <p>2. Tap a <strong>Rank</strong> then <strong>Suit</strong>.</p>
                <p>3. Use the 'X' on a card to remove it.</p>
            </div>
        )}
        
        {/* Visual Board Slots */}
        <div className="flex gap-2 sm:gap-3 justify-center sm:justify-start bg-slate-100 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800/50">
            {renderSlots()}
        </div>
      </div>

      {/* Input Keypad */}
      {cards.length < maxCards || editingIndex !== null ? (
          <div
            data-testid="card-selector-keypad"
            className={`bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-xl space-y-3 animate-in slide-in-from-top-2 fade-in relative overflow-hidden transition-transform duration-150 ${duplicateError ? 'animate-shake' : ''}`}
          >
            {/* Instruction Banner */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transition-opacity duration-300 ${selectedRank ? 'opacity-100' : 'opacity-0'}`} />
            {duplicateError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium text-center py-1" role="alert">Duplicate card — pick another suit</p>
            )}
            
            <div className="text-center pb-1">
                 <p className="text-[10px] text-slate-400 dark:text-slate-400 uppercase tracking-widest font-bold">
                    {editingIndex !== null ? <span className="text-emerald-600 dark:text-emerald-400">Replacing Card {editingIndex + 1}</span> : (
                        selectedRank ? <span className="text-emerald-600 dark:text-emerald-400 animate-pulse">Select Suit for {selectedRank}</span> : 'Select Rank'
                    )}
                 </p>
            </div>

            {/* Rank Grid - min 44px touch targets on mobile */}
            <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 sm:gap-2">
                {RANKS.map((rank) => (
                    <button
                        key={rank}
                        type="button"
                        data-testid={`rank-${rank}`}
                        onClick={() => handleRankSelect(rank)}
                        className={`
                            min-h-[44px] h-11 sm:h-11 rounded font-mono font-bold text-sm sm:text-base transition-all active:scale-95 touch-manipulation
                            ${selectedRank === rank 
                                ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105 z-10 border border-emerald-400' 
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-600'
                            }
                        `}
                    >
                        {rank}
                    </button>
                ))}
            </div>

            {/* Suit Row - min 44px touch targets */}
            <div className={`
                grid grid-cols-4 gap-2 transition-all duration-300
                ${selectedRank ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1 pointer-events-none grayscale'}
            `}>
                {SUITS.map((suit) => (
                    <button
                        key={suit}
                        type="button"
                        data-testid={`suit-${suit}`}
                        onClick={() => handleSuitSelect(suit)}
                        className={`
                            min-h-[48px] h-12 rounded-lg text-2xl font-bold flex items-center justify-center transition-transform active:scale-95 touch-manipulation
                            bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600
                            hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500
                            shadow-sm
                            ${SUIT_COLORS[suit]}
                        `}
                    >
                        {SUIT_SYMBOLS[suit]}
                    </button>
                ))}
            </div>
          </div>
      ) : (
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-500 text-sm font-medium gap-2">
             <span>Board Full</span>
             <button onClick={clearAll} className="text-xs underline hover:text-emerald-500">Reset</button>
          </div>
      )}
    </div>
  );
};

export default React.memo(CardSelector);