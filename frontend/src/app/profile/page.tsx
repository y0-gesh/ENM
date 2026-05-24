'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { ProviderProfile } from '../../types';
import { 
  User as UserIcon, 
  MapPin, 
  Settings, 
  Briefcase, 
  Star, 
  ShieldCheck, 
  Loader2, 
  Save,
  Clock,
  Compass,
  Power,
  CheckCircle
} from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Profile data (if provider)
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Form Fields
  const [bio, setBio] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Plumber');
  const [serviceRadius, setServiceRadius] = useState(10);
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [isAvailable, setIsAvailable] = useState(true);

  // States
  const [saving, setSaving] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch provider profile if role === PROVIDER
  const fetchProviderProfile = async () => {
    if (!user || user.role !== 'PROVIDER') return;
    setLoadingProfile(true);
    try {
      const response = await apiFetch('/providers/me');
      if (response.success && response.data) {
        const prof = response.data;
        setProfile(prof);
        setBio(prof.bio || '');
        setServiceCategory(prof.serviceCategory || 'Plumber');
        setServiceRadius(prof.serviceRadius || 10);
        setLatitude(prof.latitude || '');
        setLongitude(prof.longitude || '');
        setIsAvailable(prof.isAvailable);
      }
    } catch (error: any) {
      console.error('[Profile Page] Error loading profile:', error);
      setMessage({ text: error.message || 'Failed to load profile details', type: 'error' });
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'PROVIDER') {
      fetchProviderProfile();
    }
  }, [user]);

  // Request browser location for coords
  const fetchCurrentLocation = () => {
    setLocLoading(true);
    setMessage(null);

    if (!navigator.geolocation) {
      setMessage({ text: 'Geolocation is not supported by your browser.', type: 'error' });
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocLoading(false);
        setMessage({ text: 'Location coordinates successfully loaded!', type: 'success' });
      },
      (err) => {
        console.warn('[Profile Location] Error:', err);
        setMessage({ text: 'Failed to retrieve location coordinates. Enter them manually.', type: 'error' });
        setLocLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    try {
      const newAvail = !isAvailable;
      const response = await apiFetch('/providers/me/availability', {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: newAvail })
      });
      if (response.success) {
        setIsAvailable(newAvail);
        setMessage({ text: `Availability status toggled ${newAvail ? 'ON' : 'OFF'}!`, type: 'success' });
      }
    } catch (err: any) {
      console.error('[Profile Page] Error toggling availability:', err);
      setMessage({ text: err.message || 'Failed to update availability status', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (latitude === '' || longitude === '') {
      setMessage({ text: 'Base coordinates are required.', type: 'error' });
      setSaving(false);
      return;
    }

    if (bio.trim().length < 10) {
      setMessage({ text: 'Bio must be at least 10 characters long.', type: 'error' });
      setSaving(false);
      return;
    }

    try {
      const response = await apiFetch('/providers/me', {
        method: 'PUT',
        body: JSON.stringify({
          bio: bio.trim(),
          serviceCategory,
          serviceRadius: Number(serviceRadius),
          latitude: Number(latitude),
          longitude: Number(longitude)
        })
      });

      if (response.success) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        // Refresh local details
        setProfile(response.data);
      }
    } catch (err: any) {
      console.error('[Profile Page] Error updating:', err);
      setMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 size={36} className="animate-spin text-violet-500" />
      </div>
    );
  }

  const isProvider = user?.role === 'PROVIDER';

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight glow-text flex items-center gap-2">
          <Settings size={22} className="text-violet-400" />
          Account Profile Settings
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Manage your personal accounts and business profile configurations
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          <CheckCircle size={16} className="shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Basic Account Info */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-6 h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 shadow">
              <UserIcon size={36} />
            </div>
            <h3 className="text-lg font-bold text-white">{user!.name}</h3>
            <span className="text-xs text-violet-400 uppercase font-bold tracking-wider mt-1">
              {user!.role}
            </span>
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Email</span>
              <span className="text-slate-300 truncate">{user!.email}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">User ID</span>
              <span className="text-slate-400 font-mono text-[10px] truncate">{user!.id}</span>
            </div>
          </div>
        </div>

        {/* Right Columns: Provider Stats and Settings */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {isProvider && (
            <>
              {loadingProfile ? (
                <div className="glass-panel p-12 rounded-2xl border border-white/10 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-violet-500" />
                </div>
              ) : (
                <>
                  {/* Provider aggregate metrics */}
                  {profile && (
                    <div className="grid grid-cols-3 gap-4">
                      {/* Rating */}
                      <div className="glass-panel p-4 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center">
                        <div className="text-amber-400 mb-1 flex items-center justify-center">
                          <Star size={18} fill="currentColor" />
                        </div>
                        <span className="text-lg font-extrabold text-white">
                          {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Rating</span>
                      </div>
                      {/* Completed jobs */}
                      <div className="glass-panel p-4 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center">
                        <div className="text-violet-400 mb-1 flex items-center justify-center">
                          <Briefcase size={18} />
                        </div>
                        <span className="text-lg font-extrabold text-white">
                          {profile.completedJobs}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Jobs Done</span>
                      </div>
                      {/* Composite Score */}
                      <div className="glass-panel p-4 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center">
                        <div className="text-indigo-400 mb-1 flex items-center justify-center">
                          <Compass size={18} />
                        </div>
                        <span className="text-lg font-extrabold text-white">
                          {profile.score > 0 ? profile.score.toFixed(2) : '—'}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Rank Score</span>
                      </div>
                    </div>
                  )}

                  {/* Availability console */}
                  <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Operating Status</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Toggle whether you appear in nearby user searches</p>
                    </div>
                    <button
                      onClick={handleToggleAvailability}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20'
                      }`}
                    >
                      <Power size={14} />
                      {isAvailable ? 'Active & Available' : 'Inactive / Off duty'}
                    </button>
                  </div>

                  {/* Form */}
                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 pb-2 border-b border-white/5">
                      Business Listing Information
                    </h3>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                      {/* Service Category */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase">
                          Service Category
                        </label>
                        <select
                          value={serviceCategory}
                          onChange={(e) => setServiceCategory(e.target.value)}
                          className="glass-input w-full px-3 py-3 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50 bg-[#090416]"
                        >
                          <option value="Plumber" className="bg-[#090416] text-white">Plumber</option>
                          <option value="Electrician" className="bg-[#090416] text-white">Electrician</option>
                          <option value="Cleaner" className="bg-[#090416] text-white">Cleaner</option>
                          <option value="Locksmith" className="bg-[#090416] text-white">Locksmith</option>
                          <option value="HVAC" className="bg-[#090416] text-white">HVAC (Heating & Air)</option>
                          <option value="Handyman" className="bg-[#090416] text-white">Handyman</option>
                        </select>
                      </div>

                      {/* Radius */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase flex justify-between">
                          <span>Max Service Travel Distance</span>
                          <span className="text-violet-400 font-bold">{serviceRadius} km</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={serviceRadius}
                          onChange={(e) => setServiceRadius(parseInt(e.target.value))}
                          className="w-full accent-violet-500 cursor-pointer"
                        />
                      </div>

                      {/* Coordinates */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase">
                          Location Coordinates
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Latitude</span>
                            <input
                              type="number"
                              step="any"
                              required
                              value={latitude}
                              onChange={(e) => setLatitude(e.target.value === '' ? '' : parseFloat(e.target.value))}
                              placeholder="e.g. 40.7128"
                              className="glass-input w-full px-3 py-2.5 rounded-xl text-xs mt-1"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Longitude</span>
                            <input
                              type="number"
                              step="any"
                              required
                              value={longitude}
                              onChange={(e) => setLongitude(e.target.value === '' ? '' : parseFloat(e.target.value))}
                              placeholder="e.g. -74.0060"
                              className="glass-input w-full px-3 py-2.5 rounded-xl text-xs mt-1"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={fetchCurrentLocation}
                          disabled={locLoading}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-violet-500/20 hover:border-violet-500/40 bg-violet-600/5 hover:bg-violet-600/10 text-xs font-semibold text-violet-400 transition-all cursor-pointer mt-2 w-fit disabled:opacity-50"
                        >
                          {locLoading ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              Acquiring location...
                            </>
                          ) : (
                            <>
                              <MapPin size={12} />
                              Use Current GPS Location
                            </>
                          )}
                        </button>
                      </div>

                      {/* Bio */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase">
                          Bio / Professional Description
                        </label>
                        <textarea
                          required
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell potential clients about your experience, certifications, pricing rates, etc..."
                          rows={4}
                          className="glass-input w-full p-3 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
                        />
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={saving}
                        className="glow-btn py-3 rounded-xl text-sm font-semibold text-white tracking-wide uppercase cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving Profile...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Save Configuration
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </>
          )}

          {!isProvider && (
            <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-4 text-center">
              <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow">
                <ShieldCheck size={32} />
              </div>
              <h4 className="text-lg font-bold text-white">Client Account Active</h4>
              <p className="text-sm text-slate-400 max-w-sm">
                Your account is currently configured as a Service Seeker. You can search, request, book, and review local service providers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
