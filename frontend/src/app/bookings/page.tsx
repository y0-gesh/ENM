'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import { useBookings } from '../../hooks/useBookings';
import BookingCard from '../../components/BookingCard';
import { Calendar, Loader2, RefreshCw, Archive, Clock, CheckSquare, Slash } from 'lucide-react';

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Fetch Bookings hook
  const { bookings, loading: bookingsLoading, error: bookingsError, refetch } = useBookings();

  // Tabs: 'upcoming' | 'completed' | 'cancelled'
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 size={36} className="animate-spin text-violet-500" />
      </div>
    );
  }

  // Filter logic based on tabs
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'upcoming') {
      return b.status === 'PENDING' || b.status === 'ACCEPTED';
    }
    if (activeTab === 'completed') {
      return b.status === 'COMPLETED';
    }
    if (activeTab === 'cancelled') {
      return b.status === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight glow-text">My Bookings</h2>
          <p className="text-slate-400 text-sm mt-1">
            Track and manage your scheduled services and history
          </p>
        </div>

        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-violet-400 hover:text-white bg-violet-600/5 hover:bg-violet-600/10 border border-violet-500/20 transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          Refresh List
        </button>
      </div>

      {/* Tabs selectors */}
      <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/5 w-full max-w-md">
        {[
          { id: 'upcoming', label: 'Upcoming', icon: Clock },
          { id: 'completed', label: 'Completed', icon: CheckSquare },
          { id: 'cancelled', label: 'Cancelled', icon: Slash }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {bookingsLoading ? (
        // Loading skeletons
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((idx) => (
            <div key={idx} className="glass-card rounded-2xl p-6 h-56 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="skeleton w-20 h-5"></div>
              </div>
              <div className="skeleton w-36 h-6"></div>
              <div className="skeleton w-full h-12"></div>
              <div className="flex gap-2 border-t border-white/5 pt-4 mt-auto">
                <div className="skeleton w-24 h-8"></div>
              </div>
            </div>
          ))}
        </div>
      ) : bookingsError ? (
        <div className="glass-panel p-8 rounded-2xl text-center border border-rose-500/10 text-slate-300">
          <p className="text-rose-400 mb-2">Error loading bookings: {bookingsError}</p>
          <button
            onClick={refetch}
            className="glow-btn px-4 py-2 rounded-xl text-xs font-bold text-white mt-2 cursor-pointer"
          >
            Retry Request
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border border-white/10 flex flex-col items-center justify-center gap-3">
          <div className="p-4 rounded-full bg-white/5 text-slate-400 border border-white/10 mb-2">
            <Archive size={32} />
          </div>
          <h4 className="text-lg font-bold text-white uppercase tracking-wider">No {activeTab} bookings</h4>
          <p className="text-sm text-slate-400 max-w-sm">
            You do not currently have any bookings classified under the &quot;{activeTab}&quot; tab.
          </p>
        </div>
      ) : (
        /* Grid of bookings cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((bk) => (
            <BookingCard
              key={bk.id}
              booking={bk}
              currentUserRole={user?.role || 'USER'}
              onStatusChanged={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
