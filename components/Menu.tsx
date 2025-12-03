import React, { useMemo } from 'react';
import { AppScreen } from '../types';

interface MenuProps {
  onNavigate: (screen: AppScreen) => void;
}

const Menu: React.FC<MenuProps> = ({ onNavigate }) => {
  const coreItems = [
    { label: 'Karakter Yap', screen: AppScreen.CHARACTER_CREATOR, color: 'bg-orange-500', icon: '🎨' },
    { label: 'Boyama', screen: AppScreen.PAINTING, color: 'bg-green-500', icon: '🖌️' },
    { label: 'Şifre Çöz', screen: AppScreen.CIPHER_GAME, color: 'bg-blue-500', icon: '🔐' },
    { label: 'Örüntü', screen: AppScreen.PATTERN_GAME, color: 'bg-purple-500', icon: '🧩' },
  ];

  const gameItems = [
    { label: 'Hazine Avı', screen: AppScreen.TREASURE_HUNT, color: 'bg-yellow-500', icon: '🗺️' },
    { label: 'Hafıza', screen: AppScreen.MEMORY_GAME, color: 'bg-pink-500', icon: '🧠' },
    { label: 'Kayıp Sembol', screen: AppScreen.MISSING_SYMBOL, color: 'bg-red-500', icon: '❓' },
    { label: 'Sayı Avcısı', screen: AppScreen.NUMBER_HUNTER, color: 'bg-indigo-500', icon: '🔢' },
    { label: 'Dedektif', screen: AppScreen.DETECTIVE_GAME, color: 'bg-teal-500', icon: '🕵️' },
    { label: 'Gölge Bul', screen: AppScreen.SHADOW_MATCH, color: 'bg-gray-600', icon: '🌑' },
  ];

  // Animated background items (lighter opacity for menu)
  const bgItems = useMemo(() => {
    const icons = ['⭐', '🌈', '🎨', '🧩', '🐱', '🚀', '🍩', '🎈'];
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      icon: icons[Math.floor(Math.random() * icons.length)],
      left: `${Math.random() * 100}%`,
      delay: `${-(Math.random() * 20)}s`, 
      duration: `${20 + Math.random() * 15}s`,
      size: `${2 + Math.random() * 3}rem`,
      color: ['text-pink-300', 'text-blue-300', 'text-yellow-300', 'text-green-300'][Math.floor(Math.random() * 4)]
    }));
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center animate-fade-in relative overflow-hidden py-4">
       
       {/* Background Animation Layer */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          {bgItems.map((item) => (
            <div 
                key={item.id}
                className={`absolute animate-float-up opacity-30 select-none ${item.color}`}
                style={{
                    left: item.left,
                    fontSize: item.size,
                    animationDelay: item.delay,
                    animationDuration: item.duration,
                    top: '100%'
                }}
            >
                {item.icon}
            </div>
          ))}
       </div>

       <div className="text-center mb-6 z-10">
         <h2 className="text-4xl font-black text-purple-700 mb-2 drop-shadow-sm">Oyun Zamanı!</h2>
         <p className="text-xl text-gray-700 font-bold">Hadi bir oyun seçelim.</p>
       </div>

       <div className="w-full max-w-5xl z-10 flex flex-col gap-6 overflow-y-auto pb-10 px-4 scroll-smooth">
          
          {/* Main Activities */}
          <div>
            <h3 className="text-purple-800 font-bold mb-3 flex items-center gap-2"><span className="text-2xl">🌟</span> Ana Atölye</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {coreItems.map((item) => (
                    <button
                    key={item.label}
                    onClick={() => onNavigate(item.screen)}
                    className={`${item.color} text-white font-bold p-4 rounded-3xl shadow-[0_6px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[6px] transition-all flex flex-col items-center justify-center gap-2 hover:brightness-110 h-32 md:h-40`}
                    >
                        <span className="text-4xl md:text-5xl filter drop-shadow-md transform group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="text-lg md:text-xl">{item.label}</span>
                    </button>
                ))}
            </div>
          </div>

          {/* Mini Games */}
          <div>
            <h3 className="text-purple-800 font-bold mb-3 flex items-center gap-2"><span className="text-2xl">🎮</span> Mini Oyunlar</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gameItems.map((item) => (
                    <button
                    key={item.label}
                    onClick={() => onNavigate(item.screen)}
                    className={`${item.color} text-white font-bold p-4 rounded-3xl shadow-[0_6px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[6px] transition-all flex flex-col items-center justify-center gap-2 hover:brightness-110 h-32`}
                    >
                        <span className="text-3xl md:text-4xl filter drop-shadow-md">{item.icon}</span>
                        <span className="text-md md:text-lg">{item.label}</span>
                    </button>
                ))}
            </div>
          </div>

       </div>
       
       <div className="mt-2 bg-white/70 backdrop-blur-sm p-3 rounded-2xl shadow-sm z-10 border-2 border-white">
         <p className="text-purple-800 font-bold text-sm flex items-center gap-2">
            🎤 <span className="italic">"Hazine avı aç" diyebilirsin!</span>
         </p>
       </div>
    </div>
  );
};

export default Menu;