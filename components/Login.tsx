import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, UtensilsCrossed, Sparkles } from 'lucide-react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const adminPwd = localStorage.getItem('admin_password') || 'aci123';
    const guestPwd = localStorage.getItem('guest_password') || 'aci123';

    setTimeout(() => {
      if (username === 'admin' && password === adminPwd) {
        onLogin('ADMIN');
      } else if (username === 'guest' && password === guestPwd) {
        onLogin('VIEWER');
      } else {
        setError('Invalid credentials. Please try again.');
        setIsLoading(false);
      }
    }, 700);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-[#070b1a] text-white">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 opacity-90">
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full bg-indigo-600/30 blur-[120px] animate-float" />
        <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-violet-600/25 blur-[140px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-600/20 blur-[120px] animate-float" style={{ animationDelay: '4s' }} />
      </div>
      {/* Grid overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
        }}
      />

      <div className="w-full max-w-md animate-fade-scale">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-2xl blur-xl opacity-70" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl ring-1 ring-white/20">
              <UtensilsCrossed size={30} className="text-white" strokeWidth={2.2} />
            </div>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            <span className="text-gradient-brand">ACI Canteen</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 flex items-center gap-1.5">
            <Sparkles size={13} className="text-indigo-300" />
            Management System · Secure Access
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/0 shadow-2xl">
          <div className="rounded-3xl bg-slate-950/70 backdrop-blur-xl p-7 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User size={17} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-400/60 focus:bg-white/10 outline-none text-white placeholder:text-slate-500 transition-all"
                    placeholder="admin or guest"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={17} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-400/60 focus:bg-white/10 outline-none text-white placeholder:text-slate-500 transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-300 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-3 rounded-xl font-semibold text-white shadow-lg shadow-indigo-900/40 transition-all overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
                <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Sign in securely
                      <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-500 justify-center">
              <ShieldCheck size={13} className="text-emerald-400" />
              End-to-end encrypted · Session-bound access
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          Restricted area — Authorized personnel only · © {new Date().getFullYear()} ACI Limited
        </p>
      </div>
    </div>
  );
};
