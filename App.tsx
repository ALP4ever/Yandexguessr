import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StreetView from "./components/StreetView.tsx";
import MiniMap from "./components/MiniMap.tsx";
import logo from "./logo.svg";
import {
  type GameMode,
  type GameState,
  type GeneratedRound,
  type Language,
  type LatLng,
} from "./lib/gameConfig.ts";
import {
  generateCandidateLocation as sharedGenerateCandidateLocation,
  getBoundsForMode,
  haversineKm as calculateHaversineKm,
  isAllowedPopulatedPlace,
  isWithinBounds as isLocationWithinBounds,
  scoreFromDistance as calculateScoreFromDistance,
} from "./lib/mapUtils.ts";
import {
  loadYandexMaps as loadYandexMapsApi,
  PlacesService as SharedPlacesService,
  StreetViewService as SharedStreetViewService,
} from "./lib/yandexMaps.ts";

const UI_TEXT: Record<
  Language,
  {
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
    finalResults: string;
    roundsComplete: string;
    averageScore: string;
    totalDistance: string;
    bestRound: string;
    shareResult: string;
    shareSuccess: string;
    playAgain: string;
    error: string;
  }
> = {
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
    finalResults: "Финальные результаты",
    roundsComplete: "Раунд завершён",
    averageScore: "Средний результат",
    totalDistance: "Общая дистанця",
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
    chooseModeDescription: "Оонньуу сирдэрэ нэһилиэктэр иһигэр уонна талыллыбыт сир арыллыытыгар булуллар.",
    yakutskOnly: "Якутскай эрэ",
    allSakha: "Бүтүн Саха Өрөспүүбүлүкэтэ",
    loadingMap: "Яндекс Карталар хачайдана турар...",
    loadingRound: "Хачайдана турар...",
    checkingResult: "Түмүк бэрэбиэркэтэ...",
    settings: "Туруоруу",
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

const TOTAL_ROUNDS = 5;
const APP_TITLE = "Sakhaguessr";

type RoundSummary = {
  roundNumber: number;
  score: number;
  distanceKm: number;
};

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

const randomLatLngInBounds = (bounds: Bounds): LatLng => ({
  lat: randomInRange(bounds.minLat, bounds.maxLat),
  lng: randomInRange(bounds.minLng, bounds.maxLng),
});

const normalizeRegionName = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/giu, " ")
    .trim();

const isSakhaRegion = (value: string | null | undefined) => {
  const normalized = normalizeRegionName(value);
  return normalized.includes("саха") || normalized.includes("якут");
};

const isWithinBounds = (location: LatLng, bounds: Bounds) =>
  location.lat >= bounds.minLat &&
  location.lat <= bounds.maxLat &&
  location.lng >= bounds.minLng &&
  location.lng <= bounds.maxLng;

const toRad = (value: number) => (value * Math.PI) / 180;

const haversineKm = (a: LatLng, b: LatLng) => {
  const r = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * r * Math.asin(Math.sqrt(h));
};

const scoreFromDistance = (distanceKm: number) => Math.max(0, 5000 - Math.round(distanceKm * 5));

const getApiKeyCandidateUrls = () => {
  const candidates = [
    new URL("api-key.txt", document.baseURI).toString(),
    `${window.location.origin}/api-key.txt`,
  ];

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate)) {
      return false;
    }
    seen.add(candidate);
    return true;
  });
};

const getYandexMapsApiKeyFromEnv = () => {
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim();
  return apiKey || null;
};

const getYandexMapsApiKey = async () => {
  const envApiKey = getYandexMapsApiKeyFromEnv();
  if (envApiKey) {
    return envApiKey;
  }

  const candidateUrls = getApiKeyCandidateUrls();

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const apiKey = (await response.text()).trim();
      if (apiKey) {
        return apiKey;
      }
    } catch {
      continue;
    }
  }

  throw new Error(
    `Не удалось загрузить API-ключ. Укажите VITE_YANDEX_MAPS_API_KEY или файл api-key.txt. Проверенные пути: ${candidateUrls.join(", ")}`
  );
};

