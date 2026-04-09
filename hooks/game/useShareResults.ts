import { useCallback } from "react";
import { APP_TITLE } from "../../lib/appConfig.ts";
import { TOTAL_ROUNDS } from "../../lib/gameConstants.ts";
import type { GameMode } from "../../lib/gameTypes.ts";
import type { MainUiText } from "../../lib/uiText.ts";
import type { RoundSummary } from "./types.ts";

type ShareOptions = {
  gameMode: GameMode | null;
  roundHistory: RoundSummary[];
  totalXP: number;
  averageScore: number;
  totalDistance: number;
  bestRound: RoundSummary | null;
  uiText: MainUiText;
  setShareFeedback: (value: string | null) => void;
};

const buildShareText = ({
  gameMode,
  roundHistory,
  totalXP,
  averageScore,
  totalDistance,
  bestRound,
  uiText,
}: Omit<ShareOptions, "setShareFeedback">) =>
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

export const useShareResults = ({
  gameMode,
  roundHistory,
  totalXP,
  averageScore,
  totalDistance,
  bestRound,
  uiText,
  setShareFeedback,
}: ShareOptions) =>
  useCallback(async () => {
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
  }, [averageScore, bestRound, gameMode, roundHistory, setShareFeedback, totalDistance, totalXP, uiText]);
