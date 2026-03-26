export type GameMode = "YAKUTSK" | "SAKHA";
export type GameState = "MODE_SELECT" | "GUESSING" | "LOADING_RESULT" | "RESULT" | "FINAL_RESULT";
export type Language = "ru" | "sah";

export type LatLng = {
  lat: number;
  lng: number;
};

export type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type PlaceResult = {
  name: string;
  types: string[];
};

export type SeedLocation = {
  lat: number;
  lng: number;
  radiusMeters: number;
};

export type GeneratedRound = {
  location: LatLng;
  panorama: any;
};

export type PrefetchedRound = {
  mode: GameMode;
  data: GeneratedRound;
};

export const BOUNDS_BY_MODE: Record<GameMode, Bounds> = {
  YAKUTSK: {
    minLat: 61.95,
    maxLat: 62.1,
    minLng: 129.55,
    maxLng: 129.85,
  },
  SAKHA: {
    minLat: 55.0,
    maxLat: 72.0,
    minLng: 105.0,
    maxLng: 160.0,
  },
};

export const SAKHA_LOCATION_SEEDS: SeedLocation[] = [
  { lat: 62.0272, lng: 129.7326, radiusMeters: 12000 },
  { lat: 61.4844, lng: 129.1481, radiusMeters: 8000 },
  { lat: 56.6546, lng: 124.7203, radiusMeters: 9000 },
  { lat: 58.6031, lng: 125.3894, radiusMeters: 9000 },
  { lat: 59.6483, lng: 112.7415, radiusMeters: 9000 },
  { lat: 60.726, lng: 114.9541, radiusMeters: 9000 },
  { lat: 63.7553, lng: 121.6247, radiusMeters: 7000 },
  { lat: 63.286, lng: 118.3319, radiusMeters: 7000 },
  { lat: 60.3742, lng: 120.435, radiusMeters: 7000 },
  { lat: 58.9681, lng: 126.2871, radiusMeters: 7000 },
  { lat: 61.4626, lng: 128.4747, radiusMeters: 6000 },
];

export const ALLOWED_PLACE_TYPES = new Set([
  "locality",
  "political",
  "sublocality",
  "neighborhood",
  "administrative_area_level_3",
]);

export const UI_TEXT: Record<
  Language,
  {
    title: string;
    xp: string;
    streak: string;
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
    confirm: string;
    error: string;
  }
