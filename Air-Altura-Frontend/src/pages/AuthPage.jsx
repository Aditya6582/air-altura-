import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function validate(mode, form) {
  if (!form.email) return 'Email is required';
  if (!EMAIL_RE.test(form.email)) return 'Please enter a valid email address';
  if (!form.password) return 'Password is required';
  if (mode === 'register' && form.password.length < MIN_PASSWORD)
    return `Password must be at least ${MIN_PASSWORD} characters`;
  return null;
}

export default function AuthPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const returnTo    = location.state?.returnTo    || '/';
  const returnState = location.state?.returnState || null;

  const [mode, setMode]       = useState('login');
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function switchMode(next) {
    setMode(next);
    setError(null);
    setForm({ email: '', password: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const validationError = validate(mode, form);
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      if (mode === 'register') {
        const { data } = await api.post('/auth/register', {
          email:    form.email,
          password: form.password,
        });
        // Register returns token directly — no need for a second login call
        login(data.token, data.userId);
        navigate(returnTo, { state: returnState, replace: true });
      } else {
        const { data } = await api.post('/auth/login', {
          email:    form.email,
          password: form.password,
        });
        login(data.token, data.userId);
        navigate(returnTo, { state: returnState, replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] grid grid-cols-1 md:grid-cols-2 select-none">
      {/* ── Left — form ─────────────────────────────────────── */}
      <section className="flex items-center justify-center px-12 py-16 relative">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[400px] flex flex-col gap-5 animate-fade-up"
          noValidate
        >
          <div>
            <span className="block font-body text-[11px] font-medium tracking-[0.32em] uppercase text-aa-slate mb-2.5">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </span>
            <h2 className="font-display font-normal text-[36px] tracking-[-0.025em] leading-[1.2] text-aa-ink m-0">
              {mode === 'login' ? 'Sign in to Altura.' : 'Begin with Altura.'}
            </h2>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-aa-slate">
              Email
            </label>
            <input
              className="aa-input"
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-aa-slate">
              Password
            </label>
            <input
              className="aa-input"
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
            {mode === 'register' && (
              <span className="font-body text-[11px] text-aa-slate mt-0.5">
                At least {MIN_PASSWORD} characters
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="font-body text-sm text-aa-caution m-0">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-aa-horizon text-aa-cream font-body text-[15px] font-medium py-3.5 rounded-lg border-none cursor-pointer transition-opacity duration-300 hover:opacity-85 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading
              ? 'Please wait…'
              : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <p className="font-body text-sm text-aa-slate text-center m-0">
            {mode === 'login' ? (
              <>
                New to Altura?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-aa-horizon underline underline-offset-[3px] bg-transparent border-none cursor-pointer font-body text-sm p-0"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already with us?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-aa-horizon underline underline-offset-[3px] bg-transparent border-none cursor-pointer font-body text-sm p-0"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </section>

      {/* ── Right — cabin photo ──────────────────────────────── */}
      <aside className="hidden md:block relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/assets/plane_cabin.webp)', backgroundPosition: 'center 30%' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(10,34,48,0.18) 0%, rgba(10,34,48,0.72) 100%)' }}
        />
        <div className="absolute inset-0 p-14 flex flex-col justify-end animate-fade-up-2">
          <span className="block font-body text-[11px] tracking-[0.32em] uppercase text-white/60 mb-3">
            Air Altura · Business Class
          </span>
          <p className="font-display text-[34px] tracking-tight leading-[1.2] text-white m-0 max-w-[380px]">
            The sky, at its most considered.
          </p>
        </div>
      </aside>
    </main>
  );
}
