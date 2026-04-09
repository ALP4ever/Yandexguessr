import { useCallback, useMemo, useRef, useState } from "react";
import { APP_TITLE } from "../lib/appConfig.ts";
import { TOTAL_ROUNDS } from "../lib/gameConstants.ts";
import { getErrorMessage } from "../lib/errors.ts";
import type { GameMode, GameState, GeneratedRound, LatLng } from "../lib/gameTypes.ts";
import {
  generateCandidateLocation,
  getBoundsForMode,
  haversineKm,
  isAllowedPopulatedPlace,
  isWithinBounds,
  scoreFromDistance,
} from "../lib/mapUtils.ts";
import type { MainUiText } from "../lib/uiText.ts";
import type { PlacesService, StreetViewService, YandexPanorama } from "../lib/yandexMaps.ts";

export type RoundSummary = {
  roundNumber: number;
  score: number;
  distanceKm: number;
};

type ShareOptions = {
  gameMode: GameMode | null;
  roundHistory: RoundSummary[];
  totalXP: number;
  averageScore: number;
  totalDistance: number;
  bestRound: RoundSummary | null;
  uiText: MainUiText;
};

type UseGameSessionOptions = {
  uiText: MainUiText;
  streetViewService: StreetViewService | null;
  placesService: PlacesService | null;
  setExternalError: (value: string | null) => void;
};

const buildShareText = ({
  gameMode,
  roundHistory,
  totalXP,
  averageScore,
  totalDistance,
  bestRound,
  uiText,
}: ShareOptions) =>
  [
    APP_TITLE,
    `${uiText.finalResults}: ${totalXP} XP`,
    `${uiText.roundsComplete}: ${roundHistory.length}/${TOTAL_ROUNDS}`,
    `${uiText.averageScore}: ${averageScore}`,
    `${uiText.totalDistance}: ${totalDistance.toFixed(2)} km`,
    bestRound ? `${uiText.bestRound}: #${bestRound.roundNumber} (${bestRound.score})` : "",
    gameMode ? `Mode: ${gameMode}` : "",
  ]
    .filter(Boolean)
    .join("\n");

