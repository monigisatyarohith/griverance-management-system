import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { complaintAPI } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6B7280'];

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        complaintAPI.getStats(),
        complaintAPI.getAll({ limit: 100 })
      ]);
      setStats({
        ...statsRes.data.stats,
        categoryStats: statsRes.data.categoryStats,
        total: statsRes.data.stats?.total || 0,
        complaints: complaintsRes.data.data
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

  const statusData = [
    { name: 'Pending VP', value: stats?.pendingVP || 0 },
    { name: 'Approved VP', value: stats?.approvedVP || 0 },
    { name: 'Under Review', value: stats?.underReview || 0 },
    { name: 'In Progress', value: stats?.inProgress || 0 },
    { name: 'Escalated', value: stats?.escalated || 0 },
    { name: 'Resolved', value: stats?.resolved || 0 },
    { name: 'Rejected VP', value: stats?.rejectedVP || 0 },
  ].filter(d => d.value > 0);

  const categoryData = (stats?.categoryStats || []).map((c, i) => ({
    name: c._id?.charAt(0).toUpperCase() + c._id?.slice(1),
    count: c.count
  }));

  const resRate = stats?.total > 0 ? ((stats?.resolved / stats?.total) * 100).toFixed(1) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats?.total || 0, color: 'from-blue-500 to-blue-600' },
          { label: 'Resolved', value: stats?.resolved || 0, color: 'from-green-500 to-green-600' },
          { label: 'Pending', value: (stats?.submitted || 0) + (stats?.underReview || 0) + (stats?.inProgress || 0), color: 'from-yellow-500 to-yellow-600' },
          { label: 'Resolution Rate', value: `${resRate}%`, color: 'from-purple-500 to-purple-600' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-r ${card.color} rounded-xl p-5 text-white`}>
            <p className="text-white/80 text-sm">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics;