const loadYandexMaps = async () => {
  if (window.ymaps) {
    return new Promise<any>((resolve) => {
      window.ymaps?.ready(() => resolve(window.ymaps));
    });
  }

  const apiKey = await getYandexMapsApiKey();
  const scriptSrc = `${YANDEX_MAPS_URL}&apikey=${encodeURIComponent(apiKey)}`;

  return new Promise<any>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${scriptSrc}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => window.ymaps?.ready(() => resolve(window.ymaps)));
      existing.addEventListener("error", () => reject(new Error("Yandex Maps failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => window.ymaps?.ready(() => resolve(window.ymaps));
    script.onerror = () => reject(new Error("Yandex Maps failed to load"));
    document.head.appendChild(script);
  });
};

const metersToDelta = (meters: number, lat: number) => {
  const deltaLat = meters / 111320;
  const cosLat = Math.cos(toRad(lat));
  const safeCosLat = Math.abs(cosLat) < 0.0001 ? 0.0001 : cosLat;
  const deltaLng = meters / (111320 * safeCosLat);
  return { deltaLat, deltaLng };
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const randomLatLngNearSeed = (seed: SeedLocation, bounds: Bounds): LatLng => {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * seed.radiusMeters;
  const northOffsetMeters = Math.cos(angle) * distance;
  const eastOffsetMeters = Math.sin(angle) * distance;
  const lat = seed.lat + northOffsetMeters / 111320;
  const lng = seed.lng + eastOffsetMeters / (111320 * Math.max(Math.cos(toRad(seed.lat)), 0.0001));

  return {
    lat: clamp(lat, bounds.minLat, bounds.maxLat),
    lng: clamp(lng, bounds.minLng, bounds.maxLng),
  };
};

const generateCandidateLocation = (mode: GameMode, bounds: Bounds) => {
  if (mode === "SAKHA") {
    const seed = SAKHA_LOCATION_SEEDS[Math.floor(Math.random() * SAKHA_LOCATION_SEEDS.length)];
    return randomLatLngNearSeed(seed, bounds);
  }
  return randomLatLngInBounds(bounds);
};

const mapYandexKindToTypes = (kind: string | undefined): string[] => {
  switch (kind) {
    case "locality":
      return ["locality", "political"];
    case "district":
      return ["sublocality", "neighborhood", "administrative_area_level_3", "political"];
    case "area":
      return ["administrative_area_level_3", "political"];
    case "province":
      return ["administrative_area_level_1", "political"];
    case "country":
      return ["country", "political"];
    default:
      return [];
  }
};

class StreetViewService {
  private ymaps: any;

  constructor(ymaps: any) {
    this.ymaps = ymaps;
  }

  async getPanorama(request: { location: LatLng; radius: number; source: "OUTDOOR" }) {
    const panoramas = await this.ymaps.panorama.locate([request.location.lat, request.location.lng], {
      radius: request.radius,
      layer: "yandex#panorama",
    });

    if (!panoramas || panoramas.length === 0) {
      return { status: "ZERO_RESULTS" as const };
    }

    const pano = panoramas[0];
    const position = pano.getPosition();
    return {
      status: "OK" as const,
      location: { lat: position[0], lng: position[1] },
      panorama: pano,
    };
  }
}

class PlacesService {
  private ymaps: any;
  private nearbyCache = new Map<string, { results: PlaceResult[]; status: "OK" | "ZERO_RESULTS" }>();

  constructor(ymaps: any) {
    this.ymaps = ymaps;
  }

  async nearbySearch(request: { location: LatLng; radius: number }) {
    const cacheKey = [
      request.location.lat.toFixed(4),
      request.location.lng.toFixed(4),
      Math.round(request.radius),
    ].join(":");

    const cached = this.nearbyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { deltaLat, deltaLng } = metersToDelta(request.radius, request.location.lat);
    const bbox = [
      [request.location.lat - deltaLat, request.location.lng - deltaLng],
      [request.location.lat + deltaLat, request.location.lng + deltaLng],
    ];

    const geoObjects = await this.ymaps.geocode([request.location.lat, request.location.lng], {
      results: 10,
      bbox,
      rspn: 1,
    });

    const results: PlaceResult[] = [];
    geoObjects.geoObjects.each((geoObject: any) => {
      const meta = geoObject.properties.get("metaDataProperty.GeocoderMetaData");
      const kind = meta?.kind as string | undefined;
      const name = meta?.text || geoObject.properties.get("name");
      const types = mapYandexKindToTypes(kind);
      results.push({ name, types });
    });

    const response = {
      results,
      status: results.length > 0 ? ("OK" as const) : ("ZERO_RESULTS" as const),
    };

    this.nearbyCache.set(cacheKey, response);
    return response;
  }
}

const extractAdminLevel1 = (geocodeResult: any) => {
  const meta = geocodeResult?.properties?.get("metaDataProperty.GeocoderMetaData");
  const components = meta?.Address?.Components || [];

  for (const component of components) {
    if (component.kind === "province") {
      return component.name as string;
    }
  }

  for (const component of components) {
    if (component.kind === "area") {
      return component.name as string;
    }
  }

  return meta?.text ?? null;
};

const App = () => {
  const [ymapsApi, setYmapsApi] = useState<any>(null);
  const [language, setLanguage] = useState<Language>("ru");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<GameState>("MODE_SELECT");
  const [targetLocation, setTargetLocation] = useState<LatLng | null>(null);
  const [targetPanorama, setTargetPanorama] = useState<any>(null);
  const [guessLocation, setGuessLocation] = useState<LatLng | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [totalXP, setTotalXP] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundHistory, setRoundHistory] = useState<RoundSummary[]>([]);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(UI_TEXT.ru.loadingMap);
  const [error, setError] = useState<string | null>(null);
  const generationLock = useRef(false);

  const t = UI_TEXT[language];
  const isFinalRound = currentRound >= TOTAL_ROUNDS;
  const averageScore = roundHistory.length
    ? Math.round(roundHistory.reduce((sum, round) => sum + round.score, 0) / roundHistory.length)
    : 0;
  const totalDistance = roundHistory.reduce((sum, round) => sum + round.distanceKm, 0);
  const bestRound = roundHistory.reduce<RoundSummary | null>(
    (best, round) => (!best || round.score > best.score ? round : best),
    null
  );

  useEffect(() => {
    let mounted = true;

    loadYandexMapsApi()
      .then((api) => {
        if (mounted) {
          setYmapsApi(api);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : t.error);
        }
      });

    return () => {
      mounted = false;
    };
  }, [t.error]);

  const streetViewService = useMemo(() => (ymapsApi ? new SharedStreetViewService(ymapsApi) : null), [ymapsApi]);
  const placesService = useMemo(() => (ymapsApi ? new SharedPlacesService(ymapsApi) : null), [ymapsApi]);
  const isMapReady = Boolean(ymapsApi && streetViewService && placesService);

  const generateValidLocation = useCallback(
    async (mode: GameMode, attempt = 0): Promise<GeneratedRound> => {
      if (!streetViewService || !placesService) {
        throw new Error("Сервисы карты недоступны");
      }

      if (attempt > 160) {
        throw new Error("Не удалось найти подходящую локацию");
      }

      const bounds = getBoundsForMode(mode);
      const candidate = sharedGenerateCandidateLocation(mode, bounds);
      const panorama = await streetViewService.getPanorama({
        location: candidate,
        radius: mode === "SAKHA" ? 25000 : 10000,
        source: "OUTDOOR",
      });

      if (panorama.status === "ZERO_RESULTS" || !panorama.location) {
        return generateValidLocation(mode, attempt + 1);
      }

      if (!isLocationWithinBounds(panorama.location, bounds)) {
        return generateValidLocation(mode, attempt + 1);
      }

      const nearby = await placesService.nearbySearch({
        location: panorama.location,
        radius: mode === "SAKHA" ? 500 : 200,
      });

      if (nearby.status !== "OK") {
        return generateValidLocation(mode, attempt + 1);
      }

      const isPopulated = nearby.results.some((result) => isAllowedPopulatedPlace(result.types));

      if (!isPopulated) {
        return generateValidLocation(mode, attempt + 1);
      }

      return {
        location: panorama.location,
        panorama: panorama.panorama,
      };
    },
    [placesService, streetViewService]
  );

  const startNewRound = useCallback(
    async (mode: GameMode) => {
      if (generationLock.current) {
        return;
      }

      generationLock.current = true;
      setError(null);
      setLoadingMessage(t.loadingRound);
      setGameState("LOADING_RESULT");
      setShareFeedback(null);
      setGuessLocation(null);
      setTargetLocation(null);
      setTargetPanorama(null);
      setDistance(null);
      setScore(0);

      try {
        const roundData = await generateValidLocation(mode);
        setTargetLocation(roundData.location);
        setTargetPanorama(roundData.panorama);
        setGameState("GUESSING");
      } catch (err) {
        setError(err instanceof Error ? err.message : t.error);
      } finally {
        generationLock.current = false;
      }
    },
    [generateValidLocation, t.error, t.loadingRound]
  );

  const handleModeSelect = useCallback(
    (mode: GameMode) => {
      if (!ymapsApi || !streetViewService || !placesService) {
        return;
      }
      setCurrentRound(1);
      setRoundHistory([]);
      setTotalXP(0);
      setDistance(null);
      setScore(0);
      setShareFeedback(null);
      setGameMode(mode);
      startNewRound(mode);
    },
    [placesService, startNewRound, streetViewService, ymapsApi]
  );

  const handleConfirmGuess = useCallback(async () => {
    if (!guessLocation || !targetLocation || !gameMode) {
      return;
    }

    setGameState("LOADING_RESULT");
    setLoadingMessage(t.checkingResult);

    const distanceKm = calculateHaversineKm(targetLocation, guessLocation);
    const roundScore = calculateScoreFromDistance(distanceKm, gameMode);
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
  }, [currentRound, gameMode, guessLocation, t.checkingResult, targetLocation]);

  const handleNextRound = useCallback(() => {
    if (!gameMode) {
      return;
    }
    setCurrentRound((prev) => prev + 1);
    startNewRound(gameMode);
  }, [gameMode, startNewRound]);

  const handleShowFinalResults = useCallback(() => {
    setGameState("FINAL_RESULT");
  }, []);

  const handlePlayAgain = useCallback(() => {
    setGameMode(null);
    setGameState("MODE_SELECT");
    setCurrentRound(1);
    setRoundHistory([]);
    setTotalXP(0);
    setGuessLocation(null);
    setTargetLocation(null);
    setTargetPanorama(null);
    setDistance(null);
    setScore(0);
    setShareFeedback(null);
  }, []);

  const handleShareResults = useCallback(async () => {
    if (!gameMode || roundHistory.length === 0) {
      return;
    }

    const shareText = [
      APP_TITLE,
      `${t.finalResults}: ${totalXP} XP`,
      `${t.roundsComplete}: ${roundHistory.length}/${TOTAL_ROUNDS}`,
      `${t.averageScore}: ${averageScore}`,
      `${t.totalDistance}: ${totalDistance.toFixed(2)} km`,
      bestRound ? `${t.bestRound}: #${bestRound.roundNumber} (${bestRound.score})` : "",
      `Mode: ${gameMode}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        throw new Error("Share unavailable");
      }

      setShareFeedback(t.shareSuccess);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(shareText);
        setShareFeedback(t.shareSuccess);
      } catch {
        setShareFeedback("Share unavailable");
      }
    }
  }, [averageScore, bestRound, gameMode, roundHistory.length, t, totalDistance, totalXP]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === "Space" && gameState === "RESULT") {
        event.preventDefault();
        if (isFinalRound) {
          handleShowFinalResults();
          return;
        }

        handleNextRound();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState, handleNextRound, handleShowFinalResults, isFinalRound]);

  useEffect(() => {
    if (gameState === "LOADING_RESULT" && !targetLocation) {
      setLoadingMessage(t.loadingRound);
    }
  }, [gameState, t.loadingRound, targetLocation]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="glass-panel rounded-2xl px-6 py-4 text-white shadow-xl">
          <div className="text-lg font-semibold">{t.error}</div>
          <div className="mt-2 text-sm opacity-80">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <header className="absolute left-0 right-0 top-0 z-30 flex items-start justify-between pl-0 pr-6 pt-2">
        <div className="flex h-20 w-[20rem] -translate-y-1 items-center justify-center gap-4 px-4 text-white">
          <img src={logo} alt={APP_TITLE} className="h-14 w-14 shrink-0" />
          <span className="text-[1.15rem] font-semibold tracking-[0.08em]">{APP_TITLE}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-900">
          {gameMode && gameState !== "MODE_SELECT" && (
            <div className="rounded-full bg-white/90 px-3 py-1 shadow">
              {t.round}: {Math.min(currentRound, TOTAL_ROUNDS)} {t.roundsShort} {TOTAL_ROUNDS}
            </div>
          )}
          <div className="rounded-full bg-white/90 px-3 py-1 shadow">
            {t.xp}: {totalXP}
          </div>
        </div>
      </header>

      <div className="absolute bottom-6 left-6 z-30 w-[min(92vw,320px)]">
        <div className="flex flex-col items-start gap-3">
          {settingsOpen && (
            <div className="glass-panel rounded-3xl px-5 py-4 text-white shadow-2xl">
              <div className="text-sm font-semibold">{t.settings}</div>
              <div className="mt-3 text-xs uppercase text-white/60">{t.language}</div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setLanguage("ru")}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    language === "ru" ? "bg-white text-slate-900" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {t.russian}
                </button>
                <button
                  onClick={() => setLanguage("sah")}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    language === "sah" ? "bg-white text-slate-900" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {t.yakut}
                </button>
              </div>
              <a
                href="https://t.me/Alpinisti4"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-white/90 px-7 py-2 text-sm font-semibold text-slate-900 shadow transition hover:scale-[1.04]"
              >
                {t.contact}
              </a>
            </div>
          )}

          <button
            onClick={() => setSettingsOpen((prev) => !prev)}
            aria-label={t.settings}
            className="glass-panel flex h-12 w-12 items-center justify-center rounded-full text-white shadow-2xl transition hover:scale-[1.04]"
          >
            <span className="text-xl leading-none">⚙</span>
          </button>
        </div>
      </div>

      {gameState === "MODE_SELECT" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/70">
          <div className="glass-panel w-full max-w-lg rounded-3xl px-8 py-10 text-white shadow-2xl">
            <h1 className="text-2xl font-semibold">{t.chooseMode}</h1>
            <p className="mt-2 text-sm opacity-80">{t.chooseModeDescription}</p>
            <div className="mt-6 grid gap-4">
              <button
                disabled={!isMapReady}
                onClick={() => handleModeSelect("YAKUTSK")}
                className={`rounded-2xl px-5 py-4 text-left text-sm font-semibold text-slate-900 shadow-lg transition ${
                  isMapReady
                    ? "bg-emerald-400/90 hover:scale-[1.02]"
                    : "cursor-not-allowed bg-slate-300/70 text-slate-600 opacity-70"
                }`}
              >
                {t.yakutskOnly}
              </button>
              <button
                disabled={!isMapReady}
                onClick={() => handleModeSelect("SAKHA")}
                className={`rounded-2xl px-5 py-4 text-left text-sm font-semibold text-slate-900 shadow-lg transition ${
                  isMapReady
                    ? "bg-sky-300/90 hover:scale-[1.02]"
                    : "cursor-not-allowed bg-slate-300/70 text-slate-600 opacity-70"
                }`}
              >
                {t.allSakha}
              </button>
            </div>
            {!isMapReady && <p className="mt-4 text-sm opacity-80">{t.loadingMap}</p>}
          </div>
        </div>
      )}

      {gameState === "FINAL_RESULT" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-6">
          <div className="glass-panel w-full max-w-2xl rounded-3xl px-8 py-8 text-white shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/60">{t.finalResults}</div>
                <h2 className="mt-2 text-3xl font-semibold">{totalXP} XP</h2>
                <p className="mt-2 text-sm text-white/75">
                  {t.roundsComplete}: {roundHistory.length}/{TOTAL_ROUNDS}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                <div className="text-xs text-white/60">{t.averageScore}</div>
                <div className="text-2xl font-semibold">{averageScore}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/8 px-4 py-4">
                <div className="text-xs text-white/60">{t.totalDistance}</div>
                <div className="mt-2 text-xl font-semibold">{totalDistance.toFixed(2)} km</div>
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-4">
                <div className="text-xs text-white/60">{t.bestRound}</div>
                <div className="mt-2 text-xl font-semibold">
                  {bestRound ? `#${bestRound.roundNumber}` : "-"}
                </div>
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-4">
                <div className="text-xs text-white/60">{t.score}</div>
                <div className="mt-2 text-xl font-semibold">{bestRound ? bestRound.score : 0}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {roundHistory.map((round) => (
                <div
                  key={round.roundNumber}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3"
                >
                  <div className="font-semibold">
                    {t.round} {round.roundNumber}
                  </div>
                  <div className="text-sm text-white/75">{round.distanceKm.toFixed(2)} km</div>
                  <div className="text-lg font-semibold">{round.score}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-white/70">{shareFeedback ?? ""}</div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleShareResults}
                  className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-slate-900 shadow transition hover:scale-[1.02]"
                >
                  {t.shareResult}
                </button>
                <button
                  onClick={handlePlayAgain}
                  className="rounded-full bg-sky-300 px-5 py-2 text-sm font-semibold text-slate-900 shadow transition hover:scale-[1.02]"
                >
                  {t.playAgain}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="h-full w-full">
        {ymapsApi && targetLocation && (
          <StreetView ymaps={ymapsApi} location={targetLocation} panorama={targetPanorama} />
        )}
        {!ymapsApi && (
          <div className="flex h-full items-center justify-center text-lg font-semibold text-slate-700">{t.loadingMap}</div>
        )}
      </main>

      {gameMode && ymapsApi && (
        <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3">
          <div
            className={`score-panel mini-map-width expanded glass-panel rounded-3xl px-6 py-5 text-white shadow-2xl ${
              gameState === "RESULT" ? "visible" : "hidden"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-right">
                <div className="text-sm opacity-80">{t.distance}</div>
                <div className="text-2xl font-semibold">{distance ? distance.toFixed(2) : "0.00"} км</div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80">{t.score}</div>
                <div className="text-2xl font-semibold">{score}</div>
              </div>
              <button
                onClick={isFinalRound ? handleShowFinalResults : handleNextRound}
                className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-slate-900 shadow transition hover:scale-[1.02]"
              >
                {isFinalRound ? t.finalResults : t.nextRound}
              </button>
            </div>
          </div>

          <MiniMap
            ymaps={ymapsApi}
            mode={gameMode}
            targetLocation={targetLocation}
            guessLocation={guessLocation}
            gameState={gameState}
            onGuess={setGuessLocation}
            onConfirm={handleConfirmGuess}
            confirmDisabled={!guessLocation || gameState !== "GUESSING"}
            confirmLabel={t.confirm}
          />
        </div>
      )}

      {gameState === "LOADING_RESULT" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40">
          <div className="glass-panel rounded-2xl px-6 py-4 text-white shadow-xl">
            <div className="text-sm font-semibold">{loadingMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
