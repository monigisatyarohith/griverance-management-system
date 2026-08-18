import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { complaintAPI } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline';

const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1'];
const STATUS_COLORS = ['#F59E0B', '#3B82F6', '#F59E0B', '#6366F1', '#EF4444', '#10B981', '#DC2626'];

export const AnalyticsComponent = ({ embedded = false }) => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const res = await complaintAPI.getAll({ limit: 500 });
      setAllComplaints(res.data.data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate available Month-Year options dynamically from complaint submission dates
  const monthOptions = React.useMemo(() => {
    const monthSet = new Set();
    allComplaints.forEach(c => {
      if (c.createdAt) {
        const d = new Date(c.createdAt);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthSet.add(monthKey);
      }
    });
    const sorted = Array.from(monthSet).sort().reverse();
    return sorted.map(mKey => {
      const [year, month] = mKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      return { value: mKey, label };
    });
  }, [allComplaints]);

  // Filter complaints according to month filter
  const filteredComplaints = React.useMemo(() => {
    if (selectedMonth === 'ALL') return allComplaints;
    return allComplaints.filter(c => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === selectedMonth;
    });
  }, [allComplaints, selectedMonth]);

  // Calculate Status Data
  const statusData = React.useMemo(() => {
    const counts = {
      'Pending VP': 0,
      'Approved VP': 0,
      'Under Review': 0,
      'In Progress': 0,
      'Escalated': 0,
      'Resolved': 0,
      'Rejected VP': 0
    };

    filteredComplaints.forEach(c => {
      if (c.status === 'Pending Vice Principal Approval') counts['Pending VP']++;
      else if (c.status === 'Approved by Vice Principal') counts['Approved VP']++;
      else if (c.status === 'Under Review' || c.status === 'Investigation Started') counts['Under Review']++;
      else if (c.status === 'In Progress' || c.status === 'Awaiting Information') counts['In Progress']++;
      else if (c.status === 'Escalated') counts['Escalated']++;
      else if (c.status === 'Resolved' || c.status === 'Closed') counts['Resolved']++;
      else if (c.status === 'Rejected by Vice Principal') counts['Rejected VP']++;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [filteredComplaints]);

  // Calculate Category Data
  const categoryData = React.useMemo(() => {
    const catCounts = {};
    filteredComplaints.forEach(c => {
      const cat = c.category ? c.category.replace('_', ' ') : 'other';
      const formatted = cat.charAt(0).toUpperCase() + cat.slice(1);
      catCounts[formatted] = (catCounts[formatted] || 0) + 1;
    });

    return Object.entries(catCounts).map(([name, count]) => ({
      name,
      count
    }));
  }, [filteredComplaints]);

  const totalFiltered = filteredComplaints.length;
  const resolvedFiltered = filteredComplaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
  const pendingFiltered = filteredComplaints.filter(c => !['Resolved', 'Closed', 'Rejected by Vice Principal'].includes(c.status)).length;
  const rejectedFiltered = filteredComplaints.filter(c => c.status === 'Rejected by Vice Principal').length;
  const resolutionRate = totalFiltered > 0 ? ((resolvedFiltered / totalFiltered) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Filter Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-150 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-5 h-5 text-purple-600" />
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Grievance Analytics & Trends</h2>
        </div>

        {/* Month Selector Filter */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5 whitespace-nowrap">
            <CalendarIcon className="w-4 h-4 text-purple-500" />
            <span>Filter by Month:</span>
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 border border-gray-300 dark:border-gray-650 dark:bg-gray-900 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="ALL">📅 All Time (All Months)</option>
            {monthOptions.map(m => (
              <option key={m.value} value={m.value}>🗓️ {m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Grievances', value: totalFiltered, color: 'from-blue-500 to-indigo-600' },
          { label: 'Resolved / Closed', value: resolvedFiltered, color: 'from-emerald-500 to-green-600' },
          { label: 'Pending / Active', value: pendingFiltered, color: 'from-amber-500 to-yellow-600' },
          { label: 'Resolution Rate', value: `${resolutionRate}%`, color: 'from-purple-500 to-indigo-600' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-gradient-to-r ${card.color} rounded-2xl p-5 text-white shadow-md`}
          >
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider">{card.label}</p>
            <p className="text-3xl font-extrabold mt-2">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
            Status Breakdown {selectedMonth !== 'ALL' && `(${monthOptions.find(m => m.value === selectedMonth)?.label})`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Distribution across current resolution stages</p>
          
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              No grievances found for this month filter.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={35}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart with Different Color Per Category */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
            Grievances Raised by Category
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Category breakdown (distinct colors per category)</p>

          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              No category data available for this month filter.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} Grievances`, 'Count']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Analytics = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Institution Analytics</h1>
      <AnalyticsComponent embedded={false} />
    </div>
  );
};

export default Analytics;
