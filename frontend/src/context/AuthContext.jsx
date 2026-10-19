import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';
import { signInWithGoogle, logoutFirebase } from '../config/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('auth_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync current user on mount if token is stored
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
          sessionStorage.setItem('auth_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const handleAuthSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    sessionStorage.setItem('auth_user', JSON.stringify(userData));
    sessionStorage.setItem('auth_token', authToken);
  };

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    handleAuthSuccess(res.data.user, res.data.token);
    return res.data;
  };

  const register = async (formData) => {
    const res = await authApi.register(formData);
    handleAuthSuccess(res.data.user, res.data.token);
    return res.data;
  };

  const googleLogin = async (payload) => {
    const res = await authApi.googleAuth(payload);
    handleAuthSuccess(res.data.user, res.data.token);
    return res.data;
  };

  /**
   * Firebase Google Sign In integration.
   * Opens Firebase Google popup, acquires credentials, and synchronizes with Django backend.
   */
  const loginWithGoogle = async () => {
    const firebaseResult = await signInWithGoogle();
    const res = await authApi.googleAuth({
      credential: firebaseResult.credential,
      id_token: firebaseResult.idToken,
      access_token: firebaseResult.accessToken,
      email: firebaseResult.email,
      name: firebaseResult.name,
      picture: firebaseResult.picture,
      sub: firebaseResult.sub,
    });
    handleAuthSuccess(res.data.user, res.data.token);
    return res.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      await logoutFirebase();
      setUser(null);
      setToken(null);
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_token');
    }
  };

  const updateProfile = async (data) => {
    const res = await authApi.updateMe(data);
    setUser(res.data);
    sessionStorage.setItem('auth_user', JSON.stringify(res.data));
    return res.data;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    googleLogin,
    loginWithGoogle,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isMechanic: user?.role === 'MECHANIC',
    isCustomer: user?.role === 'CUSTOMER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
