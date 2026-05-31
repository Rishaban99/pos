import React, { useState } from 'react';
import { Building, Lock, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, bootstrapConfigured, hasUsers, isReady } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setupRequired = isReady && !hasUsers && !bootstrapConfigured;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(username, password);
    if (!result.success) {
      setError(result.error ?? 'Login failed.');
    }
    setIsSubmitting(false);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500 font-medium">Loading terminal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Building className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none uppercase">
              Luxe Haven POS
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
              Staff Sign In
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {setupRequired ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-bold text-amber-900">Initial setup required</h2>
                  <p className="text-xs text-amber-800 mt-2 leading-relaxed">
                    No staff accounts exist yet. Add these to your <code className="bg-amber-100 px-1 rounded">.env</code> file, then run{' '}
                    <code className="bg-amber-100 px-1 rounded">npm run db:push</code> and{' '}
                    <code className="bg-amber-100 px-1 rounded">npm run db:seed</code>:
                  </p>
                  <pre className="mt-3 text-[10px] bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto font-mono">
{`DATABASE_URL="mongodb+srv://USER:PASS@YOUR-CLUSTER.mongodb.net/hotel_pos"
NEXT_PUBLIC_INITIAL_SUPER_ADMIN_USERNAME=admin
INITIAL_SUPER_ADMIN_PASSWORD=change-me
NEXT_PUBLIC_INITIAL_SUPER_ADMIN_NAME=Super Admin`}
                  </pre>
                  <p className="text-[10px] text-amber-700 mt-2">
                    Replace <code className="bg-amber-100 px-1 rounded">YOUR-CLUSTER</code> with your Atlas cluster hostname (from Connect → Drivers in MongoDB Atlas).
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-indigo-400" />
                <div>
                  <h2 className="text-base font-bold">Terminal Login</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                    Super Admin &amp; Receptionist
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={setupRequired || isSubmitting}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm font-semibold rounded-lg px-3 py-2.5 text-slate-900 outline-hidden transition-all disabled:opacity-50"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={setupRequired || isSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm font-semibold rounded-lg pl-10 pr-3 py-2.5 text-slate-900 outline-hidden transition-all disabled:opacity-50"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={setupRequired || isSubmitting || !username.trim() || !password}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="size-4" />
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
