import React, { useState, useMemo } from 'react';
import Layout from './components/Layout';
import Menu from './components/Menu';
import CharacterCreator from './components/CharacterCreator';
import DrawingArea from './components/DrawingArea';
import GameArena from './components/CipherGame';
import MiniGamesArena from './components/MiniGamesArena';
import VoiceController from './components/VoiceController';
import { AppScreen, GameState, CharacterType, CharacterColor, SavedCharacter } from './types';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  
  // State to communicate voice commands to DrawingArea
  const [activeDrawingShape, setActiveDrawingShape] = useState<string | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    currentScreen: AppScreen.MENU,
    character: {
      type: CharacterType.CAT,
      color: CharacterColor.ORANGE,
      accessory: '',
    },
    characterPool: [], // Starts empty, will fill up
    avatarMood: 'happy',
    gameLevel: 1,
    lives: 3,
    score: 0,
  });

  // Generate random background items for Splash Screen once
  const splashItems = useMemo(() => {
    // Removed Unicorn ('🦄') from this list
    const icons = ['❓', '🗝️', '🔒', '⭐', '🧩', '🎨', '1', 'A', '🌈', '🎲', '🚀', '🍩'];
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      icon: icons[Math.floor(Math.random() * icons.length)],
      left: `${Math.random() * 100}%`,
      // Negative delay ensures items are already mid-flight when screen loads
      delay: `${-(Math.random() * 20)}s`, 
      duration: `${15 + Math.random() * 15}s`,
      size: `${3 + Math.random() * 4}rem`, // Bigger icons
      color: ['text-pink-400', 'text-blue-400', 'text-yellow-400', 'text-purple-400', 'text-green-400', 'text-red-300'][Math.floor(Math.random() * 6)]
    }));
  }, []);

  const handleStartGame = async () => {
    // Create and resume AudioContext within the user gesture (click)
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 24000 });
      await ctx.resume();
      setAudioContext(ctx);
      setHasStarted(true);
    } catch (e) {
      console.error("Audio Context Init Failed", e);
      // Fallback: Start anyway, VoiceController might try to init its own (less reliable for autoplay)
      setHasStarted(true);
    }
  };

  // --- Actions Handlers ---

  const handleNavigate = (screen: AppScreen) => {
    // Reset game state when entering a game
    if (screen !== AppScreen.MENU) {
        setGameState(prev => ({ ...prev, currentScreen: screen, gameLevel: 1, lives: 3, score: 0 }));
    } else {
        setGameState(prev => ({ ...prev, currentScreen: screen }));
    }
  };

  const handleGoHome = () => {
    // Return to menu, keep score but maybe reset level or lives? 
    // For now, just change screen to MENU.
    setGameState(prev => ({ ...prev, currentScreen: AppScreen.MENU }));
  };

  const handleSaveCharacter = (newChar: SavedCharacter) => {
    setGameState(prev => ({
      ...prev,
      characterPool: [...prev.characterPool, newChar]
    }));
  };

  const handleLoseLife = () => {
    setGameState(prev => ({ ...prev, lives: Math.max(0, prev.lives - 1), avatarMood: 'sad' }));
  };

  const handleRestartGame = () => {
      setGameState(prev => ({ ...prev, lives: 3, gameLevel: 1, score: 0, avatarMood: 'happy' }));
  };

  const handleLevelUp = () => {
      setGameState(prev => ({ ...prev, gameLevel: prev.gameLevel + 1, score: prev.score + 10, avatarMood: 'happy' }));
  };

  const handleVoiceAction = (action: { type: string, payload: any }) => {
    switch (action.type) {
      case 'navigate':
        if (Object.values(AppScreen).includes(action.payload.screen)) {
           handleNavigate(action.payload.screen);
        }
        break;
      case 'updateCharacter':
        setGameState(prev => ({
          ...prev,
          currentScreen: AppScreen.CHARACTER_CREATOR,
          character: {
            ...prev.character,
            ...action.payload
          }
        }));
        break;
      case 'drawShape':
        // If not on painting screen, go there first
        if (gameState.currentScreen !== AppScreen.PAINTING) {
            handleNavigate(AppScreen.PAINTING);
            // Small delay to allow mount
            setTimeout(() => setActiveDrawingShape(action.payload.shape), 100);
        } else {
            setActiveDrawingShape(action.payload.shape);
        }
        break;
    }
  };

  // --- Render Current Screen ---
  const renderScreen = () => {
    switch (gameState.currentScreen) {
      case AppScreen.MENU:
        return <Menu onNavigate={handleNavigate} />;
      case AppScreen.CHARACTER_CREATOR:
        return (
          <CharacterCreator 
            character={gameState.character} 
            updateCharacter={(updates) => setGameState(prev => ({ ...prev, character: { ...prev.character, ...updates } }))}
            onSaveToPool={handleSaveCharacter}
          />
        );
      case AppScreen.PAINTING:
        return (
            <DrawingArea 
                voiceRequestedShape={activeDrawingShape} 
                onShapeHandled={() => setActiveDrawingShape(null)}
                onSaveToPool={handleSaveCharacter}
            />
        );
      case AppScreen.CIPHER_GAME:
        return (
          <GameArena 
            mode="DECODE"
            characterPool={gameState.characterPool}
            lives={gameState.lives}
            level={gameState.gameLevel}
            onWin={handleLevelUp}
            onLoseLife={handleLoseLife}
            onRestart={handleRestartGame}
          />
        );
      case AppScreen.PATTERN_GAME:
        return (
            <GameArena 
              mode="PATTERN"
              characterPool={gameState.characterPool}
              lives={gameState.lives}
              level={gameState.gameLevel}
              onWin={handleLevelUp}
              onLoseLife={handleLoseLife}
              onRestart={handleRestartGame}
            />
        );
      // NEW MINI GAMES
      case AppScreen.TREASURE_HUNT:
      case AppScreen.MEMORY_GAME:
      case AppScreen.MISSING_SYMBOL:
      case AppScreen.NUMBER_HUNTER:
      case AppScreen.DETECTIVE_GAME:
      case AppScreen.SHADOW_MATCH:
          return (
              <MiniGamesArena 
                gameType={gameState.currentScreen}
                characterPool={gameState.characterPool}
                lives={gameState.lives}
                level={gameState.gameLevel}
                onWin={handleLevelUp}
                onLoseLife={handleLoseLife}
                onRestart={handleRestartGame}
              />
          );

      case AppScreen.AVATAR_CREATOR:
        return <div>Avatar Creator (Coming Soon)</div>;
      default:
        return <div>Sayfa Bulunamadı</div>;
    }
  };

  // --- Splash Screen ---
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-300 via-purple-200 to-pink-200 flex flex-col items-center justify-center z-50 overflow-hidden">
        
        {/* Animated Background Items */}
        {splashItems.map((item) => (
            <div 
                key={item.id}
                className={`absolute animate-float-up opacity-60 select-none font-black ${item.color}`}
                style={{
                    left: item.left,
                    fontSize: item.size,
                    animationDelay: item.delay,
                    animationDuration: item.duration,
                    top: '100%' // Start below screen (animation moves it up)
                }}
            >
                {item.icon}
            </div>
        ))}

        <div className="relative z-10 w-full max-w-2xl px-4 flex flex-col items-center">
            
            {/* Main Glass Card - Made more compact (max-w-2xl and smaller padding) */}
            <div className="w-full bg-white/40 backdrop-blur-xl border-8 border-white/60 rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.1)] flex flex-col items-center text-center transform hover:scale-[1.01] transition-transform duration-500">
                
                {/* Logo Area - Slightly smaller */}
                <div className="mb-4 relative group cursor-pointer">
                    <div className="absolute inset-0 bg-yellow-300 blur-3xl opacity-60 rounded-full animate-pulse"></div>
                    <div className="relative z-10 bg-white p-5 rounded-full shadow-lg border-4 border-yellow-400 text-6xl md:text-7xl transform group-hover:rotate-12 transition-transform duration-300">
                        👾
                    </div>
                    <div className="absolute -right-3 -top-3 text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🗝️</div>
                    <div className="absolute -left-3 -bottom-3 text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎨</div>
                </div>
                
                {/* Title - Smaller Font */}
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-red-500 mb-2 drop-shadow-sm leading-tight tracking-tight">
                    RENKLİ<br/>
                    <span className="text-3xl md:text-5xl">ŞİFRELER DÜNYASI</span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-700 font-bold mb-6 tracking-wide opacity-80">
                    Hayal Et • Boya • Oyna
                </p>

                {/* Info Card about Voice - More compact */}
                <div className="bg-white/90 p-4 rounded-3xl border-4 border-purple-300 shadow-xl mb-6 max-w-full transform -rotate-1 hover:rotate-0 transition-transform">
                    <div className="flex items-center justify-center gap-2 mb-1">
                         <span className="text-3xl">👋</span>
                         <h3 className="text-xl font-bold text-purple-700">Merhaba Arkadaşım!</h3>
                    </div>
                    <p className="text-gray-600 text-base font-medium leading-relaxed">
                        Seninle konuşmak ve oyun oynamak istiyorum. <br/>
                        Mikrofonu açmak için aşağıdaki <br/>
                        <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded-lg inline-block mt-1">YEŞİL BUTONA BAS</span> yeterli!
                    </p>
                </div>

                {/* Big Action Button - Adjusted padding */}
                <button 
                onClick={handleStartGame}
                className="group relative bg-gradient-to-b from-green-400 to-green-600 text-white py-4 px-10 md:px-14 rounded-full shadow-[0_8px_0_#15803d] hover:shadow-[0_12px_0_#15803d] hover:-translate-y-2 active:shadow-none active:translate-y-4 transition-all overflow-hidden w-full md:w-auto"
                >
                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <span className="text-2xl md:text-3xl font-black flex items-center gap-2 drop-shadow-md">
                           OYUNA BAŞLA 
                        </span>
                        <span className="text-sm md:text-base font-bold text-green-100 bg-green-700/30 px-3 py-1 rounded-full mt-1 flex items-center gap-1">
                           & GEMINI İLE KONUŞ 🎙️
                        </span>
                    </div>
                    
                    {/* Shine Effect */}
                    <div className="absolute top-0 -left-full w-full h-full bg-white/30 skew-x-12 group-hover:animate-[shine_1s_infinite]"></div>
                </button>
                
            </div>
        </div>

        {/* CSS for button shine if needed, or rely on existing styles */}
        <style>{`
            @keyframes shine {
                100% { left: 125%; }
            }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Layout 
        currentScreen={gameState.currentScreen} 
        onBack={() => handleNavigate(AppScreen.MENU)}
        avatarMood={gameState.avatarMood}
        score={gameState.score}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        isMicOn={isMicOn}
        onToggleMic={() => setIsMicOn(!isMicOn)}
      >
        {renderScreen()}
      </Layout>
      
      {/* Voice Brain */}
      {audioContext && (
        <VoiceController 
          onAction={handleVoiceAction} 
          gameState={gameState} 
          audioContext={audioContext}
          isMuted={isMuted}
          isMicOn={isMicOn}
        />
      )}
    </>
  );
};

export default App;