import React, { useEffect, useState } from "react";
import AppHeader from "./components/AppHeader.tsx";
import FinalResultsOverlay from "./components/FinalResultsOverlay.tsx";
import MiniMap from "./components/MiniMap.tsx";
import ModeSelectOverlay from "./components/ModeSelectOverlay.tsx";
import ResultPanel from "./components/ResultPanel.tsx";
import SettingsPanel from "./components/SettingsPanel.tsx";
import StreetView from "./components/StreetView.tsx";
import { useGameSession } from "./hooks/useGameSession.ts";
import { useLeaderboard } from "./hooks/useLeaderboard.ts";
import { useYandexMaps } from "./hooks/useYandexMaps.ts";
import type { Language } from "./lib/gameTypes.ts";
import { LEADERBOARD_TEXT, UI_TEXT } from "./lib/uiText.ts";

const App = () => {
  const [language, setLanguage] = useState<Language>("ru");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const t = UI_TEXT[language];
  const leaderboardText = LEADERBOARD_TEXT[language];

  const { ymapsApi, streetViewService, placesService, isMapReady, error, setError } = useYandexMaps(t.error);
  const {
    gameMode,
    gameState,
    targetLocation,
    targetPanorama,
    guessLocation,
    distance,
    score,
    totalXP,
    currentRound,
    roundHistory,
    shareFeedback,
    loadingMessage,
    isFinalRound,
    averageScore,
    totalDistance,
    bestRound,
    setGuessLocation,
    startGame,
    confirmGuess,
    goToNextRound,
    showFinalResults,
    resetSession,
    shareResults,
    syncLoadingMessage,
  } = useGameSession({
    uiText: t,
    streetViewService,
    placesService,
    setExternalError: setError,
  });
  const {
    playerName,
    leaderboard,
    leaderboardError,
    saveResultFeedback,
    isSubmittingResult,
    isLoadingLeaderboard,
    savedGameId,
    setPlayerName,
    resetLeaderboardState,
    loadLeaderboard,
    saveResult,
  } = useLeaderboard({
    gameMode,
    roundHistory,
    uiText: leaderboardText,
  });

  useEffect(() => {
    syncLoadingMessage();
  }, [syncLoadingMessage]);

  useEffect(() => {
    if (gameState === "FINAL_RESULT" && gameMode) {
      void loadLeaderboard();
    }
  }, [gameMode, gameState, loadLeaderboard]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === "Space" && gameState === "RESULT") {
        event.preventDefault();

        if (isFinalRound) {
          showFinalResults();
          return;
        }

        goToNextRound();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState, goToNextRound, isFinalRound, showFinalResults]);

  const handleModeSelect = (mode: "YAKUTSK" | "SAKHA") => {
    if (!isMapReady) {
      return;
    }

    resetLeaderboardState();
    startGame(mode);
  };

  const handlePlayAgain = () => {
    resetSession();
    resetLeaderboardState();
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="glass-panel rounded-2xl px-6 py-4 text-white shadow-xl">
          <div className="text-lg font-semibold">{t.error}</div>
          <div className="mt-2 text-sm opacity-80">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <AppHeader uiText={t} gameMode={gameMode} gameState={gameState} currentRound={currentRound} totalXP={totalXP} />

      <SettingsPanel
        uiText={t}
        language={language}
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((prev) => !prev)}
        onSelectLanguage={setLanguage}
      />

      {gameState === "MODE_SELECT" && (
        <ModeSelectOverlay uiText={t} isMapReady={isMapReady} onSelectMode={handleModeSelect} />
      )}

      {gameState === "FINAL_RESULT" && (
        <FinalResultsOverlay
          uiText={t}
          leaderboardText={leaderboardText}
          totalXP={totalXP}
          averageScore={averageScore}
          totalDistance={totalDistance}
          bestRound={bestRound}
          roundHistory={roundHistory}
          playerName={playerName}
          setPlayerName={setPlayerName}
          isSubmittingResult={isSubmittingResult}
          savedGameId={savedGameId}
          onSaveResult={saveResult}
          saveResultFeedback={saveResultFeedback}
          leaderboardError={leaderboardError}
          isLoadingLeaderboard={isLoadingLeaderboard}
          leaderboard={leaderboard}
          shareFeedback={shareFeedback}
          onShareResults={shareResults}
          onPlayAgain={handlePlayAgain}
        />
      )}

      <main className="h-full w-full">
        {ymapsApi && targetLocation && (
          <StreetView ymaps={ymapsApi} location={targetLocation} panorama={targetPanorama} />
        )}
        {!ymapsApi && (
          <div className="flex h-full items-center justify-center text-lg font-semibold text-slate-700">{t.loadingMap}</div>
        )}
      </main>

      {gameMode && ymapsApi && (
        <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3">
          <div className={gameState === "RESULT" ? "visible" : "hidden"}>
            <ResultPanel
              uiText={t}
              distance={distance}
              score={score}
              isFinalRound={isFinalRound}
              onShowFinalResults={showFinalResults}
              onNextRound={goToNextRound}
            />
          </div>

          <MiniMap
            ymaps={ymapsApi}
            mode={gameMode}
            targetLocation={targetLocation}
            guessLocation={guessLocation}
            gameState={gameState}
            onGuess={setGuessLocation}
            onConfirm={confirmGuess}
            confirmDisabled={!guessLocation || gameState !== "GUESSING"}
            confirmLabel={t.confirm}
          />
        </div>
      )}

      {gameState === "LOADING_RESULT" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40">
          <div className="glass-panel rounded-2xl px-6 py-4 text-white shadow-xl">
            <div className="text-sm font-semibold">{loadingMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
