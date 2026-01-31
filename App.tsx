
import React, { useState, useEffect, useCallback } from 'react';
import { getDailyCountry, generateShareGrid, getDayNumber, getLondonDateString, getRandomCountryFiltered } from './utils';
import { Country, GameState, GameFilter } from './types';
import { MAX_GUESSES } from './constants';
import ShapeDisplay from './components/ShapeDisplay';
import GuessInput from './components/GuessInput';
import GuessList from './components/GuessList';
import { HelpModal, ResultModal } from './components/Modals';
import ModeSelection from './components/ModeSelection';

const STORAGE_KEY = 'shapely-game-state-v4';

const App: React.FC = () => {
  // Game Mode State
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [isModePanelOpen, setIsModePanelOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<GameFilter>({
    continent: 'All',
    difficulty: 'Mixed',
    type: 'All'
  });
  
  // Daily Mode Data
  const [currentDay, setCurrentDay] = useState(() => getDayNumber());
  const [dailyCountry, setDailyCountry] = useState<Country>(() => getDailyCountry());
  
  // Daily Mode Progress State
  const [dailyState, setDailyState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const todayLDN = getLondonDateString();
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GameState;
        if (parsed.date === todayLDN) return parsed;
      } catch (e) {
        console.error("Failed to parse game state", e);
      }
    }
    
    return {
      date: todayLDN,
      guesses: [],
      isFinished: false,
      won: false
    };
  });

  // Infinite Mode State
  const [infiniteCountry, setInfiniteCountry] = useState<Country | null>(null);
  const [infiniteState, setInfiniteState] = useState<GameState>({
    date: 'infinite',
    guesses: [],
    isFinished: false,
    won: false
  });

  // UI State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Persistence for Daily Mode
  useEffect(() => {
    if (!isInfiniteMode) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyState));
    }
  }, [dailyState, isInfiniteMode]);

  // First time visitor help
  useEffect(() => {
    const hasVisited = localStorage.getItem('shapely-visited-v3');
    if (!hasVisited) {
      setIsHelpOpen(true);
      localStorage.setItem('shapely-visited-v3', 'true');
    }
  }, []);

  // Show result modal automatically if the daily game is finished
  useEffect(() => {
    if (!isInfiniteMode && dailyState.isFinished) {
      const timer = setTimeout(() => setIsResultOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [dailyState.isFinished, isInfiniteMode]);

  /**
   * Day-Change Detection Logic (London Time Synchronized)
   */
  const checkDayChange = useCallback(() => {
    const dayNow = getDayNumber();
    if (dayNow !== currentDay) {
      const todayLDN = getLondonDateString();
      setCurrentDay(dayNow);
      setDailyCountry(getDailyCountry());
      setDailyState({
        date: todayLDN,
        guesses: [],
        isFinished: false,
        won: false
      });
      if (!isInfiniteMode) {
        setIsResultOpen(false);
      }
      setToast('A new day in London has begun! New daily shape unlocked.');
      setTimeout(() => setToast(null), 5000);
    }
  }, [currentDay, isInfiniteMode]);

  useEffect(() => {
    const interval = setInterval(checkDayChange, 15000); 
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkDayChange();
    };
    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', checkDayChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', checkDayChange);
    };
  }, [checkDayChange]);

  const activeState = isInfiniteMode ? infiniteState : dailyState;
  const activeCountry = isInfiniteMode ? (infiniteCountry || dailyCountry) : dailyCountry;

  const handleGuess = useCallback((countryName: string) => {
    if (activeState.isFinished) return;

    const isCorrect = countryName.toLowerCase() === activeCountry.name.toLowerCase();
    const newGuesses = [...activeState.guesses, countryName];
    const isGameOver = isCorrect || newGuesses.length >= MAX_GUESSES;

    const newState = {
      ...activeState,
      guesses: newGuesses,
      isFinished: isGameOver,
      won: isCorrect
    };

    if (isInfiniteMode) {
      setInfiniteState(newState);
    } else {
      setDailyState(newState);
    }

    if (isGameOver) {
      setTimeout(() => setIsResultOpen(true), 1500);
    }
  }, [activeState, activeCountry, isInfiniteMode]);

  const startInfiniteMode = (filterOverride?: GameFilter) => {
    const filter = filterOverride || activeFilter;
    const randomCountry = getRandomCountryFiltered(filter, activeCountry.code);
    setInfiniteCountry(randomCountry);
    setInfiniteState({
      date: 'infinite',
      guesses: [],
      isFinished: false,
      won: false
    });
    setIsInfiniteMode(true);
    setIsResultOpen(false);
    
    let modeName = filter.continent === 'All' ? 'Global' : filter.continent;
    if (filter.type === 'Territory') modeName += ' (Territories)';
    
    setToast(`${modeName} shape loaded!`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleModeChange = (newFilter: GameFilter) => {
    setActiveFilter(newFilter);
    startInfiniteMode(newFilter);
  };

  const handleShare = async () => {
    const shareText = generateShareGrid(activeState.guesses, activeCountry.name, activeState.won, isInfiniteMode);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Shapely', text: shareText });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast('Result copied to clipboard!');
      setTimeout(() => setToast(null), 3000);
    }).catch(() => {
      setToast('Failed to copy. Please try again.');
      setTimeout(() => setToast(null), 3000);
    });
  };

  const toggleModePanel = () => {
    setIsModePanelOpen(!isModePanelOpen);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30">
      <header className="max-w-2xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleModePanel}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 ${isInfiniteMode ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-blue-600 shadow-blue-600/20'}`}
          >
            <i className={`fa-solid ${isInfiniteMode ? 'fa-infinity' : 'fa-earth-americas'} text-xl`}></i>
          </button>
          <div onClick={toggleModePanel} className="cursor-pointer group">
            <h1 className="text-2xl font-black tracking-tight leading-none group-hover:text-blue-400 transition-colors">SHAPELY</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] mt-1 uppercase">
              {isInfiniteMode ? `Infinite: ${activeFilter.type === 'Territory' ? 'Regions' : activeFilter.continent}` : `Daily No. ${currentDay}`}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            aria-label="Help"
          >
            <i className="fa-solid fa-circle-question"></i>
          </button>
          {activeState.isFinished && (
            <button 
              onClick={() => setIsResultOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors text-blue-400"
              aria-label="Statistics"
            >
              <i className="fa-solid fa-chart-simple"></i>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-20">
        <ShapeDisplay 
          countryCode={activeCountry.code} 
          guessCount={activeState.guesses.length}
          isRevealed={activeState.isFinished}
        />

        <GuessInput 
          onGuess={handleGuess} 
          disabled={activeState.isFinished} 
          previousGuesses={activeState.guesses}
          activeFilter={activeFilter}
          isInfiniteMode={isInfiniteMode}
        />

        <GuessList 
          guesses={activeState.guesses} 
          correctCountryName={activeCountry.name}
        />

        <div className="mt-12 text-center text-slate-500 text-sm font-medium uppercase tracking-widest flex items-center justify-center gap-4">
          <div className="h-px w-8 bg-slate-800" />
          {activeState.isFinished ? "Challenge Completed" : `${MAX_GUESSES - activeState.guesses.length} Guesses Remaining`}
          <div className="h-px w-8 bg-slate-800" />
        </div>

        {isInfiniteMode && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <button 
              onClick={toggleModePanel}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-xs font-bold uppercase tracking-widest text-slate-400 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-sliders"></i>
              Change Game Mode
            </button>
            <button 
              onClick={() => setIsInfiniteMode(false)}
              className="text-xs text-slate-600 hover:text-slate-400 font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-arrow-left"></i>
              Back to Daily Challenge
            </button>
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          {toast}
        </div>
      )}

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <ResultModal 
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        won={activeState.won}
        countryName={activeCountry.name}
        countryCode={activeCountry.code}
        capital={activeCountry.capital}
        onShare={handleShare}
        isInfinite={isInfiniteMode}
        onStartInfinite={() => startInfiniteMode()}
      />
      <ModeSelection 
        isOpen={isModePanelOpen}
        onClose={() => setIsModePanelOpen(false)}
        onSelectMode={handleModeChange}
        currentFilter={activeFilter}
      />
    </div>
  );
};

export default App;
