'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User as UserIcon, Loader2, MapPin, Compass, ShieldAlert } from 'lucide-react';

export default function RegisterPage() {
  const { user, register, loading } = useAuth();
  const router = useRouter();

  // Basic Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'PROVIDER'>('USER');

  // Provider Specific Info
  const [bio, setBio] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Plumber');
  const [serviceRadius, setServiceRadius] = useState(10);
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');

  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Auto-request location for provider base coordinates
  const fetchCurrentLocation = () => {
    setLocLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocLoading(false);
      },
      (err) => {
        console.warn('[Register] Geolocation error:', err);
        setError('Failed to acquire location. Please enter coordinates manually.');
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Get location automatically when provider role is selected
  useEffect(() => {
    if (role === 'PROVIDER' && latitude === '' && longitude === '') {
      fetchCurrentLocation();
    }
  }, [role, latitude, longitude]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload: any = {
      name: name.trim(),
      email: email.trim(),
      password,
      role
    };

    if (role === 'PROVIDER') {
      if (!bio.trim() || bio.length < 10) {
        setError('Bio must be at least 10 characters long.');
        setSubmitting(false);
        return;
      }
      if (latitude === '' || longitude === '') {
        setError('Service base coordinates are required for providers.');
        setSubmitting(false);
        return;
      }
      payload.bio = bio.trim();
      payload.serviceCategory = serviceCategory;
      payload.serviceRadius = Number(serviceRadius);
      payload.latitude = Number(latitude);
      payload.longitude = Number(longitude);
    }

    try {
      await register(payload);
    } catch (err: any) {
      console.error('[Register Page] Error:', err);
      setError(err.message || 'Registration failed. Email might already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 size={36} className="animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center py-6 px-4">
      <div className="glass-panel w-full max-w-lg p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 mb-3 shadow-lg shadow-violet-500/10">
            <Compass size={28} className="animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight glow-text">Create Account</h2>
          <p className="text-slate-400 text-sm mt-1">Get started with Everything Near Me</p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Role Tabs */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              I want to register as a
            </label>
            <div className="grid grid-cols-2 bg-black/20 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setRole('USER')}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === 'USER' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Service Seeker (Client)
              </button>
              <button
                type="button"
                onClick={() => setRole('PROVIDER')}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === 'PROVIDER' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Service Provider
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Full Name
            </label>
            <div className="relative flex items-center">
              <UserIcon size={16} className="absolute left-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>

          {/* Conditional Provider Section */}
          {role === 'PROVIDER' && (
            <div className="border-t border-white/5 pt-4 mt-2 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-violet-400 tracking-wide uppercase">
                Service Provider Settings
              </h3>

              {/* Service Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Service Type Category
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

              {/* Service Radius */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Max Travel Service Radius (km): <span className="text-white font-bold">{serviceRadius} km</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(parseInt(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>

              {/* Base Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="e.g. 40.7128"
                    className="glass-input w-full px-3 py-3 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="e.g. -74.0060"
                    className="glass-input w-full px-3 py-3 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              {/* Use Location button */}
              <button
                type="button"
                onClick={fetchCurrentLocation}
                disabled={locLoading}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-violet-500/30 hover:border-violet-500/50 bg-violet-600/10 hover:bg-violet-600/20 text-xs font-semibold text-violet-300 transition-all cursor-pointer disabled:opacity-50"
              >
                {locLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Fetching Coordinates...
                  </>
                ) : (
                  <>
                    <MapPin size={12} />
                    Use Current Device Coordinates
                  </>
                )}
              </button>

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Provider Bio / Experience Detail
                </label>
                <textarea
                  required={role === 'PROVIDER'}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your services, skills, and background..."
                  rows={3}
                  className="glass-input w-full p-3 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="glow-btn py-3.5 rounded-xl text-sm font-semibold text-white tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Registering...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
