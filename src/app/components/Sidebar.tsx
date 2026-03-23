import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  GraduationCap,
  UserCog,
  Users,
  BookOpen,
  FileText,
  Monitor,
  Calendar,
  Library,
  Layers,
  Presentation,
  UserCheck,
  Wallet,
  Send,
  DollarSign,
  ClipboardCheck,
  Trophy,
  FileBarChart,
  BookMarked,
  Database,
  TestTube,
  Settings,
  Grid3x3,
  Pencil,
  CreditCard,
  Megaphone,
  Server,
  Bot,
  Brain,
  Zap,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n';
import { cn } from '../components/ui/utils';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  status?: 'beta' | 'alpha' | 'ready'; // Add status indicator
}

interface MenuItemConfig {
  id: string;
  translationKey: string;
  icon: React.ElementType;
  roles: string[];
  status?: 'beta' | 'alpha' | 'ready';
  category: string;
}

interface MenuCategory {
  id: string;
  translationKey: string;
  icon: React.ElementType;
  defaultExpanded?: boolean;
}

// Menu categories
const menuCategories: MenuCategory[] = [
  {
    id: 'core-management',
    translationKey: 'common.coreManagement',
    icon: Grid3x3,
    defaultExpanded: true,
  },
  {
    id: 'academic-structure',
    translationKey: 'common.academicStructure',
    icon: BookOpen,
    defaultExpanded: true,
  },
  {
    id: 'learning-teaching',
    translationKey: 'common.learningTeaching',
    icon: Pencil,
    defaultExpanded: false,
  },
  {
    id: 'examinations-assessment',
    translationKey: 'common.examinationsAssessment',
    icon: FileText,
    defaultExpanded: false,
  },
  {
    id: 'financial-management',
    translationKey: 'common.financialManagement',
    icon: CreditCard,
    defaultExpanded: false,
  },
  {
    id: 'communication',
    translationKey: 'common.communication',
    icon: Megaphone,
    defaultExpanded: false,
  },
  {
    id: 'system-administration',
    translationKey: 'common.systemAdministration',
    icon: Server,
    defaultExpanded: false,
  },
  {
    id: 'ai-assistance',
    translationKey: 'common.aiAssistance',
    icon: Grid3x3,
    defaultExpanded: true,
  },
];

// Menu items structure - labels will be translated dynamically
const menuItemsConfig: MenuItemConfig[] = [
  {
    id: 'dashboard',
    translationKey: 'common.dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'teacher', 'student', 'parent'],
    // status: 'beta',
    category: 'core-management',
  },
  {
    id: 'students',
    translationKey: 'common.students',
    icon: GraduationCap,
    roles: ['admin', 'teacher'],
    // status: 'beta',
    category: 'core-management',
  },
  {
    id: 'teachers',
    translationKey: 'common.teachers',
    icon: UserCog,
    roles: ['admin'],
    // status: 'beta',
    category: 'core-management',
  },
  {
    id: 'classes',
    translationKey: 'common.classes',
    icon: Users,
    roles: ['admin'],
    // status: 'beta',
    category: 'core-management',
  },
  {
    id: 'subjects',
    translationKey: 'common.subjects',
    icon: BookOpen,
    roles: ['admin', 'teacher'],
    // status: 'beta',
    category: 'academic-structure',
  },
  {
    id: 'courses',
    translationKey: 'common.courses',
    icon: Library,
    roles: ['admin', 'teacher'],
    // status: 'beta',
    category: 'academic-structure',
  },
  {
    id: 'batches',
    translationKey: 'common.batches',
    icon: Layers,
    roles: ['admin', 'teacher'],
    // status: 'beta',
    category: 'academic-structure',
  },
  {
    id: 'timetable',
    translationKey: 'common.timetable',
    icon: Calendar,
    roles: ['admin', 'teacher', 'student', 'parent'],
    // status: 'beta',
    category: 'academic-structure',
  },
  {
    id: 'academic-year',
    translationKey: 'common.academicYear',
    icon: BookMarked,
    roles: ['admin'],
    // status: 'beta',
    category: 'academic-structure',
  },
  {
    id: 'lectures',
    translationKey: 'common.lectures',
    icon: Presentation,
    roles: ['admin', 'teacher'],
    // status: 'beta',
    category: 'learning-teaching',
  },
  {
    id: 'attendance',
    translationKey: 'common.attendance',
    icon: UserCheck,
    roles: ['admin', 'teacher'],
    // status: 'beta',
    category: 'learning-teaching',
  },
  // {
  //   id: 'online-exams',
  //   translationKey: 'common.onlineExams',
  //   icon: Monitor,
  //   roles: ['admin', 'teacher', 'student'],
  //   // status: 'beta',
  //   category: 'learning-teaching',
  // },
  {
    id: 'enrollments',
    translationKey: 'common.enrollments',
    icon: Wallet,
    roles: ['admin', 'teacher'],
    // status: 'beta',
    category: 'learning-teaching',
  },
  {
    id: 'exams',
    translationKey: 'common.exams',
    icon: FileText,
    roles: ['admin', 'teacher'],
    // status: 'beta',
    category: 'examinations-assessment',
  },
  {
    id: 'marks-entry',
    translationKey: 'common.marks',
    icon: ClipboardCheck,
    roles: ['admin', 'teacher'],
    // status: 'beta',
    category: 'examinations-assessment',
  },
  {
    id: 'results',
    translationKey: 'common.results',
    icon: Trophy,
    roles: ['admin', 'teacher', 'student', 'parent'],
    // status: 'beta',
    category: 'examinations-assessment',
  },
  {
    id: 'report-cards',
    translationKey: 'common.reportCards',
    icon: FileBarChart,
    roles: ['admin', 'teacher', 'student', 'parent'],
    // status: 'beta',
    category: 'examinations-assessment',
  },
  {
    id: 'fees',
    translationKey: 'common.fees',
    icon: DollarSign,
    roles: ['admin', 'teacher'],
    // status: 'beta',
    category: 'financial-management',
  },
  {
    id: 'payouts',
    translationKey: 'common.payouts',
    icon: Wallet,
    roles: ['admin'],
    // status: 'beta',
    category: 'financial-management',
  },
  {
    id: 'broadcasts',
    translationKey: 'common.broadcasts',
    icon: Send,
    roles: ['admin', 'teacher'],
    // status: 'beta',
    category: 'communication',
  },
  // {
  //   id: 'settings',
  //   translationKey: 'common.settings',
  //   icon: Settings,
  //   roles: ['admin'],
  //   // status: 'beta',
  //   category: 'system-administration',
  // },
  // {
  //   id: 'database',
  //   translationKey: 'common.database',
  //   icon: Database,
  //   roles: ['admin'],
  //   status: 'ready',
  //   category: 'system-administration',
  // },
  // {
  //   id: 'api-testing',
  //   translationKey: 'common.apiTesting',
  //   icon: TestTube,
  //   roles: ['admin'],
  //   // status: 'alpha',
  //   category: 'system-administration',
  // },
  // {
  //   id: 'ai-chat',
  //   translationKey: 'common.aiChat',
  //   icon: Bot,
  //   roles: ['admin', 'teacher', 'student', 'parent'],
  //   // status: 'beta',
  //   category: 'ai-assistance',
  // },
  // {
  //   id: 'ai-insights',
  //   translationKey: 'common.aiInsights',
  //   icon: Brain,
  //   roles: ['admin', 'teacher'],
  //   // status: 'beta',
  //   category: 'ai-assistance',
  // },
  // {
  //   id: 'ai-command',
  //   translationKey: 'common.aiCommand',
  //   icon: Zap,
  //   roles: ['admin'],
  //   // status: 'beta',
  //   category: 'ai-assistance',
  // },
  // {
  //   id: 'ai-dashboard',
  //   translationKey: 'common.aiDashboard',
  //   icon: BarChart3,
  //   roles: ['admin'],
  //   // status: 'beta',
  //   category: 'ai-assistance',
  // },
];

