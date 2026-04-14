import type { Language } from "./gameTypes.ts";

export type MainUiText = {
  title: string;
  xp: string;
  streak: string;
  round: string;
  roundsShort: string;
  chooseMode: string;
  chooseModeDescription: string;
  yakutskOnly: string;
  allSakha: string;
  loadingMap: string;
  loadingRound: string;
  checkingResult: string;
  settings: string;
  language: string;
  russian: string;
  yakut: string;
  contact: string;
  correctRegion: string;
  wrongRegion: string;
  region: string;
  distance: string;
  score: string;
  nextRound: string;
  finishGame: string;
  confirm: string;
  expandMap: string;
  collapseMap: string;
  closeMap: string;
  finalResults: string;
  roundsComplete: string;
  averageScore: string;
  totalDistance: string;
  bestRound: string;
  shareResult: string;
  shareSuccess: string;
  playAgain: string;
  error: string;
};

export type LeaderboardUiText = {
  playerNamePlaceholder: string;
  saveResult: string;
  savingResult: string;
  resultSaved: string;
  leaderboardTitle: string;
  leaderboardLoading: string;
  leaderboardEmpty: string;
  nameTooShort: string;
  leaderboardLoadError: string;
  saveResultError: string;
  saveResultSuccess: string;
};

export const UI_TEXT: Record<Language, MainUiText> = {
  ru: {
    title: "FREEGUESSR - ЯКУТИЯ",
    xp: "XP",
    streak: "Стрик",
    round: "Раунд",
    roundsShort: "из",
    chooseMode: "Выберите режим",
    chooseModeDescription: "Игровые локации подбираются внутри населенных пунктов и в пределах выбранной территории.",
    yakutskOnly: "Только Якутск",
    allSakha: "Вся Республика Саха (Якутия)",
    loadingMap: "Загрузка Яндекс Карт...",
    loadingRound: "Загрузка...",
    checkingResult: "Проверка результата...",
    settings: "Настройки",
    language: "Язык",
    russian: "Русский",
    yakut: "Якутский",
    contact: "Связаться с нами",
    correctRegion: "ВЕРНЫЙ РЕГИОН",
    wrongRegion: "НЕВЕРНЫЙ РЕГИОН",
    region: "Регион",
    distance: "Дистанция",
    score: "Очки",
    nextRound: "Следующий раунд (Space)",
    finishGame: "Показать финальную статистику",
    confirm: "ПОДТВЕРДИТЬ ОТВЕТ",
    expandMap: "Развернуть карту",
    collapseMap: "Уменьшить карту",
    closeMap: "Закрыть карту",
    finalResults: "Финальные результаты",
    roundsComplete: "Раунд завершён",
    averageScore: "Средний результат",
    totalDistance: "Общая дистанция",
    bestRound: "Лучший раунд",
    shareResult: "Поделиться результатом",
    shareSuccess: "Копировать результат",
    playAgain: "Сыграть снова",
    error: "Ошибка",
  },
  sah: {
    title: "FREEGUESSR - САХА",
    xp: "XP",
    streak: "Стрик",
    round: "Раунд",
    roundsShort: "",
    chooseMode: "Режим тал",
    chooseModeDescription: "Оонньуу сирдэрэ нэһилиэктэр иһигэр уонна талыыллыбыт сир арыллыытыгар булуллаллар.",
    yakutskOnly: "Якутскай эрэ",
    allSakha: "Бүтүн Саха Өрөспүүбүлүкэтэ",
    loadingMap: "Яндекс Карталар хачайдана турар...",
    loadingRound: "Хачайдана турар...",
    checkingResult: "Түмүк бэрэбиэркэтэ...",
    settings: "Туруоруулар",
    language: "Тыл",
    russian: "Нуучча",
    yakut: "Саха",
    contact: "Биһиэхэ суруй",
    correctRegion: "СӨП РЕГИОН",
    wrongRegion: "САТААБАТ РЕГИОН",
    region: "Регион",
    distance: "Ыраахтааһын",
    score: "Баал",
    nextRound: "Аныгы раунд (Space)",
    finishGame: "Түмүк",
    confirm: "ЭППИЭТИН БИГЭЛЭЭ",
    expandMap: "Картаны улаатыннар",
    collapseMap: "Картаны кыччат",
    closeMap: "Картаны сап",
    finalResults: "Түмүк",
    roundsComplete: "Хас раунд бүттэ",
    averageScore: "Орто баал",
    totalDistance: "Уопсай дистанция",
    bestRound: "Саамай үчүгэй раунд",
    shareResult: "Түмүгү үллэстии",
    shareSuccess: "Куоппуйаламмыт",
    playAgain: "Өссө төгүл оонньоо",
    error: "Алҕас",
  },
};

export const LEADERBOARD_TEXT: Record<Language, LeaderboardUiText> = {
  ru: {
    playerNamePlaceholder: "Ваше имя",
    saveResult: "Сохранить результат",
    savingResult: "Сохранение...",
    resultSaved: "Сохранено",
    leaderboardTitle: "Лидерборд",
    leaderboardLoading: "Загрузка...",
    leaderboardEmpty: "Пока записей нет",
    nameTooShort: "Введите имя хотя бы из 2 символов",
    leaderboardLoadError: "Не удалось загрузить лидерборд",
    saveResultError: "Не удалось сохранить результат",
    saveResultSuccess: "Результат сохранен",
  },
  sah: {
    playerNamePlaceholder: "Ваше имя",
    saveResult: "Сохранить результат",
    savingResult: "Сохранение...",
    resultSaved: "Сохранено",
    leaderboardTitle: "Лидерборд",
    leaderboardLoading: "Загрузка...",
    leaderboardEmpty: "Пока записей нет",
    nameTooShort: "Введите имя хотя бы из 2 символов",
    leaderboardLoadError: "Не удалось загрузить лидерборд",
    saveResultError: "Не удалось сохранить результат",
    saveResultSuccess: "Результат сохранен",
  },
};
