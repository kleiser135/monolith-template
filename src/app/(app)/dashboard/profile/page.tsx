import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from '@/lib/database/prisma';
import jwt from "jsonwebtoken";
import { ChangePasswordForm } from "@/components/features/auth/change-password/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/features/auth/delete-account/DeleteAccountDialog";
import { AvatarUpload } from "@/components/features/profile/avatar-upload/AvatarUpload";
import { User, Mail, Shield, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button/button";

interface JwtPayload {
  userId: string;
}

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, name: true, avatar: true },
    });
    return user;
  } catch (_error) {
    // Invalid token, treat as unauthenticated
    return null;
  }
}

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your account information and security preferences
            </p>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Account Information</h2>
              <p className="text-slate-600 dark:text-slate-400">Your profile details and contact information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Profile Information */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Display Name</h3>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-900 dark:text-slate-100 font-medium">
                    {user.name || 'Not set'}
                  </p>
                  {!user.name && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Add a display name to personalize your account
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Email Address</h3>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-900 dark:text-slate-100 font-medium">{user.email}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    This is your primary email address for login and notifications
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Avatar and Account Status */}
            <div className="space-y-6">
              {/* Avatar Upload Section */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Profile Avatar</h3>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <AvatarUpload currentAvatar={user.avatar} />
                </div>
              </div>

              {/* Account Status Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Account Status</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Account Type</span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Standard</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Security Level</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Secure</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Two-Factor Auth</span>
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Not Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Security Settings</h2>
              <p className="text-slate-600 dark:text-slate-400">Manage your password and account security</p>
            </div>
          </div>

          <ChangePasswordForm />
        </div>

        {/* Danger Zone Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
              <p className="text-slate-600 dark:text-slate-400">Irreversible and destructive actions</p>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Delete Account</h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              Once you delete your account, there is no going back. This action is permanent and will remove all your data from our servers.
            </p>
            <div className="space-y-3">
              <div className="text-sm text-red-600 dark:text-red-400">
                <strong>This action will:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Permanently delete your account</li>
                  <li>Remove all associated data</li>
                  <li>Cancel any active subscriptions</li>
                  <li>Log you out of all devices</li>
                </ul>
              </div>
              <DeleteAccountDialog />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 