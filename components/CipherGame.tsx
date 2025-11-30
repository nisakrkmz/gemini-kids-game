import React, { useState, useEffect, useCallback } from 'react';
import { SavedCharacter, CharacterType, CharacterColor } from '../types';
import { COLOR_HEX_MAP } from '../constants';

interface Props {
  characterPool: SavedCharacter[];
  lives: number;
  level: number;
  onWin: () => void;
  onLoseLife: () => void;
  onRestart: () => void;
}

interface GameCharacter {
  id: string;
  visual: string; // URL or Emoji
  isUrl: boolean;
  assignedNumber: number; // The number assigned in the Legend
  bgColor: string;
}

const DEFAULT_EMOJIS = [
    { type: CharacterType.CAT, emoji: '🐱', color: CharacterColor.ORANGE },
    { type: CharacterType.DOG, emoji: '🐶', color: CharacterColor.BROWN },
    { type: CharacterType.BIRD, emoji: '🐦', color: CharacterColor.BLUE },
    { type: CharacterType.FISH, emoji: '🐠', color: CharacterColor.YELLOW },
    { type: CharacterType.DINOSAUR, emoji: '🦖', color: CharacterColor.GREEN },
    { type: CharacterType.ELEPHANT, emoji: '🐘', color: CharacterColor.PURPLE },
    { type: CharacterType.CAT, emoji: '🦄', color: CharacterColor.PINK },
    { type: CharacterType.DOG, emoji: '🐼', color: CharacterColor.BLACK },
];

