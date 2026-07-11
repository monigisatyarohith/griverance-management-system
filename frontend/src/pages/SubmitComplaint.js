import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

const studentCategories = [
  { value: 'academics', label: 'Academics', escalation: 'CRC Chairperson → Head of Department → Vice-Principal' },
  { value: 'scholarships', label: 'Scholarships', escalation: 'Assistant Registrar → Deputy Registrar → Vice-Principal' },
  { value: 'examinations', label: 'Examinations', escalation: 'Officer-in-Charge of Academic Section → Vice-Principal' },
  { value: 'ragging', label: 'Ragging', escalation: 'Deputy Wardens / CRCC → OIH/HOD → Vice-Principal' },
  { value: 'extra_curricular', label: 'Extra Curricular Activities', escalation: 'Concerned Officer → Vice-Principal' },
  { value: 'boarding_lodging', label: 'Boarding & Lodging', escalation: 'Deputy Wardens → Officer-in-Charge of Hostel → Vice-Principal' },
  { value: 'other', label: 'Other', escalation: 'Concerned Officer → Vice-Principal → Principal' },
];

const staffCategories = [
  { value: 'social_inequality', label: 'Social Inequality', escalation: 'Coordinator SC/ST Cell → Principal' },
  { value: 'gender_inequality', label: 'Gender Inequality', escalation: 'Coordinator Women Empowerment Cell → Principal' },
  { value: 'amenities', label: 'Amenities', escalation: 'Head of Department → Principal' },
  { value: 'pay_perks', label: 'Pay & Perks', escalation: 'Principal' },
  { value: 'service', label: 'Service', escalation: 'Principal' },
  { value: 'other', label: 'Other', escalation: 'Concerned Officer → Vice-Principal → Principal' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
];

const SubmitComplaint = () => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: { complainantType: 'student' }
  });
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const description = watch('description');
  const complainantType = watch('complainantType');
  const selectedCategory = watch('category');

  const categories = complainantType === 'staff' ? staffCategories : studentCategories;
  const selectedCategoryInfo = categories.find(c => c.value === selectedCategory);

  const onSubmit = async (data) => {
    if (files.length === 0) {
      setFileError('At least one attachment is required');
      toast.error('Please upload at least one attachment');
      return;
    }
    setFileError('');
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('complainantType', data.complainantType);
    formData.append('category', data.category);
    formData.append('priority', 'medium');

    files.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/complaints`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Complaint submitted successfully!');
      navigate(`/complaint/${response.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFileError('');
    }
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    if (updatedFiles.length === 0) {
      setFileError('At least one attachment is required');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Submit a Grievance</h1>
          <p className="text-white/90 mt-2 text-sm sm:text-base">Please provide detailed information about your grievance as per the college's Grievance Redressal System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-6">
          {/* Complainant Type */}
          <div>
            <label className="block text-sm font-medium mb-3">I am a *</label>
            <div className="flex gap-4">
              <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${complainantType === 'student'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}>
                <input
                  type="radio"
                  value="student"
                  {...register('complainantType', { required: true })}
                  onChange={(e) => {
                    setValue('complainantType', e.target.value);
                    setValue('category', '');
                  }}
                  className="hidden"
                />
                <span className="text-2xl block mb-1">🎓</span>
                <span className="font-semibold">Student</span>
              </label>
              <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${complainantType === 'staff'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}>
                <input
                  type="radio"
                  value="staff"
                  {...register('complainantType', { required: true })}
                  onChange={(e) => {
                    setValue('complainantType', e.target.value);
                    setValue('category', '');
                  }}
                  className="hidden"
                />
                <span className="text-2xl block mb-1">👨‍🏫</span>
                <span className="font-semibold">Staff</span>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Complaint Title *</label>
            <input
              {...register('title', { required: 'Title is required', minLength: 5 })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Brief title of your complaint"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              {...register('description', { required: 'Description is required', minLength: 20 })}
              rows={6}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Detailed description of your grievance..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            {description && description.length < 20 && (
              <p className="text-yellow-500 text-sm mt-1">Please provide at least 20 characters</p>
            )}
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
            </div>
          </div>

          {/* Escalation Path Info */}
          {selectedCategoryInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700"
            >
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">📋 Escalation Path</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">{selectedCategoryInfo.escalation}</p>
            </motion.div>
          )}

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium mb-2">Attachments *</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <CloudArrowUpIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400">PDF, Images, Documents (Max 5MB each)</p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <span className="text-sm">{file.name}</span>
                    <button type="button" onClick={() => removeFile(index)} className="text-red-500">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fileError && <p className="text-red-500 text-sm mt-1">{fileError}</p>}
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-6 py-2.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-semibold order-1 sm:order-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Grievance'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default SubmitComplaint;
