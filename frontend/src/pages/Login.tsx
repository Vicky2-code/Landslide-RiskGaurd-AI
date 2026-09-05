import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMapPin, FiEye, FiEyeOff, FiShield, FiUser, FiAlertTriangle, FiFileText } from 'react-icons/fi';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'citizen' | 'authority'>('citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col lg:flex-row">
      {/* Left Panel — Brand (hidden on mobile, visible on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 800 600" className="w-full h-full">
            <path d="M0 500 L200 200 L350 350 L500 100 L650 300 L800 50 L800 600 L0 600Z" fill="#0d9488" opacity="0.3"/>
            <path d="M0 550 L150 300 L300 400 L450 150 L600 350 L800 100 L800 600 L0 600Z" fill="#0d9488" opacity="0.2"/>
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-teal rounded-full flex items-center justify-center">
              <FiMapPin className="text-white" size={24} />
            </div>
            <div>
              <span className="font-serif text-white font-bold text-3xl">RiskGuard</span>
              <span className="text-teal font-bold text-sm ml-2">AI</span>
            </div>
          </div>
          <p className="text-text-soft text-sm mt-1">Landslide Risk Monitoring System</p>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="font-serif text-white text-4xl font-bold leading-tight">
            Protecting India's<br />North Eastern Region<br />from Landslides
          </h2>
          <p className="text-text-soft text-sm leading-relaxed max-w-md">
            Real-time risk monitoring, AI-powered predictions, and citizen-powered reporting
            to keep communities safe across all 8 NER states.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-teal font-bold text-2xl font-serif">16</div>
            <div className="text-text-soft text-xs mt-1">Monitored Zones</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-teal font-bold text-2xl font-serif">8</div>
            <div className="text-text-soft text-xs mt-1">NER States</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-teal font-bold text-2xl font-serif">24/7</div>
            <div className="text-text-soft text-xs mt-1">Live Monitoring</div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 bg-teal rounded-full flex items-center justify-center mx-auto mb-3">
              <FiMapPin className="text-white" size={24} />
            </div>
            <span className="font-serif text-text font-bold text-2xl">RiskGuard</span>
            <span className="text-teal font-bold text-sm ml-1">AI</span>
            <p className="text-text-mute text-sm mt-1">Landslide Risk Monitoring</p>
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-bold text-text mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-text-mute text-sm mb-5">
            {mode === 'login'
              ? 'Sign in to access the risk monitoring dashboard'
              : 'Join the landslide monitoring network'}
          </p>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setRole('citizen')}
                className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                  role === 'citizen'
                    ? 'border-teal bg-teal/5'
                    : 'border-border bg-card hover:border-teal/50'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${
                  role === 'citizen' ? 'bg-teal text-white' : 'bg-bg text-text-mute'
                }`}>
                  <FiUser size={16} />
                </div>
                <div className="font-medium text-sm text-text">Citizen</div>
                <div className="text-xs text-text-mute mt-0.5">Report issues, get alerts</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('authority')}
                className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                  role === 'authority'
                    ? 'border-teal bg-teal/5'
                    : 'border-border bg-card hover:border-teal/50'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${
                  role === 'authority' ? 'bg-teal text-white' : 'bg-bg text-text-mute'
                }`}>
                  <FiShield size={16} />
                </div>
                <div className="font-medium text-sm text-text">Authority</div>
                <div className="text-xs text-text-mute mt-0.5">Review reports, manage alerts</div>
              </button>
            </div>
          )}

          {error && (
            <div className="bg-risk-very-high-bg text-risk-very-high text-sm px-4 py-2.5 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-card"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-card"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal pr-10 bg-card"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-mute hover:text-text"
                >
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-center disabled:opacity-50"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : `Create Account`}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-text-mute">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-teal font-medium ml-1 hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </div>

          <div className="mt-6 p-3 bg-bg rounded-xl border border-border">
            <div className="text-xs font-medium text-text-mute mb-2">Demo Credentials</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <FiShield size={12} className="text-teal flex-shrink-0" />
                <span className="text-text-mute">Authority:</span>
                <code className="text-text font-medium break-all">admin@riskguard.gov.in / admin123</code>
              </div>
              <div className="flex items-center gap-2">
                <FiUser size={12} className="text-teal flex-shrink-0" />
                <span className="text-text-mute">Citizen:</span>
                <code className="text-text font-medium break-all">citizen@riskguard.gov.in / citizen123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
