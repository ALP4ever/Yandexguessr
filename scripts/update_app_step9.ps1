$content = Get-Content App.tsx -Raw

$loadLeaderboard = @'
  const loadLeaderboard = useCallback(async () => {
    if (!gameMode) {
      return;
    }

    try {
      setIsLoadingLeaderboard(true);
      setLeaderboardError(null);
      const data = await fetchLeaderboard({ mode: gameMode, limit: 20 });
      setLeaderboard(data.items);
    } catch (error) {
      setLeaderboardError(error instanceof Error ? error.message : leaderboardText.leaderboardLoadError);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [gameMode, leaderboardText.leaderboardLoadError]);
'@

$content = [regex]::Replace(
  $content,
  '(?s)  const loadLeaderboard = useCallback\(async \(\) => \{.*?  \}, \[gameMode\]\);',
  [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $loadLeaderboard },
  1
)

$handleSaveResult = @'
  const handleSaveResult = useCallback(async () => {
    if (!gameMode || roundHistory.length === 0 || savedGameId) {
      return;
    }

    const trimmedName = playerName.trim();
    if (trimmedName.length < 2) {
      setSaveResultFeedback(leaderboardText.nameTooShort);
      return;
    }

    try {
      setIsSubmittingResult(true);
      setSaveResultFeedback(null);
      setLeaderboardError(null);

      const savedGame = await submitGameResult({
        playerName: trimmedName,
        mode: gameMode,
        rounds: roundHistory.map((round) => ({
          roundNumber: round.roundNumber,
          score: round.score,
          distanceKm: round.distanceKm,
        })),
      });

      setSavedGameId(savedGame.id);
      setSaveResultFeedback(leaderboardText.saveResultSuccess);
      setIsLoadingLeaderboard(true);

      const data = await fetchLeaderboard({ mode: gameMode, limit: 20 });
      setLeaderboard(data.items);
    } catch (error) {
      setLeaderboardError(error instanceof Error ? error.message : leaderboardText.saveResultError);
    } finally {
      setIsSubmittingResult(false);
      setIsLoadingLeaderboard(false);
    }
  }, [
    gameMode,
    leaderboardText.nameTooShort,
    leaderboardText.saveResultError,
    leaderboardText.saveResultSuccess,
    playerName,
    roundHistory,
    savedGameId,
  ]);
'@

$content = [regex]::Replace(
  $content,
  '(?s)  const handleSaveResult = useCallback\(async \(\) => \{.*?  \}, \[gameMode, playerName, roundHistory, savedGameId\]\);',
  [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $handleSaveResult },
  1
)

$finalResultBlock = @'
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
                onClick={handleSaveResult}
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
                  onClick={handleShareResults}
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
'@

$content = [regex]::Replace(
  $content,
  '(?s)      \{gameState === "FINAL_RESULT" && \(.*?      \)\}\r?\n\r?\n      <main className="h-full w-full">',
  [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $finalResultBlock },
  1
)

Set-Content App.tsx $content
