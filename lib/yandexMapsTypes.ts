export type YandexCoordinates = [number, number];

export type YandexGeocoderMetaData = {
  kind?: string;
  text?: string;
  Address?: {
    Components?: Array<{
      kind?: string;
      name?: string;
    }>;
  };
};

export type YandexGeoObject = {
  properties: {
    get(path: string): unknown;
  };
};

export type YandexGeoObjectCollection = {
  each(callback: (geoObject: YandexGeoObject) => void): void;
};

export type YandexGeocodeResponse = {
  geoObjects: YandexGeoObjectCollection;
};

export type YandexPanorama = {
  getPosition(): YandexCoordinates;
};

export type YandexPanoramaPlayer = {
  destroy(): void;
};

export type YandexPlacemark = {
  geometry: {
    setCoordinates(coords: YandexCoordinates): void;
  };
};

export type YandexPolyline = YandexPlacemark;

export type YandexEvent = {
  get(name: "coords"): YandexCoordinates;
};

export type YandexMapInstance = {
  geoObjects: {
    add(object: YandexPlacemark | YandexPolyline): void;
    remove(object: YandexPlacemark | YandexPolyline): void;
  };
  events: {
    add(name: "click", handler: (event: YandexEvent) => void): void;
    remove(name: "click", handler: (event: YandexEvent) => void): void;
  };
  behaviors: {
    enable(features: string[]): void;
  };
  container: {
    fitToViewport(): void;
  };
  setCenter(center: YandexCoordinates, zoom: number, options?: { duration?: number }): void;
  setBounds(
    bounds: [YandexCoordinates, YandexCoordinates],
    options?: { checkZoomRange?: boolean; zoomMargin?: [number, number, number, number] }
  ): void;
  destroy(): void;
};

export type YandexMapsApi = {
  ready(callback: () => void): void;
  panorama: {
    locate(coords: YandexCoordinates, options: { radius: number; layer: string }): Promise<YandexPanorama[]>;
    Player: new (
      element: HTMLElement,
      panorama: YandexPanorama,
      options: {
        controls: unknown[];
        direction: [number, number];
        span: [number, number];
        addressControl: boolean;
        showRoadLabels: boolean;
        hotkeysEnabled: boolean;
      }
    ) => YandexPanoramaPlayer;
  };
  geocode(
    coords: YandexCoordinates,
    options: { results: number; bbox: [YandexCoordinates, YandexCoordinates]; rspn: 1 }
  ): Promise<YandexGeocodeResponse>;
  Map: new (
    element: HTMLElement,
    state: {
      center: YandexCoordinates;
      zoom: number;
      controls: unknown[];
    },
    options: {
      minZoom: number;
      suppressMapOpenBlock: boolean;
    }
  ) => YandexMapInstance;
  Placemark: new (
    coords: YandexCoordinates,
    data: Record<string, unknown>,
    options: { preset: string; iconColor: string }
  ) => YandexPlacemark;
  Polyline: new (
    coords: [YandexCoordinates, YandexCoordinates],
    data: Record<string, unknown>,
    options: { strokeColor: string; strokeWidth: number; strokeStyle: string; geodesic: boolean }
  ) => YandexPolyline;
};

export type YandexGeoObjectCollectionMap = YandexMapInstance;
