import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    if (!password) return setError('Password is required');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (!isLogin && !name) return setError('Full Name is required');

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/chat');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-[0.07]" style={{ background: '#DC2626' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-[0.07]" style={{ background: '#EF4444' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: '#F87171' }} />
      </div>

      <div
        className="w-full max-w-[420px] relative z-10 p-8"
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <span className="text-3xl font-extrabold text-white tracking-tight">K</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kura Kani</h1>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Shield size={12} style={{ color: 'var(--accent-green)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>End-to-end encrypted</p>
          </div>
        </div>

        <p className="text-sm text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
          {isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
        </p>

        {error && (
          <div
            className="mb-5 px-4 py-3 text-sm font-medium"
            style={{
              background: 'rgba(229, 57, 53, 0.1)',
              border: '1px solid rgba(229, 57, 53, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-red)',
            }}
          >
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 text-sm text-white placeholder-[var(--text-tertiary)] outline-none transition-colors"
                style={{
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 text-sm text-white placeholder-[var(--text-tertiary)] outline-none transition-colors"
              style={{
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 pr-12 text-sm text-white placeholder-[var(--text-tertiary)] outline-none transition-colors"
                style={{
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            style={{
              background: 'var(--gradient-primary)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 15px rgba(107, 147, 214, 0.3)',
            }}
          >
            {loading
              ? (isLogin ? 'Signing in...' : 'Creating account...')
              : (isLogin ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="font-semibold transition-colors cursor-pointer"
              style={{ color: 'var(--accent-blue)' }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
