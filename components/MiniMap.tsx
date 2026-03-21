import React, { useEffect, useMemo, useRef, useState } from "react";

type GameMode = "YAKUTSK" | "SAKHA";
type GameState = "MODE_SELECT" | "GUESSING" | "LOADING_RESULT" | "RESULT";

type LatLng = {
  lat: number;
  lng: number;
};

type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

type MiniMapProps = {
  ymaps: any;
  mode: GameMode;
  targetLocation: LatLng | null;
  guessLocation: LatLng | null;
  gameState: GameState;
  onGuess: (location: LatLng) => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
  confirmLabel: string;
};

const BOUNDS_BY_MODE: Record<GameMode, Bounds> = {
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

const MiniMap = ({
  ymaps,
  mode,
  targetLocation,
  guessLocation,
  gameState,
  onGuess,
  onConfirm,
  confirmDisabled,
  confirmLabel,
}: MiniMapProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const guessPlacemarkRef = useRef<any>(null);
  const targetPlacemarkRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const clickHandlerRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  const modeBounds = useMemo(() => BOUNDS_BY_MODE[mode], [mode]);
  const modeCenter = useMemo(
    () => [(modeBounds.minLat + modeBounds.maxLat) / 2, (modeBounds.minLng + modeBounds.maxLng) / 2],
    [modeBounds]
  );
  const startZoom = mode === "YAKUTSK" ? 10 : 3;

  useEffect(() => {
    if (!ymaps || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    const map = new ymaps.Map(
      mapRef.current,
      {
        center: modeCenter,
        zoom: startZoom,
        controls: [],
      },
      {
        minZoom: 2,
        suppressMapOpenBlock: true,
      }
    );

    map.behaviors.enable(["drag", "scrollZoom", "multiTouch"]);
    mapInstanceRef.current = map;

    return () => {
      map.destroy();
      mapInstanceRef.current = null;
    };
  }, [modeCenter, startZoom, ymaps]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || gameState === "RESULT") {
      return;
    }

    map.setCenter(modeCenter, startZoom, { duration: 0 });
  }, [gameState, modeCenter, startZoom]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    if (clickHandlerRef.current) {
      map.events.remove("click", clickHandlerRef.current);
      clickHandlerRef.current = null;
    }

    if (gameState === "GUESSING") {
      const handler = (event: any) => {
        const coords = event.get("coords");
        onGuess({ lat: coords[0], lng: coords[1] });
      };

      clickHandlerRef.current = handler;
      map.events.add("click", handler);
    }
  }, [gameState, onGuess]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    if (guessLocation) {
      if (!guessPlacemarkRef.current) {
        guessPlacemarkRef.current = new ymaps.Placemark(
          [guessLocation.lat, guessLocation.lng],
          {},
          {
            preset: "islands#redIcon",
            iconColor: "#ef4444",
          }
        );
        map.geoObjects.add(guessPlacemarkRef.current);
      } else {
        guessPlacemarkRef.current.geometry.setCoordinates([guessLocation.lat, guessLocation.lng]);
      }
    } else if (guessPlacemarkRef.current) {
      map.geoObjects.remove(guessPlacemarkRef.current);
      guessPlacemarkRef.current = null;
    }
  }, [guessLocation, ymaps]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    if (gameState === "RESULT" && targetLocation) {
      if (!targetPlacemarkRef.current) {
        targetPlacemarkRef.current = new ymaps.Placemark(
          [targetLocation.lat, targetLocation.lng],
          {},
          {
            preset: "islands#greenIcon",
            iconColor: "#22c55e",
          }
        );
        map.geoObjects.add(targetPlacemarkRef.current);
      } else {
        targetPlacemarkRef.current.geometry.setCoordinates([targetLocation.lat, targetLocation.lng]);
      }
    } else if (targetPlacemarkRef.current) {
      map.geoObjects.remove(targetPlacemarkRef.current);
      targetPlacemarkRef.current = null;
    }
  }, [gameState, targetLocation, ymaps]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    if (polylineRef.current) {
      map.geoObjects.remove(polylineRef.current);
      polylineRef.current = null;
    }

    if (gameState === "RESULT" && targetLocation && guessLocation) {
      polylineRef.current = new ymaps.Polyline(
        [
          [guessLocation.lat, guessLocation.lng],
          [targetLocation.lat, targetLocation.lng],
        ],
        {},
        {
          strokeColor: "#1e293b",
          strokeWidth: 3,
          strokeStyle: "dash",
          geodesic: true,
        }
      );
      map.geoObjects.add(polylineRef.current);
    }
  }, [gameState, guessLocation, targetLocation, ymaps]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    if (gameState === "RESULT" && targetLocation && guessLocation) {
      const bounds = [
        [Math.min(targetLocation.lat, guessLocation.lat), Math.min(targetLocation.lng, guessLocation.lng)],
        [Math.max(targetLocation.lat, guessLocation.lat), Math.max(targetLocation.lng, guessLocation.lng)],
      ];

      map.setBounds(bounds, {
        checkZoomRange: true,
        zoomMargin: [20, 20, 350, 20],
      });
    }
  }, [gameState, guessLocation, targetLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    const fit = () => map.container.fitToViewport();
    const immediate = window.setTimeout(fit, 0);
    const afterTransition = window.setTimeout(fit, 260);

    return () => {
      window.clearTimeout(immediate);
      window.clearTimeout(afterTransition);
    };
  }, [hovered, gameState]);

  const expanded = hovered || gameState === "RESULT";
  const mapClass = `mini-map map-transition ${expanded ? "expanded" : ""}`;

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className={mapClass}>
        <div ref={mapRef} className="h-full w-full" />
        {gameState === "GUESSING" && (
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-center">
            <button
              className={`w-full rounded-xl px-4 py-2 text-sm font-semibold shadow transition ${
                confirmDisabled ? "bg-slate-200/70 text-slate-400" : "bg-white/90 text-slate-900 hover:scale-[1.02]"
              }`}
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniMap;
