import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppScreen, SavedCharacter } from '../types';

interface Props {
  gameType: AppScreen;
  characterPool: SavedCharacter[];
  onWin: () => void;
  onLoseLife: () => void;
  onRestart: () => void;
  lives: number;
  level: number; // Level comes from App state now
}

const DEFAULT_EMOJIS = ['🐱', '🐶', '🐦', '🐠', '🦖', '🐘', '🐙', '🦋', '🐞', '🦁', '🐨'];

const MiniGamesArena: React.FC<Props> = ({ gameType, characterPool, onWin, onLoseLife, onRestart, lives, level }) => {
  const [feedback, setFeedback] = useState<'neutral' | 'success' | 'error'>('neutral');

  // GAME SPECIFIC STATES
  // -- Treasure Hunt
  const [thPath, setThPath] = useState<string[]>([]);
  const [thPlayerPos, setThPlayerPos] = useState(0);
  const [thTarget, setThTarget] = useState(0);
  const [thPlayerIcon, setThPlayerIcon] = useState('🦸');

  // -- Memory
  const [memCards, setMemCards] = useState<{id: number, icon: string, flipped: boolean, matched: boolean}[]>([]);
  const [memFlipped, setMemFlipped] = useState<number[]>([]);
  const [isMemoryPreview, setIsMemoryPreview] = useState(false);
  const [previewTimer, setPreviewTimer] = useState(7);

  // -- Missing Symbol
  const [msSequence, setMsSequence] = useState<string[]>([]);
  const [msMissingIdx, setMsMissingIdx] = useState<number | null>(null);
  const [msOptions, setMsOptions] = useState<string[]>([]);
  const [msShowPhase, setMsShowPhase] = useState(true);

  // -- Number Hunter
  const [nhTarget, setNhTarget] = useState(0);
  const [nhBubbles, setNhBubbles] = useState<{id: number, val: number, top: number, left: number, speed: number, icon?: string}[]>([]);

  // -- Detective
  const [detEq, setDetEq] = useState<{icon: string, count: number, result: number} | null>(null);
  const [detOptions, setDetOptions] = useState<number[]>([]);

  // -- Shadow Match
  const [shTarget, setShTarget] = useState<string>('');
  const [shOptions, setShOptions] = useState<string[]>([]);

  // HELPER: Get mixed icons (Prioritize Custom Characters)
  const getGameIcons = useCallback(() => {
      const customIcons = characterPool.map(c => c.imageUrl);
      // Put custom icons first
      const pool = [...customIcons, ...DEFAULT_EMOJIS];
      return Array.from(new Set(pool));
  }, [characterPool]);

  // HELPER: Get a primary character (Created one if exists, else random emoji)
  const getHeroIcon = useCallback(() => {
    if (characterPool.length > 0) {
        // Pick a random one from the pool to keep it fresh
        return characterPool[Math.floor(Math.random() * characterPool.length)].imageUrl;
    }
    return DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)];
  }, [characterPool]);

  // HELPER: Render Icon
  const renderIcon = (content: string, className: string = "") => {
      const isUrl = content.startsWith('http') || content.startsWith('data:');
      if (isUrl) {
          return <img src={content} alt="icon" className={`object-contain w-full h-full ${className}`} />;
      }
      return <span className={className}>{content}</span>;
  };

  // --- INIT GAME ---
  useEffect(() => {
    startLevel(level);
  }, [gameType, level]); 

  const startLevel = (lvl: number) => {
    setFeedback('neutral');
    
    switch(gameType) {
        case AppScreen.TREASURE_HUNT: initTreasureHunt(lvl); break;
        case AppScreen.MEMORY_GAME: initMemory(lvl); break;
        case AppScreen.MISSING_SYMBOL: initMissingSymbol(lvl); break;
        case AppScreen.NUMBER_HUNTER: initNumberHunter(lvl); break;
        case AppScreen.DETECTIVE_GAME: initDetective(lvl); break;
        case AppScreen.SHADOW_MATCH: initShadowMatch(lvl); break;
    }
  };

  // ---------------- GAME LOGIC INITIALIZERS ----------------

  // 1. TREASURE HUNT
  const initTreasureHunt = (lvl: number) => {
      const length = 2 + lvl; 
      setThTarget(length);
      setThPlayerPos(0);
      setThPath(Array(length).fill(0).map(() => '⬜'));
      // Use a custom character as the player piece
      setThPlayerIcon(getHeroIcon());
  };

  // 2. MEMORY GAME
  const initMemory = (lvl: number) => {
      const allIcons = getGameIcons(); // Custom icons are at the start
      const pairCount = Math.min(2 + (lvl - 1), 6); 
      
      // Select icons: Prefer custom ones from the start of the array
      const gameIcons = [];
      // If we have created characters, ensure they are in the game
      const customCount = characterPool.length;
      
      for(let i=0; i<pairCount; i++) {
          if (i < customCount) {
              gameIcons.push(characterPool[i].imageUrl);
          } else {
              // Fill rest with defaults, offset by custom count to avoid duplicates if possible
              const fallbackIdx = (i - customCount) % DEFAULT_EMOJIS.length;
              gameIcons.push(DEFAULT_EMOJIS[fallbackIdx]);
          }
      }

      const deck = [...gameIcons, ...gameIcons]
         .sort(() => 0.5 - Math.random())
         .map((icon, idx) => ({ id: idx, icon, flipped: false, matched: false }));
      
      setMemCards(deck);
      setMemFlipped([]);
      
      const time = Math.max(3, 8 - lvl);
      setIsMemoryPreview(true);
      setPreviewTimer(time);
  };

  useEffect(() => {
      if (gameType === AppScreen.MEMORY_GAME && isMemoryPreview) {
          if (previewTimer > 0) {
              const timer = setTimeout(() => setPreviewTimer(t => t - 1), 1000);
              return () => clearTimeout(timer);
          } else {
              setIsMemoryPreview(false);
          }
      }
  }, [gameType, isMemoryPreview, previewTimer]);


  // 3. MISSING SYMBOL
  const initMissingSymbol = (lvl: number) => {
      const allIcons = getGameIcons();
      const count = Math.min(3 + (Math.floor(lvl/2)), 6);
      
      // Ensure the sequence includes our custom characters if available
      const seq: string[] = [];
      const usedIndices = new Set<number>();
      
      // Try to fill with custom chars first
      if (characterPool.length > 0) {
          const hero = getHeroIcon();
          seq.push(hero);
      }

      while(seq.length < count) {
          const rand = allIcons[Math.floor(Math.random() * allIcons.length)];
          if (!seq.includes(rand)) seq.push(rand);
      }
      
      // Shuffle sequence
      const finalSeq = seq.sort(() => 0.5 - Math.random());

      setMsSequence(finalSeq);
      setMsShowPhase(true);
      setMsMissingIdx(null);

      const delay = Math.max(1500, 3500 - (lvl * 400));
      setTimeout(() => {
          // Determine missing item
          // If we have a custom char, make it the missing one 50% of the time to make it fun
          let missing = Math.floor(Math.random() * count);
          
          // Logic: Find index of a custom character if exists
          const customCharIndex = finalSeq.findIndex(icon => characterPool.some(c => c.imageUrl === icon));
          if (customCharIndex !== -1 && Math.random() > 0.4) {
             missing = customCharIndex;
          }

          setMsMissingIdx(missing);
          setMsShowPhase(false);
          
          const correct = finalSeq[missing];
          const wrong = allIcons.filter(e => e !== correct).sort(() => 0.5 - Math.random()).slice(0, 2);
          setMsOptions([correct, ...wrong].sort(() => 0.5 - Math.random()));
      }, delay);
  };

  // 4. NUMBER HUNTER
  const initNumberHunter = (lvl: number) => {
      const target = Math.floor(Math.random() * 9) + 1;
      setNhTarget(target);
      const bubbleCount = 4 + lvl; 
      const baseSpeed = 0.5 + (lvl * 0.3);

      const bubbles = Array(bubbleCount).fill(0).map((_, i) => ({
          id: i,
          val: Math.random() > 0.3 ? target : Math.floor(Math.random() * 9) + 1,
          top: Math.random() * 80,
          left: Math.random() * 80,
          speed: baseSpeed + Math.random(),
          // Optional: Add an icon to the bubble (not used in render currently, but prepared)
          icon: Math.random() > 0.7 ? getHeroIcon() : undefined
      }));
      setNhBubbles(bubbles);
  };

  // 5. DETECTIVE
  const initDetective = (lvl: number) => {
      // Use created character as the mystery icon!
      const icon = getHeroIcon();
      
      const maxVal = Math.min(3 + lvl, 9);
      const val = Math.floor(Math.random() * maxVal) + 1; 
      const count = 2; 
      const total = val * count;
      
      setDetEq({ icon, count, result: total });
      
      const correct = val;
      const opts = [correct, correct + 1, Math.max(1, correct - 1)];
      const uniqueOpts = Array.from(new Set(opts)).sort((a,b) => a-b);
      while(uniqueOpts.length < 3) {
          const r = Math.floor(Math.random() * (maxVal + 2)) + 1;
          if(!uniqueOpts.includes(r)) uniqueOpts.push(r);
      }
      setDetOptions(uniqueOpts.sort((a,b) => a-b));
  };

  // 6. SHADOW MATCH
  const initShadowMatch = (lvl: number) => {
      const allIcons = getGameIcons();
      
      // PRIORITY: Use a custom character as the target!
      let target: string;
      if (characterPool.length > 0) {
          // High chance to pick from pool
           target = Math.random() > 0.2 
            ? characterPool[Math.floor(Math.random() * characterPool.length)].imageUrl
            : allIcons[Math.floor(Math.random() * allIcons.length)];
      } else {
          target = allIcons[Math.floor(Math.random() * allIcons.length)];
      }

      setShTarget(target);
      
      const optionCount = lvl > 3 ? 3 : 2; 

      const wrong = allIcons.filter(e => e !== target).sort(() => 0.5 - Math.random()).slice(0, optionCount);
      setShOptions([target, ...wrong].sort(() => 0.5 - Math.random()));
  };

  // ---------------- HANDLERS (Unchanged) ----------------
  const handleWin = () => {
      setFeedback('success');
      setTimeout(() => { onWin(); }, 1500);
  };

  const handleFail = () => {
      setFeedback('error');
      onLoseLife();
      setTimeout(() => setFeedback('neutral'), 1000);
  };

  const handleTreasureMove = (steps: number) => {
      const newPos = thPlayerPos + steps;
      if (newPos === thTarget) {
          setThPlayerPos(newPos);
          handleWin();
      } else if (newPos > thTarget) {
          handleFail(); 
          setThPlayerPos(0); 
      } else {
          setThPlayerPos(newPos);
      }
  };

  const handleCardClick = (id: number) => {
      if (isMemoryPreview) return;
      if (memFlipped.length >= 2 || memCards.find(c => c.id === id)?.matched || memFlipped.includes(id)) return;
      const newFlipped = [...memFlipped, id];
      setMemFlipped(newFlipped);
      setMemCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));
      if (newFlipped.length === 2) {
          const c1 = memCards.find(c => c.id === newFlipped[0]);
          const c2 = memCards.find(c => c.id === newFlipped[1]);
          if (c1?.icon === c2?.icon) {
              setTimeout(() => {
                  setMemCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true } : c));
                  setMemFlipped([]);
                  if (memCards.filter(c => !c.matched).length <= 2) handleWin();
              }, 500);
          } else {
              setTimeout(() => {
                  setMemCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
                  setMemFlipped([]);
                  onLoseLife();
              }, 1000);
          }
      }
  };

  const handleBubbleClick = (id: number, val: number) => {
      if (val === nhTarget) {
          const left = nhBubbles.filter(b => b.id !== id);
          setNhBubbles(left);
          handleWin();
      } else {
          handleFail();
      }
  };

  // ---------------- RENDERERS ----------------

  const renderGameContent = () => {
    switch(gameType) {
        case AppScreen.TREASURE_HUNT:
            return (
                <div className="flex flex-col items-center w-full gap-6">
                    <div className="flex items-center gap-2 bg-yellow-100 p-4 rounded-full overflow-x-auto max-w-full">
                        {Array(thTarget + 1).fill(0).map((_, i) => (
                            <div key={i} className={`w-12 h-12 flex items-center justify-center rounded-lg text-2xl border-2 transition-all ${
                                i === thPlayerPos ? 'bg-white border-purple-500 scale-125 z-10' : 
                                i === thTarget ? 'bg-red-100 border-red-400' : 'bg-white/50 border-yellow-200'
                            }`}>
                                {i === thPlayerPos 
                                    ? renderIcon(thPlayerIcon)
                                    : (i === thTarget ? '🎁' : i)
                                }
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-lg border-b-8 border-purple-200 text-center">
                        <p className="text-gray-500 font-bold mb-4">Hazineye gitmek için kartlara bas!</p>
                        <div className="flex gap-4">
                            <button onClick={() => handleTreasureMove(1)} className="flex flex-col items-center bg-blue-100 p-4 rounded-xl border-b-4 border-blue-300 hover:bg-blue-200 active:border-b-0 active:translate-y-1">
                                <span className="text-4xl">⭐</span>
                                <span className="font-bold text-blue-800">1 Adım</span>
                            </button>
                            <button onClick={() => handleTreasureMove(2)} className="flex flex-col items-center bg-green-100 p-4 rounded-xl border-b-4 border-green-300 hover:bg-green-200 active:border-b-0 active:translate-y-1">
                                <span className="text-4xl">🐱</span>
                                <span className="font-bold text-green-800">2 Adım</span>
                            </button>
                            <button onClick={() => handleTreasureMove(3)} className="flex flex-col items-center bg-pink-100 p-4 rounded-xl border-b-4 border-pink-300 hover:bg-pink-200 active:border-b-0 active:translate-y-1">
                                <span className="text-4xl">🐦</span>
                                <span className="font-bold text-pink-800">3 Adım</span>
                            </button>
                        </div>
                    </div>
                </div>
            );

        case AppScreen.MEMORY_GAME:
            return (
                <div className="flex flex-col items-center gap-4">
                    {isMemoryPreview && (
                        <div className="text-2xl font-bold text-purple-600 animate-pulse bg-purple-100 px-6 py-2 rounded-full">
                            Ezberle: {previewTimer} saniye!
                        </div>
                    )}
                    <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-lg">
                        {memCards.map(card => (
                            <button
                                key={card.id}
                                onClick={() => handleCardClick(card.id)}
                                className={`w-16 h-20 md:w-20 md:h-24 rounded-xl flex items-center justify-center transition-all duration-300 transform overflow-hidden ${
                                    card.flipped || card.matched || isMemoryPreview
                                    ? 'bg-white border-4 border-purple-400 rotate-0' 
                                    : 'bg-purple-500 border-4 border-purple-700 rotate-y-180'
                                }`}
                            >
                                <div className="w-full h-full p-2 flex items-center justify-center text-4xl">
                                    {(card.flipped || card.matched || isMemoryPreview) ? renderIcon(card.icon) : '❓'}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            );

        case AppScreen.MISSING_SYMBOL:
            return (
                <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
                    <div className="flex gap-2 p-6 bg-white rounded-3xl shadow-lg border-4 border-orange-200 min-h-[120px] items-center justify-center w-full overflow-hidden">
                        {msShowPhase ? (
                            msSequence.map((s, i) => (
                                <div key={i} className="text-5xl animate-pop-in w-16 h-16 flex items-center justify-center">
                                    {renderIcon(s)}
                                </div>
                            ))
                        ) : (
                            msSequence.map((s, i) => (
                                <div key={i} className="text-5xl w-16 h-16 flex items-center justify-center">
                                    {i === msMissingIdx ? '❓' : renderIcon(s)}
                                </div>
                            ))
                        )}
                    </div>
                    
                    {!msShowPhase && (
                        <div className="flex gap-6 animate-fade-in flex-wrap justify-center">
                            {msOptions.map((opt, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => opt === msSequence[msMissingIdx!] ? handleWin() : handleFail()}
                                    className="bg-white p-4 rounded-2xl shadow-md border-b-4 border-gray-200 hover:scale-110 transition-transform text-5xl w-24 h-24 flex items-center justify-center overflow-hidden"
                                >
                                    {renderIcon(opt)}
                                </button>
                            ))}
                        </div>
                    )}
                    {msShowPhase && <p className="text-xl font-bold text-orange-500 animate-pulse">İyi bak, saklanacaklar! 👀</p>}
                </div>
            );

        case AppScreen.NUMBER_HUNTER:
            return (
                <div className="relative w-full h-[400px] bg-sky-100 rounded-3xl border-4 border-sky-300 overflow-hidden shadow-inner cursor-crosshair">
                     <div className="absolute top-2 left-2 bg-white px-4 py-2 rounded-full font-bold shadow-sm z-20">
                         Hedef: <span className="text-2xl text-red-500">{nhTarget}</span>
                     </div>
                     {nhBubbles.map(b => (
                         <button
                            key={b.id}
                            onClick={() => handleBubbleClick(b.id, b.val)}
                            className="absolute w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-3xl font-bold text-sky-700 transition-transform hover:scale-110 active:scale-95 border-2 border-white"
                            style={{ 
                                top: `${b.top}%`, 
                                left: `${b.left}%`, 
                                transition: 'top 0.1s linear, left 0.1s linear'
                            }}
                         >
                             {b.val}
                         </button>
                     ))}
                </div>
            );

        case AppScreen.DETECTIVE_GAME:
            if (!detEq) return null;
            return (
                <div className="flex flex-col items-center gap-8 bg-white p-8 rounded-3xl shadow-xl border-4 border-teal-100 w-full max-w-lg">
                    <div className="flex items-center gap-4 text-4xl md:text-5xl h-24">
                        <div className="w-16 h-16">{renderIcon(detEq.icon)}</div>
                        <span>+</span>
                        <div className="w-16 h-16">{renderIcon(detEq.icon)}</div>
                        <span>=</span>
                        <span className="font-bold text-teal-600">{detEq.result}</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100"></div>
                    <div className="flex items-center gap-2">
                        <p className="text-gray-500 font-bold">O zaman</p> 
                        <div className="w-10 h-10 inline-block">{renderIcon(detEq.icon)}</div>
                        <p className="text-gray-500 font-bold">kaç eder?</p>
                    </div>
                    <div className="flex gap-4">
                        {detOptions.map(opt => (
                            <button
                                key={opt}
                                onClick={() => opt === (detEq.result / detEq.count) ? handleWin() : handleFail()}
                                className="w-20 h-20 rounded-2xl bg-teal-50 border-2 border-teal-200 text-3xl font-bold text-teal-700 hover:bg-teal-100 active:scale-95 shadow-sm"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            );

        case AppScreen.SHADOW_MATCH:
            return (
                <div className="flex flex-col items-center gap-8 w-full max-w-lg">
                    <div className="bg-white p-6 rounded-full shadow-inner border-4 border-gray-100 overflow-hidden w-48 h-48 md:w-64 md:h-64 flex items-center justify-center transform hover:scale-105 transition-transform">
                        <div className="w-full h-full filter brightness-0 contrast-200 mix-blend-multiply opacity-90 transition-all flex items-center justify-center text-6xl md:text-8xl">
                             {renderIcon(shTarget, "w-full h-full object-contain")}
                        </div>
                    </div>
                    <p className="font-bold text-gray-500 text-xl">Bu gölge kime ait?</p>
                    <div className="flex gap-4">
                        {shOptions.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => opt === shTarget ? handleWin() : handleFail()}
                                className="bg-white p-4 rounded-xl shadow-md border-b-4 border-gray-200 text-5xl hover:scale-110 transition-transform w-24 h-24 flex items-center justify-center overflow-hidden"
                            >
                                {renderIcon(opt)}
                            </button>
                        ))}
                    </div>
                </div>
            );

        default: return <div>Oyun Yükleniyor...</div>;
    }
  };

  // ---------------- MAIN RENDER ----------------
  
  if (lives <= 0) {
      return (
          <div className="flex flex-col items-center justify-center animate-pop-in text-center p-8 bg-white rounded-3xl shadow-xl border-4 border-red-100 mt-10">
              <div className="text-8xl mb-4">😿</div>
              <h2 className="text-4xl font-bold text-red-500 mb-2">Eyvah!</h2>
              <button onClick={onRestart} className="bg-yellow-400 hover:bg-yellow-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transition-transform hover:scale-105">
                  Tekrar Dene 🔄
              </button>
          </div>
      );
  }

  return (
    <div className="w-full flex flex-col items-center gap-6 p-2 max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
       <div className="w-full flex justify-between items-center bg-white/60 p-3 rounded-2xl">
           <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 text-xl font-bold text-white px-4 py-2 bg-purple-500 rounded-xl shadow-sm">
                 <span>🏆</span> Seviye {level}
             </div>
           </div>
           
           <div className="flex gap-1">
               {[...Array(3)].map((_, i) => (
                   <span key={i} className={`text-2xl transition-all ${i < lives ? 'opacity-100 scale-100' : 'opacity-20 grayscale scale-75'}`}>❤️</span>
               ))}
           </div>
       </div>

       {/* Game Area */}
       <div className="flex-grow flex items-center justify-center w-full min-h-[400px]">
           {renderGameContent()}
       </div>

       {/* Feedback Overlay */}
       {feedback === 'success' && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
               <div className="text-9xl animate-bounce drop-shadow-2xl">🌟</div>
           </div>
       )}
       {feedback === 'error' && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
               <div className="text-9xl animate-shake drop-shadow-2xl">❌</div>
           </div>
       )}
    </div>
  );
};

export default MiniGamesArena;