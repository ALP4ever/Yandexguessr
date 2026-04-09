import type { MainUiText } from "../../lib/uiText.ts";

type ModeSelectOverlayProps = {
  uiText: MainUiText;
  isMapReady: boolean;
  onSelectMode: (mode: "YAKUTSK" | "SAKHA") => void;
};

const ModeSelectOverlay = ({ uiText, isMapReady, onSelectMode }: ModeSelectOverlayProps) => (
  <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/70">
    <div className="glass-panel w-full max-w-lg rounded-3xl px-8 py-10 text-white shadow-2xl">
      <h1 className="text-2xl font-semibold">{uiText.chooseMode}</h1>
      <p className="mt-2 text-sm opacity-80">{uiText.chooseModeDescription}</p>
      <div className="mt-6 grid gap-4">
        <button
          disabled={!isMapReady}
          onClick={() => onSelectMode("YAKUTSK")}
          className={`rounded-2xl px-5 py-4 text-left text-sm font-semibold text-slate-900 shadow-lg transition ${
            isMapReady
              ? "bg-emerald-400/90 hover:scale-[1.02]"
              : "cursor-not-allowed bg-slate-300/70 text-slate-600 opacity-70"
          }`}
        >
          {uiText.yakutskOnly}
        </button>
        <button
          disabled={!isMapReady}
          onClick={() => onSelectMode("SAKHA")}
          className={`rounded-2xl px-5 py-4 text-left text-sm font-semibold text-slate-900 shadow-lg transition ${
            isMapReady
              ? "bg-sky-300/90 hover:scale-[1.02]"
              : "cursor-not-allowed bg-slate-300/70 text-slate-600 opacity-70"
          }`}
        >
          {uiText.allSakha}
        </button>
      </div>
      {!isMapReady && <p className="mt-4 text-sm opacity-80">{uiText.loadingMap}</p>}
    </div>
  </div>
);

export default ModeSelectOverlay;
