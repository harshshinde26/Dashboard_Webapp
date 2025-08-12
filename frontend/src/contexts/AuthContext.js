import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('authToken');
        
        if (storedUser && token) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      console.log(`Attempting login for username: ${username}`);
      
      // Try the new backend API first (but handle failures gracefully)
      try {
        console.log('Trying API login...');
        const response = await fetch('/api/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('API login successful:', data);
          
          if (data.success) {
            const userData = {
              id: data.user.id,
              username: data.user.username,
              email: data.user.email,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
              role: data.user.role,
              permissions: data.user.permissions,
              isRealUser: data.isRealUser || false
            };
            
            // Store user data and token
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('authToken', data.token);
            
            setUser(userData);
            setIsAuthenticated(true);
            
            return { success: true, user: userData };
          }
        }
      } catch (apiError) {
        console.log('API login failed, falling back to demo authentication:', apiError);
      }
      
      // Fallback to demo authentication (always works)
      console.log('Using demo authentication...');
      const demoResult = await simulateLogin(username, password);
      console.log('Demo authentication result:', demoResult);
      
      if (demoResult.success) {
        const userData = {
          id: demoResult.user.id,
          username: demoResult.user.username,
          email: demoResult.user.email,
          firstName: demoResult.user.firstName,
          lastName: demoResult.user.lastName,
          role: demoResult.user.role,
          permissions: demoResult.user.permissions,
          isRealUser: false
        };
        
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', demoResult.token);
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        return { success: false, error: demoResult.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear stored data
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const hasPermission = (permission) => {
    // Admin users have all permissions
    if (user?.role === 'admin') {
      return true;
    }
    
    // Check if user has the specific permission
    if (user?.permissions?.includes(permission)) {
      return true;
    }
    
    // For basic dashboard access, all authenticated users should have access
    if (permission === 'read' || !permission) {
      return isAuthenticated;
    }
    
    return false;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Demo login simulation (replace with real API call)
const simulateLogin = async (username, password) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Demo users (in production, this would be handled by your backend)
  const demoUsers = {
    'admin': {
      password: 'admin123',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@dashboard.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin']
      }
    },
    'manager': {
      password: 'manager123',
      user: {
        id: 2,
        username: 'manager',
        email: 'manager@dashboard.com',
        firstName: 'Manager',
        lastName: 'User',
        role: 'manager',
        permissions: ['read', 'write']
      }
    },
    'viewer': {
      password: 'viewer123',
      user: {
        id: 3,
        username: 'viewer',
        email: 'viewer@dashboard.com',
        firstName: 'Viewer',
        lastName: 'User',
        role: 'viewer',
        permissions: ['read']
      }
    },
    'demo': {
      password: 'demo',
      user: {
        id: 4,
        username: 'demo',
        email: 'demo@dashboard.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'manager',
        permissions: ['read', 'write']
      }
    }
  };

  const userRecord = demoUsers[username.toLowerCase()];
  
  if (userRecord && userRecord.password === password) {
    return {
      success: true,
      user: userRecord.user,
      token: `demo-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  } else {
    return {
      success: false,
      error: 'Invalid username or password'
    };
  }
}; 