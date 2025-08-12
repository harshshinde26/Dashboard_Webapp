import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Default settings
const defaultSettings = {
  appearance: {
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'UTC-5',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    batchAlerts: true,
    systemMaintenance: true,
    weeklyReports: false,
  },
  preferences: {
    autoRefresh: true,
    refreshInterval: 30,
    pageSize: 25,
    showTooltips: true,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordChangeRequired: false,
  }
};

const getThemeMode = (themeSetting) => {
  if (themeSetting === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return themeSetting;
};

const createAppTheme = (mode) => {
  const isLight = mode === 'light';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isLight ? '#667eea' : '#764ba2',
        light: isLight ? '#8fa5f4' : '#9575cd',
        dark: isLight ? '#4461c4' : '#512da8',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isLight ? '#f093fb' : '#ff6b6b',
        light: isLight ? '#f4a5fd' : '#ff8e8e',
        dark: isLight ? '#ed7bf8' : '#ff5252',
        contrastText: '#ffffff',
      },
      background: {
        default: isLight ? '#f5f7fa' : '#0c0c0c',
        paper: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 30, 30, 0.9)',
        glass: isLight 
          ? 'rgba(255, 255, 255, 0.85)' 
          : 'rgba(30, 30, 30, 0.85)',
      },
      text: {
        primary: isLight ? '#2d3748' : '#f7fafc',
        secondary: isLight ? '#4a5568' : '#cbd5e0',
        disabled: isLight ? '#a0aec0' : '#718096',
      },
      success: {
        main: '#48bb78',
        light: '#68d391',
        dark: '#38a169',
      },
      error: {
        main: '#f56565',
        light: '#fc8181',
        dark: '#e53e3e',
      },
      warning: {
        main: '#ed8936',
        light: '#f6ad55',
        dark: '#dd6b20',
      },
      info: {
        main: '#4299e1',
        light: '#63b3ed',
        dark: '#3182ce',
      },
      divider: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
      h1: {
        fontWeight: 800,
        fontSize: '2.5rem',
        letterSpacing: '-0.025em',
        background: isLight 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'linear-gradient(135deg, #8fa5f4 0%, #9575cd 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        letterSpacing: '-0.025em',
      },
      h3: {
        fontWeight: 700,
        fontSize: '1.75rem',
        letterSpacing: '-0.025em',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        letterSpacing: '-0.01em',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        letterSpacing: '0.00938em',
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        letterSpacing: '0.00714em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: isLight ? [
      'none',
      '0px 2px 4px rgba(0, 0, 0, 0.05)',
      '0px 4px 8px rgba(0, 0, 0, 0.1)',
      '0px 8px 16px rgba(0, 0, 0, 0.1)',
      '0px 16px 24px rgba(0, 0, 0, 0.1)',
      '0px 24px 32px rgba(0, 0, 0, 0.1)',
      '0px 32px 40px rgba(0, 0, 0, 0.15)',
      '0px 40px 48px rgba(0, 0, 0, 0.15)',
      '0px 48px 56px rgba(0, 0, 0, 0.15)',
      '0px 56px 64px rgba(0, 0, 0, 0.15)',
      '0px 64px 72px rgba(0, 0, 0, 0.2)',
      '0px 72px 80px rgba(0, 0, 0, 0.2)',
      '0px 80px 88px rgba(0, 0, 0, 0.2)',
      '0px 88px 96px rgba(0, 0, 0, 0.2)',
      '0px 96px 104px rgba(0, 0, 0, 0.25)',
      '0px 104px 112px rgba(0, 0, 0, 0.25)',
      '0px 112px 120px rgba(0, 0, 0, 0.25)',
      '0px 120px 128px rgba(0, 0, 0, 0.25)',
      '0px 128px 136px rgba(0, 0, 0, 0.3)',
      '0px 136px 144px rgba(0, 0, 0, 0.3)',
      '0px 144px 152px rgba(0, 0, 0, 0.3)',
      '0px 152px 160px rgba(0, 0, 0, 0.3)',
      '0px 160px 168px rgba(0, 0, 0, 0.35)',
      '0px 168px 176px rgba(0, 0, 0, 0.35)',
      '0px 176px 184px rgba(0, 0, 0, 0.35)',
    ] : [
      'none',
      '0px 2px 4px rgba(255, 255, 255, 0.05)',
      '0px 4px 8px rgba(255, 255, 255, 0.1)',
      '0px 8px 16px rgba(255, 255, 255, 0.1)',
      '0px 16px 24px rgba(255, 255, 255, 0.1)',
      '0px 24px 32px rgba(255, 255, 255, 0.1)',
      '0px 32px 40px rgba(255, 255, 255, 0.15)',
      '0px 40px 48px rgba(255, 255, 255, 0.15)',
      '0px 48px 56px rgba(255, 255, 255, 0.15)',
      '0px 56px 64px rgba(255, 255, 255, 0.15)',
      '0px 64px 72px rgba(255, 255, 255, 0.2)',
      '0px 72px 80px rgba(255, 255, 255, 0.2)',
      '0px 80px 88px rgba(255, 255, 255, 0.2)',
      '0px 88px 96px rgba(255, 255, 255, 0.2)',
      '0px 96px 104px rgba(255, 255, 255, 0.25)',
      '0px 104px 112px rgba(255, 255, 255, 0.25)',
      '0px 112px 120px rgba(255, 255, 255, 0.25)',
      '0px 120px 128px rgba(255, 255, 255, 0.25)',
      '0px 128px 136px rgba(255, 255, 255, 0.3)',
      '0px 136px 144px rgba(255, 255, 255, 0.3)',
      '0px 144px 152px rgba(255, 255, 255, 0.3)',
      '0px 152px 160px rgba(255, 255, 255, 0.3)',
      '0px 160px 168px rgba(255, 255, 255, 0.35)',
      '0px 168px 176px rgba(255, 255, 255, 0.35)',
      '0px 176px 184px rgba(255, 255, 255, 0.35)',
    ],
    components: {
      MuiTypography: {
        styleOverrides: {
          root: {
            color: isLight ? '#2d3748' : '#f7fafc',
          },
          h1: {
            color: isLight ? '#1a202c' : '#f7fafc',
          },
          h2: {
            color: isLight ? '#1a202c' : '#f7fafc',
          },
          h3: {
            color: isLight ? '#1a202c' : '#f7fafc',
          },
          h4: {
            color: isLight ? '#1a202c' : '#f7fafc',
          },
          h5: {
            color: isLight ? '#1a202c' : '#f7fafc',
          },
          h6: {
            color: isLight ? '#1a202c' : '#f7fafc',
          },
          body1: {
            color: isLight ? '#2d3748' : '#e2e8f0',
          },
          body2: {
            color: isLight ? '#4a5568' : '#cbd5e0',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: isLight ? '#2d3748' : '#f7fafc',
            '&:hover': {
              backgroundColor: isLight 
                ? 'rgba(102, 126, 234, 0.08)' 
                : 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isLight 
              ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
              : 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
            minHeight: '100vh',
            backgroundAttachment: 'fixed',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: isLight 
              ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)',
            color: 'white',
            backdropFilter: 'blur(20px)',
            borderRight: 'none',
            boxShadow: isLight 
              ? '4px 0 20px rgba(102, 126, 234, 0.15)'
              : '4px 0 20px rgba(0, 0, 0, 0.5)',
            '& .MuiListItemIcon-root': {
              color: 'white',
              minWidth: '40px',
            },
            '& .MuiListItemText-root': {
              color: 'white',
              '& .MuiTypography-root': {
                color: 'white',
                fontWeight: 500,
              },
            },
            '& .MuiListItemButton-root': {
              borderRadius: '12px',
              margin: '4px 8px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                },
              },
            },
            '& .MuiDivider-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isLight 
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`,
            boxShadow: isLight 
              ? '0 4px 20px rgba(0, 0, 0, 0.1)'
              : '0 4px 20px rgba(0, 0, 0, 0.5)',
            color: isLight ? '#2d3748' : '#f7fafc',
            '& .MuiIconButton-root': {
              color: isLight ? '#2d3748' : '#f7fafc',
            },
            '& .MuiTypography-root': {
              color: isLight ? '#2d3748' : '#f7fafc',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: isLight 
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: 16,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            color: isLight ? '#2d3748' : '#f7fafc',
            '& .MuiCardContent-root': {
              color: isLight ? '#2d3748' : '#f7fafc',
            },
            '& .MuiTypography-root': {
              color: isLight ? '#2d3748' : '#f7fafc',
            },
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: isLight 
                ? '0 20px 40px rgba(102, 126, 234, 0.15)'
                : '0 20px 40px rgba(102, 126, 234, 0.3)',
            },
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            color: isLight ? '#2d3748' : '#f7fafc',
            '& .MuiTypography-root': {
              color: isLight ? '#2d3748' : '#f7fafc',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 24px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          contained: {
            background: isLight 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
            color: 'white',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
            '&:hover': {
              background: isLight 
                ? 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                : 'linear-gradient(135deg, #6a4190 0%, #5a6fd8 100%)',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 500,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`,
            color: isLight ? '#2d3748' : '#f7fafc',
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 30, 30, 0.8)',
            '&.MuiChip-colorPrimary': {
              backgroundColor: isLight ? 'rgba(102, 126, 234, 0.12)' : 'rgba(143, 165, 244, 0.12)',
              color: isLight ? '#667eea' : '#8fa5f4',
              border: `1px solid ${isLight ? 'rgba(102, 126, 234, 0.2)' : 'rgba(143, 165, 244, 0.2)'}`,
            },
            '&.MuiChip-colorSecondary': {
              backgroundColor: isLight ? 'rgba(240, 147, 251, 0.12)' : 'rgba(255, 107, 107, 0.12)',
              color: isLight ? '#f093fb' : '#ff6b6b',
              border: `1px solid ${isLight ? 'rgba(240, 147, 251, 0.2)' : 'rgba(255, 107, 107, 0.2)'}`,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: isLight 
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`,
            color: isLight ? '#2d3748' : '#f7fafc',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              background: isLight 
                ? 'rgba(255, 255, 255, 0.9)'
                : 'rgba(30, 30, 30, 0.9)',
              backdropFilter: 'blur(10px)',
              color: isLight ? '#2d3748' : '#f7fafc',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isLight ? '#667eea' : '#8fa5f4',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: isLight ? '#667eea' : '#8fa5f4',
                borderWidth: 2,
              },
            },
            '& .MuiInputLabel-root': {
              color: isLight ? '#4a5568' : '#cbd5e0',
              '&.Mui-focused': {
                color: isLight ? '#667eea' : '#8fa5f4',
              },
              '&.Mui-error': {
                color: isLight ? '#e53e3e' : '#fc8181',
              },
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isLight ? '#4a5568' : '#cbd5e0',
            '&.Mui-focused': {
              color: isLight ? '#667eea' : '#8fa5f4',
            },
            '&.Mui-error': {
              color: isLight ? '#e53e3e' : '#fc8181',
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            background: isLight 
              ? 'rgba(255, 255, 255, 0.9)'
              : 'rgba(30, 30, 30, 0.9)',
            backdropFilter: 'blur(10px)',
            color: isLight ? '#2d3748' : '#f7fafc',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isLight ? '#667eea' : '#8fa5f4',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isLight ? '#667eea' : '#8fa5f4',
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: isLight ? '#2d3748' : '#f7fafc',
            backgroundColor: isLight ? 'transparent' : 'transparent',
            '&:hover': {
              backgroundColor: isLight ? 'rgba(102, 126, 234, 0.08)' : 'rgba(143, 165, 244, 0.08)',
            },
            '&.Mui-selected': {
              backgroundColor: isLight ? 'rgba(102, 126, 234, 0.12)' : 'rgba(143, 165, 244, 0.12)',
              color: isLight ? '#667eea' : '#8fa5f4',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: isLight ? 'rgba(102, 126, 234, 0.16)' : 'rgba(143, 165, 244, 0.16)',
              },
            },
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            '& .MuiInputLabel-root': {
              color: isLight ? '#4a5568' : '#cbd5e0',
              '&.Mui-focused': {
                color: isLight ? '#667eea' : '#8fa5f4',
              },
            },
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            color: isLight ? '#2d3748' : '#f7fafc',
            '& .MuiFormControlLabel-label': {
              color: isLight ? '#2d3748' : '#f7fafc',
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            background: isLight 
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`,
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              color: isLight ? '#2d3748' : '#f7fafc',
              borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            background: isLight 
              ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
              : 'linear-gradient(135deg, #2d2d2d 0%, #404040 100%)',
            '& .MuiTableCell-root': {
              color: isLight ? '#2d3748' : '#f7fafc',
              fontWeight: 600,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: isLight ? 'rgba(102, 126, 234, 0.04)' : 'rgba(143, 165, 244, 0.04)',
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '4px 8px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
            },
            '&.Mui-selected': {
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.25)',
              },
            },
          },
        },
      },
    },
  });
};

