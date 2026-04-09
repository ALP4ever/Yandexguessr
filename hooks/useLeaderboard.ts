import { useCallback, useState } from "react";
import { fetchLeaderboard, submitGameResult, type LeaderboardEntry } from "../lib/backendApi.ts";
import { getErrorMessage } from "../lib/errors.ts";
import type { GameMode } from "../lib/gameTypes.ts";
import type { LeaderboardUiText } from "../lib/uiText.ts";
import type { RoundSummary } from "./useGameSession.ts";

type UseLeaderboardOptions = {
  gameMode: GameMode | null;
  roundHistory: RoundSummary[];
  uiText: LeaderboardUiText;
};

export const useLeaderboard = ({ gameMode, roundHistory, uiText }: UseLeaderboardOptions) => {
  const [playerName, setPlayerName] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [saveResultFeedback, setSaveResultFeedback] = useState<string | null>(null);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [savedGameId, setSavedGameId] = useState<string | null>(null);

  const resetLeaderboardState = useCallback(() => {
    setPlayerName("");
    setLeaderboard([]);
    setLeaderboardError(null);
    setSaveResultFeedback(null);
    setIsSubmittingResult(false);
    setIsLoadingLeaderboard(false);
    setSavedGameId(null);
  }, []);

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
      setLeaderboardError(getErrorMessage(error, uiText.leaderboardLoadError));
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [gameMode, uiText.leaderboardLoadError]);

  const saveResult = useCallback(async () => {
    if (!gameMode || roundHistory.length === 0 || savedGameId) {
      return;
    }

    const trimmedName = playerName.trim();
    if (trimmedName.length < 2) {
      setSaveResultFeedback(uiText.nameTooShort);
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
      setSaveResultFeedback(uiText.saveResultSuccess);

      setIsLoadingLeaderboard(true);
      const data = await fetchLeaderboard({ mode: gameMode, limit: 20 });
      setLeaderboard(data.items);
    } catch (error) {
      setLeaderboardError(getErrorMessage(error, uiText.saveResultError));
    } finally {
      setIsSubmittingResult(false);
      setIsLoadingLeaderboard(false);
    }
  }, [
    gameMode,
    playerName,
    roundHistory,
    savedGameId,
    uiText.nameTooShort,
    uiText.saveResultError,
    uiText.saveResultSuccess,
  ]);

  return {
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
  };
};
