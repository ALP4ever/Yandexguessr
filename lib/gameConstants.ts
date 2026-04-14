import type { Bounds, GameMode, SeedLocation } from "./gameTypes.ts";

export const TOTAL_ROUNDS = 5;

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
  // Крупные города

  { lat: 62.15, lng: 117.63, radiusMeters: 6000 },  // Сунтар

];

export const YAKUTSK_LOCATION_SEEDS: SeedLocation[] = [
  { lat: 62.0272, lng: 129.7326, radiusMeters: 2500 },
  { lat: 62.035, lng: 129.675, radiusMeters: 2200 },
  { lat: 62.05, lng: 129.71, radiusMeters: 2200 },
  { lat: 62.01, lng: 129.69, radiusMeters: 2200 },
  { lat: 62.015, lng: 129.765, radiusMeters: 2000 },
  { lat: 61.995, lng: 129.735, radiusMeters: 1800 },
];

export const ALLOWED_PLACE_TYPES = new Set([
  "locality",
  "political",
  "sublocality",
  "neighborhood",
  "administrative_area_level_3",
]);
