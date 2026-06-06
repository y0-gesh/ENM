'use client';

import { useState } from 'react';
import { Booking, Role } from '../types';
import { apiFetch } from '../lib/api';
import ReviewForm from './ReviewForm';
import { Calendar, Clock, FileText, User as UserIcon, Star, CheckCircle, XCircle } from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
  currentUserRole: Role;
  onStatusChanged: () => void;
}

export default function BookingCard({ booking, currentUserRole, onStatusChanged }: BookingCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setLoadingAction(newStatus);
    try {
      await apiFetch(`/bookings/${booking.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      onStatusChanged();
    } catch (error) {
      console.error('[Booking Card] Error updating status:', error);
      alert('Failed to update booking status.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Status Badge styling mapping
  const statusConfig = {
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ACCEPTED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };

  const isUser = currentUserRole === 'USER';
  const displayPartnerName = isUser 
    ? booking.provider?.user?.name || 'Service Provider' 
    : booking.user?.name || 'Client';

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusConfig[booking.status]}`}>
            {booking.status}
          </span>
          <h4 className="text-lg font-bold text-white mt-3 flex items-center gap-2">
            <UserIcon size={16} className="text-violet-400" />
            {displayPartnerName}
          </h4>
          {isUser && (
            <span className="text-xs text-violet-400 font-medium">
              {booking.provider?.serviceCategory}
            </span>
          )}
          {!isUser && booking.user && (
            <span className="text-xs text-slate-400">
              {booking.user.email}
            </span>
          )}
        </div>
      </div>

      {/* Date & Time details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/10 p-3.5 rounded-xl border border-white/5 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar size={15} className="text-violet-400" />
          <span>{formatDate(booking.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Clock size={15} className="text-violet-400" />
          <span>{formatTime(booking.scheduledAt)}</span>
        </div>
      </div>

      {/* User optional notes */}
      {booking.notes && (
        <div className="flex gap-2 text-xs text-slate-400 bg-white/5 p-3 rounded-lg border border-white/5">
          <FileText size={14} className="shrink-0 text-slate-500 mt-0.5" />
          <p className="line-clamp-3">
            <strong className="text-slate-300">Request Notes:</strong> {booking.notes}
          </p>
        </div>
      )}

      {/* User Review Display */}
      {booking.status === 'COMPLETED' && booking.review && (
        <div className="border-t border-white/5 pt-4 mt-1 flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Submitted Review
          </span>
          <div className="flex items-center text-amber-400 gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                fill={star <= booking.review!.rating ? 'currentColor' : 'none'}
                stroke="currentColor"
              />
            ))}
          </div>
          {booking.review.comment && (
            <p className="text-xs italic text-slate-300">
              &quot;{booking.review.comment}&quot;
            </p>
          )}
        </div>
      )}

      {/* Actions Section */}
      <div className="flex flex-wrap items-center gap-3 mt-2 border-t border-white/5 pt-4">
        {/* Pending state actions */}
        {booking.status === 'PENDING' && (
          <>
            {!isUser && (
              <button
                disabled={!!loadingAction}
                onClick={() => handleStatusUpdate('ACCEPTED')}
                className="glow-btn px-4 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                {loadingAction === 'ACCEPTED' ? 'Accepting...' : 'Accept Booking'}
              </button>
            )}
            <button
              disabled={!!loadingAction}
              onClick={() => handleStatusUpdate('CANCELLED')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'CANCELLED' ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          </>
        )}

        {/* Accepted state actions */}
        {booking.status === 'ACCEPTED' && (
          <>
            {!isUser && (
              <button
                disabled={!!loadingAction}
                onClick={() => handleStatusUpdate('COMPLETED')}
                className="glow-btn px-4 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                {loadingAction === 'COMPLETED' ? 'Completing...' : 'Mark Completed'}
              </button>
            )}
            <button
              disabled={!!loadingAction}
              onClick={() => handleStatusUpdate('CANCELLED')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'CANCELLED' ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          </>
        )}

        {/* Completed state review action */}
        {booking.status === 'COMPLETED' && isUser && !booking.review && !showReviewModal && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="glow-btn px-4 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer hover:opacity-90"
          >
            Leave Review
          </button>
        )}
      </div>

      {/* Embedded Review Form dropdown */}
      {showReviewModal && (
        <div className="mt-2">
          <ReviewForm
            bookingId={booking.id}
            onSuccess={() => {
              setShowReviewModal(false);
              onStatusChanged();
            }}
            onClose={() => setShowReviewModal(false)}
          />
        </div>
      )}
    </div>
  );
}
