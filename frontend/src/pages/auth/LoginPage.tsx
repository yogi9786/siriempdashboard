import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Branch, ManagerPublicOption } from '../../types';
import api from '../../api/client';
import logoImg from '../../assets/siri samruddhi logo.png';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Branch and Manager states from Backend
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>(
    searchParams.get('branch')?.toUpperCase() || 'YELAHANKA'
  );
  const [managers, setManagers] = useState<ManagerPublicOption[]>([]);
  const [selectedManagerUsername, setSelectedManagerUsername] = useState<string>('');

  // Form State
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Interactive Background Hover State (Smooth cursor-following ambient spotlight)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setMousePos({ x, y });
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Fetch branches with their live managers directly from backend API
  const fetchBranches = async () => {
    try {
      setIsFetchingData(true);
      const res = await api.get<Branch[]>('/api/v1/auth/branches');
      if (res.data && res.data.length > 0) {
        setBranches(res.data);

        // Preselect active branch
        const defaultBranch =
          res.data.find((b) => b.code.toUpperCase() === selectedBranchCode.toUpperCase()) || res.data[0];
        setSelectedBranchCode(defaultBranch.code);

        if (defaultBranch.managers && defaultBranch.managers.length > 0) {
          setManagers(defaultBranch.managers);
          setSelectedManagerUsername(defaultBranch.managers[0].username);
        }
      }
    } catch (err) {
      console.error('Failed to load branches from backend:', err);
    } finally {
      setIsFetchingData(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleBranchSelect = async (branchCode: string) => {
    setSelectedBranchCode(branchCode);
    setErrorMessage('');
    setPassword('');

    try {
      const res = await api.get<ManagerPublicOption[]>(`/api/v1/auth/branches/${branchCode}/managers`);
      if (res.data && res.data.length > 0) {
        setManagers(res.data);
        setSelectedManagerUsername(res.data[0].username);
        return;
      }
    } catch (err) {
      console.warn('Falling back to loaded branches cache');
    }

    const targetBranch = branches.find((b) => b.code === branchCode);
    if (targetBranch && targetBranch.managers && targetBranch.managers.length > 0) {
      setManagers(targetBranch.managers);
      setSelectedManagerUsername(targetBranch.managers[0].username);
    } else {
      setManagers([]);
      setSelectedManagerUsername('');
    }
  };

  const handleManagerChange = (username: string) => {
    setSelectedManagerUsername(username);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManagerUsername.trim() || !password.trim()) {
      setErrorMessage('Please select a manager and enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const activeBranch = branches.find((b) => b.code === selectedBranchCode);
      const branchName = activeBranch ? activeBranch.name : selectedBranchCode;

      await login(selectedManagerUsername.trim(), password.trim(), selectedBranchCode, rememberMe);
      success(`Welcome to ${branchName} Showroom Portal`);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        'Invalid manager credentials. Please verify your password.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const currentBranch = branches.find((b) => b.code === selectedBranchCode);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#F6F3EC] flex flex-col justify-center items-center p-4 sm:p-6 text-[#1D1D1B] relative overflow-hidden select-none transition-colors duration-500"
    >
      {/* -------------------------------------------------------------
          1. DYNAMIC INTERACTIVE BACKGROUND WITH MOUSE-HOVER SPOTLIGHTS
      ------------------------------------------------------------- */}
      {/* Dynamic Cursor Spotlight (Follows mouse smoothly in Purple & Gold) */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}% ${mousePos.y}%, rgba(126, 34, 206, 0.09), rgba(198, 164, 92, 0.06) 40%, transparent 80%)`,
        }}
      />

      {/* Floating Ambient Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#7E22CE]/12 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#C6A45C]/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-[#7E22CE]/8 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Geometric Jewellery Watermark Lattice */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[radial-gradient(#7E22CE_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* -------------------------------------------------------------
          2. MAIN LUXURY LOGIN CARD
      ------------------------------------------------------------- */}
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl border border-[#E4DFD4] rounded-3xl shadow-[0_20px_60px_rgba(40,35,25,0.08)] p-6 sm:p-9 relative z-10 space-y-6 transition-all duration-300 hover:shadow-[0_25px_70px_rgba(126,34,206,0.12)]">
        {/* Subtle Top Purple Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#7E22CE] to-transparent rounded-t-3xl opacity-80" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 inline-flex items-center justify-center cursor-pointer">
            <img
              src={logoImg}
              alt="Siri Samruddhi Gold Palace"
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Showroom Portal Badge in Purple */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#7E22CE]" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Employee Management Portal
            </span>
          </div>
        </div>

        {/* -------------------------------------------------------------
            STEP 1: SHOWROOM BRANCH SELECTOR (SOLID MULTI-COLORS)
        ------------------------------------------------------------- */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#5E5A52] tracking-wide flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] text-[10px] flex items-center justify-center font-bold">
                1
              </span>
              <span>Select Showroom Branch</span>
            </label>
            <button
              type="button"
              onClick={fetchBranches}
              title="Sync branches from server"
              className="text-[11px] font-semibold text-[#7E22CE] hover:text-[#581C87] inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingData ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {branches.map((b, index) => {
              const isSelected = selectedBranchCode === b.code;
              // Distinct solid palettes (No Gradients): 0 = Slate Blue (Employees), 1 = Emerald Green (Outdoor), 2 = Amber Terracotta
              const branchThemes = [
                {
                  selected: 'bg-[#536B8A] text-white border-[#3E526B] shadow-sm scale-[1.02]',
                  unselected: 'bg-[#EDF2F8] text-[#1D1D1B] border-[#C5D5E6] hover:border-[#536B8A] hover:bg-[#E2EAF2]',
                  iconSelected: 'text-white',
                  iconUnselected: 'text-[#536B8A]',
                  textSelected: 'text-white',
                  textUnselected: 'text-[#1D1D1B] group-hover:text-[#536B8A]',
                  subSelected: 'text-[#E2E8F0]',
                  subUnselected: 'text-[#536B8A]',
                },
                {
                  selected: 'bg-[#23815F] text-white border-[#1A6349] shadow-sm scale-[1.02]',
                  unselected: 'bg-[#E8F4EE] text-[#1D1D1B] border-[#C5E3D5] hover:border-[#23815F] hover:bg-[#D5EADB]',
                  iconSelected: 'text-white',
                  iconUnselected: 'text-[#23815F]',
                  textSelected: 'text-white',
                  textUnselected: 'text-[#1D1D1B] group-hover:text-[#23815F]',
                  subSelected: 'text-[#D1FAE5]',
                  subUnselected: 'text-[#23815F]',
                },
                {
                  selected: 'bg-[#B97855] text-white border-[#9E6445] shadow-sm scale-[1.02]',
                  unselected: 'bg-[#FAF1EC] text-[#1D1D1B] border-[#ECCFC0] hover:border-[#B97855] hover:bg-[#F5E2D6]',
                  iconSelected: 'text-white',
                  iconUnselected: 'text-[#B97855]',
                  textSelected: 'text-white',
                  textUnselected: 'text-[#1D1D1B] group-hover:text-[#B97855]',
                  subSelected: 'text-[#FFEDD5]',
                  subUnselected: 'text-[#B97855]',
                },
              ];
              const theme = branchThemes[index % branchThemes.length];

              return (
                <button
                  type="button"
                  key={b.code}
                  onClick={() => handleBranchSelect(b.code)}
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                    isSelected ? theme.selected : theme.unselected
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Building2 className={`w-4 h-4 ${isSelected ? theme.iconSelected : theme.iconUnselected}`} />
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <p className={`font-bold text-xs ${isSelected ? theme.textSelected : theme.textUnselected}`}>
                      {b.name}
                    </p>
                    <p className={`text-[10px] ${isSelected ? theme.subSelected : theme.subUnselected} font-medium`}>
                      {b.city}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* -------------------------------------------------------------
            STEP 2: MANAGER CREDENTIALS & SIGN IN FORM
        ------------------------------------------------------------- */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1 border-t border-[#EBE6DC]">
          <label className="text-xs font-semibold text-[#5E5A52] tracking-wide flex items-center gap-2 pt-1">
            <span className="w-5 h-5 rounded-full bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] text-[10px] flex items-center justify-center font-bold">
              2
            </span>
            <span>Manager Credentials</span>
          </label>

          {/* Manager Dropdown from Backend */}
          <div>
            <label className="text-xs font-medium text-[#5E5A52] block mb-1.5">
              Select Manager Name *
            </label>
            <div className="relative flex items-center">
              <UserIcon className="absolute left-3.5 w-4 h-4 text-[#7E22CE] pointer-events-none" />
              <select
                value={selectedManagerUsername}
                onChange={(e) => handleManagerChange(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-[#1D1D1B] appearance-none focus:outline-none focus:border-[#7E22CE] focus:ring-2 focus:ring-[#7E22CE]/15 transition-all font-semibold cursor-pointer shadow-2xs"
                required
              >
                {managers.length === 0 ? (
                  <option value="">Fetching managers from showroom...</option>
                ) : (
                  managers.map((mgr) => (
                    <option key={mgr.id} value={mgr.username}>
                      {mgr.full_name} ({mgr.username})
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-3.5 w-4 h-4 text-[#8A8479] pointer-events-none" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-xs font-medium text-[#5E5A52] block mb-1.5">
              Manager Password *
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-[#7E22CE]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter showroom manager password"
                className="w-full bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-[#1D1D1B] placeholder:text-[#8A8479] focus:outline-none focus:border-[#7E22CE] focus:ring-2 focus:ring-[#7E22CE]/15 transition-all font-semibold shadow-2xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#8A8479] hover:text-[#7E22CE] transition-colors p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Session & Info */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#5E5A52] font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#E4DFD4] text-[#7E22CE] focus:ring-[#7E22CE] accent-[#7E22CE]"
              />
              <span>Remember session</span>
            </label>

            <span className="text-[11px] font-semibold text-[#7E22CE] bg-[#F3E8FF] px-2.5 py-0.5 rounded-full border border-[#D8B4FE]">
              {currentBranch?.name} Branch
            </span>
          </div>

          {/* Submit Action: Royal Purple Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7E22CE] via-[#6B21A8] to-[#581C87] hover:from-[#6B21A8] hover:to-[#4C1D95] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {currentBranch?.name || 'Showroom'} Portal</span>
                  <ArrowRight className="w-4 h-4 text-[#D8B4FE]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
