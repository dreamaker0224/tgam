import { useCallback, useEffect, useRef, useState } from 'react';
import { CakeGalleryModal } from './components/CakeGalleryModal';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { TitleScreen } from './components/TitleScreen';
import { patisserieAudio } from './game/audio';
import { CAKE_STYLES, loadPersistentData, savePersistentData } from './game/cakeCatalog';
import { PatisserieEngine } from './game/PatisserieEngine';
import { GameOverSummary, GameState, HudSnapshot, PersistentData } from './game/types';
import ambientBg from './assets/images/patisserie_ambient_bg_1794634998061.jpg';

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  floor: 0,
  combo: 0,
  maxCombo: 0,
  currentCake: CAKE_STYLES[0],
  unlockedInRun: ['chiffon'],
  newUnlockBanner: null,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<PatisserieEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [gameOverSummary, setGameOverSummary] = useState<GameOverSummary | null>(null);
  const [saveData, setSaveData] = useState<PersistentData>(() => loadPersistentData());
  const [showGallery, setShowGallery] = useState(false);

  // Sync audio mute state on mount
  useEffect(() => {
    patisserieAudio.setMuted(saveData.isMuted);
  }, [saveData.isMuted]);

  const refreshSaveData = useCallback(() => {
    setSaveData(loadPersistentData());
  }, []);

  // Initialize isolated 60fps canvas engine once
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new PatisserieEngine(canvas, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onGameOver: (summary) => {
        setGameOverSummary(summary);
        setGameState('GAME_OVER');
        refreshSaveData();
      },
    });
    engineRef.current = engine;
    engine.startAmbientPreview();

    const resizeObserver = new ResizeObserver(() => {
      engine.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, [refreshSaveData]);

  const handleStartGame = useCallback(() => {
    setShowGallery(false);
    setGameOverSummary(null);
    setGameState('PLAYING');
    engineRef.current?.startNewGame();
  }, []);

  const handlePause = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    engineRef.current?.setPaused(true);
    setGameState('PAUSED');
  }, [gameState]);

  const handleResume = useCallback(() => {
    if (gameState !== 'PAUSED') return;
    setGameState('PLAYING');
    engineRef.current?.setPaused(false);
  }, [gameState]);

  const handleBackToTitle = useCallback(() => {
    setShowGallery(false);
    setGameOverSummary(null);
    setGameState('TITLE');
    engineRef.current?.startAmbientPreview();
    refreshSaveData();
  }, [refreshSaveData]);

  const handleToggleMute = useCallback(() => {
    setSaveData((prev) => {
      const nextMuted = !prev.isMuted;
      const next: PersistentData = { ...prev, isMuted: nextMuted };
      patisserieAudio.setMuted(nextMuted);
      savePersistentData(next);
      return next;
    });
  }, []);

  // Edge-triggered keyboard controls & auto-pause on window blur
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (showGallery) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowGallery(false);
        }
        return;
      }

      if (gameState === 'TITLE') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartGame();
        }
      } else if (gameState === 'PLAYING') {
        if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'Enter') {
          e.preventDefault();
          engineRef.current?.triggerDrop();
        } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          handlePause();
        }
      } else if (gameState === 'PAUSED') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          handleResume();
        }
      } else if (gameState === 'GAME_OVER') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartGame();
        }
      }
    };

    const handleBlur = () => {
      if (gameState === 'PLAYING') {
        engineRef.current?.setPaused(true);
        setGameState('PAUSED');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, showGallery, handleStartGame, handlePause, handleResume]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden flex items-center justify-center bg-[#241714] select-none">
      {/* Desktop Atmospheric French Patisserie Backdrop */}
      <div className="hidden md:block absolute inset-0 pointer-events-none">
        <img
          src={ambientBg}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-45 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#241714]/65 via-[#241714]/45 to-[#241714]/80" />
      </div>

      {/* Portrait Mobile Game Frame (Full-screen on mobile, centered 9:16 frame on desktop) */}
      <div
        ref={containerRef}
        className="relative w-full h-full md:w-[min(430px,54dvh)] md:h-[min(860px,94dvh)] md:rounded-[28px] md:border-[3px] md:border-[#3D2720] md:shadow-[0_24px_64px_rgba(12,6,4,0.75)] overflow-hidden bg-[#FDF8F0]"
      >
        {/* Isolated 60fps Game Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            if (gameState !== 'PLAYING') return;
            e.preventDefault();
            engineRef.current?.triggerDrop();
          }}
          className="block w-full h-full touch-none cursor-pointer"
        />

        {/* Active Gameplay HUD */}
        {gameState === 'PLAYING' && (
          <GameHUD
            hud={hud}
            isMuted={saveData.isMuted}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
          />
        )}

        {/* Title Screen */}
        {gameState === 'TITLE' && (
          <div className="absolute inset-0 z-20">
            <TitleScreen
              bestScore={saveData.bestScore}
              bestFloor={saveData.bestFloor}
              unlockedCount={saveData.unlockedCakes.length}
              totalCakes={CAKE_STYLES.length}
              isMuted={saveData.isMuted}
              onStart={handleStartGame}
              onOpenGallery={() => setShowGallery(true)}
              onToggleMute={handleToggleMute}
            />
          </div>
        )}

        {/* Pause Modal */}
        {gameState === 'PAUSED' && (
          <PauseModal
            score={hud.score}
            floor={hud.floor}
            onResume={handleResume}
            onRestart={handleStartGame}
            onBackToTitle={handleBackToTitle}
          />
        )}

        {/* Game Over Summary Modal */}
        {gameState === 'GAME_OVER' && gameOverSummary && (
          <GameOverModal
            summary={gameOverSummary}
            onPlayAgain={handleStartGame}
            onOpenGallery={() => {
              refreshSaveData();
              setShowGallery(true);
            }}
            onBackToTitle={handleBackToTitle}
          />
        )}

        {/* Cake Gallery Drawer/Modal */}
        {showGallery && (
          <CakeGalleryModal
            unlockedCakes={saveData.unlockedCakes}
            onClose={() => setShowGallery(false)}
          />
        )}
      </div>
    </main>
  );
}
