import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/client';
import { User, Branch } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  selectedBranch: Branch | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string, branchCode?: string, rememberMe?: boolean) => Promise<boolean>;
  loginAdmin: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setSelectedBranch: (branch: Branch | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('siri_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('siri_auth_token'));
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(() => {
    const savedBranch = localStorage.getItem('siri_selected_branch');
    if (savedBranch) {
      try {
        return JSON.parse(savedBranch);
      } catch {}
    }
    return {
      id: 1,
      code: 'YELAHANKA',
      name: 'Yelahanka',
      city: 'Bangalore',
      is_active: true,
    };
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async (
    username: string,
    password: string,
    branchCode = 'YELAHANKA',
    rememberMe = false
  ): Promise<boolean> => {
    try {
      const response = await api.post('/api/v1/auth/login', {
        username: username.trim(),
        password: password.trim(),
        branch_code: branchCode,
        remember_me: rememberMe,
      });

      const data = response.data;
      const userProfile: User = {
        id: data.user_id,
        username: data.username,
        full_name: data.full_name,
        manager_code: data.manager_code,
        email: data.email,
        role: data.role || 'MANAGER',
        branch_id: data.branch_id,
        branch_code: data.branch_code,
        branch_name: data.branch_name,
        is_active: true,
      };

      const branchObj: Branch = {
        id: data.branch_id,
        code: data.branch_code,
        name: data.branch_name,
        city: data.branch_name,
        is_active: true,
      };

      // Calculate cache lifetime: minimum 2 days (172,800 seconds)
      const durationSeconds = data.expires_in || (2 * 24 * 60 * 60);
      const expiresAt = Date.now() + durationSeconds * 1000;

      setToken(data.access_token);
      setUser(userProfile);
      setSelectedBranch(branchObj);

      localStorage.setItem('siri_auth_token', data.access_token);
      localStorage.setItem('siri_auth_user', JSON.stringify(userProfile));
      localStorage.setItem('siri_selected_branch', JSON.stringify(branchObj));
      localStorage.setItem('siri_auth_expires_at', expiresAt.toString());
      localStorage.setItem('siri_auth_timestamp', Date.now().toString());

      return true;
    } catch (err: any) {
      throw err;
    }
  };

  const loginAdmin = async (
    username: string,
    password: string,
    rememberMe = false
  ): Promise<boolean> => {
    try {
      const response = await api.post('/api/v1/admin/auth/login', {
        username: username.trim(),
        password: password.trim(),
        branch_code: 'ALL',
        remember_me: rememberMe,
      });

      const data = response.data;
      const userProfile: User = {
        id: data.user_id || 0,
        username: data.username || 'superadmin',
        full_name: data.full_name || 'Super Administrator',
        email: data.email || 'admin@sirisamruddhigold.com',
        role: 'SUPER_ADMIN',
        branch_id: 0,
        branch_code: 'ALL',
        branch_name: 'All Branches (Enterprise HQ)',
        is_active: true,
      };

      const branchObj: Branch = {
        id: 0,
        code: 'ALL',
        name: 'All Branches',
        city: 'All Locations',
        is_active: true,
      };

      // Calculate cache lifetime: minimum 2 days
      const durationSeconds = data.expires_in || (2 * 24 * 60 * 60);
      const expiresAt = Date.now() + durationSeconds * 1000;

      setToken(data.access_token);
      setUser(userProfile);
      setSelectedBranch(branchObj);

      localStorage.setItem('siri_auth_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('siri_admin_refresh_token', data.refresh_token);
      }
      localStorage.setItem('siri_auth_user', JSON.stringify(userProfile));
      localStorage.setItem('siri_selected_branch', JSON.stringify(branchObj));
      localStorage.setItem('siri_auth_expires_at', expiresAt.toString());
      localStorage.setItem('siri_auth_timestamp', Date.now().toString());

      return true;
    } catch (err: any) {
      throw err;
    }
  };

  const logout = () => {
    try {
      if (user?.role === 'SUPER_ADMIN') {
        api.post('/api/v1/admin/auth/logout').catch(() => {});
      } else {
        api.post('/api/v1/auth/logout').catch(() => {});
      }
    } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem('siri_auth_token');
    localStorage.removeItem('siri_admin_refresh_token');
    localStorage.removeItem('siri_auth_user');
    localStorage.removeItem('siri_auth_expires_at');
    localStorage.removeItem('siri_auth_timestamp');
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const endpoint = user?.role === 'SUPER_ADMIN' ? '/api/v1/admin/auth/me' : '/api/v1/auth/me';
      const res = await api.get<User>(endpoint);
      setUser(res.data);
      if (res.data.role === 'SUPER_ADMIN') {
        const branchObj: Branch = {
          id: 0,
          code: 'ALL',
          name: 'All Branches',
          city: 'All Locations',
          is_active: true,
        };
        setSelectedBranch(branchObj);
      } else {
        const branchObj: Branch = {
          id: res.data.branch_id,
          code: res.data.branch_code,
          name: res.data.branch_name,
          city: res.data.branch_name,
          is_active: true,
        };
        setSelectedBranch(branchObj);
      }
      localStorage.setItem('siri_auth_user', JSON.stringify(res.data));
    } catch (err: any) {
      // Only force logout on genuine 401 token invalidation, not on temporary network glitch
      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  useEffect(() => {
    const verifyInitialAuth = async () => {
      const storedToken = localStorage.getItem('siri_auth_token');
      const savedUser = localStorage.getItem('siri_auth_user');
      const expiresAtRaw = localStorage.getItem('siri_auth_expires_at');

      if (storedToken && savedUser) {
        // Check if cache has expired (default 2 days cache window)
        const isExpired = expiresAtRaw ? Date.now() > parseInt(expiresAtRaw, 10) : false;

        if (isExpired) {
          logout();
          setIsLoading(false);
          return;
        }

        try {
          const parsedUser: User = JSON.parse(savedUser);
          setUser(parsedUser);
          setToken(storedToken);

          // Non-blocking background sync
          const endpoint = parsedUser.role === 'SUPER_ADMIN' ? '/api/v1/admin/auth/me' : '/api/v1/auth/me';
          api.get<User>(endpoint)
            .then((res) => {
              if (res.data) {
                setUser(res.data);
                localStorage.setItem('siri_auth_user', JSON.stringify(res.data));
              }
            })
            .catch((err) => {
              if (err.response?.status === 401) {
                logout();
              }
            });
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyInitialAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        selectedBranch,
        isAuthenticated: !!token && !!user,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isLoading,
        login,
        loginAdmin,
        logout,
        refreshProfile,
        setSelectedBranch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
