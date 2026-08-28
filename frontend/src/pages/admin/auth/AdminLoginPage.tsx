import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import logoImg from '../../../assets/siri samruddhi logo.png';

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin, isAuthenticated, isSuperAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('admin@sirisamruddhigold.com');
  const [password, setPassword] = useState<string>('Admin@GoldPalace2026!');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, isSuperAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your Super Admin email.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    try {
      setIsLoading(true);
      await loginAdmin(email, password, rememberMe);
      success('Super Admin authenticated successfully. Welcome to Enterprise Command Center.');
      navigate('/admin/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101114] text-white flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Ambient Gold Glow & Filigree Background */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#C5A869]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#78350F]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="px-6 py-5 flex items-center justify-between z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1F1F23] border border-[#C5A869]/60 p-1 flex items-center justify-center">
            <img src={logoImg} alt="Siri Samruddhi" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
              Siri Samruddhi Gold Palace
            </h1>
            <p className="text-[10px] font-bold text-[#C5A869] tracking-wider uppercase">
              Enterprise Command Center
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="text-xs font-bold text-[#A1A1AA] hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
        >
          <Building2 className="w-3.5 h-3.5 text-[#C5A869]" />
          <span>Showroom Manager Login →</span>
        </button>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 my-6">
        <div className="w-full max-w-md bg-[#181A1F] border border-[#C5A869]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top Gold Shimmer Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C5A869] to-transparent animate-pulse" />

          {/* Card Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#78350F]/40 border border-[#FBBF24]/40 text-[#FDE68A] text-[10px] font-extrabold uppercase tracking-wider mb-1">
              <Shield className="w-3 h-3" />
              <span>Super Administrator Access</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Enterprise Command Center
            </h2>
            <p className="text-xs text-[#A1A1AA] font-medium">
              Multi-branch oversight for Yelahanka, Kolar, and Udupi
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#D4D4D8] uppercase tracking-wider">
                Super Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sirisamruddhigold.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#23262D] border border-[#3F3F46] focus:border-[#C5A869] rounded-xl text-xs text-white placeholder-[#71717A] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#D4D4D8] uppercase tracking-wider">
                  Admin Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#23262D] border border-[#3F3F46] focus:border-[#C5A869] rounded-xl text-xs text-white placeholder-[#71717A] focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#A1A1AA] hover:text-white">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-[#3F3F46] text-[#C5A869] focus:ring-0 bg-[#23262D] cursor-pointer"
                />
                <span>Keep session active</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#C5A869] to-[#A98948] hover:from-[#D2B074] hover:to-[#B8943D] text-[#101114] text-xs font-extrabold shadow-lg shadow-[#C5A869]/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              {isLoading ? (
                <span>Authenticating Super Admin...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Enterprise Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <p className="text-[11px] text-[#A1A1AA]">
              Protected by <code className="text-[#C5A869] font-mono font-bold">Argon2 / Bcrypt ENV Security</code> (Role: SUPER_ADMIN)
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/5 text-center text-xs text-[#71717A] z-10">
        © 2026 Siri Samruddhi Gold Palace Private Limited. Enterprise Security Layer.
      </footer>
    </div>
  );
};
