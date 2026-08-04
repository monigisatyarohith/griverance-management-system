import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';
import { UserIcon, EnvelopeIcon, LockClosedIcon, AcademicCapIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const departments = ['CSE', 'ECE', 'ME', 'CE', 'IT', 'Other'];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'student'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Email verification state
  const [emailStatus, setEmailStatus] = useState({ checking: false, exists: false, checked: false, message: '' });
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateEmailFormat = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleEmailBlur = async () => {
    const email = formData.email.trim();
    if (!email) {
      setEmailStatus({ checking: false, exists: false, checked: false, message: '' });
      return;
    }
    if (!validateEmailFormat(email)) {
      setEmailStatus({ checking: false, exists: false, checked: true, message: 'Please enter a valid email address (e.g., student@college.edu)' });
      return;
    }

    setEmailStatus({ checking: true, exists: false, checked: false, message: 'Checking email availability...' });
    try {
      const response = await authAPI.checkEmail(email);
      if (response.data.exists) {
        setEmailStatus({ checking: false, exists: true, checked: true, message: 'An account with this email address already exists.' });
      } else {
        setEmailStatus({ checking: false, exists: false, checked: true, message: 'Email is available' });
      }
    } catch (err) {
      setEmailStatus({ checking: false, exists: false, checked: false, message: '' });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    if (e.target.name === 'email') {
      setEmailStatus({ checking: false, exists: false, checked: false, message: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmailFormat(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (emailStatus.exists) {
      setError('An account with this email address already exists. Please sign in or use a different email.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Double check email availability before submitting if not checked yet
    if (!emailStatus.checked) {
      setIsLoading(true);
      try {
        const checkRes = await authAPI.checkEmail(formData.email.trim());
        if (checkRes.data.exists) {
          setEmailStatus({ checking: false, exists: true, checked: true, message: 'An account with this email address already exists.' });
          setError('An account with this email address already exists. Please sign in.');
          setIsLoading(false);
          return;
        }
      } catch (err) {
        // proceed to register
      }
    }
    
    setIsLoading(true);
    const success = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      department: formData.department,
      role: formData.role
    });
    if (success) {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Register to submit and track grievances</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
          <div className="relative">
            <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
          <div className="relative">
            <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              required
              className={`w-full pl-10 pr-10 py-3 border ${
                emailStatus.exists
                  ? 'border-red-500 focus:ring-red-500'
                  : emailStatus.checked && !emailStatus.exists && validateEmailFormat(formData.email)
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              } rounded-xl focus:ring-2 dark:bg-gray-700 dark:text-white transition-all`}
              placeholder="you@college.edu"
            />
            {emailStatus.checking && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            )}
            {!emailStatus.checking && emailStatus.checked && !emailStatus.exists && validateEmailFormat(formData.email) && (
              <CheckCircleIcon className="w-5 h-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
            )}
            {!emailStatus.checking && emailStatus.exists && (
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
          {emailStatus.message && (
            <p className={`text-xs mt-1 font-medium ${
              emailStatus.exists ? 'text-red-500' : emailStatus.checking ? 'text-blue-500' : 'text-green-600 dark:text-green-400'
            }`}>
              {emailStatus.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
            <div className="relative">
              <AcademicCapIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all appearance-none"
              >
                <option value="">Select</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <div className="relative">
            <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              placeholder="Min. 6 characters"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
          <div className="relative">
            <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              placeholder="Re-enter password"
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-blue-500/25"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Creating account...</span>
            </div>
          ) : 'Create Account'}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;
