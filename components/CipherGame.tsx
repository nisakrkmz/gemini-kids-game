import React, { useState, useEffect, useCallback } from 'react';
import { SavedCharacter } from '../types';

type GameMode = 'DECODE' | 'PATTERN';

interface Props {
  mode: GameMode;
  characterPool: SavedCharacter[];
  lives: number;
  level: number;
  onWin: () => void;
  onLoseLife: () => void;
  onRestart: () => void;
}

// --- TYPES ---
interface PatternCard {
  number: number;
  visual: string; 
  id: string;
}

interface ClueRow {
    icons: string[];
    numbers: number[];
}

interface Option {
  id: number;
  content: string | PatternCard; 
  isCorrect: boolean;
}

// --- ASSETS ---
const CIPHER_SHAPES = ['⭐', '🔺', '🟢', '🌙', '❤️', '🔷', '🟧', '🟣', '⚡', '💎', '🍀'];
const DEFAULT_EMOJIS = ['🐱', '🐶', '🐦', '🐠', '🦖', '🐘', '🦒', '🐇'];

const GameArena: React.FC<Props> = ({ mode, characterPool, lives, level, onWin, onLoseLife, onRestart }) => {
  
  // -- Decode State --
  const [clueRows, setClueRows] = useState<ClueRow[]>([]);
  const [questionRow, setQuestionRow] = useState<string[]>([]);
  
  // -- Pattern State --
  const [patternSequence, setPatternSequence] = useState<PatternCard[]>([]);
  
  // -- Shared State --
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<'neutral' | 'success' | 'error'>('neutral');

  // Max Level Cap
  const MAX_LEVEL = 5;
  const isGameComplete = level > MAX_LEVEL;

  // HELPER: Render Icon
  const renderIcon = (content: string, className: string = "") => {
    const isUrl = content.startsWith('http') || content.startsWith('data:');
    if (isUrl) {
        return <img src={content} alt="icon" className={`object-contain ${className}`} />;
    }
    return <span className={className}>{content}</span>;
  };

  // -------------------------------------------------------------------------
  // LOGIC GENERATION
  // -------------------------------------------------------------------------
  
  const generateLevel = useCallback(() => {
    if (isGameComplete) return;

    setSelectedIndex(null);
    setFeedbackState('neutral');
    
    if (mode === 'DECODE') {
        generateDecodeGame(level);
    } else {
        generatePatternGame(level);
    }
  }, [level, mode, isGameComplete, characterPool]);

  // --- 1. DECODE GAME LOGIC (Deductive / Rosetta Style) ---
  const generateDecodeGame = (lvl: number) => {
      // Difficulty Config
      let symbolCount = 3;
      let clueCount = 2;
      let rowLength = 3;

      if (lvl === 1) { symbolCount = 3; clueCount = 2; }
      else if (lvl === 2) { symbolCount = 4; clueCount = 2; }
      else if (lvl === 3) { symbolCount = 4; clueCount = 3; }
      else if (lvl === 4) { symbolCount = 5; clueCount = 3; }
      else { symbolCount = 5; clueCount = 3; }

      // 1. Select Symbols (Prioritize Custom Characters)
      const userVisuals = characterPool.map(c => c.imageUrl);
      
      // Mix: Put user visuals at the start
      const pool = [...userVisuals, ...CIPHER_SHAPES, ...DEFAULT_EMOJIS];
      // Ensure unique list before slicing, but keep order to favor user visuals
      const uniquePool = Array.from(new Set(pool));
      
      // To ensure diversity, we might want some shapes too, but let's try to use as many user chars as possible first
      // But we shuffle the selection slightly so it's not ALWAYS the first character
      let availableIcons;
      if (userVisuals.length > 0) {
          // If we have custom chars, take them, then fill remainder from shapes
          const needed = symbolCount;
          const userPart = userVisuals.slice(0, needed);
          const remainder = needed - userPart.length;
          const otherPart = [...CIPHER_SHAPES, ...DEFAULT_EMOJIS].sort(() => 0.5 - Math.random()).slice(0, Math.max(0, remainder));
          availableIcons = [...userPart, ...otherPart].sort(() => 0.5 - Math.random());
      } else {
          availableIcons = [...CIPHER_SHAPES, ...DEFAULT_EMOJIS].sort(() => 0.5 - Math.random()).slice(0, symbolCount);
      }
      
      const selectedIcons = availableIcons; // Already sliced logic above handled count mostly
      // Trim to exact size if logic above overshoot
      const finalIcons = selectedIcons.slice(0, symbolCount);

      const availableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => 0.5 - Math.random());
      const selectedNumbers = availableNumbers.slice(0, symbolCount);

      const iconToNum = new Map<string, number>();
      finalIcons.forEach((icon, i) => iconToNum.set(icon, selectedNumbers[i]));

      // 2. Generate Clue Rows
      const newClueRows: ClueRow[] = [];
      for (let i = 0; i < clueCount; i++) {
          const rowIcons = [];
          for(let j=0; j<rowLength; j++) {
              rowIcons.push(finalIcons[Math.floor(Math.random() * symbolCount)]);
          }
          const rowNums = rowIcons.map(icon => iconToNum.get(icon)!);
          newClueRows.push({ icons: rowIcons, numbers: rowNums });
      }
      setClueRows(newClueRows);

      // 3. Generate Question Row
      const qIcons = [];
      for(let j=0; j<rowLength; j++) {
          qIcons.push(finalIcons[Math.floor(Math.random() * symbolCount)]);
      }
      setQuestionRow(qIcons);

      const correctNums = qIcons.map(icon => iconToNum.get(icon)!);
      const correctStr = correctNums.join(' ');

      // 4. Options
      const newOptions: Option[] = [];
      newOptions.push({ id: 0, content: correctStr, isCorrect: true });

      let wrong1 = [...correctNums].sort(() => 0.5 - Math.random());
      if (wrong1.join(' ') === correctStr) wrong1.push(wrong1.shift()!);
      newOptions.push({ id: 1, content: wrong1.join(' '), isCorrect: false });

      const wrong2 = correctNums.map(() => selectedNumbers[Math.floor(Math.random() * symbolCount)]);
      if (wrong2.join(' ') === correctStr) wrong2[0] = (wrong2[0] % 9) + 1;
      newOptions.push({ id: 2, content: wrong2.join(' '), isCorrect: false });

      setOptions(newOptions.sort(() => 0.5 - Math.random()));
  };

  // --- 2. PATTERN GAME LOGIC ---
  const generatePatternGame = (lvl: number) => {
      // Visuals (Prioritize Custom)
      const userVisuals = characterPool.map(c => c.imageUrl);
      
      // Ensure we have at least 3 distinct visuals for complex patterns
      // We fill the rest with default emojis
      const visuals = [...userVisuals, ...DEFAULT_EMOJIS];
      // Do NOT shuffle initially, so user visuals stay at index 0, 1...
      
      const A = visuals[0];
      const B = visuals[1] || visuals[0];
      const C = visuals[2] || visuals[0];

      let fullSequence: PatternCard[] = [];
      let target: PatternCard;
      let questionSeq: PatternCard[] = [];
      
      if (lvl === 1) {
          // A-B-A-B-?
          const len = 5;
          for(let i=0; i<len; i++) {
              fullSequence.push({ id: `p${i}`, number: 1, visual: i % 2 === 0 ? A : B });
          }
      } else if (lvl === 2) {
          // 1-2-3-4-? (Visual A fixed)
          const len = 5; 
          for(let i=0; i<len; i++) {
              fullSequence.push({ id: `p${i}`, number: i + 1, visual: A });
          }
      } else if (lvl === 3) {
          // A-A-B-B-?
          const len = 5; 
          for(let i=0; i<len; i++) {
             const vis = (Math.floor(i / 2) % 2 === 0) ? A : B;
             fullSequence.push({ id: `p${i}`, number: 1, visual: vis });
          }
      } else if (lvl === 4) {
          // A-B-C-A-B-?
          const len = 6;
          for(let i=0; i<len; i++) {
             const vis = i % 3 === 0 ? A : (i % 3 === 1 ? B : C);
             fullSequence.push({ id: `p${i}`, number: 1, visual: vis });
          }
      } else if (lvl === 5) {
          // 1A - 2B - 3A - 4B - ?
          const len = 5;
          for(let i=0; i<len; i++) {
             fullSequence.push({ id: `p${i}`, number: i+1, visual: i % 2 === 0 ? A : B });
          }
      } else {
          for(let i=0; i<5; i++) fullSequence.push({ id:`p${i}`, number:1, visual:A });
      }

      target = fullSequence[fullSequence.length - 1];
      questionSeq = fullSequence.slice(0, fullSequence.length - 1);
      setPatternSequence(questionSeq);

      // Options
      const newOptions: Option[] = [];
      newOptions.push({ id: 0, content: target, isCorrect: true });

      const wrongVis = target.visual === A ? B : A;
      newOptions.push({ 
          id: 1, 
          content: { ...target, visual: wrongVis, id: 'opt1' }, 
          isCorrect: false 
      });

      const wrongNum = target.number === 1 ? 2 : 1; 
      const wrongMath = target.number + 1;
      newOptions.push({ 
          id: 2, 
          content: { ...target, number: lvl === 2 || lvl === 5 ? wrongMath : wrongNum, id: 'opt2' }, 
          isCorrect: false 
      });

      setOptions(newOptions.sort(() => 0.5 - Math.random()));
  };

  useEffect(() => {
    generateLevel();
  }, [generateLevel]);


  // -------------------------------------------------------------------------
  // HANDLERS (Unchanged)
  // -------------------------------------------------------------------------
  const handleConfirm = () => {
      if (selectedIndex === null) return;
      const selectedOption = options.find(o => o.id === selectedIndex);
      if (selectedOption?.isCorrect) {
          setFeedbackState('success');
          setTimeout(() => onWin(), 1500);
      } else {
          setFeedbackState('error');
          onLoseLife();
          setTimeout(() => {
              setFeedbackState('neutral');
              setSelectedIndex(null);
          }, 1000);
      }
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  if (lives <= 0) {
      return (
          <div className="flex flex-col items-center justify-center animate-pop-in text-center p-8 bg-white rounded-3xl shadow-xl border-4 border-red-100 mt-10">
              <div className="text-8xl mb-4">😿</div>
              <h2 className="text-4xl font-bold text-red-500 mb-2">Eyvah!</h2>
              <p className="text-xl text-gray-500 mb-6">Canın bitti. Ama pes etmek yok!</p>
              <button onClick={onRestart} className="bg-yellow-400 hover:bg-yellow-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transition-transform hover:scale-105">
                  Tekrar Dene 🔄
              </button>
          </div>
      );
  }

  if (isGameComplete) {
      return (
          <div className="flex flex-col items-center justify-center animate-pop-in text-center p-8 bg-gradient-to-br from-yellow-100 to-white rounded-3xl shadow-2xl border-4 border-yellow-300 mt-10 max-w-2xl">
              <div className="text-9xl mb-6 animate-bounce">🏆</div>
              <h2 className="text-5xl font-black text-purple-600 mb-4">TEBRİKLER!</h2>
              <p className="text-2xl text-gray-700 font-bold mb-8">
                  {mode === 'DECODE' ? 'Şifre Ustası Oldun!' : 'Örüntü Dahisi Oldun!'}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <span className="text-3xl">⭐</span> {level-1} Seviye
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <span className="text-3xl">❤️</span> {lives} Can
                  </div>
              </div>
              <button onClick={onRestart} className="mt-10 bg-green-500 hover:bg-green-600 text-white text-3xl font-bold py-5 px-16 rounded-full shadow-[0_6px_0_#15803d] active:shadow-none active:translate-y-[6px] transition-all">
                  Başa Dön 🏠
              </button>
          </div>
      );
  }

  // --- RENDER HELPERS ---
  const renderCard = (card: PatternCard, isLarge: boolean = false) => {
      const isUrl = card.visual.startsWith('http') || card.visual.startsWith('data:');
      return (
          <div className={`
            flex flex-col items-center justify-center bg-white border-b-4 border-r-4 border-gray-200 rounded-xl shadow-sm overflow-hidden
            ${isLarge ? 'w-24 h-32 md:w-28 md:h-36' : 'w-20 h-28 md:w-24 md:h-32'}
          `}>
             <div className="flex-1 flex items-center justify-center w-full p-1">
                 {isUrl ? (
                     <img src={card.visual} alt="icon" className="w-full h-full object-contain drop-shadow-sm" />
                 ) : (
                     <span className={`${isLarge ? 'text-5xl' : 'text-4xl'}`}>{card.visual}</span>
                 )}
             </div>
             <div className="w-full bg-purple-100 text-purple-800 font-bold text-center py-1 text-xl md:text-2xl border-t border-purple-200">
                 {card.number}
             </div>
          </div>
      );
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 p-2 max-w-5xl mx-auto">
        
        {/* Header */}
       <div className="w-full flex justify-between items-center bg-white/60 p-3 rounded-2xl">
           <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 text-xl font-bold text-white px-4 py-2 bg-purple-500 rounded-xl shadow-sm">
                 <span>🚀</span> Seviye {level} / {MAX_LEVEL}
             </div>
             <span className="hidden md:inline text-sm font-bold text-purple-800 bg-purple-100 px-3 py-2 rounded-lg">
                 {mode === 'DECODE' ? 'Şifre Çözme' : 'Örüntü Tamamlama'}
             </span>
           </div>
           
           <div className="flex gap-1">
               {[...Array(3)].map((_, i) => (
                   <span key={i} className={`text-2xl transition-all ${i < lives ? 'opacity-100 scale-100' : 'opacity-20 grayscale scale-75'}`}>❤️</span>
               ))}
           </div>
       </div>

       {/* ==================== MODE: DECODE ==================== */}
       {mode === 'DECODE' && (
           <>
             {/* 1. CLUE SECTION (Examples) */}
             <div className="w-full max-w-2xl bg-yellow-50 rounded-3xl border-4 border-yellow-200 p-4 flex flex-col items-center gap-3 relative shadow-sm">
                 <div className="absolute -top-4 bg-yellow-400 text-yellow-900 px-6 py-1 rounded-full font-bold text-sm tracking-wider shadow-sm border border-yellow-200">
                     İPUÇLARI 🧐
                 </div>
                 
                 {clueRows.map((row, idx) => (
                     <div key={idx} className="flex items-center gap-2 md:gap-4 bg-white p-2 md:p-3 rounded-xl shadow-sm w-full justify-center">
                         {/* Icons */}
                         <div className="flex gap-2">
                             {row.icons.map((icon, i) => (
                                 <div key={i} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-gray-50 rounded-lg text-2xl md:text-4xl border border-gray-100 overflow-hidden">
                                     {renderIcon(icon)}
                                 </div>
                             ))}
                         </div>
                         
                         {/* Arrow */}
                         <div className="text-gray-400 font-bold text-xl">➜</div>

                         {/* Numbers */}
                         <div className="flex gap-2">
                             {row.numbers.map((num, i) => (
                                 <div key={i} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg text-2xl md:text-4xl font-black border border-blue-100">
                                     {num}
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>

             {/* 2. QUESTION SECTION */}
             <div className="w-full max-w-xl bg-white p-6 rounded-3xl shadow-xl border-b-8 border-purple-200 flex flex-col items-center gap-4 animate-pop-in">
                 <h3 className="text-purple-400 font-bold tracking-widest text-sm">BU ŞİFREYİ ÇÖZ!</h3>
                 <div className="flex items-center gap-2 md:gap-4">
                     {questionRow.map((icon, i) => (
                         <div key={i} className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-purple-50 rounded-2xl text-4xl md:text-5xl border-2 border-purple-100 shadow-inner overflow-hidden">
                             {renderIcon(icon)}
                         </div>
                     ))}
                     <div className="text-4xl font-black text-purple-300">=</div>
                     <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-gray-100 rounded-2xl text-5xl font-black text-gray-400 border-2 border-dashed border-gray-300 animate-pulse">
                         ?
                     </div>
                 </div>
             </div>

             {/* 3. OPTIONS SECTION */}
             <div className="flex flex-wrap justify-center gap-4 w-full">
                {options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => setSelectedIndex(option.id)}
                        disabled={feedbackState !== 'neutral'}
                        className={`
                            px-8 py-4 rounded-2xl border-4 transition-all text-3xl md:text-4xl font-black tracking-widest shadow-md
                            ${selectedIndex === option.id 
                                ? (feedbackState === 'neutral' ? 'border-blue-500 bg-blue-50 scale-105' 
                                : feedbackState === 'success' && option.isCorrect ? 'border-green-500 bg-green-100 scale-105' 
                                : 'border-red-500 bg-red-100 scale-105')
                                : 'border-white bg-white hover:border-blue-200 hover:-translate-y-1'
                            }
                        `}
                    >
                        {option.content as string}
                    </button>
                ))}
             </div>
           </>
       )}

       {/* ==================== MODE: PATTERN ==================== */}
       {mode === 'PATTERN' && (
           <>
              <div className="bg-white p-6 rounded-3xl shadow-xl border-b-8 border-r-8 border-gray-200 w-full flex flex-col items-center gap-6 mt-4">
                 
                 <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
                     {patternSequence.map((card, idx) => (
                         <React.Fragment key={idx}>
                             {renderCard(card)}
                             <div className="text-gray-300 font-bold text-2xl">➜</div>
                         </React.Fragment>
                     ))}
                     {/* Question Mark */}
                     <div className="w-20 h-28 md:w-24 md:h-32 bg-purple-50 border-4 border-dashed border-purple-300 rounded-xl flex items-center justify-center text-6xl text-purple-400 animate-pulse">
                         ?
                     </div>
                 </div>
              </div>

              <p className="text-purple-600 font-bold text-lg">Sıradaki hangisi?</p>

              {/* Options */}
              <div className="flex flex-wrap justify-center gap-8 w-full">
                  {options.map((option) => (
                      <button
                          key={option.id}
                          onClick={() => setSelectedIndex(option.id)}
                          disabled={feedbackState !== 'neutral'}
                          className={`
                              rounded-xl p-2 border-4 transition-all transform
                              ${selectedIndex === option.id 
                                  ? (feedbackState === 'neutral' ? 'border-blue-500 bg-blue-50 scale-110 shadow-lg' 
                                  : feedbackState === 'success' && option.isCorrect ? 'border-green-500 bg-green-100 scale-110 shadow-lg' 
                                  : 'border-red-500 bg-red-100 scale-110 shadow-lg')
                                  : 'border-transparent hover:scale-110 hover:bg-white/50'
                              }
                          `}
                      >
                          {renderCard(option.content as PatternCard, true)}
                      </button>
                  ))}
              </div>
           </>
       )}

       {/* Confirm Button */}
       <div className="h-24 flex items-center justify-center w-full mt-2">
           {selectedIndex !== null && feedbackState === 'neutral' && (
               <button 
                   onClick={handleConfirm}
                   className="bg-green-500 hover:bg-green-600 text-white text-2xl font-bold py-3 px-16 rounded-full shadow-[0_6px_0_#15803d] active:shadow-none active:translate-y-[6px] transition-all animate-pop-in"
               >
                   ONAYLA ✅
               </button>
           )}
           {feedbackState === 'success' && (
               <div className="flex flex-col items-center animate-bounce">
                   <span className="text-5xl">🌟</span>
                   <span className="text-3xl font-bold text-green-600">SÜPERSİN!</span>
               </div>
           )}
            {feedbackState === 'error' && (
               <div className="flex flex-col items-center animate-shake">
                   <span className="text-5xl">🚫</span>
                   <span className="text-3xl font-bold text-red-500">BİR DAHA BAK</span>
               </div>
           )}
       </div>
    </div>
  );
};

export default GameArena;