import React from 'react';
import { AppScreen } from '../types';

interface MenuProps {
  onNavigate: (screen: AppScreen) => void;
}

const Menu: React.FC<MenuProps> = ({ onNavigate }) => {
  const menuItems = [
    { label: 'Karakter Yap', screen: AppScreen.CHARACTER_CREATOR, color: 'bg-orange-400', icon: '🎨' },
    { label: 'Boyama', screen: AppScreen.PAINTING, color: 'bg-green-400', icon: '🖌️' },
    { label: 'Şifre Oyunu', screen: AppScreen.CIPHER_GAME, color: 'bg-blue-400', icon: '🔐' },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8 animate-fade-in">
       <div className="text-center mb-8">
         <h2 className="text-4xl font-bold text-purple-700 mb-4">Hoş Geldin!</h2>
         <p className="text-xl text-gray-600">Ne yapmak istersin?</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.screen)}
              className={`${item.color} text-white text-3xl font-bold p-8 rounded-3xl shadow-[0_10px_0_rgb(0,0,0,0.15)] active:shadow-[0_4px_0_rgb(0,0,0,0.15)] active:translate-y-[6px] transition-all flex flex-col items-center gap-4 hover:brightness-110`}
            >
              <span className="text-6xl filter drop-shadow-md">{item.icon}</span>
              {item.label}
            </button>
          ))}
       </div>
       
       <div className="mt-8 bg-white/50 p-4 rounded-xl">
         <p className="text-gray-500 text-lg flex items-center gap-2">
            🎤 <span className="italic">"Boyama yapmak istiyorum" diyebilirsin!</span>
         </p>
       </div>
    </div>
  );
};

export default Menu;