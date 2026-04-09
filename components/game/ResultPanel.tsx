import type { MainUiText } from "../../lib/uiText.ts";

type ResultPanelProps = {
  uiText: MainUiText;
  distance: number | null;
  score: number;
  isFinalRound: boolean;
  onShowFinalResults: () => void;
  onNextRound: () => void;
};

const ResultPanel = ({
  uiText,
  distance,
  score,
  isFinalRound,
  onShowFinalResults,
  onNextRound,
}: ResultPanelProps) => (
  <div className="score-panel mini-map-width expanded glass-panel rounded-3xl px-6 py-5 text-white shadow-2xl">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="text-right">
        <div className="text-sm opacity-80">{uiText.distance}</div>
        <div className="text-2xl font-semibold">{distance ? distance.toFixed(2) : "0.00"} км</div>
      </div>
      <div className="text-right">
        <div className="text-sm opacity-80">{uiText.score}</div>
        <div className="text-2xl font-semibold">{score}</div>
      </div>
      <button
        onClick={isFinalRound ? onShowFinalResults : onNextRound}
        className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-slate-900 shadow transition hover:scale-[1.02]"
      >
        {isFinalRound ? uiText.finalResults : uiText.nextRound}
      </button>
    </div>
  </div>
);

export default ResultPanel;
