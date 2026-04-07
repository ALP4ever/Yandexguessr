import {
  ALLOWED_PLACE_TYPES,
  BOUNDS_BY_MODE,
  SAKHA_LOCATION_SEEDS,
  YAKUTSK_LOCATION_SEEDS,
  type Bounds,
  type GameMode,
  type LatLng,
  type SeedLocation,
} from "./gameConfig.ts";

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

export const isSakhaRegion = (value: string | null | undefined) => {
  const normalized = normalizeRegionName(value);
  return normalized.includes("саха") || normalized.includes("якут");
};

export const isWithinBounds = (location: LatLng, bounds: Bounds) =>
  location.lat >= bounds.minLat &&
  location.lat <= bounds.maxLat &&
  location.lng >= bounds.minLng &&
  location.lng <= bounds.maxLng;

const toRad = (value: number) => (value * Math.PI) / 180;

export const haversineKm = (a: LatLng, b: LatLng) => {
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

const MAX_SCORE = 5000;

const SCORE_HALF_DISTANCE_KM: Record<GameMode, number> = {
  // Inside Yakutsk even a few kilometers is a meaningful miss, so the curve is much steeper.
  YAKUTSK: 2.5,
  // Keep Sakha close to the previous pacing for large-scale rounds.
  SAKHA: 275,
};

export const scoreFromDistance = (distanceKm: number, mode: GameMode) => {
  const halfDistanceKm = SCORE_HALF_DISTANCE_KM[mode];
  return Math.max(0, Math.round(MAX_SCORE * Math.pow(0.5, distanceKm / halfDistanceKm)));
};

export const metersToDelta = (meters: number, lat: number) => {
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

export const generateCandidateLocation = (mode: GameMode, bounds: Bounds) => {
  if (mode === "SAKHA") {
    const seed = SAKHA_LOCATION_SEEDS[Math.floor(Math.random() * SAKHA_LOCATION_SEEDS.length)];
    return randomLatLngNearSeed(seed, bounds);
  }

  if (mode === "YAKUTSK") {
    const seed = YAKUTSK_LOCATION_SEEDS[Math.floor(Math.random() * YAKUTSK_LOCATION_SEEDS.length)];
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

export const getPlaceTypesFromYandexKind = (kind: string | undefined) => mapYandexKindToTypes(kind);

export const isAllowedPopulatedPlace = (types: string[]) => types.some((type) => ALLOWED_PLACE_TYPES.has(type));

export const getBoundsForMode = (mode: GameMode) => BOUNDS_BY_MODE[mode];
