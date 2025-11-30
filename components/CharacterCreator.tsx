import React, { useState } from 'react';
import { CharacterState, CharacterType, SavedCharacter } from '../types';
import { COLORS_MAP, COLOR_HEX_MAP } from '../constants';
import { generateCharacterImage } from '../services/geminiService';

interface Props {
  character: CharacterState;
  updateCharacter: (updates: Partial<CharacterState>) => void;
  onSaveToPool: (char: SavedCharacter) => void;
}

const CharacterCreator: React.FC<Props> = ({ character, updateCharacter, onSaveToPool }) => {
  const [loading, setLoading] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setHasSaved(false);
    const url = await generateCharacterImage(character.type, character.color, character.accessory);
    if (url) {
      updateCharacter({ generatedImageUrl: url });
      
      // Automatically save to pool for the game
      onSaveToPool({
          id: Date.now().toString(),
          imageUrl: url,
          type: character.type,
          color: character.color
      });
      setHasSaved(true);
    }
    setLoading(false);
  };

  if (character.generatedImageUrl) {
      return (
          <div className="flex flex-col items-center gap-6 animate-pop-in">
              <h2 className="text-3xl font-bold text-purple-600">İşte Karakterin!</h2>
              <p className="text-gray-500">Bu karakter "Şifre Oyunu" havuzuna eklendi! 🎉</p>
              
              <div className="p-4 bg-white rounded-3xl shadow-xl rotate-1 hover:rotate-0 transition-transform relative">
                  <img src={character.generatedImageUrl} alt="Generated" className="rounded-2xl max-h-[400px] object-cover" />
                  {hasSaved && <div className="absolute top-2 right-2 text-4xl animate-bounce">⭐</div>}
              </div>
              
              <div className="flex gap-4">
                  <button onClick={() => { 
                      updateCharacter({ generatedImageUrl: undefined });
                      setHasSaved(false);
                  }} className="bg-yellow-400 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg hover:bg-yellow-500">
                      Yenisini Yap
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="w-full max-w-4xl flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-700">Hayalindeki Arkadaşı Tasarla!</h2>
        <p className="text-gray-500 text-lg mt-2">Hangi hayvan olsun? Rengi ne olsun?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Controls */}
        <div className="flex flex-col gap-6 bg-white p-6 rounded-3xl shadow-lg">
            
            {/* Animal Type */}
            <div>
                <h3 className="text-xl font-bold text-purple-500 mb-3">1. Hayvan Seç</h3>
                <div className="flex flex-wrap gap-2">
                    {Object.values(CharacterType).map((t) => (
                        <button
                            key={t}
                            onClick={() => updateCharacter({ type: t })}
                            className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${character.type === t ? 'bg-purple-500 text-white border-purple-500' : 'bg-gray-100 text-gray-600 border-transparent'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color */}
            <div>
                <h3 className="text-xl font-bold text-purple-500 mb-3">2. Renk Seç (1-9)</h3>
                <div className="grid grid-cols-5 gap-3">
                    {Object.entries(COLORS_MAP).map(([num, color]) => (
                        <button
                            key={num}
                            onClick={() => updateCharacter({ color: color })}
                            className={`w-12 h-12 rounded-full border-4 shadow-sm transition-transform hover:scale-110 flex items-center justify-center text-white font-bold ${character.color === color ? 'border-gray-800 scale-110' : 'border-white'}`}
                            style={{ backgroundColor: COLOR_HEX_MAP[color] }}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

             {/* Accessory */}
             <div>
                <h3 className="text-xl font-bold text-purple-500 mb-3">3. Aksesuar Ekle</h3>
                <input 
                    type="text" 
                    value={character.accessory} 
                    onChange={(e) => updateCharacter({ accessory: e.target.value })}
                    placeholder="Örn: Şapka, Gözlük..."
                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none text-lg bg-gray-50"
                />
            </div>
        </div>

        {/* Right Column: Preview & Action */}
        <div className="flex flex-col items-center justify-center gap-6 bg-white p-6 rounded-3xl shadow-lg min-h-[300px] border-4 border-dashed border-gray-200">
             <div className="text-center">
                 <div className="text-8xl mb-4 transition-all duration-500" style={{ color: COLOR_HEX_MAP[character.color] }}>
                    {character.type === CharacterType.CAT && '🐱'}
                    {character.type === CharacterType.DOG && '🐶'}
                    {character.type === CharacterType.BIRD && '🐦'}
                    {character.type === CharacterType.FISH && '🐟'}
                    {character.type === CharacterType.DINOSAUR && '🦖'}
                    {character.type === CharacterType.ELEPHANT && '🐘'}
                 </div>
                 <p className="text-2xl font-bold text-gray-700">
                    {character.color} {character.type}
                 </p>
                 <p className="text-gray-500">{character.accessory ? `+ ${character.accessory}` : ''}</p>
             </div>

             <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-2xl text-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
             >
                 {loading ? 'Sihir Yapılıyor... ✨' : 'Oluştur! ✨'}
             </button>
             <p className="text-xs text-gray-400">Sesli komut: "Kırmızı fil yap"</p>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;