export function Sidebar() {
  const { currentUser, sidebarCollapsed, toggleSidebar, currentView, setCurrentView } = useApp();
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(menuCategories.filter(cat => cat.defaultExpanded).map(cat => cat.id))
  );

  // Auto-expand category when current view changes
  React.useEffect(() => {
    if (currentView && !sidebarCollapsed) {
      const activeItemConfig = menuItemsConfig.find(config => config.id === currentView);
      if (activeItemConfig) {
        setExpandedCategories(prev => {
          const newSet = new Set(prev);
          newSet.add(activeItemConfig.category);
          return newSet;
        });
      }
    }
  }, [currentView, sidebarCollapsed]);

  // Fallback user for backward compatibility
  const user = currentUser || {
    id: 'demo-admin',
    name: 'Demo Admin',
    role: 'admin' as const,
    email: 'admin@school.edu',
  };

  // Create menu items with translated labels
  const menuItems: MenuItem[] = menuItemsConfig.map((config) => ({
    id: config.id,
    label: t(config.translationKey),
    icon: config.icon,
    roles: config.roles,
    status: config.status,
  }));

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user.role));

  // Group menu items by category
  const groupedMenuItems = menuCategories.reduce((acc, category) => {
    const items = filteredMenuItems.filter(item => {
      const config = menuItemsConfig.find(config => config.id === item.id);
      return config?.category === category.id;
    });
    if (items.length > 0) {
      acc[category.id] = items;
    }
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Filter categories that have items for the current user
  const visibleCategories = menuCategories.filter(category =>
    groupedMenuItems[category.id] && groupedMenuItems[category.id].length > 0
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  return (
    <div
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">SEMS</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {sidebarCollapsed ? (
            // Collapsed view: Show only menu items without categories
            filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={cn(
                    'w-full flex items-center justify-center px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                  title={item.label}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-blue-700')} />
                </button>
              );
            })
          ) : (
            // Expanded view: Show grouped menu items by categories
            visibleCategories.map((category) => {
              const CategoryIcon = category.icon;
              const isExpanded = expandedCategories.has(category.id);
              const categoryItems = groupedMenuItems[category.id];

              return (
                <div key={category.id} className="mb-2">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                  >
                    <CategoryIcon className="w-4 h-4" />
                    <span className="flex-1 text-left">{t(category.translationKey)}</span>
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 transition-transform',
                        !isExpanded && 'transform -rotate-90'
                      )}
                    />
                  </button>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="mt-1 space-y-1">
                      {categoryItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ml-4',
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            )}
                          >
                            <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-blue-700')} />
                            <div className="flex items-center justify-between flex-1">
                              <span className="text-sm font-medium">{item.label}</span>
                              {item.status === 'beta' && (
                                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                  β
                                </span>
                              )}
                              {item.status === 'alpha' && (
                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  α
                                </span>
                              )}
                              {item.status === 'ready' && (
                                <span className="text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                                  Ready
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </nav>

      {/* User Info */}
      {!sidebarCollapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}