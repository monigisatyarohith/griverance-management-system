import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserCircleIcon, EnvelopeIcon, AcademicCapIcon, ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout, updatePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setUpdating(true);
    const success = await updatePassword(currentPassword, newPassword);
    setUpdating(false);
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile & Account Settings</h1>

      {user?.mustChangePassword && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 text-amber-800 dark:text-amber-300 flex items-start gap-3 shadow-sm">
          <KeyIcon className="w-6 h-6 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Action Required: First-Time Login Password Update</h4>
            <p className="text-xs mt-1">Your account was assigned temporary credentials. Please set a new secure password below to protect your account.</p>
          </div>
        </div>
      )}

      {/* User Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32 relative">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 border-4 border-white dark:border-gray-800 shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="pt-16 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-500 capitalize">{user?.role?.replace('_', ' ')} {user?.coordinatorType ? `(${user.coordinatorType})` : ''}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/60 rounded-xl">
              <EnvelopeIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Email Address</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/60 rounded-xl">
              <AcademicCapIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Department / Type</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{user?.department || user?.coordinatorType || 'Institutional'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/60 rounded-xl">
              <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Access Role</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/60 rounded-xl">
              <UserCircleIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Member Since</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active User'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Password Update Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-3">
          <KeyIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Security & Password Management</h3>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Current Password *</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Confirm New Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
            >
              {updating ? 'Updating Password...' : 'Update Password'}
            </button>

            <button
              type="button"
              onClick={logout}
              className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 font-bold text-sm rounded-xl transition"
            >
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default Profile;
