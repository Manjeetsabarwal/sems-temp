import React from 'react';
import { School, Users, BookOpen, FileText, Trophy, Calendar, BarChart3, Shield, Zap, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
}

export function LandingPage({ onNavigateToLogin, onNavigateToSignUp }: LandingPageProps) {
  const features = [
    {
      icon: Users,
      title: 'Student Management',
      description: 'Comprehensive student records with class and section assignments',
      color: 'bg-blue-500',
    },
    {
      icon: BookOpen,
      title: 'Exam Management',
      description: 'Create and manage exams with flexible scheduling and subject assignments',
      color: 'bg-purple-500',
    },
    {
      icon: FileText,
      title: 'Marks Entry',
      description: 'Efficient marks entry system with automatic grade calculation',
      color: 'bg-green-500',
    },
    {
      icon: Trophy,
      title: 'Results & Report Cards',
      description: 'Generate results, calculate ranks, and create professional report cards',
      color: 'bg-orange-500',
    },
    {
      icon: Calendar,
      title: 'Exam Timetable',
      description: 'Create and manage exam schedules with calendar view',
      color: 'bg-pink-500',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track performance with comprehensive analytics and insights',
      color: 'bg-indigo-500',
    },
  ];

  const benefits = [
    'Role-based access control (Admin, Teacher, Student, Parent)',
    'Real-time notifications for result publishing',
    'Secure authentication and data protection',
    'Mobile-responsive design',
    'Export data to Excel/CSV',
    'Comprehensive reporting and analytics',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SEMS</h1>
                <p className="text-xs text-gray-500">School Exam Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onNavigateToLogin}>
                Sign In
              </Button>
              <Button onClick={onNavigateToSignUp} className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Streamline Your School's Exam Management</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Manage Exams, Results & More
            <span className="block text-blue-600 mt-2">All in One Platform</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A comprehensive solution for schools to manage students, exams, marks entry, results, and report cards with ease.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              size="lg"
              onClick={onNavigateToSignUp}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onNavigateToLogin}
              className="text-lg px-8 py-6 border-2"
            >
              Sign In
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required • Free to try</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to simplify school exam management
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-2 hover:border-blue-300 transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose SEMS?
              </h2>
              <p className="text-lg text-gray-600">
                Built for modern schools with security and efficiency in mind
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Access Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Designed for Everyone
            </h2>
            <p className="text-lg text-gray-600">
              Separate portals for administrators, teachers, students, and parents
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: 'Admin', desc: 'Full system control', color: 'bg-red-500' },
              { role: 'Teacher', desc: 'Manage classes & exams', color: 'bg-blue-500' },
              { role: 'Student', desc: 'View results & exams', color: 'bg-green-500' },
              { role: 'Parent', desc: 'Track child progress', color: 'bg-purple-500' },
            ].map((item, index) => (
              <Card key={index} className="text-center border-2 hover:border-blue-300 transition-all">
                <CardContent className="p-6">
                  <div className={`${item.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.role}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join schools already using SEMS to streamline their exam management
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                size="lg"
                onClick={onNavigateToSignUp}
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 font-semibold shadow-lg"
              >
                Create Account
              </Button>
              <button
                onClick={onNavigateToLogin}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-lg font-semibold px-8 py-6 h-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 transition-all duration-200 shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <School className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">SEMS</h3>
                  <p className="text-xs">School Exam Management</p>
                </div>
              </div>
              <p className="text-sm">
                Comprehensive exam management solution for modern schools.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={onNavigateToLogin} className="hover:text-white transition-colors">
                    Sign In
                  </button>
                </li>
                <li>
                  <button onClick={onNavigateToSignUp} className="hover:text-white transition-colors">
                    Sign Up
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li>Student Management</li>
                <li>Exam Scheduling</li>
                <li>Results & Reports</li>
                <li>Analytics Dashboard</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 School Exam Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
