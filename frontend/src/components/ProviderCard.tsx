'use client';

import Link from 'next/link';
import { NearbyProvider } from '../types';
import { Star, Shield, MapPin, Briefcase } from 'lucide-react';

interface ProviderCardProps {
  provider: NearbyProvider;
}

export default function ProviderCard({ provider }: ProviderCardProps) {
  const rating = provider.avgRating || 0;
  
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      <div>
        {/* Top bar with category and availability */}
        <div className="flex justify-between items-start mb-4">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 uppercase tracking-wide">
            {provider.serviceCategory}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              provider.isAvailable
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${provider.isAvailable ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`}></span>
            {provider.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {/* Profile Info */}
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">
          {provider.name}
        </h3>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center text-amber-400">
            <Star size={16} fill="currentColor" />
            <span className="ml-1 text-sm font-semibold text-white">
              {rating > 0 ? rating.toFixed(1) : 'No reviews'}
            </span>
          </div>
          <span className="text-slate-500 text-xs">•</span>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Briefcase size={12} />
            <span>{provider.completedJobs} jobs done</span>
          </div>
        </div>

        {/* Bio Snippet */}
        <p className="text-slate-300 text-sm line-clamp-2 mb-5">
          {provider.bio}
        </p>
      </div>

      {/* Footer Info & CTA */}
      <div className="border-t border-white/5 pt-4 mt-auto flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-violet-400 font-bold text-sm">
            <MapPin size={14} />
            <span>{provider.distance} km</span>
          </div>
          <span className="text-[10px] text-slate-500">Service radius: {provider.serviceRadius}km</span>
        </div>

        <Link
          href={`/providers/${provider.id}`}
          className="glow-btn px-4 py-2 rounded-xl text-xs font-semibold text-white tracking-wide cursor-pointer"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
