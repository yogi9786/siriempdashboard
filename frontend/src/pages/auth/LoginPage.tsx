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
import { Branch, ManagerPublicOption, EmployeePublicOption } from '../../types';
import api from '../../api/client';
import logoImg from '../../assets/siri samruddhi logo.png';

// Complete showroom employee directory for instant zero-latency autofetch
const SHOWROOM_EMPLOYEES_FALLBACK: Record<string, EmployeePublicOption[]> = {
  YELAHANKA: [
    { id: 214, employee_code: 'EMP-YEL-214', full_name: 'GAGAN', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 94, employee_code: 'EMP-YEL-094', full_name: 'BHEEMAMMA', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 8, employee_code: 'EMP-YEL-008', full_name: 'SHYLAJA B N', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 22, employee_code: 'EMP-YEL-022', full_name: 'SATISH ARKSALI', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 25, employee_code: 'EMP-YEL-025', full_name: 'SANNIRAMMA', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 54, employee_code: 'EMP-YEL-054', full_name: 'NANDINI BASAVARAJ', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 61, employee_code: 'EMP-YEL-061', full_name: 'KANTHARAJU', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 68, employee_code: 'EMP-YEL-068', full_name: 'TULASI', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 107, employee_code: 'EMP-YEL-107', full_name: 'SUNIL', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 110, employee_code: 'EMP-YEL-110', full_name: 'CHITHRA B', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 43, employee_code: 'EMP-YEL-043', full_name: 'PRASAD H R', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 116, employee_code: 'EMP-YEL-116', full_name: 'YOGANANDAN S P', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 132, employee_code: 'EMP-YEL-132', full_name: 'THEJU', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 178, employee_code: 'EMP-YEL-178', full_name: 'S GOPI', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 179, employee_code: 'EMP-YEL-179', full_name: 'DEVARAJU', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 183, employee_code: 'EMP-YEL-183', full_name: 'HARIPRIYA P V', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 200, employee_code: 'EMP-YEL-200', full_name: 'SINCHANA S', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 201, employee_code: 'EMP-YEL-201', full_name: 'SHWETHA M V', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 202, employee_code: 'EMP-YEL-202', full_name: 'VIDYASHREE', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 203, employee_code: 'EMP-YEL-203', full_name: 'SINCHANA P', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 204, employee_code: 'EMP-YEL-204', full_name: 'NAGINDRAPPA', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 211, employee_code: 'EMP-YEL-211', full_name: 'MADHU', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
    { id: 213, employee_code: 'EMP-YEL-213', full_name: 'MAHESWHARI', designation: 'Sales Executive', branch_id: 1, branch_code: 'YELAHANKA' },
  ],
  KOLAR: [
    { id: 82, employee_code: 'EMP-KOL-082', full_name: 'DIVAKARA N', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
    { id: 84, employee_code: 'EMP-KOL-084', full_name: 'MANJUNATHA M M', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
    { id: 85, employee_code: 'EMP-KOL-085', full_name: 'KIRAN KUMAR S', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
    { id: 90, employee_code: 'EMP-KOL-090', full_name: 'SHASHANKA N', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
    { id: 72, employee_code: 'EMP-KOL-072', full_name: 'SANDEEP S', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
    { id: 182, employee_code: 'EMP-KOL-182', full_name: 'N LEELAVATHI', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
    { id: 191, employee_code: 'EMP-KOL-191', full_name: 'KALPANA', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
    { id: 198, employee_code: 'EMP-KOL-198', full_name: 'PUNITRAJKUMAR R', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
    { id: 199, employee_code: 'EMP-KOL-199', full_name: 'SWATHI V', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
    { id: 208, employee_code: 'EMP-KOL-208', full_name: 'GAJENDRA S', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
    { id: 209, employee_code: 'EMP-KOL-209', full_name: 'H MAHESH KUMAR', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
    { id: 80, employee_code: 'EMP-KOL-080', full_name: 'SHIVAKUMAR M K', designation: 'Sales Executive', branch_id: 2, branch_code: 'KOLAR' },
  ],
  UDUPI: [
    { id: 118, employee_code: 'EMP-UDU-118', full_name: 'ASHWINI KUMARI N', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 140, employee_code: 'EMP-UDU-140', full_name: 'RAKSHITH AMIN', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 141, employee_code: 'EMP-UDU-141', full_name: 'KIRAN KUMAR', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 143, employee_code: 'EMP-UDU-143', full_name: 'CHAITHRA', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 144, employee_code: 'EMP-UDU-144', full_name: 'SANDHYA', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 147, employee_code: 'EMP-UDU-147', full_name: 'BHAGYA B R', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 148, employee_code: 'EMP-UDU-148', full_name: 'AKSHAYA', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 150, employee_code: 'EMP-UDU-150', full_name: 'VENKATESHA', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 151, employee_code: 'EMP-UDU-151', full_name: 'SANDESH KINI', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 152, employee_code: 'EMP-UDU-152', full_name: 'SWETHA R', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 154, employee_code: 'EMP-UDU-154', full_name: 'KAVYA H R', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 155, employee_code: 'EMP-UDU-155', full_name: 'GAYATHRI', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 158, employee_code: 'EMP-UDU-158', full_name: 'MANOJ IRANNA', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 160, employee_code: 'EMP-UDU-160', full_name: 'LAVISHA', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 163, employee_code: 'EMP-UDU-163', full_name: 'NISARGA ULLAS KHARVI', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 165, employee_code: 'EMP-UDU-165', full_name: 'KAVYASHRI N', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 167, employee_code: 'EMP-UDU-167', full_name: 'PRABHAKARA K', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 186, employee_code: 'EMP-UDU-186', full_name: 'NIKIL', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 189, employee_code: 'EMP-UDU-189', full_name: 'DILEEP', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
    { id: 210, employee_code: 'EMP-UDU-210', full_name: 'RAGHAVENDRA S', designation: 'Sales Executive', branch_id: 3, branch_code: 'UDUPI' },
  ],
};

export const LoginPage: React.FC = () => {
  const { login, loginEmployee, isAuthenticated, isEmployee } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Portal Mode: 'manager' vs 'employee'
  const [portalMode, setPortalMode] = useState<'manager' | 'employee'>('manager');

  // Branch, Manager, and Employee states from Backend
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>(
    searchParams.get('branch')?.toUpperCase() || 'YELAHANKA'
  );
  const [managers, setManagers] = useState<ManagerPublicOption[]>([]);
  const [selectedManagerUsername, setSelectedManagerUsername] = useState<string>('');

  const [employees, setEmployees] = useState<EmployeePublicOption[]>([]);
  const [selectedEmployeeUsername, setSelectedEmployeeUsername] = useState<string>('');

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
      if (isEmployee) {
        navigate('/employee/activity');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isEmployee, navigate]);

  // Fetch branches and autofetch managers & employees directly from backend API
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

        // Autofetch and set managers
        if (defaultBranch.managers && defaultBranch.managers.length > 0) {
          setManagers(defaultBranch.managers);
          setSelectedManagerUsername(defaultBranch.managers[0].username);
        }

        // Autofetch and set employees
        if (defaultBranch.employees && defaultBranch.employees.length > 0) {
          setEmployees(defaultBranch.employees);
          setSelectedEmployeeUsername(defaultBranch.employees[0].employee_code);
        } else {
          // Instant autofetch fallback for the branch
          const fallback = SHOWROOM_EMPLOYEES_FALLBACK[defaultBranch.code.toUpperCase()] || [];
          setEmployees(fallback);
          if (fallback.length > 0) {
            setSelectedEmployeeUsername(fallback[0].employee_code);
          }
        }

        // Live sync employees in background
        fetchEmployees(defaultBranch.code);
      }
    } catch (err) {
      console.error('Failed to load branches from backend:', err);
      // Fallback branches
      const fallback = SHOWROOM_EMPLOYEES_FALLBACK[selectedBranchCode] || [];
      setEmployees(fallback);
      if (fallback.length > 0) {
        setSelectedEmployeeUsername(fallback[0].employee_code);
      }
    } finally {
      setIsFetchingData(false);
    }
  };

  const fetchEmployees = async (branchCode: string) => {
    const cleanCode = branchCode.toUpperCase();
    try {
      const res = await api.get<EmployeePublicOption[]>(`/api/v1/auth/branches/${cleanCode}/employees`);
      const salesEmployees = (res.data || []).filter(
        (emp) => !emp.designation?.toLowerCase().includes('manager')
      );
      if (salesEmployees.length > 0) {
        setEmployees(salesEmployees);
        setSelectedEmployeeUsername((curr) => {
          const exists = salesEmployees.some((e) => e.employee_code === curr);
          return exists ? curr : salesEmployees[0].employee_code;
        });
      } else {
        const fallback = SHOWROOM_EMPLOYEES_FALLBACK[cleanCode] || [];
        setEmployees(fallback);
        if (fallback.length > 0) {
          setSelectedEmployeeUsername(fallback[0].employee_code);
        }
      }
    } catch (err) {
      // Smooth autofetch from showroom roster fallback
      const fallback = SHOWROOM_EMPLOYEES_FALLBACK[cleanCode] || [];
      setEmployees(fallback);
      if (fallback.length > 0) {
        setSelectedEmployeeUsername((curr) => {
          const exists = fallback.some((e) => e.employee_code === curr);
          return exists ? curr : fallback[0].employee_code;
        });
      }
    }
  };
  useEffect(() => {
    fetchBranches();
  }, []);

  const handleBranchSelect = (branchCode: string) => {
    const cleanCode = branchCode.toUpperCase();
    setSelectedBranchCode(cleanCode);
    setErrorMessage('');
    setPassword('');

    // Update managers
    const targetBranch = branches.find((b) => b.code.toUpperCase() === cleanCode);
    if (targetBranch && targetBranch.managers && targetBranch.managers.length > 0) {
      setManagers(targetBranch.managers);
      setSelectedManagerUsername(targetBranch.managers[0].username);
    } else {
      setManagers([]);
      setSelectedManagerUsername('');
    }

    // Autofetch employees immediately for selected branch
    const branchEmps = targetBranch?.employees && targetBranch.employees.length > 0
      ? targetBranch.employees
      : (SHOWROOM_EMPLOYEES_FALLBACK[cleanCode] || []);
    setEmployees(branchEmps);
    if (branchEmps.length > 0) {
      setSelectedEmployeeUsername(branchEmps[0].employee_code);
    } else {
      setSelectedEmployeeUsername('');
    }
    fetchEmployees(cleanCode);

    // Non-blocking background sync from .env endpoint
    api.get<ManagerPublicOption[]>(`/api/v1/auth/branches/${cleanCode}/managers`)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setManagers(res.data);
          setSelectedManagerUsername((curr) => {
            const exists = res.data.some((m) => m.username === curr);
            return exists ? curr : res.data[0].username;
          });
        }
      })
      .catch(() => {});
  };

  const handleManagerChange = (username: string) => {
    setSelectedManagerUsername(username);
    setErrorMessage('');
  };

  const handleEmployeeChange = (empCode: string) => {
    setSelectedEmployeeUsername(empCode);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (portalMode === 'manager') {
      if (!selectedManagerUsername.trim() || !password.trim()) {
        setErrorMessage('Please select a manager and enter your password.');
        return;
      }
    } else {
      if (!selectedEmployeeUsername.trim() || !password.trim()) {
        setErrorMessage('Please select an employee and enter your password.');
        return;
      }
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const activeBranch = branches.find((b) => b.code === selectedBranchCode);
      const branchName = activeBranch ? activeBranch.name : selectedBranchCode;

      if (portalMode === 'manager') {
        await login(selectedManagerUsername.trim(), password.trim(), selectedBranchCode, rememberMe);
        success(`Welcome to ${branchName} Showroom Portal`);
        navigate('/dashboard');
      } else {
        await loginEmployee(selectedEmployeeUsername.trim(), password.trim(), selectedBranchCode, rememberMe);
        success(`Welcome to ${branchName} Employee Portal`);
        navigate('/employee/activity');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        (portalMode === 'manager'
          ? 'Invalid manager credentials. Please verify your password.'
          : 'Invalid employee credentials. Please check your password.');
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
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[radial-gradient(#7E22CE_1px,transparent_1px)] bg-size-[24px_24px]" />

      {/* -------------------------------------------------------------
          2. MAIN LUXURY LOGIN CARD
      ------------------------------------------------------------- */}
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl border border-[#E4DFD4] rounded-3xl shadow-[0_20px_60px_rgba(40,35,25,0.08)] p-6 sm:p-9 relative z-10 space-y-6 transition-all duration-300 hover:shadow-[0_25px_70px_rgba(126,34,206,0.12)]">
        {/* Subtle Top Purple Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-transparent via-[#7E22CE] to-transparent rounded-t-3xl opacity-80" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 inline-flex items-center justify-center cursor-pointer">
            <img
              src={logoImg}
              alt="Siri Samruddhi Gold Palace"
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Showroom Portal Badge */}
          <div className={`mt-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full shadow-2xs transition-colors ${
            portalMode === 'manager'
              ? 'bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE]'
              : 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB]'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {portalMode === 'manager' ? 'Showroom Manager Portal' : 'Showroom Employee Portal'}
            </span>
          </div>
        </div>

        {/* -------------------------------------------------------------
            PORTAL ROLE TOGGLE: MANAGER vs EMPLOYEE
        ------------------------------------------------------------- */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[#F4F1EA] border border-[#E6E1D6] gap-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setPortalMode('manager');
              setErrorMessage('');
              setPassword('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              portalMode === 'manager'
                ? 'bg-white text-[#7E22CE] shadow-sm border border-[#E4DFD4] scale-[1.02]'
                : 'text-[#6B6559] hover:text-[#1D1D1B] hover:bg-white/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Showroom Manager</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalMode('employee');
              setErrorMessage('');
              setPassword('');
              fetchEmployees(selectedBranchCode);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              portalMode === 'employee'
                ? 'bg-white text-[#2563EB] shadow-sm border border-[#E4DFD4] scale-[1.02]'
                : 'text-[#6B6559] hover:text-[#1D1D1B] hover:bg-white/40'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Showroom Employee</span>
          </button>
        </div>

        {/* -------------------------------------------------------------
            STEP 1: SHOWROOM BRANCH SELECTOR (SOLID MULTI-COLORS)
        ------------------------------------------------------------- */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#5E5A52] tracking-wide flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                portalMode === 'manager'
                  ? 'bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE]'
                  : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
              }`}>
                1
              </span>
              <span>Select Showroom Branch</span>
            </label>
            <button
              type="button"
              onClick={fetchBranches}
              title="Sync branches from server"
              className={`text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                portalMode === 'manager' ? 'text-[#7E22CE] hover:text-[#581C87]' : 'text-[#2563EB] hover:text-[#1D4ED8]'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingData ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {branches.map((b, index) => {
              const isSelected = selectedBranchCode === b.code;
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
            STEP 2: CREDENTIALS & SIGN IN FORM
        ------------------------------------------------------------- */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1 border-t border-[#EBE6DC]">
          <label className="text-xs font-semibold text-[#5E5A52] tracking-wide flex items-center gap-2 pt-1">
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
              portalMode === 'manager'
                ? 'bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE]'
                : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
            }`}>
              2
            </span>
            <span>{portalMode === 'manager' ? 'Manager Credentials' : 'Employee Credentials'}</span>
          </label>

          {portalMode === 'manager' ? (
            /* Manager Dropdown */
            <div>
              <label className="text-xs font-medium text-[#5E5A52] block mb-1.5">
                Select Manager Name *
              </label>
              <div className="relative flex items-center">
                <UserIcon className="absolute left-3.5 w-4 h-4 text-[#7E22CE] pointer-events-none" />
                <select
                  value={selectedManagerUsername}
                  onChange={(e) => handleManagerChange(e.target.value)}
                  className="w-full select-luxury-purple rounded-2xl pl-9 pr-9 py-2.5 text-xs sm:text-sm appearance-none transition-all font-semibold cursor-pointer shadow-2xs"
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
          ) : (
            /* Employee Dropdown - Autofetched without examples */
            <div>
              <label className="text-xs font-medium text-[#5E5A52] block mb-1.5">
                Select Sales Employee *
              </label>
              <div className="relative flex items-center">
                <UserIcon className="absolute left-3.5 w-4 h-4 text-[#2563EB] pointer-events-none" />
                <select
                  value={selectedEmployeeUsername}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl pl-9 pr-9 py-2.5 text-xs sm:text-sm appearance-none transition-all font-semibold cursor-pointer shadow-2xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[#1E293B]"
                  required
                >
                  {employees.length === 0 ? (
                    <option value="">Fetching showroom employees...</option>
                  ) : (
                    employees.map((emp) => (
                      <option key={emp.id} value={emp.employee_code}>
                        {emp.full_name} ({emp.employee_code})
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-3.5 w-4 h-4 text-[#8A8479] pointer-events-none" />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="text-xs font-medium text-[#5E5A52] block mb-1.5">
              {portalMode === 'manager' ? 'Manager Password *' : 'Employee Password *'}
            </label>
            <div className="relative flex items-center">
              <Lock className={`absolute left-3.5 w-4 h-4 ${portalMode === 'manager' ? 'text-[#7E22CE]' : 'text-[#2563EB]'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={portalMode === 'manager' ? "Enter showroom manager password" : "Enter employee password"}
                className={`w-full rounded-2xl pl-9 pr-10 py-2.5 text-xs sm:text-sm transition-all font-semibold shadow-2xs ${
                  portalMode === 'manager'
                    ? 'input-luxury-purple'
                    : 'bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[#1E293B]'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 transition-colors p-1 cursor-pointer ${
                  portalMode === 'manager' ? 'text-[#8A8479] hover:text-[#7E22CE]' : 'text-[#8A8479] hover:text-[#2563EB]'
                }`}
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
                className={`w-4 h-4 rounded border-[#E4DFD4] ${portalMode === 'manager' ? 'text-[#7E22CE] focus:ring-[#7E22CE] accent-[#7E22CE]' : 'text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB]'}`}
              />
              <span>Remember session</span>
            </label>

            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
              portalMode === 'manager'
                ? 'text-[#7E22CE] bg-[#F3E8FF] border-[#D8B4FE]'
                : 'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]'
            }`}>
              {currentBranch?.name} Branch
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-2xl text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                portalMode === 'manager'
                  ? 'bg-linear-to-r from-[#7E22CE] via-[#6B21A8] to-[#581C87] hover:from-[#6B21A8] hover:to-[#4C1D95] btn-login-purple'
                  : 'bg-linear-to-r from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] hover:from-[#1D4ED8] hover:to-[#1E3A8A]'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>
                    {portalMode === 'manager'
                      ? `Sign In to ${currentBranch?.name || 'Showroom'} Manager Portal`
                      : `Sign In to ${currentBranch?.name || 'Showroom'} Employee Portal`}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/80" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};
