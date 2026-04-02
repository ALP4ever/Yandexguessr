import React, { useEffect, useMemo, useRef, useState } from "react";
import { BOUNDS_BY_MODE, type GameMode, type GameState, type LatLng } from "../lib/gameConfig.ts";

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
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  const modeBounds = useMemo(() => BOUNDS_BY_MODE[mode], [mode]);
  const modeCenter = useMemo(
    () => [(modeBounds.minLat + modeBounds.maxLat) / 2, (modeBounds.minLng + modeBounds.maxLng) / 2],
    [modeBounds]
  );
  const startZoom = mode === "YAKUTSK" ? 10 : 3;
  const isMobile = viewportSize.width < 640;
  const collapsedSize = useMemo(
    () => ({
      width: isMobile ? Math.min(viewportSize.width - 32, 420) : 320,
      height: isMobile ? 188 : 220,
    }),
    [isMobile, viewportSize.width]
  );
  const expanded = hovered || gameState === "RESULT" || isMobile;
  const expandedSize = useMemo(
    () =>
      isMobile
        ? {
            width: Math.min(viewportSize.width - 32, 420),
            height: Math.min(viewportSize.height * 0.3, 240),
          }
        : {
            width: Math.min(viewportSize.width * 0.92, 920),
            height: Math.min(viewportSize.height * 0.7, 640),
          },
    [isMobile, viewportSize.height, viewportSize.width]
  );
  const mapSize = expanded ? expandedSize : collapsedSize;

  const removeGeoObject = (map: any, ref: React.MutableRefObject<any>) => {
    if (!ref.current) {
      return;
    }

    map.geoObjects.remove(ref.current);
    ref.current = null;
  };

  const removeClickHandler = (map: any) => {
    if (!clickHandlerRef.current) {
      return;
    }

    map.events.remove("click", clickHandlerRef.current);
    clickHandlerRef.current = null;
  };

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      removeClickHandler(map);
      removeGeoObject(map, guessPlacemarkRef);
      removeGeoObject(map, targetPlacemarkRef);
      removeGeoObject(map, polylineRef);
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

    removeClickHandler(map);

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
    } else {
      removeGeoObject(map, guessPlacemarkRef);
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
    } else {
      removeGeoObject(map, targetPlacemarkRef);
    }
  }, [gameState, targetLocation, ymaps]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    removeGeoObject(map, polylineRef);

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
        zoomMargin: isMobile ? [20, 20, 240, 20] : [20, 20, 350, 20],
      });
    }
  }, [gameState, guessLocation, isMobile, targetLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    const fit = () => map.container.fitToViewport();
    let animationFrameId = 0;
    let timeoutId = 0;
    const animationDurationMs = 260;
    const startedAt = performance.now();

    const syncViewport = (now: number) => {
      fit();

      if (now - startedAt < animationDurationMs) {
        animationFrameId = window.requestAnimationFrame(syncViewport);
      }
    };

    animationFrameId = window.requestAnimationFrame(syncViewport);
    timeoutId = window.setTimeout(fit, animationDurationMs);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [gameState, mapSize.height, mapSize.width]);

  const mapClass = `mini-map map-transition ${expanded ? "expanded" : ""}`;

  return (
    <div
      className="relative"
      onMouseEnter={isMobile ? undefined : () => setHovered(true)}
      onMouseLeave={isMobile ? undefined : () => setHovered(false)}
    >
      <div className={mapClass} style={mapSize}>
        <div ref={mapRef} className="h-full w-full" />
        {gameState === "GUESSING" && (
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-center sm:inset-x-4 sm:bottom-4">
            <button
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold shadow transition sm:py-2 ${
                confirmDisabled
                  ? "bg-slate-200/70 text-slate-400"
                  : "bg-white/90 text-slate-900 hover:scale-[1.02]"
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
