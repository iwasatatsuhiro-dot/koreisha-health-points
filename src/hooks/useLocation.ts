import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

export type LocationResult =
  | { status: 'ok'; latitude: number; longitude: number; accuracy?: number | null }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string };

export function useCurrentLocation() {
  const [result, setResult] = useState<LocationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLocation = useCallback(async (): Promise<LocationResult> => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const r: LocationResult = { status: 'denied' };
        setResult(r);
        return r;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const r: LocationResult = {
        status: 'ok',
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      setResult(r);
      return r;
    } catch (e) {
      const r: LocationResult = {
        status: 'error',
        message: e instanceof Error ? e.message : String(e),
      };
      setResult(r);
      return r;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, fetchLocation };
}
