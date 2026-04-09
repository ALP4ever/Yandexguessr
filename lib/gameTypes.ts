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
