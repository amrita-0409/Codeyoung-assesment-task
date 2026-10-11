import { useState, useEffect } from 'react';
import { Code, Sparkles, Users, Shield, GraduationCap, Eye, EyeOff, ArrowRight, Zap } from 'lucide-react';
import type { Role } from '@/lib/types';
import { login, getQuickLogin } from '@/lib/auth';
import type { AuthSession } from '@/lib/types';

interface LoginProps {
  onLogin: (session: AuthSession) => void;
}

const floatingWords = [
  'function()', 'const x = 42', '{ }', 'array[0]', 'if/else', 'for loop',
  'return true', 'class Code', '<div>', 'npm install', 'git push', 'AI/ML',
  'Python', 'Scratch', 'React', 'console.log', 'async', 'await', 'JSON',
  'API', '200 OK', '42', '0x1A', 'true', 'null', 'void', '#hashtag',
];

export default function Login({ onLogin }: LoginProps) {
  const [role, setRole] = useState<Role>('parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const creds = getQuickLogin(role);
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
  }, [role]);

  function applyRole(r: Role) {
    setRole(r);
    const creds = getQuickLogin(r);
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const session = await login(email, password);
    if (!session) {
      setError('Invalid email or password. Try the quick-fill buttons below.');
      setLoading(false);
      return;
    }
    if (session.user.role !== role) {
      setError(`These credentials belong to the ${session.user.role} portal. Select ${session.user.role} or use Quick demo access.`);
      setLoading(false);
      return;
    }
    onLogin(session);
    setLoading(false);
  }

  function quickFill(r: Role) {
    applyRole(r);
  }

  const roles: { key: Role; label: string; icon: typeof Users; desc: string }[] = [
    { key: 'parent', label: 'Parent', icon: Users, desc: 'Book a demo class' },
    { key: 'mentor', label: 'Mentor', icon: GraduationCap, desc: 'Teach & schedule' },
    { key: 'admin', label: 'Admin', icon: Shield, desc: 'Manage everything' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-emerald-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating code words */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingWords.map((word, i) => (
          <span
            key={i}
            className="absolute font-mono text-xs sm:text-sm text-slate-600/30 select-none"
            style={{
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
              animation: `floatWord ${15 + (i % 5) * 3}s ease-in-out ${i * 0.5}s infinite alternate`,
            }}
          >
            {word}
          </span>
        ))}
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-xl bg-teal-500/20" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 shadow-lg shadow-teal-500/30">
              <Code className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Codeyoung</h1>
            <p className="text-xs text-slate-400 font-medium">Appointment Booking System</p>
          </div>
        </div>

        {/* Glass card */}
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-400 ring-1 ring-teal-500/20">
              <Sparkles className="h-3 w-3" /> Welcome back
            </div>
            <h2 className="text-xl font-semibold text-white">Sign in to your portal</h2>
            <p className="mt-1 text-sm text-slate-400">Select your role to continue</p>
          </div>

          {/* Role selector tabs */}
          <div className="mb-6 grid grid-cols-3 gap-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const active = role === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => applyRole(r.key)}
                  className={`group relative flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-br from-teal-500/20 to-blue-500/20 ring-2 ring-teal-400/40'
                      : 'bg-white/[0.02] ring-1 ring-white/5 hover:ring-white/20'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-colors ${active ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{r.label}</span>
                  <span className="text-[10px] text-slate-500 hidden sm:block">{r.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 pr-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 ring-1 ring-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/40 disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'Signing in...' : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          </form>

          {/* Quick fill */}
          <div className="mt-6 border-t border-white/5 pt-4">
            <p className="mb-2 text-center text-xs text-slate-500">Quick demo access — click a role:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {roles.map((r) => (
                <button
                  key={r.key}
                  onClick={() => quickFill(r.key)}
                  className="inline-flex items-center gap-1 rounded-full bg-white/[0.03] px-3 py-1 text-xs text-slate-400 ring-1 ring-white/10 transition hover:bg-white/[0.06] hover:text-slate-200"
                >
                  <Zap className="h-3 w-3 text-teal-400" />
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Codeyoung © 2026 — Where young minds learn to code
        </p>
      </div>

      <style>{`
        @keyframes floatWord {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.15; }
          100% { transform: translateY(-30px) rotate(5deg); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
