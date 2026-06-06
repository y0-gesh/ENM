'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth';
import { MapPin, Calendar, User, LogOut, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 px-6 py-4 flex items-center justify-between">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-90">
        <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
          <MapPin size={22} className="animate-pulse" />
        </div>
        <span className="bg-gradient-to-r from-white via-slate-200 to-violet-400 bg-clip-text text-transparent glow-text">
          Everything Near Me
        </span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-6">
        <Link
          href="/"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isActive('/') 
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Search size={16} />
          Explore
        </Link>
        <Link
          href="/bookings"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isActive('/bookings') 
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar size={16} />
          Bookings
        </Link>
        <Link
          href="/profile"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isActive('/profile') 
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <User size={16} />
          Profile
        </Link>
      </div>

      {/* User Info & Actions */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-sm font-semibold text-white">{user.name}</span>
          <span className="text-xs text-violet-400 uppercase tracking-wider font-bold">
            {user.role}
          </span>
        </div>
        <div className="w-[1px] h-6 bg-white/10 hidden sm:block"></div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
