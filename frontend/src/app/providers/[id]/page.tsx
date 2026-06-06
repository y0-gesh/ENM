'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '../../../lib/auth';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { ProviderProfile } from '../../../types';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Clock, 
  FileText, 
  Loader2, 
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

interface ProviderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // States
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch provider detail
  const fetchProviderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/providers/${id}`);
      if (response.success && response.data) {
        setProvider(response.data);
      }
    } catch (err: any) {
      console.error('[Provider Detail] Fetch error:', err);
      setError(err.message || 'Failed to retrieve provider details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProviderDetail();
    }
  }, [id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');

    if (!scheduledAt) {
      setBookingError('Please select a scheduled date and time.');
      setBookingLoading(false);
      return;
    }

    const selectedTime = new Date(scheduledAt);
    if (selectedTime < new Date()) {
      setBookingError('Scheduled time must be in the future.');
      setBookingLoading(false);
      return;
    }

    try {
      const response = await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          providerId: id,
          scheduledAt: selectedTime.toISOString(),
          notes: notes.trim() || undefined
        })
      });

      if (response.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          router.push('/bookings');
        }, 1500);
      }
    } catch (err: any) {
      console.error('[Provider Detail] Booking submission error:', err);
      setBookingError(err.message || 'Failed to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (authLoading || (!user && !authLoading) || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 size={36} className="animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center border border-rose-500/10 text-slate-300 max-w-lg mx-auto mt-12">
        <p className="text-rose-400 mb-4">{error || 'Provider not found.'}</p>
        <Link
          href="/"
          className="glow-btn px-5 py-2.5 rounded-xl text-xs font-semibold text-white tracking-wide flex items-center justify-center gap-1.5 w-fit mx-auto cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Explore
        </Link>
      </div>
    );
  }

  const rating = provider.avgRating || 0;
  const isClient = user?.role === 'USER';

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm w-fit">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Provider Details Card */}
      <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
        {/* Glow orb background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-extrabold text-white tracking-tight glow-text">
              {provider.user?.name}
            </h2>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 uppercase tracking-wide">
              {provider.serviceCategory}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Star size={16} fill="currentColor" />
              <span>{rating > 0 ? rating.toFixed(1) : 'No reviews'}</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1 text-slate-400">
              <Briefcase size={14} />
              <span>{provider.completedJobs} completed jobs</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1 text-violet-400 font-semibold">
              <MapPin size={14} />
              <span>Radius: {provider.serviceRadius} km</span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">About / Bio</h4>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {provider.bio}
            </p>
          </div>
        </div>

        {/* CTA Side Action */}
        <div className="shrink-0 flex flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8 min-w-[200px]">
          <div className="flex flex-col items-center md:items-end text-center md:text-right mb-4">
            <span className="text-xs text-slate-400 font-semibold uppercase">Availability</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mt-2 ${
              provider.isAvailable 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${provider.isAvailable ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`}></span>
              {provider.isAvailable ? 'Available Now' : 'Not Available'}
            </span>
          </div>

          {isClient && provider.isAvailable && (
            <button
              onClick={() => setShowBookingModal(true)}
              className="glow-btn w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-white tracking-wide cursor-pointer flex items-center justify-center gap-2"
            >
              <Calendar size={16} />
              Book Service
            </button>
          )}

          {isClient && !provider.isAvailable && (
            <button
              disabled
              className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-slate-500 bg-white/5 border border-white/5 text-center cursor-not-allowed"
            >
              Currently Booked / Busy
            </button>
          )}
        </div>
      </div>

      {/* Reviews Logs */}
      <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <MessageSquare size={18} className="text-violet-400" />
          Customer Reviews ({provider.reviews?.length || 0})
        </h3>

        {!provider.reviews || provider.reviews.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm italic">
            This service provider hasn&apos;t received any reviews yet.
          </div>
        ) : (
          <div className="flex flex-col gap-5 divide-y divide-white/5">
            {provider.reviews.map((rev, index) => (
              <div key={rev.id} className={`flex flex-col gap-2.5 ${index > 0 ? 'pt-5' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-sm font-bold text-white">
                      {rev.reviewer?.name || 'Anonymous Seeker'}
                    </h5>
                    <span className="text-[10px] text-slate-500">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Stars display */}
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        fill={star <= rev.rating ? 'currentColor' : 'none'}
                        stroke="currentColor"
                      />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-sm text-slate-300 leading-relaxed font-light italic">
                    &quot;{rev.comment}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Form Modal Overlay */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-white/10 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 glow-text flex items-center gap-2">
              <Calendar size={18} className="text-violet-400" />
              Request Service Booking
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Select your scheduled time slot and provide service details for {provider.user?.name}.
            </p>

            {bookingSuccess ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                <CheckCircle size={48} className="text-emerald-400 animate-bounce" />
                <h4 className="text-lg font-bold text-white">Booking Requested!</h4>
                <p className="text-xs text-slate-400">
                  Redirecting you to your bookings dashboard to track updates...
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs">
                    {bookingError}
                  </div>
                )}

                {/* Scheduled At */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    Scheduled Time
                  </label>
                  <div className="relative flex items-center">
                    <Clock size={16} className="absolute left-3 text-slate-500" />
                    <input
                      type="datetime-local"
                      required
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="glass-input w-full pl-10 pr-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    Service Details / Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe what you need fixed (e.g. leaking kitchen pipe under the sink)..."
                    rows={3}
                    className="glass-input p-3 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="flex-1 glow-btn py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Request Booking'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
