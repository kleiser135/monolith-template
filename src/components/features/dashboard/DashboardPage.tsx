"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button/button";
import { LogoutButton } from "@/components/features/auth/logout-button/LogoutButton";
import { User, Settings, TestTube, Shield, LogOut } from "lucide-react";

export function DashboardPage() {
  // No client-side authentication check needed - middleware handles all security
  // If user reaches this page, they are already authenticated by server-side middleware

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to Your Dashboard
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage your account, explore features, and access all the tools you need in one place.
            </p>
          </div>
        </div>

        {/* Main Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Card */}
          <Link href="/dashboard/profile" className="group">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 group-hover:border-blue-300 dark:group-hover:border-blue-600">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Profile</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your account</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                View and edit your profile information, change your password, and manage account settings.
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                View Profile
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Toast Demo Card */}
          <Link href="/dashboard/toast-demo" className="group">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 group-hover:border-green-300 dark:group-hover:border-green-600">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                  <TestTube className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Toast Demo</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Test notifications</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Explore different types of toast notifications and see how they work in the application.
              </p>
              <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium group-hover:text-green-700 dark:group-hover:text-green-300">
                Try Demo
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Protected Action Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Protected Actions</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Secure operations</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Perform secure operations that require authentication and proper authorization.
            </p>
            <Button variant="destructive" className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Execute Protected Action
            </Button>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Account Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Active</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Account Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">Secure</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Security Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">Protected</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Data Protection</div>
            </div>
          </div>
        </div>

        {/* Sign Out Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Session Management</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            You are securely authenticated. Sign out when you're done to protect your account.
          </p>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
