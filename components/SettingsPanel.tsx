import type { Language } from "../lib/gameTypes.ts";
import type { MainUiText } from "../lib/uiText.ts";

type SettingsPanelProps = {
  uiText: MainUiText;
  language: Language;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  onSelectLanguage: (language: Language) => void;
};

const SettingsPanel = ({
  uiText,
  language,
  settingsOpen,
  onToggleSettings,
  onSelectLanguage,
}: SettingsPanelProps) => (
  <div className="absolute bottom-6 left-6 z-30 w-[min(92vw,320px)]">
    <div className="flex flex-col items-start gap-3">
      {settingsOpen && (
        <div className="glass-panel rounded-3xl px-5 py-4 text-white shadow-2xl">
          <div className="text-sm font-semibold">{uiText.settings}</div>
          <div className="mt-3 text-xs uppercase text-white/60">{uiText.language}</div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onSelectLanguage("ru")}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                language === "ru" ? "bg-white text-slate-900" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {uiText.russian}
            </button>
            <button
              onClick={() => onSelectLanguage("sah")}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                language === "sah" ? "bg-white text-slate-900" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {uiText.yakut}
            </button>
          </div>
          <a
            href="https://t.me/Alpinisti4"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-white/90 px-7 py-2 text-sm font-semibold text-slate-900 shadow transition hover:scale-[1.04]"
          >
            {uiText.contact}
          </a>
        </div>
      )}

      <button
        onClick={onToggleSettings}
        aria-label={uiText.settings}
        className="glass-panel flex h-12 w-12 items-center justify-center rounded-full text-white shadow-2xl transition hover:scale-[1.04]"
      >
        <span className="text-xl leading-none">⚙</span>
      </button>
    </div>
  </div>
);

export default SettingsPanel;
