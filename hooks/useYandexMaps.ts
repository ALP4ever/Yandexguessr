import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../lib/errors.ts";
import { loadYandexMaps, PlacesService, StreetViewService } from "../lib/yandexMaps.ts";

export const useYandexMaps = (fallbackErrorMessage: string) => {
  const [ymapsApi, setYmapsApi] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    loadYandexMaps()
      .then((api) => {
        if (mounted) {
          setYmapsApi(api);
        }
      })
      .catch((loadError) => {
        if (mounted) {
          setError(getErrorMessage(loadError, fallbackErrorMessage));
        }
      });

    return () => {
      mounted = false;
    };
  }, [fallbackErrorMessage]);

  const streetViewService = useMemo(() => (ymapsApi ? new StreetViewService(ymapsApi) : null), [ymapsApi]);
  const placesService = useMemo(() => (ymapsApi ? new PlacesService(ymapsApi) : null), [ymapsApi]);

  return {
    ymapsApi,
    streetViewService,
    placesService,
    isMapReady: Boolean(ymapsApi && streetViewService && placesService),
    error,
    setError,
  };
};
