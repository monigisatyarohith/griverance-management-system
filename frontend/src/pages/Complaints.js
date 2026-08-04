import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { complaintAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

const statusColors = {
  'Pending Vice Principal Approval': 'bg-yellow-100 text-yellow-800',
  'Approved by Vice Principal': 'bg-blue-100 text-blue-800',
  'Rejected by Vice Principal': 'bg-red-100 text-red-800',
  'Under Review': 'bg-orange-100 text-orange-800',
  'Investigation Started': 'bg-amber-100 text-amber-800',
  'In Progress': 'bg-indigo-100 text-indigo-800',
  'Awaiting Information': 'bg-purple-100 text-purple-800',
  'Escalated': 'bg-rose-100 text-rose-800',
  'Resolved': 'bg-green-100 text-green-800',
  'Closed': 'bg-gray-100 text-gray-800'
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const Complaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter, categoryFilter]);

  const fetchComplaints = async () => {
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await complaintAPI.getAll(params);
      setComplaints(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'student' ? 'My Complaints' : 'Assigned Complaints'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">View and manage your grievances</p>
        </div>
        {user?.role === 'student' && (
          <Link
            to="/submit-complaint"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all text-sm text-center flex-shrink-0"
          >
            + New Complaint
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search complaints..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-sm"
            >
              <option value="">All Status</option>
              <option value="Pending Vice Principal Approval">Pending VP Approval</option>
              <option value="Approved by Vice Principal">Approved VP</option>
              <option value="Rejected by Vice Principal">Rejected VP</option>
              <option value="Under Review">Under Review</option>
              <option value="Investigation Started">Investigation Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Information">Awaiting Information</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-sm"
            >
              <option value="">All Categories</option>
              <optgroup label="Student Grievances">
                <option value="academics">Academics</option>
                <option value="scholarships">Scholarships</option>
                <option value="examinations">Examinations</option>
                <option value="ragging">Ragging</option>
                <option value="extra_curricular">Extra Curricular</option>
                <option value="boarding_lodging">Boarding & Lodging</option>
              </optgroup>
              <optgroup label="Staff Grievances">
                <option value="social_inequality">Social Inequality</option>
                <option value="gender_inequality">Gender Inequality</option>
                <option value="amenities">Amenities</option>
                <option value="pay_perks">Pay & Perks</option>
                <option value="service">Service</option>
              </optgroup>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-4 text-lg">No complaints found</p>
          {user?.role === 'student' && (
            <Link
              to="/submit-complaint"
              className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg"
            >
              Submit your first complaint
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint, index) => (
            <motion.div
              key={complaint._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/complaint/${complaint._id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg p-4 sm:p-5 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                      {complaint.title}
                    </h3>
                    <p className="text-gray-500 mt-1 text-sm line-clamp-2">
                      {complaint.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[complaint.status] || 'bg-gray-100 text-gray-800'}`}>
                        {complaint.status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[complaint.priority]}`}>
                        {complaint.priority}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        {complaint.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                    {complaint.assignedTo && (
                      <p className="text-xs text-gray-500 mt-1">
                        → {complaint.assignedTo.name}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded-lg ${
                p === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Complaints;
