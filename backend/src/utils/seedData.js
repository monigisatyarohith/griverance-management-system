const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { sequelize, User, Complaint, GrievanceUpdate, Setting } = require('../models');

const seedData = async () => {
  try {
    // Sync database (force: true drops and recreates all tables)
    await sequelize.sync({ force: true });
    console.log('Database synced (tables recreated)');

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@college.edu',
      password: 'admin123',
      role: 'admin',
      isVerified: true
    });

    const hod = await User.create({
      name: 'Dr. Sharma',
      email: 'hod@college.edu',
      password: 'hod123',
      role: 'hod',
      department: 'CSE',
      isVerified: true
    });

    const faculty = await User.create({
      name: 'Prof. Kumar',
      email: 'faculty@college.edu',
      password: 'faculty123',
      role: 'faculty',
      department: 'CSE',
      isVerified: true
    });

    const student = await User.create({
      name: 'Rahul Student',
      email: 'student@college.edu',
      password: 'student123',
      role: 'student',
      department: 'CSE',
      isVerified: true
    });

    const vp = await User.create({
      name: 'Vice Principal Office',
      email: 'msatyarohith@gmail.com',
      password: 'vp123456',
      role: 'vice_principal',
      isVerified: true
    });

    const principal = await User.create({
      name: 'Principal Office',
      email: 'principal@college.edu',
      password: 'principal123456',
      role: 'principal',
      isVerified: true
    });

    // Seed Coordinators
    const academicCoord = await User.create({
      name: 'Academic Coordinator',
      email: 'academic_coord@college.edu',
      password: 'coordinator123',
      role: 'coordinator',
      coordinatorType: 'academic',
      isVerified: true
    });

    const hostelCoord = await User.create({
      name: 'Hostel Coordinator',
      email: 'moningisatyarohith@gmail.com',
      password: 'coordinator123',
      role: 'coordinator',
      coordinatorType: 'hostel',
      isVerified: true
    });

    const transportCoord = await User.create({
      name: 'Transport Coordinator',
      email: 'transport_coord@college.edu',
      password: 'coordinator123',
      role: 'coordinator',
      coordinatorType: 'transport',
      isVerified: true
    });

    const examCoord = await User.create({
      name: 'Examination Coordinator',
      email: 'exam_coord@college.edu',
      password: 'coordinator123',
      role: 'coordinator',
      coordinatorType: 'examination',
      isVerified: true
    });

    const placementCoord = await User.create({
      name: 'Placement Coordinator',
      email: 'placement_coord@college.edu',
      password: 'coordinator123',
      role: 'coordinator',
      coordinatorType: 'placement',
      isVerified: true
    });

    const maintenanceCoord = await User.create({
      name: 'Maintenance Coordinator',
      email: 'maintenance_coord@college.edu',
      password: 'coordinator123',
      role: 'coordinator',
      coordinatorType: 'maintenance',
      isVerified: true
    });

    const generalCoord = await User.create({
      name: 'General Grievance Officer',
      email: 'general_coord@college.edu',
      password: 'coordinator123',
      role: 'coordinator',
      coordinatorType: 'general',
      isVerified: true
    });

    // Create sample complaints matching the new workflow
    const c1 = await Complaint.create({
      title: 'Syllabus not covered in Data Structures',
      description: 'The professor has only covered 50% of the syllabus and the exam is next month. We are very worried about completing the course on time.',
      complainantType: 'student',
      category: 'academics',
      priority: 'high',
      status: 'Pending Vice Principal Approval',
      studentId: student.id,
      timeline: [{ status: 'Pending Vice Principal Approval', message: 'Complaint submitted and pending VP approval', changedBy: student.id, timestamp: new Date() }]
    });

    const c2 = await Complaint.create({
      title: 'Exam marks not updated on portal',
      description: 'The midterm examination marks for Data Structures have not been updated on the student portal even after 2 weeks.',
      complainantType: 'student',
      category: 'examinations',
      priority: 'medium',
      status: 'Approved by Vice Principal',
      studentId: student.id,
      assignedToId: examCoord.id,
      timeline: [
        { status: 'Pending Vice Principal Approval', message: 'Complaint submitted', changedBy: student.id, timestamp: new Date(Date.now() - 86400000) },
        { status: 'Approved by Vice Principal', message: 'Approved by Vice Principal, routed to Exam Coordinator', changedBy: vp.id, timestamp: new Date() }
      ]
    });

    const c3 = await Complaint.create({
      title: 'Hostel water supply issue',
      description: 'There has been no water supply in Block C of the boys hostel for the last 3 days. Please resolve urgently.',
      complainantType: 'student',
      category: 'boarding_lodging',
      priority: 'urgent',
      status: 'Investigation Started',
      studentId: student.id,
      assignedToId: hostelCoord.id,
      estimatedResolutionDate: new Date(Date.now() + 86400000 * 3),
      timeline: [
        { status: 'Pending Vice Principal Approval', message: 'Complaint submitted', changedBy: student.id, timestamp: new Date(Date.now() - 172800000) },
        { status: 'Approved by Vice Principal', message: 'Approved by Vice Principal, routed to Hostel Coordinator', changedBy: vp.id, timestamp: new Date(Date.now() - 86400000) },
        { status: 'Investigation Started', message: 'Under investigation. Plumber team is scheduled to inspect the pipeline tomorrow morning.', changedBy: hostelCoord.id, timestamp: new Date() }
      ]
    });

    // Create GrievanceUpdate entries for c3
    await GrievanceUpdate.create({
      grievance_id: c3.id,
      coordinator_id: hostelCoord.id,
      status: 'Investigation Started',
      remarks: 'Under investigation. Plumber team is scheduled to inspect the pipeline tomorrow morning.',
      estimatedResolutionDate: new Date(Date.now() + 86400000 * 3)
    });

    const c4 = await Complaint.create({
      title: 'Ragging incident in hostel',
      description: 'Senior students in Block A are regularly harassing first-year students during night hours. This needs immediate attention.',
      complainantType: 'student',
      category: 'ragging',
      priority: 'urgent',
      status: 'Pending Vice Principal Approval',
      studentId: student.id,
      timeline: [{ status: 'Pending Vice Principal Approval', message: 'Complaint submitted', changedBy: student.id, timestamp: new Date() }]
    });

    const c5 = await Complaint.create({
      title: 'Scholarship amount not credited',
      description: 'My SC/ST scholarship amount for the current semester has not been credited to my account despite submitting all required documents two months ago.',
      complainantType: 'student',
      category: 'scholarships',
      priority: 'high',
      status: 'Rejected by Vice Principal',
      studentId: student.id,
      timeline: [
        { status: 'Pending Vice Principal Approval', message: 'Complaint submitted', changedBy: student.id, timestamp: new Date(Date.now() - 604800000) },
        { status: 'Rejected by Vice Principal', message: 'Rejected: You do not meet the attendance criteria required for this scholarship.', changedBy: vp.id, timestamp: new Date() }
      ]
    });

    const c6 = await Complaint.create({
      title: 'Lab equipment not maintained',
      description: 'The computers in the CSE lab have outdated software and several machines are not working. This is affecting our practical sessions.',
      complainantType: 'staff',
      category: 'amenities',
      priority: 'medium',
      status: 'Resolved',
      studentId: faculty.id,
      assignedToId: maintenanceCoord.id,
      resolution: { text: 'New equipment ordered and software updated', resolvedBy: maintenanceCoord.id, resolvedAt: new Date() },
      timeline: [
        { status: 'Pending Vice Principal Approval', message: 'Complaint submitted', changedBy: faculty.id, timestamp: new Date(Date.now() - 604800000) },
        { status: 'Approved by Vice Principal', message: 'Approved by VP, assigned to maintenance coordinator', changedBy: vp.id, timestamp: new Date(Date.now() - 302400000) },
        { status: 'Resolved', message: 'New equipment ordered and software updated', changedBy: maintenanceCoord.id, timestamp: new Date() }
      ]
    });

    await GrievanceUpdate.create({
      grievance_id: c6.id,
      coordinator_id: maintenanceCoord.id,
      status: 'Resolved',
      remarks: 'New equipment ordered and software updated'
    });

    // Seed dynamic configurations in settings
    await Setting.create({ key: 'vice_principal_email', value: 'msatyarohith@gmail.com' });
    await Setting.create({ key: 'principal_email', value: 'principal@college.edu' });
    await Setting.create({ key: 'coordinator_hostel_email', value: 'moningisatyarohith@gmail.com' });
    await Setting.create({ key: 'coordinator_academic_email', value: 'academic_coord@college.edu' });
    await Setting.create({ key: 'coordinator_transport_email', value: 'transport_coord@college.edu' });
    await Setting.create({ key: 'coordinator_examination_email', value: 'exam_coord@college.edu' });
    await Setting.create({ key: 'coordinator_placement_email', value: 'placement_coord@college.edu' });
    await Setting.create({ key: 'coordinator_maintenance_email', value: 'maintenance_coord@college.edu' });
    await Setting.create({ key: 'coordinator_general_email', value: 'general_coord@college.edu' });

    const dbType = process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite';
    console.log(`\n✅ Seed data created successfully! (${dbType})`);
    console.log('\n📋 Test Credentials:');
    console.log('   Admin:          admin@college.edu / admin123');
    console.log('   Principal:      principal@college.edu / principal123456');
    console.log('   Vice Principal: msatyarohith@gmail.com / vp123456');
    console.log('   Student:        student@college.edu / student123');
    console.log('   Academic Coord: academic_coord@college.edu / coordinator123');
    console.log('   Hostel Coord:   moningisatyarohith@gmail.com / coordinator123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedData();
