import { apiFetch } from '@/lib/api';
import { NearbyProvider } from '@/types';
import { useState, useEffect, useCallback } from 'react';

export function useNearbyProviders(
  lat: number | null,
  lng: number | null,
  radius: number = 10
) {
  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    if (lat === null || lng === null) {
      setProviders([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/providers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
      if (response.success) {
        setProviders(response.data || []);
      }
    } catch (err: any) {
      console.error('[Nearby Providers Hook] Fetch error:', err);
      setError(err.message || 'Failed to retrieve service providers.');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radius]);

  // Sync effect
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders,
  };
}
