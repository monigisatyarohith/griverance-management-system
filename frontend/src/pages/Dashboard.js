import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { complaintAPI } from '../services/api';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected, resolved
  
  // VP/Admin Action Modal/States
  const [actionModal, setActionModal] = useState({ show: false, type: null, complaintId: null });
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionPriority, setActionPriority] = useState('medium');

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await complaintAPI.getStats();
      setStats(statsRes.data.stats);

      // Construct status filter based on role & active tab
      const params = {};
      if (user?.role === 'vice_principal') {
        if (activeTab === 'pending') params.status = 'Pending Vice Principal Approval';
        else if (activeTab === 'approved') params.status = 'Approved by Vice Principal';
        else if (activeTab === 'rejected') params.status = 'Rejected by Vice Principal';
      } else if (user?.role === 'coordinator') {
        if (activeTab === 'pending') params.status = 'Approved by Vice Principal';
        else if (activeTab === 'in_progress') params.status = 'In Progress';
        else if (activeTab === 'resolved') params.status = 'Resolved';
      }

      const complaintsRes = await complaintAPI.getAll(params);
      setComplaints(complaintsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessComplaint = async () => {
    try {
      const { type, complaintId } = actionModal;
      
      const payload = { remarks: actionRemarks };
      if (type === 'approve') {
        payload.priority = actionPriority;
        await complaintAPI.approve(complaintId, payload);
      } else {
        await complaintAPI.reject(complaintId, payload);
      }
      
      toast.success(`Complaint successfully ${type}d`);
      
      setActionModal({ show: false, type: null, complaintId: null });
      setActionRemarks('');
      setActionPriority('medium');
      fetchDashboardData();
    } catch (error) {
      console.error('Error processing complaint:', error);
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'Pending Vice Principal Approval': return 10;
      case 'Approved by Vice Principal': return 25;
      case 'Rejected by Vice Principal': return 100;
      case 'Under Review': return 40;
      case 'Investigation Started': return 55;
      case 'In Progress': return 75;
      case 'Awaiting Information': return 80;
      case 'Escalated': return 85;
      case 'Resolved': return 100;
      case 'Closed': return 100;
      default: return 0;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Vice Principal Approval': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30';
      case 'Approved by Vice Principal': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30';
      case 'Rejected by Vice Principal': return 'text-red-600 bg-red-50 dark:bg-red-950/30';
      case 'Investigation Started':
      case 'Under Review': return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
      case 'In Progress': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30';
      case 'Resolved': return 'text-green-600 bg-green-50 dark:bg-green-950/30';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/30';
    }
  };

  // 1. Vice Principal Dashboard Render
  if (user?.role === 'vice_principal') {
    const vpCards = [
      { title: 'Pending Approval', value: stats?.pendingVP || 0, icon: ClockIcon, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
      { title: 'Approved & Routed', value: stats?.approvedVP || 0, icon: CheckCircleIcon, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
      { title: 'Rejected', value: stats?.rejectedVP || 0, icon: XCircleIcon, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
      { title: 'Total Grievances', value: stats?.total || 0, icon: DocumentTextIcon, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' }
    ];

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
          <h1 className="text-xl sm:text-3xl font-bold">Vice Principal Administration Panel</h1>
          <p className="mt-2 opacity-90 text-sm sm:text-base">Review student/staff submissions, add remarks, and route complaints dynamically to assigned coordinators.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vpCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-150 dark:border-gray-700 p-6 flex items-center justify-between"
            >
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{card.title}</p>
                <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`${card.color} p-4 rounded-xl`}>
                <card.icon className="w-6 h-6" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 pb-4 mb-6 -mx-1 scrollbar-hide">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({stats?.pendingVP || 0})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`pb-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap ${
                activeTab === 'approved'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Approved ({stats?.approvedVP || 0})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`pb-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap ${
                activeTab === 'rejected'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Rejected ({stats?.rejectedVP || 0})
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No grievances found in this category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 pl-4">ID</th>
                    <th className="pb-3">Title & Student</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Priority</th>
                    <th className="pb-3">Date</th>
                    {activeTab === 'pending' && <th className="pb-3 pr-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="py-4 pl-4 font-semibold text-gray-700 dark:text-gray-300">#{c.id}</td>
                      <td className="py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{c.title}</div>
                        <div className="text-xs text-gray-500">{c.student?.name} ({c.student?.department || 'N/A'})</div>
                      </td>
                      <td className="py-4 capitalize font-medium text-gray-600 dark:text-gray-450">{c.category.replace('_', ' ')}</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          c.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          c.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          c.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-4 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      {activeTab === 'pending' ? (
                        <td className="py-4 pr-4 text-right space-x-2">
                          <button
                            onClick={() => setActionModal({ show: true, type: 'approve', complaintId: c.id })}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setActionModal({ show: true, type: 'reject', complaintId: c.id })}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
                          >
                            Reject
                          </button>
                        </td>
                      ) : (
                        <td className="py-4 pr-4 text-right">
                          <Link
                            to={`/complaint/${c.id}`}
                            className="text-purple-600 hover:text-purple-700 font-semibold text-xs"
                          >
                            View details ➔
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Remarks Modal */}
        {actionModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold capitalize text-gray-900 dark:text-white mb-2">
                {actionModal.type} Grievance
              </h3>
              {actionModal.type === 'approve' && (
                <div className="mb-4 space-y-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block">Set Initial Priority *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'low', label: '🟢 Low', activeColor: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' },
                      { value: 'medium', label: '🟡 Med', activeColor: 'bg-yellow-50 text-yellow-750 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-450 dark:border-yellow-800' },
                      { value: 'high', label: '🟠 High', activeColor: 'bg-orange-50 text-orange-750 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-850' },
                      { value: 'urgent', label: '🔴 Urg', activeColor: 'bg-red-50 text-red-750 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' }
                    ].map(opt => {
                      const isActive = actionPriority === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setActionPriority(opt.value)}
                          className={`py-2 px-1 border rounded-xl text-xs font-semibold capitalize transition-all duration-200 text-center ${
                            isActive 
                              ? `${opt.activeColor} ring-2 ring-purple-500/20 shadow-sm scale-[1.02]` 
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Add remarks/comments to accompany this grievance action:
              </p>
              <textarea
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="Enter remarks..."
                rows={4}
                className="w-full border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
              <div className="flex justify-end space-x-3 mt-5">
                <button
                  onClick={() => setActionModal({ show: false, type: null, complaintId: null })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessComplaint}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-semibold transition ${
                    actionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm {actionModal.type}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Coordinator Dashboard Render
  if (user?.role === 'coordinator') {
    const coordCards = [
      { title: 'Total Assigned', value: stats?.total || 0, icon: DocumentTextIcon, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
      { title: 'In Progress', value: (stats?.inProgress || 0) + (stats?.underReview || 0) + (stats?.investigationStarted || 0), icon: ClockIcon, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
      { title: 'Resolved', value: stats?.resolved || 0, icon: CheckCircleIcon, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' }
    ];

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
          <h1 className="text-xl sm:text-3xl font-bold">Coordinator Workspace</h1>
          <p className="mt-2 opacity-90 text-sm sm:text-base">Manage assigned grievances, post regular timeline/stage updates, upload evidence, and resolve issues.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {coordCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-150 dark:border-gray-700 p-6 flex items-center justify-between"
            >
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{card.title}</p>
                <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`${card.color} p-4 rounded-xl`}>
                <card.icon className="w-6 h-6" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 pb-4 mb-6 -mx-1 scrollbar-hide">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({complaints.filter(c => c.status === 'Approved by Vice Principal').length})
            </button>
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`pb-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap ${
                activeTab === 'in_progress'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active ({complaints.filter(c => ['Under Review', 'Investigation Started', 'In Progress', 'Awaiting Information', 'Escalated'].includes(c.status)).length})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`pb-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap ${
                activeTab === 'resolved'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Resolved
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No assigned grievances found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complaints.map((c) => (
                <div key={c.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">#{c.id}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mt-3 text-lg">{c.title}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">{c.description}</p>
                  
                  <div className="flex items-center space-x-3 mt-4 text-xs text-gray-500">
                    <div>
                      <strong>Student:</strong> {c.student?.name}
                    </div>
                    <div>|</div>
                    <div>
                      <strong>Date:</strong> {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${getProgressPercentage(c.status)}%` }} />
                    </div>
                    <Link
                      to={`/complaint/${c.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition"
                    >
                      Update Stage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Default Dashboard (Student/Faculty/HOD/Admin)
  const statCards = [
    { title: 'Total Complaints', value: stats?.total || 0, icon: DocumentTextIcon, color: 'bg-blue-500' },
    { title: 'Resolved', value: stats?.resolved || 0, icon: CheckCircleIcon, color: 'bg-green-500' },
    { title: 'Pending VP Approval', value: stats?.pendingVP || 0, icon: ClockIcon, color: 'bg-yellow-500' },
    { title: 'Escalated', value: stats?.escalated || 0, icon: ExclamationTriangleIcon, color: 'bg-red-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="mt-1 sm:mt-2 opacity-95 text-sm sm:text-base">Here's what's happening with your grievances today.</p>
        </div>
        {user?.role === 'student' && (
          <Link
            to="/submit-complaint"
            className="bg-white text-purple-700 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-gray-100 transition flex items-center space-x-1 flex-shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Grievance</span>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-150 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3.5 rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent complaints */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-900 dark:text-white">Recent Activity</h3>
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : complaints.length === 0 ? (
            <p className="text-center py-6 text-gray-500 dark:text-gray-400">You haven't submitted any complaints yet.</p>
          ) : (
            complaints.slice(0, 5).map((complaint) => (
              <div key={complaint._id} className="border-b dark:border-gray-700 pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 last:border-b-0 last:pb-0">
                <div className="min-w-0">
                  <Link to={`/complaint/${complaint.id}`} className="font-semibold text-blue-600 hover:underline text-sm sm:text-base truncate block">{complaint.title}</Link>
                  <p className="text-xs text-gray-500 mt-1">Submitted on {new Date(complaint.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className={`text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full font-bold uppercase ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                  <div className="w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 hidden sm:block">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${getProgressPercentage(complaint.status)}%` }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
