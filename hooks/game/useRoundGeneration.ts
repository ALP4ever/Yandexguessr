import { useCallback, useRef } from "react";
import { getErrorMessage } from "../../lib/errors.ts";
import type { GameMode, GeneratedRound } from "../../lib/gameTypes.ts";
import {
  generateCandidateLocation,
  getBoundsForMode,
  isAllowedPopulatedPlace,
  isWithinBounds,
} from "../../lib/mapUtils.ts";
import type { MainUiText } from "../../lib/uiText.ts";
import type { PlacesService, StreetViewService } from "../../lib/yandexMaps.ts";

type UseRoundGenerationOptions = {
  uiText: MainUiText;
  streetViewService: StreetViewService | null;
  placesService: PlacesService | null;
  setExternalError: (value: string | null) => void;
  resetRoundState: () => void;
  setShareFeedback: (value: string | null) => void;
  setLoadingMessage: (value: string) => void;
  setGameState: (value: "LOADING_RESULT" | "GUESSING") => void;
  setTargetLocation: (value: GeneratedRound["location"] | null) => void;
  setTargetPanorama: (value: GeneratedRound["panorama"] | null) => void;
};

export const useRoundGeneration = ({
  uiText,
  streetViewService,
  placesService,
  setExternalError,
  resetRoundState,
  setShareFeedback,
  setLoadingMessage,
  setGameState,
  setTargetLocation,
  setTargetPanorama,
}: UseRoundGenerationOptions) => {
  const generationLock = useRef(false);

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
    [
      generateValidLocation,
      resetRoundState,
      setExternalError,
      setGameState,
      setLoadingMessage,
      setShareFeedback,
      setTargetLocation,
      setTargetPanorama,
      uiText.error,
      uiText.loadingRound,
    ]
  );

  return { startNewRound };
};
