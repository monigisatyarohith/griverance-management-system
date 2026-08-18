import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('student');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs = [
    { id: 'student', label: '🎓 Student Flow' },
    { id: 'staff', label: '👨‍🏫 Staff Flow' },
    { id: 'alternate', label: '🔄 Alternate Channels' }
  ];

  const categoryColorMap = {
    'Academics': { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    'Scholarships': { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    'Examinations': { badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    'Ragging': { badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    'Extra-Curricular': { badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
    'Boarding/Lodging': { badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    'Others': { badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    'Social Inequality': { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    'Gender Inequality': { badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
    'Amenities': { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    'Pay & Perks': { badge: 'bg-green-500/20 text-green-300 border-green-500/30' },
    'Service': { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    'Student Union': { badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
    'Hostel Channel': { badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    'Staff Channels': { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
  };

  const studentFlows = [
    { title: 'Academics', steps: ['CRC Chairperson', 'HOD', 'Vice-Principal', 'Principal'] },
    { title: 'Scholarships', steps: ['Asst. Registrar', 'Deputy Registrar', 'Vice-Principal', 'Principal'] },
    { title: 'Examinations', steps: ['OIC Academic', 'Vice-Principal', 'Principal'] },
    { title: 'Ragging', steps: ['Deputy Wardens', 'OIH / HOD', 'Vice-Principal', 'Principal'] },
    { title: 'Extra-Curricular', steps: ['Concerned Officer', 'Vice-Principal', 'Principal'] },
    { title: 'Boarding/Lodging', steps: ['Deputy Wardens', 'OIC Hostel', 'Vice-Principal', 'Principal'] },
    { title: 'Others', steps: ['General Grievance Officer', 'Vice-Principal', 'Principal'] },
  ];

  const staffFlows = [
    { title: 'Social Inequality', steps: ['Coordinator SC/ST Cell', 'Principal'] },
    { title: 'Gender Inequality', steps: ['Coordinator Women Cell', 'Principal'] },
    { title: 'Amenities', steps: ['Head of Department', 'Principal'] },
    { title: 'Pay & Perks', steps: ['Principal'] },
    { title: 'Service', steps: ['Principal'] },
  ];

  const alternateFlows = [
    { title: 'Student Union', steps: ['Class / Girls Rep', 'Student Union Coord', 'Vice-Principal', 'Principal'] },
    { title: 'Hostel Channel', steps: ['Hostel Rep', 'OIC Hostel', 'Principal'] },
    { title: 'Staff Channels', steps: ['Teachers/Staff Association', 'Principal'] },
  ];

  const getFlows = () => {
    switch (activeTab) {
      case 'staff': return staffFlows;
      case 'alternate': return alternateFlows;
      default: return studentFlows;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left - Branding & Dynamic Flowchart Panel */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-10"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #31104b 25%, #4c1d95 50%, #2e1065 75%, #0f172a 100%)'
        }}
      >
        {/* Animated background glowing spheres */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }}></div>
          <div className="absolute top-1/2 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }}></div>
          <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40 border border-white/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-white font-extrabold text-2xl tracking-tight drop-shadow-sm">GrievanceSys</span>
        </div>

        {/* Main Interactive Flowchart Card */}
        <div className="relative z-10 flex-1 flex flex-col justify-center my-4">
          <div className="mb-5">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1.5 leading-tight tracking-tight drop-shadow-md">
              Grievance Redressal Flow
            </h1>
            <p className="text-purple-200/80 text-xs sm:text-sm font-medium">
              Official escalation pathways & institutional redressal channels.
            </p>
          </div>

          <div className="bg-slate-900/75 backdrop-blur-xl rounded-2xl border border-white/15 p-5 shadow-2xl flex flex-col h-[540px]">
            {/* Tabs */}
            <div className="flex bg-slate-950/80 rounded-xl p-1 mb-4 border border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Flows Grid */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-3 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {getFlows().map((flow) => {
                    const catStyle = categoryColorMap[flow.title] || { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
                    return (
                      <div
                        key={flow.title}
                        className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/60 rounded-xl p-3.5 transition-all shadow-sm group"
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${catStyle.badge}`}>
                            {flow.title}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {flow.steps.map((step, sIndex) => {
                            const isFinal = sIndex === flow.steps.length - 1;
                            const isVP = step === 'Vice-Principal';
                            return (
                              <React.Fragment key={step}>
                                <span className={`px-2.5 py-1 rounded-lg text-[11px] transition-all duration-150 ${
                                  isFinal
                                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 font-bold shadow-sm shadow-emerald-950/40'
                                    : isVP
                                    ? 'bg-purple-500/25 text-purple-200 border border-purple-400/35 font-semibold'
                                    : 'bg-slate-900/90 text-slate-200 border border-slate-700/80 font-medium'
                                }`}>
                                  {step}
                                </span>
                                {sIndex < flow.steps.length - 1 && (
                                  <svg className="w-3.5 h-3.5 text-purple-400/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                  </svg>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center text-purple-200/50 text-xs">
          <p>© 2026 College Grievance Management System. All rights reserved.</p>
        </div>
      </motion.div>

      {/* Right - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
