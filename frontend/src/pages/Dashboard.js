import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { complaintAPI, authAPI } from '../services/api';
import { AnalyticsComponent } from './Analytics';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlusIcon,
  BellIcon,
  ChartBarIcon,
  UserGroupIcon,
  KeyIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const COORDINATOR_TYPES = [
  { type: 'academic', title: 'Academic Coordinator', desc: 'Handles curriculum, exams, faculty, and academic grievance routing.' },
  { type: 'hostel', title: 'Hostel Facilities Coordinator', desc: 'Manages hostel accommodations, maintenance, and mess grievances.' },
  { type: 'transport', title: 'Transport & Bus Coordinator', desc: 'Handles college buses, routes, schedules, and transport issues.' },
  { type: 'examination', title: 'Examination & Evaluation Officer', desc: 'Manages hall tickets, mark sheets, grade cards, and exam disputes.' },
  { type: 'placement', title: 'Placement & Internship Coordinator', desc: 'Manages campus placements, company drives, and internship grievances.' },
  { type: 'maintenance', title: 'Campus Infrastructure & Maintenance', desc: 'Handles campus repairs, lab equipment, electrical, and plumbing.' },
  { type: 'general', title: 'General Grievance Officer', desc: 'Handles general institutional complaints, sports, and library issues.' }
];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected, resolved
  
  // Principal Tab & Modal State
  const [principalTab, setPrincipalTab] = useState('oversight'); // oversight, vp_decisions, analytics, coordinators
  const [principalRemarksModal, setPrincipalRemarksModal] = useState({ show: false, complaintId: null, currentTitle: '' });
  const [principalRemarksText, setPrincipalRemarksText] = useState('');
  const [submittingRemarks, setSubmittingRemarks] = useState(false);

  // Coordinator Management State for Principal
  const [coordinators, setCoordinators] = useState([]);
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);
  const [coordModal, setCoordModal] = useState({ show: false, coordinatorType: '', name: '', email: '', password: '' });
  const [submittingCoord, setSubmittingCoord] = useState(false);
  const [sharedCredsModal, setSharedCredsModal] = useState({ show: false, name: '', email: '', password: '', typeTitle: '' });

  // VP/Admin Action Modal/States
  const [actionModal, setActionModal] = useState({ show: false, type: null, complaintId: null });
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionPriority, setActionPriority] = useState('medium');

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  useEffect(() => {
    if (user?.role === 'principal' && principalTab === 'coordinators') {
      fetchCoordinators();
    }
  }, [principalTab, user]);

  const fetchCoordinators = async () => {
    try {
      setLoadingCoordinators(true);
      const res = await authAPI.getCoordinators();
      setCoordinators(res.data.data || []);
    } catch (err) {
      console.error('Error fetching coordinators:', err);
      toast.error('Failed to load coordinators list');
    } finally {
      setLoadingCoordinators(false);
    }
  };

  const handleSaveCoordinator = async (e) => {
    e.preventDefault();
    if (!coordModal.name || !coordModal.email || !coordModal.coordinatorType) {
      toast.error('Name, email, and coordinator type are required');
      return;
    }
    setSubmittingCoord(true);
    try {
      const res = await authAPI.saveCoordinator({
        name: coordModal.name,
        email: coordModal.email,
        coordinatorType: coordModal.coordinatorType,
        password: coordModal.password || 'coord123456'
      });
      toast.success(res.data.message || 'Coordinator saved successfully');
      
      const typeInfo = COORDINATOR_TYPES.find(ct => ct.type === coordModal.coordinatorType);
      
      setSharedCredsModal({
        show: true,
        name: coordModal.name,
        email: coordModal.email,
        password: coordModal.password || 'coord123456',
        typeTitle: typeInfo ? typeInfo.title : coordModal.coordinatorType
      });

      setCoordModal({ show: false, coordinatorType: '', name: '', email: '', password: '' });
      fetchCoordinators();
    } catch (err) {
      console.error('Save coordinator error:', err);
      toast.error(err.response?.data?.message || 'Failed to save coordinator');
    } finally {
      setSubmittingCoord(false);
    }
  };

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

  const handleSavePrincipalRemarks = async () => {
    if (!principalRemarksText.trim()) {
      toast.error('Remarks cannot be empty');
      return;
    }
    setSubmittingRemarks(true);
    try {
      await complaintAPI.addRemarks(principalRemarksModal.complaintId, principalRemarksText);
      toast.success('Executive remarks added successfully!');
      setPrincipalRemarksModal({ show: false, complaintId: null, currentTitle: '' });
      setPrincipalRemarksText('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding remarks:', error);
      toast.error(error.response?.data?.message || 'Failed to add remarks');
    } finally {
      setSubmittingRemarks(false);
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

  // 1. Principal Dashboard Render
  if (user?.role === 'principal') {
    const principalCards = [
      { title: 'Total Grievances', value: stats?.total || 0, icon: DocumentTextIcon, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
      { title: 'Pending VP Review', value: stats?.pendingVP || 0, icon: ClockIcon, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
      { title: 'Active Investigation', value: (stats?.approvedVP || 0) + (stats?.underReview || 0) + (stats?.inProgress || 0), icon: ExclamationTriangleIcon, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
      { title: 'Resolved & Closed', value: (stats?.resolved || 0) + (stats?.closed || 0), icon: CheckCircleIcon, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' }
    ];

    const vpDecisionComplaints = complaints.filter(c => 
      c.status === 'Approved by Vice Principal' || c.status === 'Rejected by Vice Principal' || c.timeline?.some(t => t.status?.includes('Vice Principal'))
    );

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 sm:p-7 text-white shadow-lg border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/10 backdrop-blur-md text-indigo-200 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-white/10">Executive Oversight</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">Principal Control Panel</h1>
            <p className="mt-1 text-slate-300 text-sm sm:text-base max-w-3xl">Monitor all institutional grievances, view real-time stage updates, track Vice Principal decisions, and post executive remarks.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {principalCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 p-6 flex items-center justify-between"
            >
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{card.title}</p>
                <p className="text-3xl font-extrabold mt-2 text-gray-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`${card.color} p-4 rounded-2xl`}>
                <card.icon className="w-6 h-6" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 pb-4 mb-6 -mx-1 scrollbar-hide gap-4">
            <button
              onClick={() => setPrincipalTab('oversight')}
              className={`pb-2 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap flex items-center gap-2 ${
                principalTab === 'oversight'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span>All Grievances Oversight ({complaints.length})</span>
            </button>
            <button
              onClick={() => setPrincipalTab('vp_decisions')}
              className={`pb-2 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap flex items-center gap-2 ${
                principalTab === 'vp_decisions'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BellIcon className="w-4 h-4" />
              <span>VP Action Feed ({vpDecisionComplaints.length})</span>
            </button>
            <button
              onClick={() => setPrincipalTab('analytics')}
              className={`pb-2 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap flex items-center gap-2 ${
                principalTab === 'analytics'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ChartBarIcon className="w-4 h-4" />
              <span>Analytics Dashboard</span>
            </button>
            <button
              onClick={() => setPrincipalTab('coordinators')}
              className={`pb-2 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap flex items-center gap-2 ${
                principalTab === 'coordinators'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserGroupIcon className="w-4 h-4" />
              <span>Manage Coordinators</span>
            </button>
          </div>

          {principalTab === 'coordinators' ? (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Institutional Coordinator Management</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Assign and manage coordinators directly from the UI. When you issue credentials to a coordinator, they will be automatically prompted to set their custom password on first login.
                  </p>
                </div>
              </div>

              {loadingCoordinators ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {COORDINATOR_TYPES.map((ct) => {
                    const assignedUser = coordinators.find(c => c.coordinatorType === ct.type);
                    return (
                      <div key={ct.type} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-3 relative flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                              {ct.title}
                            </span>
                            {assignedUser ? (
                              assignedUser.mustChangePassword ? (
                                <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-bold">
                                  🔑 1st Login Pending
                                </span>
                              ) : (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                  ✅ Active & Password Set
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                                Unassigned
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{ct.desc}</p>
                          
                          <div className="mt-4 p-3 bg-slate-50 dark:bg-gray-800/80 rounded-xl space-y-1 border border-slate-100 dark:border-gray-700/50">
                            <p className="text-xs font-bold text-gray-900 dark:text-white">
                              {assignedUser ? assignedUser.name : 'No assigned coordinator'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              📧 {assignedUser ? assignedUser.email : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                          <button
                            onClick={() => setCoordModal({
                              show: true,
                              coordinatorType: ct.type,
                              name: assignedUser ? assignedUser.name : '',
                              email: assignedUser ? assignedUser.email : '',
                              password: 'coord123456'
                            })}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                          >
                            <KeyIcon className="w-3.5 h-3.5" />
                            <span>{assignedUser ? 'Update Credentials' : 'Assign Coordinator'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : principalTab === 'analytics' ? (
            <AnalyticsComponent embedded={true} />
          ) : principalTab === 'vp_decisions' ? (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 text-xs text-slate-800 dark:text-slate-200 font-medium">
                🔔 <strong>Vice Principal Actions Stream:</strong> Notifications and log of all grievances approved or rejected by the Vice Principal office.
              </div>
              {vpDecisionComplaints.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No VP decisions recorded yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vpDecisionComplaints.map(c => {
                    const isApproved = c.status === 'Approved by Vice Principal';
                    const vpTimeline = c.timeline?.find(t => t.status?.includes('Vice Principal'));
                    return (
                      <div key={c.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {c.status}
                          </span>
                          <span className="text-xs font-bold text-gray-400">#{c.id}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{c.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400"><strong>Student:</strong> {c.student?.name} ({c.student?.department || 'N/A'})</p>
                        {vpTimeline && (
                          <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 p-3 rounded-xl text-xs space-y-1">
                            <p className="font-semibold text-gray-700 dark:text-gray-300">VP Remarks:</p>
                            <p className="text-gray-600 dark:text-gray-400">{vpTimeline.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(vpTimeline.timestamp).toLocaleString()}</p>
                          </div>
                        )}
                        <div className="pt-2 flex justify-end">
                          <Link to={`/complaint/${c.id}`} className="text-xs font-bold text-indigo-600 hover:underline">
                            View full complaint & details ➔
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No grievances found in system.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 pl-4">ID</th>
                      <th className="pb-3">Title & Student</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Current Stage</th>
                      <th className="pb-3">Progress</th>
                      <th className="pb-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                    {complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/60">
                        <td className="py-4 pl-4 font-bold text-gray-700 dark:text-gray-300">#{c.id}</td>
                        <td className="py-4">
                          <div className="font-bold text-gray-900 dark:text-white">{c.title}</div>
                          <div className="text-xs text-gray-500">{c.student?.name} ({c.student?.department || 'N/A'})</div>
                        </td>
                        <td className="py-4 capitalize font-semibold text-gray-600 dark:text-gray-400">{c.category?.replace('_', ' ')}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusColor(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 w-32">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${getProgressPercentage(c.status)}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">{getProgressPercentage(c.status)}% complete</span>
                        </td>
                        <td className="py-4 pr-4 text-right space-x-2">
                          <button
                            onClick={() => setPrincipalRemarksModal({ show: true, complaintId: c.id, currentTitle: c.title })}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                          >
                            + Remarks
                          </button>
                          <Link
                            to={`/complaint/${c.id}`}
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold transition inline-block"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Modal for Principal Remarks */}
        {principalRemarksModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Principal Executive Remarks
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Grievance #{principalRemarksModal.complaintId}: <strong>{principalRemarksModal.currentTitle}</strong>
              </p>
              <textarea
                value={principalRemarksText}
                onChange={(e) => setPrincipalRemarksText(e.target.value)}
                placeholder="Enter official Principal remarks/instructions..."
                rows={4}
                className="w-full border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => {
                    setPrincipalRemarksModal({ show: false, complaintId: null, currentTitle: '' });
                    setPrincipalRemarksText('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePrincipalRemarks}
                  disabled={submittingRemarks}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {submittingRemarks ? 'Saving...' : 'Submit Executive Remarks'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Assigning / Updating Coordinator */}
        {coordModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Assign Coordinator Credentials
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Category: <strong className="capitalize">{COORDINATOR_TYPES.find(c => c.type === coordModal.coordinatorType)?.title}</strong>
              </p>
              
              <form onSubmit={handleSaveCoordinator} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Coordinator Name *</label>
                  <input
                    type="text"
                    value={coordModal.name}
                    onChange={(e) => setCoordModal({ ...coordModal, name: e.target.value })}
                    placeholder="e.g. Prof. Kumar"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Coordinator Email Address *</label>
                  <input
                    type="email"
                    value={coordModal.email}
                    onChange={(e) => setCoordModal({ ...coordModal, email: e.target.value })}
                    placeholder="e.g. academic_coord@college.edu"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Temporary Initial Password *</label>
                  <input
                    type="text"
                    value={coordModal.password}
                    onChange={(e) => setCoordModal({ ...coordModal, password: e.target.value })}
                    placeholder="Set temporary password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    🔒 The coordinator will be forced to change this password when logging in for the first time.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setCoordModal({ show: false, coordinatorType: '', name: '', email: '', password: '' })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCoord}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    {submittingCoord ? 'Saving...' : 'Save & Issue Credentials'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Sharing Generated Credentials */}
        {sharedCredsModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheckIcon className="w-6 h-6" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Credentials Ready to Share!
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Copy and share these credentials with the newly assigned coordinator <strong>{sharedCredsModal.name}</strong> ({sharedCredsModal.typeTitle}):
              </p>

              <div className="bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 p-4 rounded-xl space-y-2 text-xs">
                <p><strong className="text-gray-600 dark:text-gray-400">Role Title:</strong> {sharedCredsModal.typeTitle}</p>
                <p><strong className="text-gray-600 dark:text-gray-400">Name:</strong> {sharedCredsModal.name}</p>
                <p><strong className="text-gray-600 dark:text-gray-400">Login Email:</strong> <code className="bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100">{sharedCredsModal.email}</code></p>
                <p><strong className="text-gray-600 dark:text-gray-400">Temporary Password:</strong> <code className="bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100">{sharedCredsModal.password}</code></p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                🔑 <strong>First-Time Login Protocol:</strong> When {sharedCredsModal.name} logs in with these credentials, the system will automatically display a notice prompting them to update their password immediately.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSharedCredsModal({ show: false, name: '', email: '', password: '', typeTitle: '' })}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Done / Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Vice Principal Dashboard Render
  if (user?.role === 'vice_principal') {
    const vpCards = [
      { title: 'Pending Approval', value: stats?.pendingVP || 0, icon: ClockIcon, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
      { title: 'Approved & Routed', value: stats?.approvedVP || 0, icon: CheckCircleIcon, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
      { title: 'Rejected', value: stats?.rejectedVP || 0, icon: XCircleIcon, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
      { title: 'Total Grievances', value: stats?.total || 0, icon: DocumentTextIcon, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' }
    ];

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-slate-800">
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">Vice Principal Administration Panel</h1>
          <p className="mt-1 text-slate-300 text-sm sm:text-base">Review student/staff submissions, add remarks, and route complaints dynamically to assigned coordinators.</p>
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
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({stats?.pendingVP || 0})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`pb-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap ${
                activeTab === 'approved'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Approved ({stats?.approvedVP || 0})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`pb-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap ${
                activeTab === 'rejected'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Rejected ({stats?.rejectedVP || 0})
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                      <td className="py-4 capitalize font-medium text-gray-600 dark:text-gray-450">{c.category?.replace('_', ' ')}</td>
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setActionModal({ show: true, type: 'reject', complaintId: c.id })}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
                          >
                            Reject
                          </button>
                        </td>
                      ) : (
                        <td className="py-4 pr-4 text-right">
                          <Link
                            to={`/complaint/${c.id}`}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs"
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
                      { value: 'low', label: '🟢 Low', activeColor: 'bg-green-50 text-green-750 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' },
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
                              ? `${opt.activeColor} ring-2 ring-indigo-500/20 shadow-sm scale-[1.02]` 
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
                className="w-full border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                    actionModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
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

  // 3. Coordinator Dashboard Render
  if (user?.role === 'coordinator') {
    const coordCards = [
      { title: 'Total Assigned', value: stats?.total || 0, icon: DocumentTextIcon, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
      { title: 'In Progress', value: (stats?.inProgress || 0) + (stats?.underReview || 0) + (stats?.investigationStarted || 0), icon: ClockIcon, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
      { title: 'Resolved', value: stats?.resolved || 0, icon: CheckCircleIcon, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' }
    ];

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-slate-800">
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">Coordinator Workspace</h1>
          <p className="mt-1 text-slate-300 text-sm sm:text-base">Manage assigned grievances, post regular timeline/stage updates, upload evidence, and resolve issues.</p>
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
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({complaints.filter(c => c.status === 'Approved by Vice Principal').length})
            </button>
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`pb-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap ${
                activeTab === 'in_progress'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active ({complaints.filter(c => ['Under Review', 'Investigation Started', 'In Progress', 'Awaiting Information', 'Escalated'].includes(c.status)).length})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`pb-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[18px] whitespace-nowrap ${
                activeTab === 'resolved'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Resolved
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${getProgressPercentage(c.status)}%` }} />
                    </div>
                    <Link
                      to={`/complaint/${c.id}`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition"
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

  // 4. Default Dashboard (Student/Faculty/HOD/Admin)
  const statCards = [
    { title: 'Total Complaints', value: stats?.total || 0, icon: DocumentTextIcon, color: 'bg-indigo-600' },
    { title: 'Resolved', value: stats?.resolved || 0, icon: CheckCircleIcon, color: 'bg-emerald-600' },
    { title: 'Pending VP Approval', value: stats?.pendingVP || 0, icon: ClockIcon, color: 'bg-amber-500' },
    { title: 'Escalated', value: stats?.escalated || 0, icon: ExclamationTriangleIcon, color: 'bg-rose-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="mt-1 text-slate-300 text-sm sm:text-base">Here's what's happening with your grievances today.</p>
        </div>
        {user?.role === 'student' && (
          <Link
            to="/submit-complaint"
            className="bg-indigo-600 text-white hover:bg-indigo-500 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-sm shadow transition flex items-center space-x-1 flex-shrink-0"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : complaints.length === 0 ? (
            <p className="text-center py-6 text-gray-500 dark:text-gray-400">You haven't submitted any complaints yet.</p>
          ) : (
            complaints.slice(0, 5).map((complaint) => (
              <div key={complaint._id} className="border-b dark:border-gray-700 pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 last:border-b-0 last:pb-0">
                <div className="min-w-0">
                  <Link to={`/complaint/${complaint.id}`} className="font-semibold text-indigo-600 hover:underline text-sm sm:text-base truncate block">{complaint.title}</Link>
                  <p className="text-xs text-gray-500 mt-1">Submitted on {new Date(complaint.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className={`text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full font-bold uppercase ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                  <div className="w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 hidden sm:block">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${getProgressPercentage(complaint.status)}%` }} />
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