export const CustomThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [currentTheme, setCurrentTheme] = useState(() => {
    const mode = getThemeMode(settings.appearance.theme);
    return createAppTheme(mode);
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  // Update theme when appearance settings change
  useEffect(() => {
    const mode = getThemeMode(settings.appearance.theme);
    setCurrentTheme(createAppTheme(mode));
  }, [settings.appearance.theme]);

  // Listen for system theme changes when auto mode is selected
  useEffect(() => {
    if (settings.appearance.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const mode = mediaQuery.matches ? 'dark' : 'light';
        setCurrentTheme(createAppTheme(mode));
      };

      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [settings.appearance.theme]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const updateSetting = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('appSettings');
  };

  const formatDate = (date, useCustomFormat = true) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!useCustomFormat) {
      return dateObj.toLocaleDateString();
    }

    const format = settings.appearance.dateFormat;
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY':
      default:
        return `${month}/${day}/${year}`;
    }
  };

  const formatTime = (date, includeTimezone = false) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const timeString = dateObj.toLocaleTimeString();
    
    if (includeTimezone) {
      return `${timeString} ${settings.appearance.timezone}`;
    }
    
    return timeString;
  };

  const contextValue = {
    theme: currentTheme,
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
    formatDate,
    formatTime,
    // Add toast configuration based on current theme
    toastConfig: {
      theme: currentTheme.palette.mode === 'dark' ? 'dark' : 'light',
      toastStyle: {
        backgroundColor: currentTheme.palette.mode === 'dark' ? '#333' : '#fff',
        color: currentTheme.palette.mode === 'dark' ? '#fff' : '#000',
        borderRadius: '8px',
        border: currentTheme.palette.mode === 'dark' 
          ? '1px solid rgba(255, 255, 255, 0.1)' 
          : '1px solid rgba(0, 0, 0, 0.1)',
      },
      progressStyle: {
        background: currentTheme.palette.mode === 'dark' 
          ? 'linear-gradient(to right, #4caf50, #8bc34a)' 
          : 'linear-gradient(to right, #1976d2, #42a5f5)',
      }
    }
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}; 