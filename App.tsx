import React, { useState } from 'react';
import Layout from './components/Layout';
import Menu from './components/Menu';
import CharacterCreator from './components/CharacterCreator';
import DrawingArea from './components/DrawingArea';
import CipherGame from './components/CipherGame';
import VoiceController from './components/VoiceController';
import { AppScreen, GameState, CharacterType, CharacterColor, SavedCharacter } from './types';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
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
    setGameState(prev => ({ ...prev, currentScreen: screen }));
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
            />
        );
      case AppScreen.CIPHER_GAME:
        return (
          <CipherGame 
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
      <div className="fixed inset-0 bg-yellow-100 flex flex-col items-center justify-center z-50 p-4">
        <div className="blob bg-purple-300 w-96 h-96 rounded-full absolute mix-blend-multiply opacity-50 animate-pulse"></div>
        <h1 className="text-5xl md:text-7xl font-bold text-purple-600 mb-8 text-center drop-shadow-md relative z-10">
          Renkli Şifreler<br/>Dünyası
        </h1>
        <button 
          onClick={handleStartGame}
          className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-4xl font-bold py-8 px-16 rounded-full shadow-[0_10px_0_rgb(0,0,0,0.2)] hover:scale-105 active:scale-95 active:shadow-none transition-all relative z-10"
        >
          OYUNA BAŞLA! ▶
        </button>
        <p className="mt-8 text-gray-500 text-lg relative z-10">Mikrofon izni isteyecektir 🎤</p>
      </div>
    );
  }

  return (
    <>
      <Layout 
        currentScreen={gameState.currentScreen} 
        onBack={() => handleNavigate(AppScreen.MENU)}
        avatarMood={gameState.avatarMood}
      >
        {renderScreen()}
      </Layout>
      
      {/* Voice Brain */}
      {audioContext && (
        <VoiceController 
          onAction={handleVoiceAction} 
          gameState={gameState} 
          audioContext={audioContext}
        />
      )}
    </>
  );
};

export default App;