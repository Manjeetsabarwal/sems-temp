import React from 'react';
import { Bell, Search, ArrowLeftRight, User, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

export function Header() {
  const { currentUser, switchRole, toggleSidebarPosition, sidebarPosition, logout, isAuthenticated } = useApp();
  const { t } = useLanguage();

  // Fallback user for backward compatibility
  const user = currentUser || {
    id: 'demo-admin',
    name: 'Demo Admin',
    role: 'admin' as const,
    email: 'admin@school.edu',
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Sidebar Position Toggle */}
        <button
          onClick={toggleSidebarPosition}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={`Sidebar on ${sidebarPosition === 'left' ? 'right' : 'left'}`}
        >
          <ArrowLeftRight className="w-5 h-5 text-gray-600" />
        </button>

        {/* Notifications */}
        {/* <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button> */}

        {/* Role Switcher */}
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Switch Role
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Select Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => switchRole('admin')}>
              <div className="flex items-center justify-between w-full">
                <span>Admin</span>
                {user.role === 'admin' && (
                  <Badge variant="secondary">Active</Badge>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchRole('teacher')}>
              <div className="flex items-center justify-between w-full">
                <span>Teacher</span>
                {user.role === 'teacher' && (
                  <Badge variant="secondary">Active</Badge>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchRole('student')}>
              <div className="flex items-center justify-between w-full">
                <span>Student</span>
                {user.role === 'student' && (
                  <Badge variant="secondary">Active</Badge>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchRole('parent')}>
              <div className="flex items-center justify-between w-full">
                <span>Parent</span>
                {user.role === 'parent' && (
                  <Badge variant="secondary">Active</Badge>
                )}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAuthenticated && (
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                {t('common.logout')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
