import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/auth.service';
import type { UserProfile } from '../services/auth.service';

interface NavigationEntry {
  view: string;
  recordId?: string;
  timestamp: number;
}

interface AppContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  sidebarPosition: 'left' | 'right';
  toggleSidebarPosition: () => void;
  setSidebarPosition: (position: 'left' | 'right') => void;
  currentView: string;
  setCurrentView: (view: string, recordId?: string) => void;
  navigateToRecord: (view: string, recordId: string) => void;
  getPendingRecordId: (view: string) => string | null;
  clearPendingRecordId: (view: string) => void;
  // Navigation history
  navigationHistory: NavigationEntry[];
  pushNavigation: (view: string, recordId?: string) => void;
  popNavigation: () => NavigationEntry | null;
  canGoBack: () => boolean;
  goBack: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [currentView, setCurrentViewState] = useState('dashboard');
  const [pendingRecordIds, setPendingRecordIds] = useState<Record<string, string>>({});
  const [navigationHistory, setNavigationHistory] = useState<NavigationEntry[]>([]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            // Try to fetch fresh user data
            try {
              const userProfile = await authService.getCurrentUser();
              setCurrentUser({
                id: userProfile.userId,
                name: userProfile.name,
                role: userProfile.role as UserRole,
                email: userProfile.email,
                studentId: userProfile.studentId || null,
                teacherId: userProfile.teacherId || null,
              });
              setIsAuthenticated(true);
            } catch (error) {
              // Token might be invalid or API call failed, use stored user
              // Don't logout - use stored data instead
              console.warn('Using stored user data due to API error:', error);
              setCurrentUser({
                id: storedUser.userId,
                name: storedUser.name,
                role: storedUser.role as UserRole,
                email: storedUser.email,
                studentId: storedUser.studentId || null,
                teacherId: storedUser.teacherId || null,
              });
              setIsAuthenticated(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      setCurrentUser({
        id: response.user.userId,
        name: response.user.name,
        role: response.user.role as UserRole,
        email: response.user.email,
        studentId: response.user.studentId || null,
        teacherId: response.user.teacherId || null,
      });
      setIsAuthenticated(true);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentViewState('dashboard');
    setNavigationHistory([]);
  };

  const switchRole = (role: UserRole) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        role,
      });
      setCurrentViewState('dashboard');
      setNavigationHistory([]);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const toggleSidebarPosition = () => {
    setSidebarPosition((prev) => (prev === 'left' ? 'right' : 'left'));
  };

  // Push navigation entry to history
  const pushNavigation = (view: string, recordId?: string) => {
    setNavigationHistory((prev) => {
      // Don't add duplicate consecutive entries
      const lastEntry = prev[prev.length - 1];
      if (lastEntry && lastEntry.view === view && lastEntry.recordId === recordId) {
        return prev;
      }
      return [...prev, { view, recordId, timestamp: Date.now() }];
    });
  };

  // Pop navigation entry from history
  const popNavigation = (): NavigationEntry | null => {
    let popped: NavigationEntry | null = null;
    setNavigationHistory((prev) => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      popped = newHistory.pop() || null;
      return newHistory;
    });
    return popped;
  };

  // Check if we can go back
  const canGoBack = (): boolean => {
    return navigationHistory.length > 0;
  };

  // Go back to previous view
  const goBack = () => {
    const previous = popNavigation();
    if (previous) {
      setCurrentViewState(previous.view);
      if (previous.recordId) {
        setPendingRecordIds((prev) => ({ ...prev, [previous.view]: previous.recordId! }));
      }
    } else {
      // Fallback to dashboard if no history
      setCurrentViewState('dashboard');
    }
  };

  // setCurrentView - for sidebar navigation (does NOT track history)
  const setCurrentView = (view: string, recordId?: string) => {
    // Clear navigation history when using sidebar navigation
    // This ensures back button only works for cross-module record links
    setNavigationHistory([]);
    setCurrentViewState(view);
    if (recordId) {
      setPendingRecordIds((prev) => ({ ...prev, [view]: recordId }));
    }
  };

  // Navigate to a specific record in a module
  // Note: The calling component should call pushNavigation() before this
  // to save the current location with record ID to the history
  const navigateToRecord = (view: string, recordId: string) => {
    setPendingRecordIds((prev) => ({ ...prev, [view]: recordId }));
    setCurrentViewState(view);
  };

  // Get pending record ID for a view (and optionally clear it)
  const getPendingRecordId = (view: string): string | null => {
    return pendingRecordIds[view] || null;
  };

  // Clear pending record ID for a view
  const clearPendingRecordId = (view: string) => {
    setPendingRecordIds((prev) => {
      const newState = { ...prev };
      delete newState[view];
      return newState;
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        login,
        logout,
        switchRole,
        sidebarCollapsed,
        toggleSidebar,
        sidebarPosition,
        toggleSidebarPosition,
        setSidebarPosition,
        currentView,
        setCurrentView,
        navigateToRecord,
        getPendingRecordId,
        clearPendingRecordId,
        navigationHistory,
        pushNavigation,
        popNavigation,
        canGoBack,
        goBack,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
