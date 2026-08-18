import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../services/api';
import { 
  UserGroupIcon, 
  TrashIcon, 
  PencilIcon, 
  EnvelopeIcon, 
  Cog6ToothIcon,
  AcademicCapIcon,
  HomeIcon,
  TruckIcon,
  DocumentCheckIcon,
  BriefcaseIcon,
  WrenchIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  
  // Settings tab state
  const [settings, setSettings] = useState({
    principal_email: '',
    vice_principal_email: '',
    coordinator_academic_email: '',
    coordinator_hostel_email: '',
    coordinator_transport_email: '',
    coordinator_examination_email: '',
    coordinator_placement_email: '',
    coordinator_maintenance_email: '',
    coordinator_general_email: ''
  });
  const [updatingSettings, setUpdatingSettings] = useState(false);

  useEffect(() => { 
    if (activeTab === 'users') {
      fetchUsers(); 
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers();
      setUsers(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally { 
      setLoading(false); 
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getSettings();
      const dbSettings = res.data.data;
      
      const newSettings = { ...settings };
      dbSettings.forEach(s => {
        if (s.key in newSettings) {
          newSettings[s.key] = s.value;
        }
      });
      setSettings(newSettings);
    } catch (error) {
      toast.error('Failed to load email configurations');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id, data) => {
    try {
      await adminAPI.updateUser(id, data);
      toast.success('User updated');
      setEditingUser(null);
      fetchUsers();
    } catch (error) { 
      toast.error('Update failed'); 
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) { 
      toast.error('Delete failed'); 
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setUpdatingSettings(true);
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await adminAPI.saveSettings(payload);
      toast.success('Email routing configurations saved successfully!');
    } catch (error) {
      toast.error('Failed to save email settings');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    principal: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    vice_principal: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    hod: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    faculty: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    student: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
    coordinator: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Admin Control Center</h1>
          <p className="text-gray-500 mt-1 text-sm">Configure system variables, manage user credentials, and manage role-based routing.</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 sm:p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'users' 
                ? 'bg-white dark:bg-gray-750 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-350'
            }`}
          >
            <UserGroupIcon className="w-4 h-4" />
            <span>User Management</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'settings' 
                ? 'bg-white dark:bg-gray-750 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-350'
            }`}
          >
            <Cog6ToothIcon className="w-4 h-4" />
            <span>Email Routing Config</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-650"></div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-150 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Department</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-r from-purple-500 to-indigo-650 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {u.name?.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{u.email}</td>
                    <td className="px-6 py-4">
                      {editingUser === u._id ? (
                        <select 
                          defaultValue={u.role} 
                          onChange={(e) => updateUser(u._id, { role: e.target.value, department: u.department })}
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" 
                          onBlur={() => setEditingUser(null)}
                        >
                          <option value="student">Student</option>
                          <option value="coordinator">Coordinator</option>
                          <option value="faculty">Faculty</option>
                          <option value="hod">HOD</option>
                          <option value="vice_principal">Vice Principal</option>
                          <option value="principal">Principal</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${roleColors[u.role] || 'bg-gray-100'}`}>
                          {u.role?.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.department || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setEditingUser(u._id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
                          <PencilIcon className="w-4 h-4 text-blue-500" />
                        </button>
                        <button onClick={() => deleteUser(u._id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
                          <TrashIcon className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={saveSettings} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-150 dark:border-gray-700 p-4 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center gap-2">
            <EnvelopeIcon className="w-6 h-6 text-purple-650" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Routing Setup</h2>
          </div>
          <p className="text-sm text-gray-500">
            Set and configure the email addresses for administrative approval and category-specific coordinators. 
            All modifications will take effect immediately for upcoming complaints.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* VP config */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-purple-600" />
                <span>Vice Principal Email (Reviewer)</span>
              </label>
              <input
                type="email"
                name="vice_principal_email"
                value={settings.vice_principal_email}
                onChange={handleSettingsChange}
                placeholder="viceprincipal@college.edu"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
              />
            </div>

            {/* Academic Coord */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                <AcademicCapIcon className="w-4 h-4 text-blue-500" />
                <span>Academic Coordinator Email</span>
              </label>
              <input
                type="email"
                name="coordinator_academic_email"
                value={settings.coordinator_academic_email}
                onChange={handleSettingsChange}
                placeholder="academic_coord@college.edu"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
              />
            </div>

            {/* Hostel Coord */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                <HomeIcon className="w-4 h-4 text-green-500" />
                <span>Hostel Coordinator Email</span>
              </label>
              <input
                type="email"
                name="coordinator_hostel_email"
                value={settings.coordinator_hostel_email}
                onChange={handleSettingsChange}
                placeholder="hostel_coord@college.edu"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
              />
            </div>

            {/* Transport Coord */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                <TruckIcon className="w-4 h-4 text-orange-500" />
                <span>Transport Coordinator Email</span>
              </label>
              <input
                type="email"
                name="coordinator_transport_email"
                value={settings.coordinator_transport_email}
                onChange={handleSettingsChange}
                placeholder="transport_coord@college.edu"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
              />
            </div>

            {/* Examination Coord */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                <DocumentCheckIcon className="w-4 h-4 text-purple-500" />
                <span>Examination Coordinator Email</span>
              </label>
              <input
                type="email"
                name="coordinator_examination_email"
                value={settings.coordinator_examination_email}
                onChange={handleSettingsChange}
                placeholder="exam_coord@college.edu"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
              />
            </div>

            {/* Placement Coord */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                <BriefcaseIcon className="w-4 h-4 text-indigo-500" />
                <span>Placement Coordinator Email</span>
              </label>
              <input
                type="email"
                name="coordinator_placement_email"
                value={settings.coordinator_placement_email}
                onChange={handleSettingsChange}
                placeholder="placement_coord@college.edu"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
              />
            </div>

            {/* Maintenance Coord */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                <WrenchIcon className="w-4 h-4 text-teal-500" />
                <span>Maintenance Coordinator Email</span>
              </label>
              <input
                type="email"
                name="coordinator_maintenance_email"
                value={settings.coordinator_maintenance_email}
                onChange={handleSettingsChange}
                placeholder="maintenance_coord@college.edu"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
              />
            </div>

            {/* General Grievance */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                <UserGroupIcon className="w-4 h-4 text-gray-500" />
                <span>General Grievance Officer Email (Fallback Routing)</span>
              </label>
              <input
                type="email"
                name="coordinator_general_email"
                value={settings.coordinator_general_email}
                onChange={handleSettingsChange}
                placeholder="general_coord@college.edu"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updatingSettings}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-2xl shadow transition disabled:opacity-50"
          >
            {updatingSettings ? 'Saving Configuration...' : 'Save Email Configurations'}
          </button>
        </form>
      )}
    </motion.div>
  );
};

export default AdminPanel;
