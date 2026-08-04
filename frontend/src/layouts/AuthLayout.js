import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('student');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-violet-500 to-blue-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
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

  const studentFlows = [
    { title: 'Academics', steps: ['CRC Chairperson', 'HOD', 'Vice-Principal', 'Principal'] },
    { title: 'Scholarships', steps: ['Asst. Registrar', 'Deputy Registrar', 'Vice-Principal', 'Principal'] },
    { title: 'Examinations', steps: ['OIC Academic', 'Vice-Principal', 'Principal'] },
    { title: 'Ragging', steps: ['Deputy Wardens', 'OIH / HOD', 'Vice-Principal', 'Principal'] },
    { title: 'Extra-Curricular', steps: ['Concerned Officer', 'Vice-Principal', 'Principal'] },
    { title: 'Boarding/Lodging', steps: ['Deputy Wardens', 'OIC Hostel', 'Vice-Principal', 'Principal'] },
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
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 20%, #a855f7 40%, #c084fc 55%, #6366f1 75%, #4f46e5 100%)'
        }}
      >
        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute top-1/2 -right-16 w-64 h-64 bg-white/5 rounded-full animate-pulse" style={{ animationDuration: '6s' }}></div>
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">GrievanceSys</span>
        </div>

        {/* Main Interactive Flowchart Card */}
        <div className="relative z-10 flex-1 flex flex-col justify-center my-6">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
              Grievance Redressal Flow
            </h1>
            <p className="text-white/70 text-sm">
              Explore the official workflow pathways for quick grievance redressal.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-2xl flex flex-col h-[520px]">
            {/* Tabs */}
            <div className="flex bg-black/10 rounded-xl p-1 mb-5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === tab.id
                      ? 'bg-white text-purple-700 shadow-md'
                      : 'text-white/75 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Flows Grid */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {getFlows().map((flow, fIndex) => (
                    <div
                      key={flow.title}
                      className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 transition-all"
                    >
                      <div className="text-xs font-bold text-purple-200 mb-2 tracking-wide uppercase">
                        {flow.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {flow.steps.map((step, sIndex) => (
                          <React.Fragment key={step}>
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${sIndex === flow.steps.length - 1
                                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30 font-semibold'
                                : 'bg-white/10 text-white border border-white/5'
                              }`}>
                              {step}
                            </span>
                            {sIndex < flow.steps.length - 1 && (
                              <svg className="w-3.5 h-3.5 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center text-white/40 text-xs">
          <p>© 2026 College Grievance System. All rights reserved.</p>
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
