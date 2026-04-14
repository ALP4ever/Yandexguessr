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
  <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between gap-2 px-4 pt-2 md:items-start md:gap-0 md:px-6">
    <div className="flex min-w-0 max-w-[min(58vw,16rem)] items-center gap-2 rounded-2xl bg-slate-900 px-2.5 py-1.5 text-white md:h-20 md:max-w-none md:w-[20rem] md:justify-center md:gap-4 md:rounded-3xl md:px-4 md:py-0">
      <img src={logo} alt={APP_TITLE} className="h-8 w-8 shrink-0 md:h-14 md:w-14" />
      <span className="truncate text-xs font-semibold md:overflow-visible md:whitespace-normal md:text-[1.15rem] md:tracking-[0.08em]">
        {APP_TITLE}
      </span>
    </div>
    <div className="ml-auto flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-900 md:mt-5 md:gap-3">
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
