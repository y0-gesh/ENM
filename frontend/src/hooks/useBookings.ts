import { useState, useEffect, useCallback } from 'react';
import { Booking } from '../types';
import { apiFetch } from '../lib/api';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/bookings');
      if (response.success) {
        setBookings(response.data || []);
      }
    } catch (err: any) {
      console.error('[Bookings Hook] Fetch error:', err);
      setError(err.message || 'Failed to retrieve bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
  };
}