export const useGameSession = ({ uiText, streetViewService, placesService, setExternalError }: UseGameSessionOptions) => {
  const generationLock = useRef(false);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<GameState>("MODE_SELECT");
  const [targetLocation, setTargetLocation] = useState<LatLng | null>(null);
  const [targetPanorama, setTargetPanorama] = useState<YandexPanorama | null>(null);
  const [guessLocation, setGuessLocation] = useState<LatLng | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [totalXP, setTotalXP] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundHistory, setRoundHistory] = useState<RoundSummary[]>([]);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(uiText.loadingMap);

  const isFinalRound = currentRound >= TOTAL_ROUNDS;
  const averageScore = useMemo(
    () =>
      roundHistory.length
        ? Math.round(roundHistory.reduce((sum, round) => sum + round.score, 0) / roundHistory.length)
        : 0,
    [roundHistory]
  );
  const totalDistance = useMemo(
    () => roundHistory.reduce((sum, round) => sum + round.distanceKm, 0),
    [roundHistory]
  );
  const bestRound = useMemo(
    () => roundHistory.reduce<RoundSummary | null>((best, round) => (!best || round.score > best.score ? round : best), null),
    [roundHistory]
  );

  const resetRoundState = useCallback(() => {
    setGuessLocation(null);
    setTargetLocation(null);
    setTargetPanorama(null);
    setDistance(null);
    setScore(0);
  }, []);

  const resetSession = useCallback(() => {
    setGameMode(null);
    setGameState("MODE_SELECT");
    setCurrentRound(1);
    setRoundHistory([]);
    setTotalXP(0);
    setShareFeedback(null);
    resetRoundState();
  }, [resetRoundState]);

  const generateValidLocation = useCallback(
    async (mode: GameMode, attempt = 0): Promise<GeneratedRound> => {
      if (!streetViewService || !placesService) {
        throw new Error("Сервисы карты недоступны");
      }

      if (attempt > 160) {
        throw new Error("Не удалось найти подходящую локацию");
      }

      const bounds = getBoundsForMode(mode);

      try {
        const candidate = generateCandidateLocation(mode, bounds);
        const panorama = await streetViewService.getPanorama({
          location: candidate,
          radius: mode === "SAKHA" ? 25000 : 3500,
          source: "OUTDOOR",
        });

        if (panorama.status === "ZERO_RESULTS" || !panorama.location) {
          return generateValidLocation(mode, attempt + 1);
        }

        if (!isWithinBounds(panorama.location, bounds)) {
          return generateValidLocation(mode, attempt + 1);
        }

        if (mode === "YAKUTSK") {
          return {
            location: panorama.location,
            panorama: panorama.panorama,
          };
        }

        const nearby = await placesService.nearbySearch({
          location: panorama.location,
          radius: 1200,
        });

        if (nearby.status !== "OK") {
          return generateValidLocation(mode, attempt + 1);
        }

        const isPopulated = nearby.results.some((result: { types: string[] }) => isAllowedPopulatedPlace(result.types));

        if (!isPopulated) {
          return generateValidLocation(mode, attempt + 1);
        }

        return {
          location: panorama.location,
          panorama: panorama.panorama,
        };
      } catch (error) {
        const message = getErrorMessage(error, "");
        const isConfigurationError =
          /api[- ]?key|failed to load|unauthorized|forbidden|access denied/i.test(message);

        if (isConfigurationError) {
          throw new Error(message);
        }

        console.warn("Round generation attempt failed, retrying with a new location.", error);
        return generateValidLocation(mode, attempt + 1);
      }
    },
    [placesService, streetViewService]
  );

  const startNewRound = useCallback(
    async (mode: GameMode) => {
      if (generationLock.current) {
        return;
      }

      generationLock.current = true;
      setExternalError(null);
      setLoadingMessage(uiText.loadingRound);
      setGameState("LOADING_RESULT");
      setShareFeedback(null);
      resetRoundState();

      try {
        const roundData = await generateValidLocation(mode);
        setTargetLocation(roundData.location);
        setTargetPanorama(roundData.panorama);
        setGameState("GUESSING");
      } catch (error) {
        setExternalError(getErrorMessage(error, uiText.error));
      } finally {
        generationLock.current = false;
      }
    },
    [generateValidLocation, resetRoundState, setExternalError, uiText.error, uiText.loadingRound]
  );

  const startGame = useCallback(
    (mode: GameMode) => {
      if (!streetViewService || !placesService) {
        return;
      }

      setCurrentRound(1);
      setRoundHistory([]);
      setTotalXP(0);
      setDistance(null);
      setScore(0);
      setShareFeedback(null);
      setGameMode(mode);
      void startNewRound(mode);
    },
    [placesService, startNewRound, streetViewService]
  );

  const confirmGuess = useCallback(() => {
    if (!guessLocation || !targetLocation || !gameMode) {
      return;
    }

    setGameState("LOADING_RESULT");
    setLoadingMessage(uiText.checkingResult);

    const distanceKm = haversineKm(targetLocation, guessLocation);
    const roundScore = scoreFromDistance(distanceKm, gameMode);
    const nextRoundSummary = {
      roundNumber: currentRound,
      score: roundScore,
      distanceKm,
    };

    setDistance(distanceKm);
    setScore(roundScore);
    setTotalXP((prev) => prev + roundScore);
    setRoundHistory((prev) => [...prev, nextRoundSummary]);
    setGameState("RESULT");
  }, [currentRound, gameMode, guessLocation, targetLocation, uiText.checkingResult]);

  const goToNextRound = useCallback(() => {
    if (!gameMode) {
      return;
    }

    setCurrentRound((prev) => prev + 1);
    void startNewRound(gameMode);
  }, [gameMode, startNewRound]);

  const showFinalResults = useCallback(() => {
    setGameState("FINAL_RESULT");
  }, []);

  const shareResults = useCallback(async () => {
    if (!gameMode || roundHistory.length === 0) {
      return;
    }

    const shareText = buildShareText({
      gameMode,
      roundHistory,
      totalXP,
      averageScore,
      totalDistance,
      bestRound,
      uiText,
    });

    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        throw new Error("Share unavailable");
      }

      setShareFeedback(uiText.shareSuccess);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(shareText);
        setShareFeedback(uiText.shareSuccess);
      } catch {
        setShareFeedback("Share unavailable");
      }
    }
  }, [averageScore, bestRound, gameMode, roundHistory, totalDistance, totalXP, uiText]);

  const syncLoadingMessage = useCallback(() => {
    if (gameState === "LOADING_RESULT" && !targetLocation) {
      setLoadingMessage(uiText.loadingRound);
    }
  }, [gameState, targetLocation, uiText.loadingRound]);

  return {
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
  };
};
