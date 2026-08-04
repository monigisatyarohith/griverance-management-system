import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { BellIcon, CheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) { toast.error('Failed to mark as read'); }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (error) { toast.error('Failed'); }
  };

  const typeIcons = {
    complaint_update: '📋', escalation: '⚠️', assignment: '👤', reminder: '⏰', system: '🔔'
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 mt-1">{notifications.filter(n => !n.isRead).length} unread</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">
            <CheckCircleIcon className="w-5 h-5" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
          <BellIcon className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-4">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, i) => (
            <motion.div key={notif._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex items-start gap-4 ${!notif.isRead ? 'border-l-4 border-blue-500' : ''}`}
            >
              <span className="text-2xl">{typeIcons[notif.type] || '🔔'}</span>
              <div className="flex-1">
                <p className={`font-medium ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{notif.title}</p>
                <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</span>
                  {notif.relatedComplaint && (
                    <Link to={`/complaint/${notif.relatedComplaint._id || notif.relatedComplaint}`} className="text-xs text-blue-600 hover:underline">View complaint</Link>
                  )}
                </div>
              </div>
              {!notif.isRead && (
                <button onClick={() => markAsRead(notif._id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Mark as read">
                  <CheckIcon className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Notifications;
