import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Save,
  Copy,
  Check,
  AlertCircle,
  BadgeCheck,
  IdCard,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

export const AccountSettingsPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

  // Profile Edit State
  const [fullName, setFullName] = useState<string>(user?.full_name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // Copied Username State
  const [copiedUsername, setCopiedUsername] = useState<boolean>(false);

  const handleCopyUsername = () => {
    if (user?.username) {
      navigator.clipboard.writeText(user.username);
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
      success('Username copied to clipboard!');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toastError('Full name cannot be empty.');
      return;
    }

    try {
      setIsSavingProfile(true);
      await api.put('/api/v1/auth/profile', {
        full_name: fullName.trim(),
        email: email.trim() || undefined,
      });
      await refreshProfile();
      success('Manager profile updated successfully!');
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toastError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toastError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('New passwords do not match. Please verify.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await api.post('/api/v1/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      success(res.data?.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isPasswordValid = newPassword.length >= 6;
  const isPasswordMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-[#536B8A] via-[#40546D] to-[#2C3B4D] rounded-3xl p-6 sm:p-8 text-white shadow-[0_10px_30px_rgba(83,107,138,0.2)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#FAF8F3]">
              <Shield className="w-3.5 h-3.5 text-[#E4DFD4]" />
              <span>Showroom Manager Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Manager Account & Security</span>
            </h1>
            <p className="text-sm text-[#FAF8F3]/80 max-w-xl">
              Manage your personal showroom manager profile, view login credentials, and update your security password.
            </p>
          </div>

          {/* Quick ID Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white text-[#536B8A] flex items-center justify-center font-black text-lg shadow-sm">
              {user?.full_name?.charAt(0) || 'M'}
            </div>
            <div>
              <div className="text-xs text-[#FAF8F3]/70 font-semibold uppercase tracking-wider">
                Manager Identity
              </div>
              <div className="text-base font-bold text-white flex items-center gap-1.5">
                <span>{user?.full_name}</span>
                <BadgeCheck className="w-4 h-4 text-[#7BB896]" />
              </div>
              <div className="text-xs text-[#E4DFD4] font-mono">
                {user?.manager_code ? `Manager ID: #${user.manager_code}` : `User ID: #${user?.id}`}
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 bg-[#FAF8F3]/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Profile & Credentials (1 col) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card: Credentials Overview */}
          <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-5">
            <div className="flex items-center gap-3 border-b border-[#F0EFEA] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] flex items-center justify-center">
                <IdCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1D1D1B]">Login Credentials</h2>
                <p className="text-xs text-[#8A8479]">Auto-saved manager account details</p>
              </div>
            </div>

            {/* Username Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block">
                Username (Auto-Saved)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-3.5 py-2.5 font-mono text-sm font-bold text-[#1D1D1B] truncate">
                  {user?.username || '—'}
                </div>
                <button
                  onClick={handleCopyUsername}
                  title="Copy Username"
                  className="p-2.5 rounded-xl bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] hover:bg-[#E2E8F0] transition-colors cursor-pointer shrink-0"
                >
                  {copiedUsername ? <Check className="w-4 h-4 text-[#21845F]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-[#8A8479] flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3 text-[#21845F]" />
                <span>Active showroom login ID</span>
              </span>
            </div>

            {/* Showroom Branch Box */}
            <div className="space-y-1.5 pt-2 border-t border-[#F0EFEA]">
              <label className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block">
                Assigned Showroom
              </label>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
                <Building2 className="w-5 h-5 text-[#536B8A] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#1D1D1B] block">
                    {user?.branch_name || 'Showroom Branch'}
                  </span>
                  <span className="text-[10px] font-mono text-[#536B8A]">
                    Code: {user?.branch_code || 'MAIN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Manager Code & Role */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F0EFEA] text-xs">
              <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#E4DFD4]">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Manager ID</span>
                <span className="font-mono font-bold text-[#536B8A] text-sm">
                  #{user?.manager_code || user?.id || '—'}
                </span>
              </div>
              <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#E4DFD4]">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Role</span>
                <span className="font-bold text-[#1D1D1B]">Showroom Mgr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Edit & Change Password Form (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card: Change Password Form (Self-Service) */}
          <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-6">
            <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF1EC] border border-[#ECCFC0] text-[#B97855] flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-[#B97855]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1D1D1B]">Change Manager Password</h2>
                  <p className="text-xs text-[#8A8479]">
                    Showroom managers can set and update their own password securely.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1D1D1B] block">
                  Current Password <span className="text-[#C24141]">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#8A8479]" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-10 pr-10 py-2.5 input-luxury-beige rounded-xl text-xs transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 p-1 text-[#8A8479] hover:text-[#1D1D1B]"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1D1D1B] block">
                    New Password <span className="text-[#C24141]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-[#8A8479]" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 input-luxury-beige rounded-xl text-xs transition-all font-medium"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 p-1 text-[#8A8479] hover:text-[#1D1D1B]"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <p
                      className={`text-[10px] flex items-center gap-1 font-semibold ${
                        isPasswordValid ? 'text-[#21845F]' : 'text-[#C24141]'
                      }`}
                    >
                      {isPasswordValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Password length is valid (6+ characters)
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" /> Must be at least 6 characters
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1D1D1B] block">
                    Confirm New Password <span className="text-[#C24141]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-[#8A8479]" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-10 py-2.5 input-luxury-beige rounded-xl text-xs transition-all font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 p-1 text-[#8A8479] hover:text-[#1D1D1B]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p
                      className={`text-[10px] flex items-center gap-1 font-semibold ${
                        isPasswordMatch ? 'text-[#21845F]' : 'text-[#C24141]'
                      }`}
                    >
                      {isPasswordMatch ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Passwords match perfectly
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" /> Passwords do not match
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isChangingPassword}
                  className="bg-[#536B8A] hover:bg-[#40546D] text-white px-5"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  <span>Update Password</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Card: Personal Details & Name Update */}
          <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-6">
            <div className="flex items-center gap-3 border-b border-[#F0EFEA] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1D1D1B]">Profile Information</h2>
                <p className="text-xs text-[#8A8479]">Update your displayed manager name and email address</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1D1D1B] block">
                    Manager Full Name <span className="text-[#C24141]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-[#8A8479]" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. ADARSHA"
                      className="w-full pl-10 pr-3.5 py-2.5 input-luxury-beige rounded-xl text-xs transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1D1D1B] block">
                    Contact Email Address (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[#8A8479]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. manager@sirisamruddhigold.com"
                      className="w-full pl-10 pr-3.5 py-2.5 input-luxury-beige rounded-xl text-xs transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Save Profile Button */}
              <div className="flex items-center justify-end pt-2">
                <Button
                  type="submit"
                  variant="outline"
                  isLoading={isSavingProfile}
                  className="border-[#C5D5E6] text-[#536B8A] hover:bg-[#EDF2F7] px-5"
                >
                  <Save className="w-4 h-4 mr-2" />
                  <span>Save Profile Changes</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