> = {
  ru: {
    title: "FREEGUESSR - Ð¯ÐšÐ£Ð¢Ð˜Ð¯",
    xp: "XP",
    streak: "Ð¡Ñ‚Ñ€Ð¸Ðº",
    chooseMode: "Ð’Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ñ€ÐµÐ¶Ð¸Ð¼",
    chooseModeDescription: "Ð˜Ð³Ñ€Ð¾Ð²Ñ‹Ðµ Ð»Ð¾ÐºÐ°Ñ†Ð¸Ð¸ Ð¿Ð¾Ð´Ð±Ð¸Ñ€Ð°ÑŽÑ‚ÑÑ Ð²Ð½ÑƒÑ‚Ñ€Ð¸ Ð½Ð°ÑÐµÐ»ÐµÐ½Ð½Ñ‹Ñ… Ð¿ÑƒÐ½ÐºÑ‚Ð¾Ð² Ð¸ Ð² Ð¿Ñ€ÐµÐ´ÐµÐ»Ð°Ñ… Ð²Ñ‹Ð±Ñ€Ð°Ð½Ð½Ð¾Ð¹ Ñ‚ÐµÑ€Ñ€Ð¸Ñ‚Ð¾Ñ€Ð¸Ð¸.",
    yakutskOnly: "Ð¢Ð¾Ð»ÑŒÐºÐ¾ Ð¯ÐºÑƒÑ‚ÑÐº",
    allSakha: "Ð’ÑÑ Ð ÐµÑÐ¿ÑƒÐ±Ð»Ð¸ÐºÐ° Ð¡Ð°Ñ…Ð° (Ð¯ÐºÑƒÑ‚Ð¸Ñ)",
    loadingMap: "Ð—Ð°Ð³Ñ€ÑƒÐ·ÐºÐ° Ð¯Ð½Ð´ÐµÐºÑ ÐšÐ°Ñ€Ñ‚...",
    loadingRound: "Ð—Ð°Ð³Ñ€ÑƒÐ·ÐºÐ°...",
    checkingResult: "ÐŸÑ€Ð¾Ð²ÐµÑ€ÐºÐ° Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚Ð°...",
    settings: "ÐÐ°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸",
    language: "Ð¯Ð·Ñ‹Ðº",
    russian: "Ð ÑƒÑÑÐºÐ¸Ð¹",
    yakut: "Ð¯ÐºÑƒÑ‚ÑÐºÐ¸Ð¹",
    contact: "Ð¡Ð²ÑÐ·Ð°Ñ‚ÑŒÑÑ Ñ Ð½Ð°Ð¼Ð¸",
    correctRegion: "Ð’Ð•Ð ÐÐ«Ð™ Ð Ð•Ð“Ð˜ÐžÐ",
    wrongRegion: "ÐÐ•Ð’Ð•Ð ÐÐ«Ð™ Ð Ð•Ð“Ð˜ÐžÐ",
    region: "Ð ÐµÐ³Ð¸Ð¾Ð½",
    distance: "Ð”Ð¸ÑÑ‚Ð°Ð½Ñ†Ð¸Ñ",
    score: "ÐžÑ‡ÐºÐ¸",
    nextRound: "Ð¡Ð»ÐµÐ´ÑƒÑŽÑ‰Ð¸Ð¹ Ñ€Ð°ÑƒÐ½Ð´ (Space)",
    confirm: "ÐŸÐžÐ”Ð¢Ð’Ð•Ð Ð”Ð˜Ð¢Ð¬ ÐžÐ¢Ð’Ð•Ð¢",
    error: "ÐžÑˆÐ¸Ð±ÐºÐ°",
  },
  sah: {
    title: "FREEGUESSR - Ð¡ÐÐ¥Ð",
    xp: "XP",
    streak: "Ð¡Ñ‚Ñ€Ð¸Ðº",
    chooseMode: "Ð ÐµÐ¶Ð¸Ð¼ Ñ‚Ð°Ð»",
    chooseModeDescription: "ÐžÐ¾Ð½Ð½ÑŒÑƒÑƒ ÑÐ¸Ñ€Ð´ÑÑ€Ñ Ð½ÑÒ»Ð¸Ð»Ð¸ÑÐºÑ‚ÑÑ€ Ð¸Ò»Ð¸Ð³ÑÑ€ ÑƒÐ¾Ð½Ð½Ð° Ñ‚Ð°Ð»Ñ‹Ð»Ð»Ñ‹Ð±Ñ‹Ñ‚ ÑÐ¸Ñ€ Ð°Ñ€Ñ‹Ð»Ð»Ñ‹Ñ‹Ñ‚Ñ‹Ð³Ð°Ñ€ Ð±ÑƒÐ»ÑƒÐ»Ð»Ð°Ñ€.",
    yakutskOnly: "Ð¯ÐºÑƒÑ‚ÑÐºÐ°Ð¹ ÑÑ€Ñ",
    allSakha: "Ð‘Ò¯Ñ‚Ò¯Ð½ Ð¡Ð°Ñ…Ð° Ó¨Ñ€Ó©ÑÐ¿Ò¯Ò¯Ð±Ò¯Ð»Ò¯ÐºÑÑ‚Ñ",
    loadingMap: "Ð¯Ð½Ð´ÐµÐºÑ ÐšÐ°Ñ€Ñ‚Ð°Ð»Ð°Ñ€ Ñ…Ð°Ñ‡Ð°Ð¹Ð´Ð°Ð½Ð° Ñ‚ÑƒÑ€Ð°Ñ€...",
    loadingRound: "Ð¥Ð°Ñ‡Ð°Ð¹Ð´Ð°Ð½Ð° Ñ‚ÑƒÑ€Ð°Ñ€...",
    checkingResult: "Ð¢Ò¯Ð¼Ò¯Ðº Ð±ÑÑ€ÑÐ±Ð¸ÑÑ€ÐºÑÑ‚Ñ...",
    settings: "Ð¢ÑƒÑ€ÑƒÐ¾Ñ€ÑƒÑƒ",
    language: "Ð¢Ñ‹Ð»",
    russian: "ÐÑƒÑƒÑ‡Ñ‡Ð°",
    yakut: "Ð¡Ð°Ñ…Ð°",
    contact: "Ð‘Ð¸Ò»Ð¸ÑÑ…Ñ ÑÑƒÑ€ÑƒÐ¹",
    correctRegion: "Ð¡Ó¨ÐŸ Ð Ð•Ð“Ð˜ÐžÐ",
    wrongRegion: "Ð¡ÐÐ¢ÐÐÐ‘ÐÐ¢ Ð Ð•Ð“Ð˜ÐžÐ",
    region: "Ð ÐµÐ³Ð¸Ð¾Ð½",
    distance: "Ð«Ñ€Ð°Ð°Ñ…Ñ‚Ð°Ð°Ò»Ñ‹Ð½",
    score: "Ð‘Ð°Ð°Ð»",
    nextRound: "ÐÐ½Ñ‹Ð³Ñ‹ Ñ€Ð°ÑƒÐ½Ð´ (Space)",
    confirm: "Ð­ÐŸÐŸÐ˜Ð­Ð¢Ð˜Ð Ð‘Ð˜Ð“Ð­Ð›Ð­Ð­",
    error: "ÐÐ»Ò•Ð°Ñ",
  },
};
