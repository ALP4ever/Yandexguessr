import { useCallback } from "react";
import { haversineKm, scoreFromDistance } from "../lib/mapUtils.ts";
import type { GameMode } from "../lib/gameTypes.ts";
import type { MainUiText } from "../lib/uiText.ts";
import type { PlacesService, StreetViewService } from "../lib/yandexMaps.ts";
import { useGameProgress } from "./game/useGameProgress.ts";
import { useRoundGeneration } from "./game/useRoundGeneration.ts";
import { useShareResults } from "./game/useShareResults.ts";
export type { RoundSummary } from "./game/types.ts";

type UseGameSessionOptions = {
  uiText: MainUiText;
  streetViewService: StreetViewService | null;
  placesService: PlacesService | null;
  setExternalError: (value: string | null) => void;
};

export const useGameSession = ({ uiText, streetViewService, placesService, setExternalError }: UseGameSessionOptions) => {
  const progress = useGameProgress(uiText);

  const { startNewRound } = useRoundGeneration({
    uiText,
    streetViewService,
    placesService,
    setExternalError,
    resetRoundState: progress.resetRoundState,
    setShareFeedback: progress.setShareFeedback,
    setLoadingMessage: progress.setLoadingMessage,
    setGameState: progress.setGameState,
    setTargetLocation: progress.setTargetLocation,
    setTargetPanorama: progress.setTargetPanorama,
  });

  const shareResults = useShareResults({
    gameMode: progress.gameMode,
    roundHistory: progress.roundHistory,
    totalXP: progress.totalXP,
    averageScore: progress.averageScore,
    totalDistance: progress.totalDistance,
    bestRound: progress.bestRound,
    uiText,
    setShareFeedback: progress.setShareFeedback,
  });

  const startGame = useCallback(
    (mode: GameMode) => {
      if (!streetViewService || !placesService) {
        return;
      }

      progress.beginGame(mode);
      void startNewRound(mode);
    },
    [placesService, progress, startNewRound, streetViewService]
  );

  const confirmGuess = useCallback(() => {
    if (!progress.guessLocation || !progress.targetLocation || !progress.gameMode) {
      return;
    }

    const distanceKm = haversineKm(progress.targetLocation, progress.guessLocation);
    const roundScore = scoreFromDistance(distanceKm, progress.gameMode);
    const nextRoundSummary = {
      roundNumber: progress.currentRound,
      score: roundScore,
      distanceKm,
    };

    progress.completeGuess(nextRoundSummary, distanceKm, roundScore, uiText.checkingResult);
  }, [progress, uiText.checkingResult]);

  const goToNextRound = useCallback(() => {
    if (!progress.gameMode) {
      return;
    }

    progress.setCurrentRound((prev) => prev + 1);
    void startNewRound(progress.gameMode);
  }, [progress, startNewRound]);

  const showFinalResults = useCallback(() => {
    progress.setGameState("FINAL_RESULT");
  }, [progress]);

  return {
    gameMode: progress.gameMode,
    gameState: progress.gameState,
    targetLocation: progress.targetLocation,
    targetPanorama: progress.targetPanorama,
    guessLocation: progress.guessLocation,
    distance: progress.distance,
    score: progress.score,
    totalXP: progress.totalXP,
    currentRound: progress.currentRound,
    roundHistory: progress.roundHistory,
    shareFeedback: progress.shareFeedback,
    loadingMessage: progress.loadingMessage,
    isFinalRound: progress.isFinalRound,
    averageScore: progress.averageScore,
    totalDistance: progress.totalDistance,
    bestRound: progress.bestRound,
    setGuessLocation: progress.setGuessLocation,
    startGame,
    confirmGuess,
    goToNextRound,
    showFinalResults,
    resetSession: progress.resetSession,
    shareResults,
    syncLoadingMessage: progress.syncLoadingMessage,
  };
};
