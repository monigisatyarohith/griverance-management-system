import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { complaintAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const statusColors = {
  'Pending Vice Principal Approval': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Approved by Vice Principal': 'bg-blue-100 text-blue-800 border-blue-200',
  'Rejected by Vice Principal': 'bg-red-100 text-red-800 border-red-200',
  'Under Review': 'bg-orange-100 text-orange-850 border-orange-200',
  'Investigation Started': 'bg-amber-100 text-amber-850 border-amber-200',
  'In Progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Awaiting Information': 'bg-purple-100 text-purple-800 border-purple-200',
  'Escalated': 'bg-rose-100 text-rose-800 border-rose-200',
  'Resolved': 'bg-green-100 text-green-800 border-green-200',
  'Closed': 'bg-gray-100 text-gray-800 border-gray-200'
};

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // VP Action State
  const [vpRemarks, setVpRemarks] = useState('');
  const [vpPriority, setVpPriority] = useState('medium');
  
  // Coordinator Update Form State
  const [newStatus, setNewStatus] = useState('');
  const [coordinatorRemarks, setCoordinatorRemarks] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [attachment, setAttachment] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaintAndUpdates();
  }, [id]);

  const fetchComplaintAndUpdates = async () => {
    try {
      setLoading(true);
      
      const res = await complaintAPI.getAll();
      const found = res.data.data.find(c => String(c.id) === String(id) || String(c._id) === String(id));
      
      if (found) {
        setComplaint(found);
        setVpPriority(found.priority || 'medium');
        
        const updatesRes = await complaintAPI.getUpdates(found.id);
        setUpdates(updatesRes.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  const handleVpDecision = async (decision) => {
    setSubmitting(true);
    try {
      const payload = { remarks: vpRemarks };
      if (decision === 'approve') {
        payload.priority = vpPriority;
        await complaintAPI.approve(complaint.id, payload);
      } else {
        await complaintAPI.reject(complaint.id, payload);
      }
      toast.success(`Complaint successfully ${decision === 'approve' ? 'Approved' : 'Rejected'}`);
      setVpRemarks('');
      fetchComplaintAndUpdates();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update decision');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    setSubmitting(true);
    try {
      await complaintAPI.updatePriority(complaint.id, newPriority);
      toast.success(`Priority updated to ${newPriority}`);
      fetchComplaintAndUpdates();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update priority');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCoordinatorUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus || !coordinatorRemarks) {
      toast.error('Please specify the status and add remarks');
      return;
    }
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('remarks', coordinatorRemarks);
      if (estimatedDate) {
        formData.append('estimatedResolutionDate', estimatedDate);
      }
      if (attachment) {
        formData.append('attachments', attachment);
      }

      await complaintAPI.addUpdate(complaint.id, formData);

      toast.success('Stage update posted successfully');
      setNewStatus('');
      setCoordinatorRemarks('');
      setEstimatedDate('');
      setAttachment(null);
      fetchComplaintAndUpdates();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to submit update');
    } finally {
      setSubmitting(false);
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

  const getAttachmentUrl = (filePath) => {
    if (!filePath) return '';
    const normalized = filePath.replace(/\\/g, '/');
    const relative = normalized.replace(/^backend\//, '').replace(/^src\//, '');
    const baseUrl = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');
    return `${baseUrl}/${relative}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto" />
        <h3 className="text-xl font-bold mt-4">Grievance Not Found</h3>
        <p className="text-gray-500 mt-1">The requested grievance is invalid or has been removed.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-6 bg-purple-600 text-white px-5 py-2 rounded-xl text-sm font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isAssignedCoordinator = user?.role === 'coordinator' && complaint.assignedToId === user.id;
  const isVP = user?.role === 'vice_principal';
  const isPrincipal = user?.role === 'principal';
  const isAdmin = user?.role === 'admin';
  const progressPercent = getProgressPercentage(complaint.status);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-5xl mx-auto space-y-6 pb-12"
    >
      {/* Back navigation */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        <span className="text-sm font-medium">Back to Grievances</span>
      </button>

      {/* Main card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-150 dark:border-gray-700 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 sm:px-8 py-6 sm:py-8 text-white">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <span className="text-purple-200 text-xs font-bold uppercase tracking-wide">
                Grievance #{complaint.id}
              </span>
              <h1 className="text-xl sm:text-3xl font-bold mt-1 leading-tight break-words">{complaint.title}</h1>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border uppercase tracking-wider ${statusColors[complaint.status]}`}>
                {complaint.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-y-1 gap-x-4 sm:gap-x-6 mt-4 sm:mt-6 text-xs sm:text-sm text-purple-100">
            <span className="capitalize"><strong>Category:</strong> {complaint.category.replace('_', ' ')}</span>
            <span className="hidden sm:inline">•</span>
            <span className="capitalize"><strong>Priority:</strong> {complaint.priority}</span>
            <span className="hidden sm:inline">•</span>
            <span><strong>Submitted:</strong> {new Date(complaint.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Progress tracker */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/50 px-4 sm:px-8 py-4 sm:py-5">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
            <span>RESOLUTION PROGRESS</span>
            <span>{progressPercent}% COMPLETE</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                complaint.status.includes('Rejected') ? 'bg-red-500' : 'bg-purple-600'
              }`}
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>

        {/* Details list */}
        <div className="p-4 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100 dark:border-gray-700 pb-6">
            <div className="flex items-start space-x-3">
              <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Submitted By</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{complaint.student?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{complaint.student?.email}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <ShieldCheckIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Department</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{complaint.student?.department || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Est. Resolution Date</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                  {complaint.estimatedResolutionDate 
                    ? new Date(complaint.estimatedResolutionDate).toLocaleDateString()
                    : 'Awaiting Coordinator review'
                  }
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Description</h3>
            <p className="text-gray-750 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </p>
          </div>

          {/* Attachments if any */}
          {(() => {
            const attachmentsList = Array.isArray(complaint.attachments)
              ? complaint.attachments
              : (typeof complaint.attachments === 'string' && complaint.attachments.trim() !== '' && complaint.attachments !== '[]'
                  ? JSON.parse(complaint.attachments)
                  : []);
            if (attachmentsList.length === 0) return null;
            return (
              <div className="pt-4">
                <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Student Attachments</h3>
                <div className="flex flex-wrap gap-3">
                  {attachmentsList.map((path, i) => (
                    <a
                      key={i}
                      href={getAttachmentUrl(path)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 transition"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 text-purple-500" />
                      <span>Download file #{i+1}</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Vice Principal / Principal / Admin Priority Manager */}
      {(isVP || isPrincipal || isAdmin) && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-150 dark:border-gray-700 p-4 sm:p-8 space-y-4 animate-fadeIn">
          <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Grievance Priority Manager</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
              As a Principal, Vice Principal, or Administrator, you can update the priority of this grievance at any point during its investigation cycle.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: 'low', label: '🟢 Low', activeColor: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' },
                { value: 'medium', label: '🟡 Medium', activeColor: 'bg-yellow-50 text-yellow-750 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-450 dark:border-yellow-800' },
                { value: 'high', label: '🟠 High', activeColor: 'bg-orange-50 text-orange-750 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-850' },
                { value: 'urgent', label: '🔴 Urgent', activeColor: 'bg-red-50 text-red-750 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' }
              ].map(opt => {
                const isActive = complaint.priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={submitting}
                    onClick={() => handlePriorityChange(opt.value)}
                    className={`py-2.5 px-4 border rounded-2xl text-sm font-semibold capitalize transition-all duration-200 text-center ${
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
        </div>
      )}

      {/* Review & Approvals Form (Principal / Vice Principal / Admin) */}
      {(isVP || isPrincipal || isAdmin) && complaint.status === 'Pending Vice Principal Approval' && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-150 dark:border-gray-700 p-4 sm:p-8 space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg text-gray-950 dark:text-white">
              {isPrincipal ? 'Principal Review & Actions' : isVP ? 'Vice Principal Review & Actions' : 'Executive Review & Actions'}
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please add review remarks below. Approving will automatically route this complaint to the appropriate coordinator.
          </p>
          <textarea
            value={vpRemarks}
            onChange={(e) => setVpRemarks(e.target.value)}
            placeholder="Add official remarks/comments..."
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
          />
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase block">Set Urgent/Priority Level *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: 'low', label: '🟢 Low', activeColor: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' },
                { value: 'medium', label: '🟡 Medium', activeColor: 'bg-yellow-50 text-yellow-750 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-450 dark:border-yellow-800' },
                { value: 'high', label: '🟠 High', activeColor: 'bg-orange-50 text-orange-750 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-855' },
                { value: 'urgent', label: '🔴 Urgent', activeColor: 'bg-red-50 text-red-750 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' }
              ].map(opt => {
                const isActive = vpPriority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVpPriority(opt.value)}
                    className={`py-2.5 px-4 border rounded-2xl text-sm font-semibold capitalize transition-all duration-200 text-center ${
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
          <div className="flex gap-4">
            <button
              onClick={() => handleVpDecision('approve')}
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl shadow transition disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Approve & Route'}
            </button>
            <button
              onClick={() => handleVpDecision('reject')}
              disabled={submitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl shadow transition disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Reject & Close'}
            </button>
          </div>
        </div>
      )}

      {/* Coordinator Progress Form */}
      {isAssignedCoordinator && !['Resolved', 'Closed', 'Rejected by Vice Principal'].includes(complaint.status) && (
        <form onSubmit={handleCoordinatorUpdate} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-150 dark:border-gray-700 p-4 sm:p-8 space-y-5">
          <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Post Stage Update</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Update Grievance Stage</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-350 dark:border-gray-650 dark:bg-gray-900 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="">Select Stage</option>
                <option value="Under Review">Under Review</option>
                <option value="Investigation Started">Investigation Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Awaiting Information">Awaiting Information</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Estimated Resolution Date</label>
              <input
                type="date"
                value={estimatedDate}
                onChange={(e) => setEstimatedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-350 dark:border-gray-650 dark:bg-gray-900 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Coordinator Notes & Remarks</label>
            <textarea
              value={coordinatorRemarks}
              onChange={(e) => setCoordinatorRemarks(e.target.value)}
              required
              placeholder="Add details about the investigation, stage progress, or next steps..."
              rows={4}
              className="w-full border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase block">Supporting Attachment (Report, PDF, evidence)</label>
            <input
              type="file"
              onChange={(e) => setAttachment(e.target.files[0])}
              className="file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-xs text-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow transition disabled:opacity-50"
          >
            {submitting ? 'Posting Update...' : 'Submit Progress Update'}
          </button>
        </form>
      )}

      {/* Historical chronological updates table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-150 dark:border-gray-700 p-4 sm:p-8">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 mb-6">
          Investigation History & Progress Timeline
        </h3>

        {updates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No official progress updates have been recorded yet.
          </div>
        ) : (
          <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
            {updates.map((update, idx) => (
              <div key={update.update_id} className="relative pl-6">
                {/* timeline dot */}
                <span className="absolute -left-[9px] top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white dark:bg-gray-800 border-2 border-blue-500" />
                
                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-150 dark:border-gray-700 rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/50 dark:border-gray-700/50 pb-2 mb-2">
                    <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 capitalize">
                        {update.status}
                      </span>
                      <span className="text-xs text-gray-400 font-medium ml-2">
                        Updated by {update.coordinator?.name} ({update.coordinator?.role.replace('_', ' ')})
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(update.created_at || update.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {update.remarks}
                  </p>

                  {update.estimatedResolutionDate && (
                    <div className="mt-3 flex items-center space-x-1.5 text-xs text-amber-600 font-semibold">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Estimated resolution changed to: {new Date(update.estimatedResolutionDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {update.attachment_path && (
                    <div className="mt-3">
                      <a
                        href={getAttachmentUrl(update.attachment_path)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        <span>Download Coordinator Attachment</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main system Audit/Timeline log */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-150 dark:border-gray-700 p-4 sm:p-8">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 mb-6">
          Official Action Timeline
        </h3>
        <div className="space-y-6">
          {complaint.timeline?.map((entry, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${
                  entry.status?.includes('Resolved') ? 'bg-green-500' :
                  entry.status?.includes('Rejected') ? 'bg-red-500' :
                  'bg-purple-600'
                }`} />
                {i < complaint.timeline.length - 1 && <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1"></div>}
              </div>
              <div className="pb-4">
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-250 capitalize">
                  {entry.status}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{entry.message}</p>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ComplaintDetail;
