import { APP_TITLE } from "../../lib/appConfig.ts";
import { TOTAL_ROUNDS } from "../../lib/gameConstants.ts";
import type { GameMode, GameState } from "../../lib/gameTypes.ts";
import type { MainUiText } from "../../lib/uiText.ts";
import logo from "../../logo.svg";

type AppHeaderProps = {
  uiText: MainUiText;
  gameMode: GameMode | null;
  gameState: GameState;
  currentRound: number;
  totalXP: number;
};

const AppHeader = ({ uiText, gameMode, gameState, currentRound, totalXP }: AppHeaderProps) => (
  <header className="absolute left-0 right-0 top-0 z-30 flex items-start justify-between pl-0 pr-6 pt-2">
    <div className="flex h-20 w-[20rem] -translate-y-1 items-center justify-center gap-4 px-4 text-white">
      <img src={logo} alt={APP_TITLE} className="h-14 w-14 shrink-0" />
      <span className="text-[1.15rem] font-semibold tracking-[0.08em]">{APP_TITLE}</span>
    </div>
    <div className="flex items-center gap-3 text-xs font-semibold text-slate-900">
      {gameMode && gameState !== "MODE_SELECT" && (
        <div className="rounded-full bg-white/90 px-3 py-1 shadow">
          {uiText.round}: {Math.min(currentRound, TOTAL_ROUNDS)} {uiText.roundsShort} {TOTAL_ROUNDS}
        </div>
      )}
      <div className="rounded-full bg-white/90 px-3 py-1 shadow">
        {uiText.xp}: {totalXP}
      </div>
    </div>
  </header>
);

export default AppHeader;
