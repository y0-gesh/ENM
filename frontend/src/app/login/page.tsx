'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, MapPin } from 'lucide-react';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // If already authenticated, redirect to search dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      console.error('[Login Page] Error:', err);
      setError(err.message || 'Invalid email or password combination');
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
    <div className="flex min-h-[75vh] items-center justify-center py-6 px-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand/Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 mb-3 shadow-lg shadow-violet-500/10">
            <MapPin size={28} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight glow-text">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-1">Sign in to search local services near you</p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                placeholder="you@example.com"
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
                placeholder="••••••••"
                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="glow-btn py-3.5 rounded-xl text-sm font-semibold text-white tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