const CipherGame: React.FC<Props> = ({ characterPool, lives, level, onWin, onLoseLife, onRestart }) => {
  const [legend, setLegend] = useState<GameCharacter[]>([]); // The "Key" (Top)
  const [question, setQuestion] = useState<GameCharacter[]>([]); // The "Question" (Middle)
  const [input, setInput] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [errorShake, setErrorShake] = useState(false);

  // Generate a new level
  const generateLevel = useCallback(() => {
    // 1. Prepare available characters (Mix Custom + Default)
    const availableChars: {id: string, visual: string, isUrl: boolean, bgColor: string}[] = [];
    
    // Add User Characters
    characterPool.forEach(c => {
        availableChars.push({
            id: `pool-${c.id}`,
            visual: c.imageUrl,
            isUrl: true,
            bgColor: COLOR_HEX_MAP[c.color]
        });
    });

    // Add Default Characters (Ensure we have enough variety)
    DEFAULT_EMOJIS.forEach((c, idx) => {
        availableChars.push({
            id: `def-${idx}`,
            visual: c.emoji,
            isUrl: false,
            bgColor: COLOR_HEX_MAP[c.color] || '#FFF'
        });
    });

    // Shuffle Available Characters
    const shuffledAvailable = [...availableChars].sort(() => 0.5 - Math.random());

    // 2. Create Legend (Key) - Select 4-5 items
    const legendSize = Math.min(5, Math.max(3, level + 1));
    const selectedForLegend = shuffledAvailable.slice(0, legendSize);
    
    // Assign unique random numbers (1-9) to the legend items
    const availableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => 0.5 - Math.random());
    
    const newLegend: GameCharacter[] = selectedForLegend.map((char, index) => ({
        ...char,
        assignedNumber: availableNumbers[index]
    }));

    setLegend(newLegend);

    // 3. Create Question - Select `level + 1` items FROM THE LEGEND
    const questionLength = Math.min(4, Math.ceil(level / 2) + 1);
    const newQuestion: GameCharacter[] = [];
    
    for(let i=0; i<questionLength; i++) {
        const randomLegendItem = newLegend[Math.floor(Math.random() * newLegend.length)];
        // Create a copy so we don't reference the same object instance if needed (though stateless here)
        newQuestion.push(randomLegendItem);
    }

    setQuestion(newQuestion);
    setInput('');
  }, [level, characterPool]);

  // Initial Load
  useEffect(() => {
    generateLevel();
  }, [generateLevel]);

  const handleNumClick = (num: string) => {
      if (input.length < question.length) {
          setInput(prev => prev + num);
      }
  };

  const handleClear = () => setInput('');

  const checkAnswer = () => {
      const targetCode = question.map(q => q.assignedNumber).join('');
      
      if (input === targetCode) {
          setShowConfetti(true);
          setTimeout(() => {
              setShowConfetti(false);
              onWin(); // Logic to increase level in parent
          }, 1500);
      } else {
          setErrorShake(true);
          onLoseLife(); // Logic to decrease life
          setInput('');
          setTimeout(() => setErrorShake(false), 500);
      }
  };

  // --- GAME OVER SCREEN ---
  if (lives <= 0) {
      return (
          <div className="flex flex-col items-center justify-center w-full h-full animate-pop-in">
              <div className="text-8xl mb-4">😿</div>
              <h2 className="text-4xl font-bold text-red-500 mb-2">Oyun Bitti!</h2>
              <p className="text-xl text-gray-600 mb-8">Üzülme, tekrar deneyelim mi?</p>
              
              <button 
                onClick={onRestart}
                className="bg-green-500 hover:bg-green-600 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                  Tekrar Oyna 🔄
              </button>
          </div>
      );
  }

  return (
    <div className="w-full flex flex-col items-center gap-6 p-2 md:p-4 max-w-6xl">
       {showConfetti && (
           <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
               <div className="text-8xl animate-bounce">🎉 DOĞRU! 🎉</div>
           </div>
       )}

        {/* HEADER: Level & Lives */}
       <div className="w-full flex justify-between items-center bg-white/60 p-3 rounded-2xl mb-2">
           <div className="text-xl font-bold text-purple-600 px-4 py-2 bg-white rounded-xl shadow-sm">
               Seviye {level}
           </div>
           <div className="flex gap-1">
               {[...Array(3)].map((_, i) => (
                   <span key={i} className={`text-3xl transition-all ${i < lives ? 'scale-100 opacity-100' : 'scale-75 opacity-20 grayscale'}`}>
                       ❤️
                   </span>
               ))}
           </div>
       </div>

       {/* --- TOP: THE LEGEND (Cipher Key) --- */}
       <div className="w-full bg-white p-4 md:p-6 rounded-3xl shadow-lg flex flex-col items-center relative overflow-hidden border-4 border-purple-100">
           <div className="absolute top-0 left-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-br-xl z-10">
               ANAHTAR TABLOSU 🗝️
           </div>
           
           <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 pt-4">
               {legend.map((char) => (
                   <div key={char.id} className="flex flex-col items-center gap-2 group">
                       {/* Character Image */}
                       <div 
                         className="w-16 h-16 md:w-24 md:h-24 rounded-xl border-2 border-gray-100 shadow-sm flex items-center justify-center overflow-hidden bg-white"
                         style={{ backgroundColor: char.isUrl ? char.bgColor : '#f9fafb' }}
                       >
                           {char.isUrl ? (
                               <img src={char.visual} alt="char" className="w-full h-full object-cover" />
                           ) : (
                               <span className="text-4xl md:text-5xl select-none">{char.visual}</span>
                           )}
                       </div>
                       
                       {/* Assigned Number */}
                       <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-purple-200">
                           {char.assignedNumber}
                       </div>
                   </div>
               ))}
           </div>
       </div>

       {/* --- MIDDLE: THE QUESTION & INPUT (Black Box) --- */}
       <div className={`w-full max-w-2xl bg-gray-900 p-6 md:p-8 rounded-3xl shadow-2xl border-b-8 border-gray-700 flex flex-col items-center gap-6 relative ${errorShake ? 'animate-shake' : ''}`}>
           
           <div className="absolute top-4 left-4 text-gray-500 text-xs font-mono tracking-widest">GÖREV: ŞİFREYİ ÇÖZ</div>

           {/* The Question Sequence */}
           <div className="flex gap-3 md:gap-4 items-center justify-center bg-gray-800/50 p-4 rounded-2xl w-full">
               {question.map((qChar, idx) => (
                   <div key={idx} className="flex flex-col items-center animate-pop-in" style={{ animationDelay: `${idx * 150}ms` }}>
                       <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl flex items-center justify-center overflow-hidden border-4 border-gray-600 shadow-lg">
                           {qChar.isUrl ? (
                               <img src={qChar.visual} alt="q" className="w-full h-full object-cover" />
                           ) : (
                               <span className="text-5xl">{qChar.visual}</span>
                           )}
                       </div>
                       {/* Connection Line */}
                       <div className="h-4 w-1 bg-gray-600"></div>
                   </div>
               ))}
           </div>

           {/* The Input Display */}
           <div className="flex items-center gap-2 md:gap-4">
                {question.map((_, idx) => (
                    <div key={idx} className={`w-14 h-16 md:w-16 md:h-20 rounded-lg flex items-center justify-center text-4xl font-mono font-bold transition-all ${input[idx] ? 'bg-green-900 text-green-400 border-2 border-green-500 shadow-[0_0_15px_rgba(74,222,128,0.3)]' : 'bg-gray-800 border-2 border-gray-600 text-gray-600'}`}>
                        {input[idx] || '_'}
                    </div>
                ))}
           </div>

       </div>

       {/* --- BOTTOM: KEYPAD --- */}
       <div className="w-full max-w-md grid grid-cols-3 gap-3 p-4 bg-yellow-100/50 rounded-3xl">
           {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
               <button
                 key={num}
                 onClick={() => handleNumClick(num.toString())}
                 className="aspect-square bg-white hover:bg-white text-gray-800 font-bold text-4xl rounded-2xl shadow-[0_4px_0_rgb(0,0,0,0.1)] active:shadow-none active:translate-y-[4px] transition-all border-2 border-yellow-200 hover:border-yellow-400 flex items-center justify-center"
               >
                   {num}
               </button>
           ))}
           
           <div className="col-span-3 grid grid-cols-2 gap-3 mt-2">
               <button onClick={handleClear} className="bg-red-400 text-white font-bold py-4 rounded-2xl shadow-[0_4px_0_#991B1B] active:shadow-none active:translate-y-[4px] text-xl">
                   SİL ❌
               </button>
               <button onClick={checkAnswer} className="bg-green-500 text-white font-bold py-4 rounded-2xl shadow-[0_4px_0_#166534] active:shadow-none active:translate-y-[4px] text-xl">
                   TAMAM ✅
               </button>
           </div>
       </div>

    </div>
  );
};

export default CipherGame;