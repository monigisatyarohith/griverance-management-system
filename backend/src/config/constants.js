module.exports = {
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://griverance-management-system.vercel.app/',
  ROLES: {
    STUDENT: 'student',
    FACULTY: 'faculty',
    HOD: 'hod',
    ADMIN: 'admin',
    VICE_PRINCIPAL: 'vice_principal',
    COORDINATOR: 'coordinator',
    PRINCIPAL: 'principal'
  },
  COMPLAINT_STATUS: {
    PENDING_VP: 'Pending Vice Principal Approval',
    APPROVED_VP: 'Approved by Vice Principal',
    REJECTED_VP: 'Rejected by Vice Principal',
    UNDER_REVIEW: 'Under Review',
    INVESTIGATION_STARTED: 'Investigation Started',
    IN_PROGRESS: 'In Progress',
    AWAITING_INFO: 'Awaiting Information',
    ESCALATED: 'Escalated',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
  },
  COMPLAINANT_TYPES: ['student', 'staff'],
  CATEGORIES: [
    // Student categories
    'academics',
    'scholarships',
    'examinations',
    'ragging',
    'extra_curricular',
    'boarding_lodging',
    'transport',
    'placement',
    // Staff categories
    'social_inequality',
    'gender_inequality',
    'amenities',
    'pay_perks',
    'service',
    // General
    'other'
  ],
  STUDENT_CATEGORIES: [
    'academics',
    'scholarships',
    'examinations',
    'ragging',
    'extra_curricular',
    'boarding_lodging',
    'transport',
    'placement',
    'other'
  ],
  STAFF_CATEGORIES: [
    'social_inequality',
    'gender_inequality',
    'amenities',
    'pay_perks',
    'service',
    'other'
  ],
  // Escalation hierarchy from the college's official Grievances Redressal System
  ESCALATION_HIERARCHY: {
    // Student grievance escalation paths
    academics: [
      'CRC Chairperson',
      'Head of Department',
      'Vice-Principal'
    ],
    scholarships: [
      'Assistant Registrar',
      'Deputy Registrar',
      'Vice-Principal'
    ],
    examinations: [
      'Officer-in-Charge of Academic Section',
      'Vice-Principal'
    ],
    ragging: [
      'Deputy Wardens / CRCC',
      'OIH / HOD',
      'Vice-Principal'
    ],
    extra_curricular: [
      'Concerned Officer',
      'Vice-Principal'
    ],
    boarding_lodging: [
      'Deputy Wardens',
      'Officer-in-Charge of Hostel',
      'Vice-Principal'
    ],
    transport: [
      'Transport Officer',
      'Vice-Principal'
    ],
    placement: [
      'Placement Officer',
      'Vice-Principal'
    ],
    // Staff grievance escalation paths
    social_inequality: [
      'Coordinator SC/ST Cell',
      'Principal'
    ],
    gender_inequality: [
      'Coordinator Women Empowerment Cell',
      'Principal'
    ],
    amenities: [
      'Head of Department',
      'Principal'
    ],
    pay_perks: [
      'Principal'
    ],
    service: [
      'Principal'
    ],
    other: [
      'Concerned Officer',
      'Vice-Principal',
      'Principal'
    ]
  },
  // Alternate channels for student problems
  ALTERNATE_CHANNELS: {
    student: [
      'Class Representative / Girls Representative → Student Union Coordinator → Vice-Principal',
      'Hostel Representative → Officer-in-Charge of Hostel'
    ],
    staff: [
      'Teachers Association',
      'Non-Teaching Staff Association',
      'Administrative Officers Association',
      'Pensioners Association'
    ]
  },
  PRIORITIES: ['low', 'medium', 'high', 'urgent'],
  ESCALATION_DAYS: {
    low: 14,
    medium: 7,
    high: 3,
    urgent: 1
  }
};
