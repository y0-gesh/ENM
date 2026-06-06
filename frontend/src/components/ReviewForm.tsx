'use client';

import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { Star, Loader2, X } from 'lucide-react';

interface ReviewFormProps {
  bookingId: string;
  onSuccess: () => void;
  onClose?: () => void;
}

export default function ReviewForm({ bookingId, onSuccess, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment.trim() || undefined
        })
      });
      onSuccess();
    } catch (err: any) {
      console.error('[Review Form] Error submitting:', err);
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl relative w-full border border-white/10 shadow-2xl">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <X size={16} />
        </button>
      )}

      <h3 className="text-lg font-bold text-white mb-1 glow-text">Leave a Review</h3>
      <p className="text-slate-400 text-xs mb-6">How was your service experience? Let others know!</p>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Star rating selector */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Your Rating
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
              >
                <Star
                  size={28}
                  fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment input */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Feedback Comment (Optional)
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your review comments here..."
            rows={4}
            className="glass-input p-3 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
            maxLength={1000}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="glow-btn mt-2 py-3 rounded-xl text-sm font-semibold text-white tracking-wide cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting Review...
            </>
          ) : (
            'Submit Review'
          )}
        </button>
      </form>
    </div>
  );
}
