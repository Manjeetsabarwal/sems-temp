import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider } from './i18n';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/views/Dashboard';
import { StudentsAPI } from './components/views/StudentsAPI';
import { ExamsAPI } from './components/views/ExamsAPI';
import SubjectsAPI from './components/views/SubjectsAPI';
import MarksAPI from './components/views/MarksAPI';
import { MarksEntry } from './components/views/MarksEntry';
import { Results } from './components/views/Results';
import { ReportCardsAPI } from './components/views/ReportCardsAPI';
import { Timetable } from './components/views/Timetable';
import { Teachers, Classes, Settings } from './components/views/OtherViews';
import { TeachersAPI } from './components/views/TeachersAPI';
import { ClassesAndSections } from './components/views/ClassesAndSections';
import { ResultsAPI } from './components/views/ResultsAPI';
import { AcademicYearAPI } from './components/views/AcademicYearAPI';
import { TimetableAPI } from './components/views/TimetableAPI';
import { SettingsAPI } from './components/views/SettingsAPI';
import { DataPopulator } from './components/DataPopulator';
import { DatabaseTools } from './components/DatabaseTools';
import { ApiTesting } from './components/views/ApiTesting';
import { OnlineExamsHub } from './components/views/OnlineExamsHub';
import CoursesAPI from './components/views/CoursesAPI';
import BatchesAPI from './components/views/BatchesAPI';
import LecturesAPI from './components/views/LecturesAPI';
import AttendanceAPI from './components/views/AttendanceAPI';
import EnrollmentsAPI from './components/views/EnrollmentsAPI';
import PayoutsAPI from './components/views/PayoutsAPI';
import FeesAPI from './components/views/FeesAPI';
import BroadcastsAPI from './components/views/BroadcastsAPI';
import { Toaster } from './components/ui/sonner';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { LandingPage } from './components/landing/LandingPage';
import { Loader2 } from 'lucide-react';
import { AiChatbot } from './components/ai/AiChatbot';
import { AiInsightPanel } from './components/ai/AiInsightPanel';
import { AiCommandCenter } from './components/ai/AiCommandCenter';
import { AiDashboard } from './components/ai/AiDashboard';

function AppContent() {
  const { currentView, sidebarPosition, isAuthenticated, isLoading, currentUser } = useApp();
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page, login, or register if not authenticated
  // NOTE: For now, we make auth optional to not break existing functionality
  // Set ENABLE_AUTH=true in environment to enable authentication
  const enableAuth = import.meta.env.VITE_ENABLE_AUTH === 'true';
  
  if (enableAuth && !isAuthenticated) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onNavigateToLogin={() => setAuthView('login')}
          onNavigateToSignUp={() => setAuthView('register')}
        />
      );
    }
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} onSwitchToLanding={() => setAuthView('landing')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} onSwitchToLanding={() => setAuthView('landing')} />;
  }

  // Set default user if not authenticated (for backward compatibility)
  const user = currentUser || {
    id: 'demo-admin',
    name: 'Demo Admin',
    role: 'admin' as const,
    email: 'admin@school.edu',
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentsAPI />;
      case 'teachers':
        return <TeachersAPI />;
      case 'classes':
      case 'sections':  // Sections are part of ClassesAndSections component
        return <ClassesAndSections />;
      case 'subjects':
        return <SubjectsAPI />;
      case 'exams':
        return <ExamsAPI />;
      case 'online-exams':
        return <OnlineExamsHub />;
      case 'timetable':
        return <TimetableAPI />;
      case 'courses':
        return <CoursesAPI />;
      case 'batches':
        return <BatchesAPI />;
      case 'lectures':
        return <LecturesAPI />;
      case 'attendance':
        return <AttendanceAPI />;
      case 'enrollments':
        return <EnrollmentsAPI />;
      case 'payouts':
        return <PayoutsAPI />;
      case 'fees':
        return <FeesAPI />;
      case 'broadcasts':
        return <BroadcastsAPI />;
      case 'marks-entry':
        return <MarksAPI />;
      case 'results':
        return <ResultsAPI />;
      case 'report-cards':
        return <ReportCardsAPI />;
      case 'academic-year':
        return <AcademicYearAPI />;
      case 'database':
        return <DatabaseTools />;
      case 'api-testing':
        return <ApiTesting />;
      case 'settings':
        return <SettingsAPI />;
      case 'ai-chat':
        return <AiChatbot />;
      case 'ai-insights':
        return <AiInsightPanel />;
      case 'ai-command':
        return <AiCommandCenter />;
      case 'ai-dashboard':
        return <AiDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex">
      {/* Sidebar - position based on state */}
      {sidebarPosition === 'left' && <Sidebar />}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 max-w-7xl">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Sidebar - right position */}
      {sidebarPosition === 'right' && <Sidebar />}
      
      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </LanguageProvider>
  );
}
