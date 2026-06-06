'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/navigation';
import { useGeolocation } from '../hooks/useGeolocation';
import { useNearbyProviders } from '../hooks/useNearbyProviders';
import SearchBar from '../components/SearchBar';
import ProviderCard from '../components/ProviderCard';
import { Loader2, AlertCircle, RefreshCw, Compass, MapPin, Sparkles, Briefcase, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Geolocation
  const { coords, setCoords, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();

  // Filters & State
  const [categorySearch, setCategorySearch] = useState('');
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'distance' | 'rating'
  const [radius, setRadius] = useState(15); // Default 15km

  // Manual Coordinate Overrides
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Fetch Providers hook
  const { providers, loading: providersLoading, error: providersError, refetch } = useNearbyProviders(
    coords?.lat || null,
    coords?.lng || null,
    radius
  );

  // Auth Guard redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleManualCoordsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoords({ lat, lng });
    } else {
      alert('Please enter valid numerical coordinate values.');
    }
  };

  // Client side filtering for service category search
  const filteredAndSortedProviders = providers
    .filter((p) => {
      if (!categorySearch.trim()) return true;
      return p.serviceCategory.toLowerCase().includes(categorySearch.toLowerCase().trim());
    })
    .sort((a, b) => {
      if (sortBy === 'distance') {
        return a.distance - b.distance; // closest first
      }
      if (sortBy === 'rating') {
        return b.avgRating - a.avgRating; // highest rating first
      }
      // default: composite score
      return b.score - a.score;
    });

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 size={36} className="animate-spin text-violet-500" />
      </div>
    );
  }

  const isProvider = user?.role === 'PROVIDER';

  return (
    <div className="flex flex-col gap-6">
      {/* Provider Welcome Dashboard Panel */}
      {isProvider && (
        <div className="glass-panel p-6 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-indigo-600/5 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-violet-400" />
              Provider Control Panel Active
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              You are logged in as a Service Provider. Check your active bookings or manage your availability.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/bookings"
              className="glow-btn px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar size={14} />
              View Bookings
            </Link>
            <Link
              href="/profile"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              Manage Profile
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid: Info columns + Search */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side: Geolocation details */}
        <div className="glass-panel p-6 rounded-2xl w-full lg:w-80 border border-white/10 shrink-0 flex flex-col gap-5">
          <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
            <Compass size={16} className="text-violet-400" />
            Your Location
          </h3>

          {geoLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
              <Loader2 size={16} className="animate-spin text-violet-500" />
              <span>Locating device...</span>
            </div>
          ) : geoError ? (
            <div className="flex flex-col gap-3 py-2">
              <div className="flex gap-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded-xl border border-rose-500/15">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{geoError}</span>
              </div>

              {/* Manual Coordinate Form */}
              <form onSubmit={handleManualCoordsSubmit} className="flex flex-col gap-3 mt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Lat</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="40.7128"
                      className="glass-input p-2 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Lng</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                      placeholder="-74.0060"
                      className="glass-input p-2 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="glow-btn py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
                >
                  Apply Coordinates
                </button>
              </form>
            </div>
          ) : coords ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-sm text-slate-300">
                <div className="p-1.5 rounded-lg bg-violet-600/15 border border-violet-500/20 text-violet-400">
                  <MapPin size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Active Coordinates</span>
                  <span className="text-xs font-mono text-white">
                    {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
                  </span>
                </div>
              </div>

              <button
                onClick={requestLocation}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-violet-400 hover:text-white bg-violet-600/5 hover:bg-violet-600/10 border border-violet-500/20 transition-all cursor-pointer mt-2"
              >
                <RefreshCw size={12} />
                Refresh Location
              </button>
            </div>
          ) : null}
        </div>

        {/* Right Side: Search results and lists */}
        <div className="flex-1 w-full flex flex-col">
          {coords ? (
            <>
              {/* Search Control Board */}
              <SearchBar
                category={categorySearch}
                setCategory={setCategorySearch}
                sortBy={sortBy}
                setSortBy={setSortBy}
                radius={radius}
                setRadius={setRadius}
              />

              {/* Providers Status */}
              {providersLoading ? (
                // Skeleton Grid
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="glass-card rounded-2xl p-6 h-60 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="skeleton w-20 h-5"></div>
                          <div className="skeleton w-16 h-5"></div>
                        </div>
                        <div className="skeleton w-36 h-6 mb-3"></div>
                        <div className="skeleton w-24 h-4 mb-4"></div>
                        <div className="skeleton w-full h-8"></div>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-auto">
                        <div className="skeleton w-16 h-5"></div>
                        <div className="skeleton w-20 h-8"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : providersError ? (
                <div className="glass-panel p-8 rounded-2xl text-center border border-rose-500/10 text-slate-300">
                  <p className="text-rose-400 mb-2">Error loading providers: {providersError}</p>
                  <button
                    onClick={refetch}
                    className="glow-btn px-4 py-2 rounded-xl text-xs font-bold text-white mt-2 cursor-pointer"
                  >
                    Retry Request
                  </button>
                </div>
              ) : filteredAndSortedProviders.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl text-center border border-white/10 flex flex-col items-center justify-center gap-3">
                  <div className="p-4 rounded-full bg-white/5 text-slate-400 border border-white/10 mb-2">
                    <Briefcase size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-white">No Providers Found</h4>
                  <p className="text-sm text-slate-400 max-w-sm">
                    We couldn&apos;t find any active service providers matching your parameters within {radius} km. Try widening your search radius or modifying your category filter.
                  </p>
                </div>
              ) : (
                /* Cards list */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAndSortedProviders.map((prov) => (
                    <ProviderCard key={prov.id} provider={prov} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="glass-panel p-12 rounded-2xl text-center border border-white/10 flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/20 mb-2">
                <MapPin size={32} />
              </div>
              <h4 className="text-lg font-bold text-white">Location Access Required</h4>
              <p className="text-sm text-slate-400 max-w-sm">
                To discover local providers, we need to know your coordinates. Please share browser location permissions or type coordinates manually on the sidebar.
              </p>
              <button
                onClick={requestLocation}
                className="glow-btn px-5 py-3 rounded-xl text-xs font-semibold text-white mt-2 cursor-pointer"
              >
                Allow Geolocation Access
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
