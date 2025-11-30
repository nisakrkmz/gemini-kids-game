import React from 'react';
import { AppScreen } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: AppScreen;
  onBack: () => void;
  avatarMood: 'happy' | 'sad' | 'neutral';
}

const Layout: React.FC<LayoutProps> = ({ children, currentScreen, onBack, avatarMood }) => {
  const getAvatarEmoji = () => {
    switch(avatarMood) {
      case 'happy': return '🤩';
      case 'sad': return '😢';
      default: return '🙂';
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-yellow-50 text-gray-800 font-fredoka selection:bg-purple-200">
      
      {/* Decorative Blobs */}
      <div className="blob bg-pink-300 w-64 h-64 rounded-full top-0 left-0 mix-blend-multiply opacity-30 animate-pulse"></div>
      <div className="blob bg-blue-300 w-64 h-64 rounded-full bottom-0 right-0 mix-blend-multiply opacity-30 animate-bounce"></div>

      {/* Header / Sticky Top */}
      <div className="sticky top-0 z-50 p-4 flex justify-between items-center bg-white/80 backdrop-blur-sm shadow-sm rounded-b-3xl mx-2 mt-2">
        {currentScreen !== AppScreen.INTRO && currentScreen !== AppScreen.MENU && (
           <button 
             onClick={onBack}
             className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition active:scale-95 flex items-center gap-2"
           >
             <span className="text-2xl">🔙</span>
             <span className="text-lg">Geri</span>
           </button>
        )}
        
        <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-purple-600 tracking-wide drop-shadow-sm">
                RENKLİ ŞİFRELER
            </h1>
        </div>

        {/* User Avatar */}
        <div className="w-16 h-16 bg-white border-4 border-yellow-400 rounded-full flex items-center justify-center text-4xl shadow-md transition-transform hover:scale-110">
            {getAvatarEmoji()}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 w-full max-w-5xl mx-auto z-10">
        {children}
      </main>

    </div>
  );
};

export default Layout;
