import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios headers whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user on mount or token change
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/users/me');
        setCurrentUser(res.data);
        setIsAuthenticated(true);
        
        // Ensure user ID is in localStorage
        if (res.data && res.data.id) {
          localStorage.setItem('userId', res.data.id);
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setToken(null);
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('userId');
      }

      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    setError(null);

    try {
      const res = await axios.post('/api/users/register', userData);

      // If using FormData (for file uploads)
      if (userData instanceof FormData) {
        return res.data;
      }

      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  // Login user
  const login = async (username, password) => {
    setError(null);

    try {
      const res = await axios.post('/api/users/login', { username, password });
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setIsAuthenticated(true);
      
      // Store user ID in localStorage for like/comment functionality
      if (res.data.user && res.data.user.id) {
        localStorage.setItem('userId', res.data.user.id);
      }
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    // Add a small delay to prevent ResizeObserver errors
    setTimeout(() => {
      setToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
      
      // Clear user ID from localStorage
      localStorage.removeItem('userId');
    }, 10);
  };

  // Update the current user in the auth context
  const updateUser = (updatedUserData) => {
    setCurrentUser(prev => ({
      ...prev,
      ...updatedUserData
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 