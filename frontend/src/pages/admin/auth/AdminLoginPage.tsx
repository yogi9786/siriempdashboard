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
  Sparkles,
  KeyRound,
  Crown,
  CheckCircle2,
  Layers,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import logoImg from '../../../assets/siri samruddhi logo.png';

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin, isAuthenticated, isSuperAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('admin@sirisamruddhigold.com');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Interactive smooth mouse-following radial spotlight
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setMousePos({ x, y });
  };

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, isSuperAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your Super Admin email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your administrator master password.');
      return;
    }

    try {
      setIsLoading(true);
      await loginAdmin(email.trim(), password.trim(), rememberMe);
      success('Super Admin authenticated successfully. Welcome to Enterprise Command Center.');
      navigate('/admin/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        'Invalid Super Admin credentials. Please verify your email and password.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#0C0D10] text-white flex flex-col justify-between relative overflow-hidden font-sans select-none"
    >
      {/* -------------------------------------------------------------
          1. LUXURY AMBIENT BACKGROUND & SPOTLIGHTS
      ------------------------------------------------------------- */}
      {/* Dynamic Cursor Spotlight (Follows mouse smoothly in Rich Royal Purple & Warm Lustrous Gold) */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out"
        style={{
          background: `radial-gradient(750px circle at ${mousePos.x}% ${mousePos.y}%, rgba(147, 51, 234, 0.14), rgba(197, 168, 105, 0.09) 35%, transparent 75%)`,
        }}
      />

      {/* Floating Ambient Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-120 h-120 bg-[#7E22CE]/18 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute -bottom-40 -right-40 w-lg h-128 bg-[#C5A869]/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-[#3B0764]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Geometric Jewellery Lattice Watermark */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#C5A869_1.5px,transparent_1.5px)] bg-size-[28px_28px]" />

      {/* -------------------------------------------------------------
          2. TOP LUXURY HEADER BAR (MOBILE RESPONSIVE)
      ------------------------------------------------------------- */}
      <header className="px-4 py-3 sm:px-8 sm:py-5 flex items-center justify-between z-10 border-b border-white/7 bg-[#121318]/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-linear-to-br from-[#1E1F26] to-[#14151B] border border-[#C5A869]/60 p-1 sm:p-1.5 flex items-center justify-center shrink-0 shadow-md">
            <img src={logoImg} alt="Siri Samruddhi" className="w-full h-full object-contain scale-105" />
          </div>
          {/* Hidden on mobile, shown on tablet/desktop */}
          <div className="hidden sm:block">
            <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>Siri Samruddhi Gold Palace</span>
            </h1>
            <p className="text-[10px] font-bold text-[#E5C378] tracking-widest uppercase flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#E5C378]" />
              <span>Enterprise Command Center</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="text-[11px] sm:text-xs font-bold text-[#D4D4D8] hover:text-white flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/5 hover:bg-[#7E22CE]/20 border border-white/10 hover:border-[#D8B4FE] transition-all cursor-pointer shadow-2xs group shrink-0"
        >
          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A869] group-hover:text-[#F3E8FF] transition-colors" />
          <span className="hidden sm:inline">Showroom Manager Portal</span>
          <span className="sm:hidden">Manager Portal →</span>
          <ArrowRight className="hidden sm:inline w-3.5 h-3.5 text-[#C5A869] group-hover:translate-x-1 transition-transform" />
        </button>
      </header>

      {/* -------------------------------------------------------------
          3. MAIN LUXURY ADMIN LOGIN CARD
      ------------------------------------------------------------- */}
      <main className="flex-1 flex items-center justify-center p-3.5 sm:p-6 z-10 my-3 sm:my-4">
        <div className="w-full max-w-md sm:max-w-lg bg-[#14151B]/90 backdrop-blur-2xl border border-[#C5A869]/40 rounded-3xl p-5 sm:p-8 md:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all duration-300 hover:border-[#C5A869]/70 hover:shadow-[0_30px_90px_rgba(126,34,206,0.2)]">
          {/* Top Gold & Purple Shimmer Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-[#C5A869] via-[#A855F7] to-[#C5A869] opacity-90 animate-pulse" />

          {/* Top Center Logo & Title */}
          <div className="flex flex-col items-center text-center space-y-3 mb-5 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-[#242630] via-[#1A1B22] to-[#121319] border-2 border-[#C5A869]/70 p-1.5 sm:p-2 flex items-center justify-center shadow-lg shadow-[#C5A869]/10 relative group">
              <img src={logoImg} alt="Siri Samruddhi" className="w-full h-full object-contain scale-110 drop-shadow-md group-hover:scale-115 transition-transform duration-300" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-linear-to-br from-[#7E22CE] to-[#9333EA] border border-white/50 flex items-center justify-center shadow-xs">
                <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FDE68A]" />
              </div>
            </div>

            <div className="space-y-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-[#7E22CE]/30 via-[#C5A869]/20 to-[#7E22CE]/30 border border-[#C5A869]/50 text-[#FDE68A] text-[10px] font-extrabold uppercase tracking-widest shadow-2xs">
                <Shield className="w-3 h-3 text-[#E5C378]" />
                <span>Super Administrator Access</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Enterprise Command Center
              </h2>
              <p className="text-xs text-[#A1A1AA] font-medium">
                HQ Executive Control & Operations Intelligence
              </p>
            </div>

            {/* Scope Showrooms Pill Indicator */}
            <div className="w-full pt-1">
              <div className="bg-[#1C1E26] border border-white/8 rounded-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-xs">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  <span className="text-[11px] font-bold text-[#D4D4D8]">Enterprise Scope:</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-[#2E1065] border border-[#7E22CE]/60 text-[#F3E8FF] text-[9px] sm:text-[10px] font-extrabold">
                    YELAHANKA
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#14532D] border border-[#22C55E]/60 text-[#DCFCE7] text-[9px] sm:text-[10px] font-extrabold">
                    KOLAR
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#7C2D12] border border-[#F97316]/60 text-[#FFEDD5] text-[9px] sm:text-[10px] font-extrabold">
                    UDUPI
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <span className="text-red-400 font-bold">!</span>
              </div>
              <p className="leading-snug">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Super Admin Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#E4DFD4] uppercase tracking-wider flex items-center justify-between">
                <span>Super Admin Identifier / Email</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5A869] transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sirisamruddhigold.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1C24] border border-[#3F3F46] rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#C5A869]/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Master Security Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#E4DFD4] uppercase tracking-wider">
                  Master Security Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5A869] transition-colors">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  required
                  className="w-full pl-10 pr-11 py-3 bg-[#1A1C24] border border-[#3F3F46] rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#C5A869]/20 transition-all font-medium tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A1A1AA] hover:text-[#E5C378] cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me / 2-Day Session Cache */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#D4D4D8] hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-[#52525B] text-[#7E22CE] focus:ring-0 bg-[#1A1C24] cursor-pointer"
                />
                <span className="font-medium">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-linear-to-r from-[#C5A869] via-[#E5C378] to-[#C5A869] hover:from-[#D4B97A] hover:via-[#F3DA96] hover:to-[#D4B97A] text-[#101114] text-xs font-black shadow-lg shadow-[#C5A869]/20 transition-all hover:scale-[1.01] active:scale-[0.99] tracking-wider uppercase disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying Super Admin Authorization...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#101114]" />
                  <span>Authenticate Command Center</span>
                  <ArrowRight className="w-4 h-4 text-[#101114]" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* -------------------------------------------------------------
          4. FOOTER
      ------------------------------------------------------------- */}
      <footer className="px-6 py-4 border-t border-white/6 bg-[#101114]/80 text-center text-xs text-[#71717A] z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Siri Samruddhi Gold Palace Private Limited.</span>
        <span className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>Enterprise Security Protocol v2.6</span>
        </span>
      </footer>
    </div>
  );
};
