import React, { useEffect, useState } from "react";
import MiniMap from "./components/MiniMap.tsx";
import StreetView from "./components/StreetView.tsx";
import { useGameSession } from "./hooks/useGameSession.ts";
import { useLeaderboard } from "./hooks/useLeaderboard.ts";
import { useYandexMaps } from "./hooks/useYandexMaps.ts";
import { APP_TITLE, TOTAL_ROUNDS } from "./lib/gameConstants.ts";
import type { Language } from "./lib/gameTypes.ts";
import { LEADERBOARD_TEXT, UI_TEXT } from "./lib/uiText.ts";
import logo from "./logo.svg";

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
      <header className="absolute left-0 right-0 top-0 z-30 flex items-start justify-between pl-0 pr-6 pt-2">
        <div className="flex h-20 w-[20rem] -translate-y-1 items-center justify-center gap-4 px-4 text-white">
          <img src={logo} alt={APP_TITLE} className="h-14 w-14 shrink-0" />
          <span className="text-[1.15rem] font-semibold tracking-[0.08em]">{APP_TITLE}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-900">
          {gameMode && gameState !== "MODE_SELECT" && (
            <div className="rounded-full bg-white/90 px-3 py-1 shadow">
              {t.round}: {Math.min(currentRound, TOTAL_ROUNDS)} {t.roundsShort} {TOTAL_ROUNDS}
            </div>
          )}
          <div className="rounded-full bg-white/90 px-3 py-1 shadow">
            {t.xp}: {totalXP}
          </div>
        </div>
      </header>

      <div className="absolute bottom-6 left-6 z-30 w-[min(92vw,320px)]">
        <div className="flex flex-col items-start gap-3">
          {settingsOpen && (
            <div className="glass-panel rounded-3xl px-5 py-4 text-white shadow-2xl">
              <div className="text-sm font-semibold">{t.settings}</div>
              <div className="mt-3 text-xs uppercase text-white/60">{t.language}</div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setLanguage("ru")}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    language === "ru" ? "bg-white text-slate-900" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {t.russian}
                </button>
                <button
                  onClick={() => setLanguage("sah")}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    language === "sah" ? "bg-white text-slate-900" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {t.yakut}
                </button>
              </div>
              <a
                href="https://t.me/Alpinisti4"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-white/90 px-7 py-2 text-sm font-semibold text-slate-900 shadow transition hover:scale-[1.04]"
              >
                {t.contact}
              </a>
            </div>
          )}

          <button
            onClick={() => setSettingsOpen((prev) => !prev)}
            aria-label={t.settings}
            className="glass-panel flex h-12 w-12 items-center justify-center rounded-full text-white shadow-2xl transition hover:scale-[1.04]"
          >
            <span className="text-xl leading-none">⚙</span>
          </button>
        </div>
      </div>

      {gameState === "MODE_SELECT" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/70">
          <div className="glass-panel w-full max-w-lg rounded-3xl px-8 py-10 text-white shadow-2xl">
            <h1 className="text-2xl font-semibold">{t.chooseMode}</h1>
            <p className="mt-2 text-sm opacity-80">{t.chooseModeDescription}</p>
            <div className="mt-6 grid gap-4">
              <button
                disabled={!isMapReady}
                onClick={() => handleModeSelect("YAKUTSK")}
                className={`rounded-2xl px-5 py-4 text-left text-sm font-semibold text-slate-900 shadow-lg transition ${
                  isMapReady
                    ? "bg-emerald-400/90 hover:scale-[1.02]"
                    : "cursor-not-allowed bg-slate-300/70 text-slate-600 opacity-70"
                }`}
              >
                {t.yakutskOnly}
              </button>
              <button
                disabled={!isMapReady}
                onClick={() => handleModeSelect("SAKHA")}
                className={`rounded-2xl px-5 py-4 text-left text-sm font-semibold text-slate-900 shadow-lg transition ${
                  isMapReady
                    ? "bg-sky-300/90 hover:scale-[1.02]"
                    : "cursor-not-allowed bg-slate-300/70 text-slate-600 opacity-70"
                }`}
              >
                {t.allSakha}
              </button>
            </div>
            {!isMapReady && <p className="mt-4 text-sm opacity-80">{t.loadingMap}</p>}
          </div>
        </div>
      )}

      {gameState === "FINAL_RESULT" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-6">
          <div className="glass-panel w-full max-w-2xl rounded-3xl px-8 py-8 text-white shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/60">{t.finalResults}</div>
                <h2 className="mt-2 text-3xl font-semibold">{totalXP} XP</h2>
                <p className="mt-2 text-sm text-white/75">
                  {t.roundsComplete}: {roundHistory.length}/{TOTAL_ROUNDS}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                <div className="text-xs text-white/60">{t.averageScore}</div>
                <div className="text-2xl font-semibold">{averageScore}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/8 px-4 py-4">
                <div className="text-xs text-white/60">{t.totalDistance}</div>
                <div className="mt-2 text-xl font-semibold">{totalDistance.toFixed(2)} km</div>
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-4">
                <div className="text-xs text-white/60">{t.bestRound}</div>
                <div className="mt-2 text-xl font-semibold">{bestRound ? `#${bestRound.roundNumber}` : "-"}</div>
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-4">
                <div className="text-xs text-white/60">{t.score}</div>
                <div className="mt-2 text-xl font-semibold">{bestRound ? bestRound.score : 0}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {roundHistory.map((round) => (
                <div
                  key={round.roundNumber}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3"
                >
                  <div className="font-semibold">
                    {t.round} {round.roundNumber}
                  </div>
                  <div className="text-sm text-white/75">{round.distanceKm.toFixed(2)} km</div>
                  <div className="text-lg font-semibold">{round.score}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder={leaderboardText.playerNamePlaceholder}
                className="min-w-[220px] flex-1 rounded-xl bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50"
                maxLength={24}
              />
              <button
                onClick={saveResult}
                disabled={isSubmittingResult || Boolean(savedGameId)}
                className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmittingResult
                  ? leaderboardText.savingResult
                  : savedGameId
                    ? leaderboardText.resultSaved
                    : leaderboardText.saveResult}
              </button>
            </div>

            {(saveResultFeedback || leaderboardError) && (
              <div className="mt-3 text-sm">
                {saveResultFeedback && <div className="text-emerald-300">{saveResultFeedback}</div>}
                {leaderboardError && <div className="text-rose-300">{leaderboardError}</div>}
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-white/8 px-4 py-4">
              <div className="text-sm font-semibold text-white">{leaderboardText.leaderboardTitle}</div>

              {isLoadingLeaderboard && (
                <div className="mt-3 text-sm text-white/70">{leaderboardText.leaderboardLoading}</div>
              )}

              {!isLoadingLeaderboard && leaderboard.length === 0 && !leaderboardError && (
                <div className="mt-3 text-sm text-white/70">{leaderboardText.leaderboardEmpty}</div>
              )}

              <div className="mt-3 grid gap-2">
                {leaderboard.map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-xl bg-white/6 px-4 py-3">
                    <div className="font-medium">
                      {index + 1}. {entry.playerName}
                    </div>
                    <div className="text-sm text-white/75">{entry.totalScore} XP</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-white/70">{shareFeedback ?? ""}</div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={shareResults}
                  className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-slate-900 shadow transition hover:scale-[1.02]"
                >
                  {t.shareResult}
                </button>
                <button
                  onClick={handlePlayAgain}
                  className="rounded-full bg-sky-300 px-5 py-2 text-sm font-semibold text-slate-900 shadow transition hover:scale-[1.02]"
                >
                  {t.playAgain}
                </button>
              </div>
            </div>
          </div>
        </div>
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
          <div
            className={`score-panel mini-map-width expanded glass-panel rounded-3xl px-6 py-5 text-white shadow-2xl ${
              gameState === "RESULT" ? "visible" : "hidden"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-right">
                <div className="text-sm opacity-80">{t.distance}</div>
                <div className="text-2xl font-semibold">{distance ? distance.toFixed(2) : "0.00"} км</div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80">{t.score}</div>
                <div className="text-2xl font-semibold">{score}</div>
              </div>
              <button
                onClick={isFinalRound ? showFinalResults : goToNextRound}
                className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-slate-900 shadow transition hover:scale-[1.02]"
              >
                {isFinalRound ? t.finalResults : t.nextRound}
              </button>
            </div>
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
