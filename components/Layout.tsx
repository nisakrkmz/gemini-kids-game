import React from 'react';
import { AppScreen } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: AppScreen;
  onBack: () => void;
  avatarMood: 'happy' | 'sad' | 'neutral';
  score: number;
  isMuted: boolean;
  onToggleMute: () => void;
  isMicOn: boolean;
  onToggleMic: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentScreen, 
  onBack, 
  avatarMood, 
  score, 
  isMuted, 
  onToggleMute,
  isMicOn,
  onToggleMic
}) => {
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
      <div className="sticky top-0 z-50 p-3 flex justify-between items-center bg-white/90 backdrop-blur-md shadow-sm rounded-b-3xl mx-2 mt-1 border-b-2 border-purple-100">
        
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
            
            {/* Back Button */}
            {currentScreen !== AppScreen.INTRO && currentScreen !== AppScreen.MENU && (
                <button 
                    onClick={onBack}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-full shadow-lg transform transition active:scale-95 flex items-center justify-center"
                    title="Geri"
                >
                    <span className="text-xl">🔙</span>
                </button>
            )}

            {/* Logo Placeholder (if on menu) */}
            {(currentScreen === AppScreen.INTRO || currentScreen === AppScreen.MENU) && (
                <div className="text-2xl mr-2">👾</div>
            )}
            
            {/* Score Display */}
            <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-300 ml-1">
                <span className="text-xl">⭐</span>
                <span className="font-bold text-yellow-700 text-lg">{score}</span>
            </div>
        </div>
        
        {/* Center: Title (Hidden on small screens) */}
        <div className="hidden md:block text-center flex-1">
            <h1 className="text-xl font-bold text-purple-600 tracking-wide drop-shadow-sm">
                RENKLİ ŞİFRELER
            </h1>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 md:gap-3">
            
            {/* Mic Toggle Button */}
            <button 
                onClick={onToggleMic}
                className={`p-2 rounded-full shadow-sm border-2 transition-all ${!isMicOn ? 'bg-red-100 border-red-400 text-red-500' : 'bg-blue-100 border-blue-400 text-blue-600'}`}
                title={isMicOn ? "Mikrofonu Kapat" : "Mikrofonu Aç"}
            >
                {isMicOn ? (
                    <span className="text-xl">🎙️</span>
                ) : (
                    <span className="text-xl opacity-50">🚫</span>
                )}
            </button>

            {/* Speaker Mute Button */}
            <button 
                onClick={onToggleMute}
                className={`p-2 rounded-full shadow-sm border-2 transition-all ${isMuted ? 'bg-gray-200 border-gray-400 text-gray-500' : 'bg-green-100 border-green-400 text-green-600'}`}
                title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
            >
                {isMuted ? (
                    <span className="text-xl">🔇</span>
                ) : (
                    <span className="text-xl">🔊</span>
                )}
            </button>

            {/* User Avatar */}
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-yellow-400 rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-md transition-transform hover:scale-110">
                {getAvatarEmoji()}
            </div>
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