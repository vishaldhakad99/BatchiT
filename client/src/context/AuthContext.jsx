import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { getOrGenerateE2EEKeyPair } from '../services/crypto';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('batchit_token'));
  const [loading, setLoading] = useState(true);
  const [e2eeKeys, setE2eeKeys] = useState(null);

  // Initialize E2EE Keys
  useEffect(() => {
    const initCrypto = async () => {
      const keys = await getOrGenerateE2EEKeyPair();
      if (keys) {
        setE2eeKeys(keys);
      }
    };
    initCrypto();
  }, []);

  // Check current session
  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('batchit_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await api.get('/auth/me');
      if (res.data.success && res.data.data) {
        const userData = res.data.data;
        setUser(userData);

        // Sync E2EE public key if server doesn't have it yet
        if (e2eeKeys?.rawPublicKeyBase64 && (!userData.publicKey || userData.publicKey !== e2eeKeys.rawPublicKeyBase64)) {
          api.put('/users/profile', { publicKey: e2eeKeys.rawPublicKeyBase64 }).catch(() => {});
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('batchit_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [e2eeKeys]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.data.success) {
      const { user: loggedInUser, accessToken } = res.data.data;
      localStorage.setItem('batchit_token', accessToken);
      setToken(accessToken);
      setUser(loggedInUser);

      // Sync E2EE public key
      if (e2eeKeys?.rawPublicKeyBase64 && (!loggedInUser.publicKey || loggedInUser.publicKey !== e2eeKeys.rawPublicKeyBase64)) {
        api.put('/users/profile', { publicKey: e2eeKeys.rawPublicKeyBase64 }).catch(() => {});
      }
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const register = async (formData) => {
    const payload = {
      ...formData,
      publicKey: e2eeKeys?.rawPublicKeyBase64 || null
    };

    const res = await api.post('/auth/register', payload);
    if (res.data.success) {
      const { user: registeredUser, accessToken } = res.data.data;
      localStorage.setItem('batchit_token', accessToken);
      setToken(accessToken);
      setUser(registeredUser);
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('batchit_token');
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (updates) => {
    const res = await api.put('/users/profile', updates);
    if (res.data.success) {
      setUser((prev) => ({ ...prev, ...res.data.data }));
      return { success: true, data: res.data.data };
    }
    return { success: false, message: res.data.message };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        e2eeKeys,
        login,
        register,
        logout,
        updateProfile,
        refreshUser: checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
