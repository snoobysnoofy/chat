import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [waking, setWaking] = useState(false);
  const [serverStatus, setServerStatus] = useState<'idle' | 'ok' | 'waking' | 'error'>('idle');
  const [latency, setLatency] = useState<number | null>(null);
  // Auto ping on mount to show users they may need to wait for cold start
  useEffect(() => {
    const autoPing = async () => {
      setWaking(true);
      setServerStatus('waking');
      const start = performance.now();
      try {
        const res = await fetch('https://chat-f5sg.onrender.com/api/health', { cache: 'no-store' });
        if (res.ok) {
          setServerStatus('ok');
          setLatency(Math.round(performance.now() - start));
        } else {
          setServerStatus('error');
        }
      } catch (e) {
        setServerStatus('error');
      } finally {
        setWaking(false);
      }
    };
    autoPing();
  }, []);

  const wakeServer = async () => {
    setWaking(true);
    setServerStatus('waking');
    setLatency(null);
    const start = performance.now();
    try {
      const res = await fetch('https://chat-f5sg.onrender.com/api/health', { cache: 'no-store' });
      if (res.ok) {
        setServerStatus('ok');
        setLatency(Math.round(performance.now() - start));
      } else {
        setServerStatus('error');
      }
    } catch (e) {
      setServerStatus('error');
    } finally {
      setWaking(false);
    }
  };

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
  await login(username, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="glass rounded-2xl p-8 shadow-glass">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-message rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-blue-100 mb-4">
              Sign in to continue chatting
            </p>
            <div className="flex flex-col items-center space-y-2">
              <button
                type="button"
                onClick={wakeServer}
                disabled={waking}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-50 transition-colors"
              >
                {waking ? 'Waking server...' : 'Wake / Check Server'}
              </button>
              <div className="text-xs text-blue-200 min-h-[1.25rem]">
                {serverStatus === 'waking' && 'Contacting server... (Render cold starts can take ~30s)'}
                {serverStatus === 'ok' && (
                  <span className="text-green-300">Server online {latency !== null && `(${latency}ms)`}</span>
                )}
                {serverStatus === 'error' && (
                  <span className="text-red-300">Server unreachable. Try again.</span>
                )}
              </div>
            </div>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-blue-100 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-messenger-blue focus:border-transparent backdrop-blur-sm"
                  placeholder="Enter your username"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-messenger-blue focus:border-transparent backdrop-blur-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-message hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-messenger-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover-lift"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-blue-100">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-white hover:text-blue-200 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
