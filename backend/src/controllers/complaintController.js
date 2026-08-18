const { Op, fn, col, literal } = require('sequelize');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const GrievanceUpdate = require('../models/GrievanceUpdate');
const Setting = require('../models/Setting');
const sendEmail = require('../utils/sendEmail');
const { aiCategorizeComplaint } = require('../services/aiService');
const { FRONTEND_URL } = require('../config/constants');

// Helper: map category to coordinatorType
const getCoordinatorType = (category) => {
  switch (category) {
    case 'academics':
      return 'academic';
    case 'boarding_lodging':
      return 'hostel';
    case 'transport':
      return 'transport';
    case 'examinations':
      return 'examination';
    case 'placement':
      return 'placement';
    case 'amenities':
    case 'infrastructure':
      return 'maintenance';
    default:
      return 'general';
  }
};

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private/Student
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, complainantType } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one attachment is required' });
    }

    const attachmentPaths = req.files.map(file => `uploads/${file.filename}`);

    // AI categorization if category not provided
    let finalCategory = category;
    if (!finalCategory && process.env.OPENAI_API_KEY) {
      finalCategory = await aiCategorizeComplaint(description);
    }

    const complaint = await Complaint.create({
      title,
      description,
      complainantType: complainantType || 'student',
      category: finalCategory || 'other',
      priority: priority || 'medium',
      studentId: req.user.id,
      status: 'Pending Vice Principal Approval',
      attachments: attachmentPaths,
      timeline: [{
        status: 'Pending Vice Principal Approval',
        message: 'Grievance submitted and pending Vice Principal approval',
        changedBy: req.user.id,
        timestamp: new Date()
      }]
    });

    // Fetch Vice Principal Email dynamically from settings or database
    const vpSetting = await Setting.findOne({ where: { key: 'vice_principal_email' } });
    let vpEmail = vpSetting ? vpSetting.value : null;
    if (!vpEmail) {
      const vp = await User.findOne({ where: { role: 'vice_principal' } });
      vpEmail = vp ? vp.email : 'viceprincipal@college.edu';
    }

    const actionUrl = `${FRONTEND_URL}/complaint/${complaint.id}`;
    const submissionDate = new Date().toLocaleString();

    // Send VP and Student notification emails concurrently
    await Promise.all([
      sendEmail({
        email: vpEmail,
        subject: 'New Grievance Submitted - Approval Required',
        message: `New Grievance Submitted - Approval Required\n\n` +
                 `Grievance ID: #${complaint.id}\n` +
                 `Student Name: ${req.user.name}\n` +
                 `Roll Number / Student ID: ${req.user.id}\n` +
                 `Department: ${req.user.department || 'N/A'}\n` +
                 `Category: ${complaint.category}\n` +
                 `Description: ${complaint.description}\n` +
                 `Submission Date: ${submissionDate}\n` +
                 `Direct link: ${actionUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h2 style="color: #7C3AED; margin-bottom: 5px;">College Grievance System</h2>
            <p style="color: #4B5563; font-size: 14px; margin-top: 0;">New Grievance Pending Vice Principal Approval</p>
            <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #F3F4F6;">
              <strong>Grievance ID:</strong> #${complaint.id}<br/>
              <strong>Student Name:</strong> ${req.user.name}<br/>
              <strong>Roll Number / ID:</strong> ${req.user.id}<br/>
              <strong>Department:</strong> ${req.user.department || 'N/A'}<br/>
              <strong>Category:</strong> ${complaint.category}<br/>
              <strong>Submission Date:</strong> ${submissionDate}<br/>
              <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 12px 0;"/>
              <strong>Description:</strong><br/>
              <p style="white-space: pre-wrap; margin-top: 5px; color: #374151;">${complaint.description}</p>
            </div>
            <div style="margin: 25px 0;">
              <a href="${actionUrl}" style="background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review Grievance</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-top: 30px;"/>
            <p style="color: #9CA3AF; font-size: 11px; margin-bottom: 0;">This is an automated notification from the College Grievance Management System.</p>
          </div>
        `
      }),
      sendEmail({
        email: req.user.email,
        subject: `Grievance Submitted Successfully: #${complaint.id}`,
        message: `Your grievance has been submitted and is currently pending Vice Principal approval.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h2 style="color: #7C3AED;">Grievance Submitted Successfully</h2>
            <p>Dear ${req.user.name},</p>
            <p>Your grievance <strong>#${complaint.id}</strong> ("${complaint.title}") has been received and sent to the Vice Principal for approval.</p>
            <p>You can track the progress of your grievance directly on your dashboard.</p>
            <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-top: 30px;"/>
            <p style="color: #9CA3AF; font-size: 11px;">College Grievance Management System</p>
          </div>
        `
      })
    ]);

    // Create audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'complaint',
      resourceId: complaint.id,
      details: { title, category },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Reload with associations
    const result = await Complaint.findByPk(complaint.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      data: formatComplaint(result)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all complaints (with filters)
// @route   GET /api/complaints
// @access  Private
exports.getComplaints = async (req, res) => {
  try {
    let where = {};
    
    // Role-based filtering
    if (req.user.role === 'student') {
      where.studentId = req.user.id;
    } else if (req.user.role === 'coordinator') {
      where.assignedToId = req.user.id;
    } else if (req.user.role === 'faculty') {
      where.assignedToId = req.user.id;
    } else if (req.user.role === 'hod') {
      const faculty = await User.findAll({
        where: { department: req.user.department, role: 'faculty' },
        attributes: ['id']
      });
      const facultyIds = faculty.map(f => f.id);
      where.assignedToId = { [Op.in]: facultyIds };
    }

    // Apply filters
    if (req.query.status) where.status = req.query.status;
    if (req.query.category) where.category = req.query.category;
    if (req.query.priority) where.priority = req.query.priority;
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      where.createdAt = {};
      if (req.query.startDate) where.createdAt[Op.gte] = new Date(req.query.startDate);
      if (req.query.endDate) where.createdAt[Op.lte] = new Date(req.query.endDate);
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count: total, rows: complaints } = await Complaint.findAndCountAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    res.json({
      success: true,
      data: complaints.map(formatComplaint),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve Complaint (Vice Principal)
// @route   PUT /api/complaints/:id/approve
// @access  Private/Vice Principal
exports.approveComplaint = async (req, res) => {
  try {
    const { remarks, priority } = req.body;
    const complaint = await Complaint.findByPk(req.params.id, {
      include: [{ model: User, as: 'student' }]
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Identify coordinator category
    const coordType = getCoordinatorType(complaint.category);

    // Look up coordinator email from admin settings
    const coordSetting = await Setting.findOne({ where: { key: `coordinator_${coordType}_email` } });
    let coordEmail = coordSetting ? coordSetting.value : null;

    // Load matching coordinator from User database
    const dbCoordinator = await User.findOne({
      where: {
        role: 'coordinator',
        coordinatorType: coordType
      }
    });

    // Default to general coordinator if not found
    let finalCoordinator = dbCoordinator;
    if (!finalCoordinator) {
      finalCoordinator = await User.findOne({
        where: {
          role: 'coordinator',
          coordinatorType: 'general'
        }
      });
    }

    // Try to find a user matching the settings email, otherwise fallback
    let targetCoordinatorUser = null;
    if (coordEmail) {
      targetCoordinatorUser = await User.findOne({ where: { email: coordEmail } });
    }
    if (!targetCoordinatorUser) {
      targetCoordinatorUser = finalCoordinator;
    }

    const finalTargetEmail = coordEmail || (targetCoordinatorUser ? targetCoordinatorUser.email : 'coordinator@college.edu');

    complaint.status = 'Approved by Vice Principal';
    if (priority) {
      complaint.priority = priority;
    }
    if (targetCoordinatorUser) {
      complaint.assignedToId = targetCoordinatorUser.id;
    }

    const actorRole = req.user.role === 'principal' ? 'Principal'
      : req.user.role === 'vice_principal' ? 'Vice Principal'
      : req.user.role === 'admin' ? 'Admin'
      : 'Vice Principal';

    const timeline = complaint.timeline || [];
    timeline.push({
      status: 'Approved by Vice Principal',
      message: remarks || `Grievance approved by ${actorRole} and assigned to coordinator`,
      changedBy: req.user.id,
      timestamp: new Date()
    });
    complaint.timeline = timeline;

    await complaint.save();

    // 3. Send Email to the Assigned Coordinator
    if (targetCoordinatorUser) {
      await Notification.create({
        userId: targetCoordinatorUser.id,
        title: 'New Complaint Assigned',
        message: `New grievance assigned: #${complaint.id} - ${complaint.title}`,
        type: 'assignment',
        relatedComplaintId: complaint.id
      });
    }

    // Send coordinator assignment and student approval notification emails concurrently
    await Promise.all([
      sendEmail({
        email: finalTargetEmail,
        subject: `New Grievance Assigned - Action Required: #${complaint.id}`,
        message: `You have been assigned a new grievance to investigate.\n\n` +
                 `Grievance ID: #${complaint.id}\n` +
                 `Category: ${complaint.category}\n` +
                 `Title: ${complaint.title}\n` +
                 `Description: ${complaint.description}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h2 style="color: #7C3AED;">New Grievance Assigned - Action Required</h2>
            <p>You have been assigned a new grievance to coordinate and resolve.</p>
            <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <strong>Grievance ID:</strong> #${complaint.id}<br/>
              <strong>Student Name:</strong> ${complaint.student ? complaint.student.name : 'N/A'}<br/>
              <strong>Category:</strong> ${complaint.category}<br/>
              <strong>Title:</strong> ${complaint.title}<br/>
              <strong>Description:</strong><br/>
              <p style="white-space: pre-wrap; margin-top: 5px;">${complaint.description}</p>
            </div>
            <p>Please log in to your coordinator dashboard to start investigating.</p>
          </div>
        `
      }),
      sendEmail({
        email: complaint.student.email,
        subject: `Grievance Approved by Vice Principal: #${complaint.id}`,
        message: `Your grievance has been approved by the Vice Principal and assigned to a coordinator.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h2 style="color: #10B981;">Grievance Approved</h2>
            <p>Dear ${complaint.student.name},</p>
            <p>Your grievance <strong>#${complaint.id}</strong> has been approved by the Vice Principal.</p>
            <p><strong>Remarks:</strong> ${remarks || 'None'}</p>
            <p>It has been routed and assigned to our <strong>${coordType} coordinator</strong> for resolution.</p>
            <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-top: 30px;"/>
            <p style="color: #9CA3AF; font-size: 11px;">College Grievance Management System</p>
          </div>
        `
      })
    ]);

    // In-app notification to student
    await Notification.create({
      userId: complaint.studentId,
      title: 'Grievance Approved',
      message: `Your grievance #${complaint.id} has been approved by the Vice Principal`,
      type: 'complaint_update',
      relatedComplaintId: complaint.id
    });

    // In-app notification to Principal users
    const principalUsers = await User.findAll({ where: { role: 'principal' } });
    for (const pUser of principalUsers) {
      await Notification.create({
        userId: pUser.id,
        title: 'Grievance Approved by VP',
        message: `Vice Principal approved grievance #${complaint.id} ("${complaint.title}")`,
        type: 'complaint_update',
        relatedComplaintId: complaint.id
      });
    }

    // Email notification to Principal
    const principalSetting = await Setting.findOne({ where: { key: 'principal_email' } });
    const principalEmail = principalSetting ? principalSetting.value : (principalUsers[0]?.email || 'principal@college.edu');
    if (principalEmail) {
      sendEmail({
        email: principalEmail,
        subject: `[Executive Notice] Grievance Approved by Vice Principal: #${complaint.id}`,
        message: `Grievance #${complaint.id} has been approved by the Vice Principal and routed to coordinator. Remarks: ${remarks || 'None'}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h2 style="color: #7C3AED;">Executive Notice - Grievance Approved by VP</h2>
            <p>Vice Principal has reviewed and <strong>Approved</strong> grievance <strong>#${complaint.id}</strong> ("${complaint.title}").</p>
            <p><strong>Remarks:</strong> ${remarks || 'None'}</p>
            <p><strong>Priority:</strong> ${priority || complaint.priority}</p>
            <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-top: 20px;"/>
            <p style="color: #9CA3AF; font-size: 11px;">College Grievance Management System</p>
          </div>
        `
      }).catch(err => console.error('Error sending email to principal:', err));
    }

    // Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'assign',
      resource: 'complaint',
      resourceId: complaint.id,
      details: { remarks },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    const reloaded = await Complaint.findByPk(complaint.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({ success: true, data: formatComplaint(reloaded) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject Complaint (Vice Principal)
// @route   PUT /api/complaints/:id/reject
// @access  Private/Vice Principal
exports.rejectComplaint = async (req, res) => {
  try {
    const { remarks } = req.body;
    const complaint = await Complaint.findByPk(req.params.id, {
      include: [{ model: User, as: 'student' }]
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = 'Rejected by Vice Principal';

    const actorRole = req.user.role === 'principal' ? 'Principal'
      : req.user.role === 'vice_principal' ? 'Vice Principal'
      : req.user.role === 'admin' ? 'Admin'
      : 'Vice Principal';

    const timeline = complaint.timeline || [];
    timeline.push({
      status: 'Rejected by Vice Principal',
      message: remarks || `Grievance rejected by ${actorRole}`,
      changedBy: req.user.id,
      timestamp: new Date()
    });
    complaint.timeline = timeline;

    await complaint.save();

    // 4. Rejection Notification Email to Student
    await sendEmail({
      email: complaint.student.email,
      subject: `Grievance Rejected by Vice Principal - Resolution Update: #${complaint.id}`,
      message: `Your grievance has been rejected by the Vice Principal. Remarks: ${remarks}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; border: 1px solid #E5E7EB; border-radius: 8px;">
          <h2 style="color: #EF4444;">Grievance Rejected</h2>
          <p>Dear ${complaint.student.name},</p>
          <p>Your grievance <strong>#${complaint.id}</strong> ("${complaint.title}") has been rejected by the Vice Principal and is now closed.</p>
          <div style="background-color: #FEF2F2; padding: 15px; border-radius: 8px; border: 1px solid #FEE2E2; margin: 15px 0;">
            <strong>Remarks / Reason:</strong><br/>
            <p style="margin-top: 5px; color: #991B1B;">${remarks || 'No remarks provided'}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-top: 30px;"/>
          <p style="color: #9CA3AF; font-size: 11px;">College Grievance Management System</p>
        </div>
      `
    });

    // In-app notification to student
    await Notification.create({
      userId: complaint.studentId,
      title: 'Grievance Rejected',
      message: `Your grievance #${complaint.id} has been rejected by the Vice Principal`,
      type: 'complaint_update',
      relatedComplaintId: complaint.id
    });

    // In-app notification to Principal users
    const principalUsersRej = await User.findAll({ where: { role: 'principal' } });
    for (const pUser of principalUsersRej) {
      await Notification.create({
        userId: pUser.id,
        title: 'Grievance Rejected by VP',
        message: `Vice Principal rejected grievance #${complaint.id} ("${complaint.title}")`,
        type: 'complaint_update',
        relatedComplaintId: complaint.id
      });
    }

    // Email notification to Principal
    const principalSettingRej = await Setting.findOne({ where: { key: 'principal_email' } });
    const principalEmailRej = principalSettingRej ? principalSettingRej.value : (principalUsersRej[0]?.email || 'principal@college.edu');
    if (principalEmailRej) {
      sendEmail({
        email: principalEmailRej,
        subject: `[Executive Notice] Grievance Rejected by Vice Principal: #${complaint.id}`,
        message: `Grievance #${complaint.id} has been rejected by the Vice Principal. Remarks: ${remarks || 'None'}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h2 style="color: #EF4444;">Executive Notice - Grievance Rejected by VP</h2>
            <p>Vice Principal has reviewed and <strong>Rejected</strong> grievance <strong>#${complaint.id}</strong> ("${complaint.title}").</p>
            <p><strong>Remarks / Reason:</strong> ${remarks || 'None'}</p>
            <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-top: 20px;"/>
            <p style="color: #9CA3AF; font-size: 11px;">College Grievance Management System</p>
          </div>
        `
      }).catch(err => console.error('Error sending email to principal:', err));
    }

    // Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'reject',
      resource: 'complaint',
      resourceId: complaint.id,
      details: { remarks },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    const reloaded = await Complaint.findByPk(complaint.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({ success: true, data: formatComplaint(reloaded) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add Grievance Update (Coordinator)
// @route   POST /api/complaints/:id/updates
// @access  Private/Coordinator
exports.addGrievanceUpdate = async (req, res) => {
  try {
    const { status, remarks, estimatedResolutionDate } = req.body;
    const complaint = await Complaint.findByPk(req.params.id, {
      include: [{ model: User, as: 'student' }]
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Verify it is assigned to this coordinator
    if (complaint.assignedToId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this complaint' });
    }

    let attachmentPath = null;
    if (req.files && req.files.length > 0) {
      attachmentPath = `uploads/${req.files[0].filename}`;
    }

    // Create GrievanceUpdate history
    const update = await GrievanceUpdate.create({
      grievance_id: complaint.id,
      coordinator_id: req.user.id,
      status,
      remarks,
      attachment_path: attachmentPath,
      estimatedResolutionDate: estimatedResolutionDate ? new Date(estimatedResolutionDate) : null
    });

    // Update Complaint Main fields
    complaint.status = status;
    if (estimatedResolutionDate) {
      complaint.estimatedResolutionDate = new Date(estimatedResolutionDate);
    }

    const isResolvedOrClosed = status === 'Resolved' || status === 'Closed';

    if (isResolvedOrClosed) {
      complaint.resolution = {
        text: remarks,
        resolvedBy: req.user.id,
        resolvedAt: new Date()
      };
    }

    const timeline = complaint.timeline || [];
    timeline.push({
      status,
      message: remarks,
      changedBy: req.user.id,
      timestamp: new Date(),
      attachment: attachmentPath
    });
    complaint.timeline = timeline;

    await complaint.save();

    // 5. Send notifications to Student based on resolution state
    if (isResolvedOrClosed) {
      // Step 5: Final Resolution Notification Email
      await sendEmail({
        email: complaint.student.email,
        subject: `Grievance Resolved - Final Resolution Details: #${complaint.id}`,
        message: `Your grievance #${complaint.id} has been resolved.\n\n` +
                 `Coordinator Remarks: ${remarks}\n` +
                 `Resolution Status: ${status}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h2 style="color: #10B981; margin-top: 0;">Grievance Resolved Successfully</h2>
            <p>Dear ${complaint.student.name},</p>
            <p>Your grievance <strong>#${complaint.id}</strong> ("${complaint.title}") has been marked as <strong>${status}</strong> by the coordinator.</p>
            <div style="background-color: #F0FDF4; padding: 15px; border-radius: 8px; border: 1px solid #DCFCE7; margin: 15px 0;">
              <strong>Coordinator Remarks / Resolution Details:</strong><br/>
              <p style="margin-top: 5px; color: #166534;">${remarks || 'No remarks provided'}</p>
            </div>
            <p>Please log in to your dashboard to view the full investigation log or download attachments.</p>
            <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-top: 30px;"/>
            <p style="color: #9CA3AF; font-size: 11px;">College Grievance Management System</p>
          </div>
        `
      });
    } else {
      // Step 4: Status Update Notification Email
      await sendEmail({
        email: complaint.student.email,
        subject: `Grievance #${complaint.id} Stage Updated: ${status}`,
        message: `Your grievance #${complaint.id} has been updated. Current Stage: ${status}. Remarks: ${remarks}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h3 style="color: #7C3AED; margin-top: 0;">Grievance Update Notification</h3>
            <p>Dear ${complaint.student.name},</p>
            <p>Your grievance <strong>#${complaint.id}</strong> has been updated by the coordinator.</p>
            <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #7C3AED;">
              <strong>Current Stage:</strong> ${status}<br/>
              <strong>Coordinator Remarks:</strong> ${remarks || 'None'}<br/>
              <strong>Estimated Resolution Date:</strong> ${estimatedResolutionDate ? new Date(estimatedResolutionDate).toLocaleDateString() : 'N/A'}<br/>
              <strong>Updated Date & Time:</strong> ${new Date().toLocaleString()}
            </div>
            <p>Please log in to the portal to view full details or download attachments.</p>
            <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-top: 30px;"/>
            <p style="color: #9CA3AF; font-size: 11px;">College Grievance Management System</p>
          </div>
        `
      });
    }

    // Step 4: In-app Notification to Student
    await Notification.create({
      userId: complaint.studentId,
      title: isResolvedOrClosed ? 'Grievance Resolved' : 'Grievance Update',
      message: `Your grievance #${complaint.id} has been updated to "${status}"`,
      type: 'complaint_update',
      relatedComplaintId: complaint.id
    });

    // Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'complaint',
      resourceId: complaint.id,
      details: { status, remarks, attachmentPath },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    const reloaded = await Complaint.findByPk(complaint.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({ success: true, update, data: formatComplaint(reloaded) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all Grievance Updates
// @route   GET /api/complaints/:id/updates
// @access  Private
exports.getGrievanceUpdates = async (req, res) => {
  try {
    const updates = await GrievanceUpdate.findAll({
      where: { grievance_id: req.params.id },
      include: [{ model: User, as: 'coordinator', attributes: ['id', 'name', 'role'] }],
      order: [['created_at', 'ASC']]
    });

    res.json({ success: true, data: updates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update complaint status (deprecated, backward compatible)
// @route   PUT /api/complaints/:id/status
// @access  Private
exports.updateStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const complaint = await Complaint.findByPk(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = status;
    const timeline = complaint.timeline || [];
    timeline.push({
      status,
      message: remarks || `Status updated to ${status}`,
      changedBy: req.user.id,
      timestamp: new Date()
    });
    complaint.timeline = timeline;

    if (status === 'Resolved' || status === 'resolved') {
      complaint.resolution = {
        text: remarks,
        resolvedBy: req.user.id,
        resolvedAt: new Date()
      };
    }

    await complaint.save();

    res.json({ success: true, data: formatComplaint(complaint) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get complaint statistics
// @route   GET /api/complaints/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    let where = {};
    
    if (req.user.role === 'student') {
      where.studentId = req.user.id;
    } else if (req.user.role === 'coordinator') {
      where.assignedToId = req.user.id;
    } else if (req.user.role === 'faculty') {
      where.assignedToId = req.user.id;
    } else if (req.user.role === 'hod') {
      const faculty = await User.findAll({
        where: { department: req.user.department, role: 'faculty' },
        attributes: ['id']
      });
      where.assignedToId = { [Op.in]: faculty.map(f => f.id) };
    }

    const total = await Complaint.count({ where });
    const pendingVP = await Complaint.count({ where: { ...where, status: 'Pending Vice Principal Approval' } });
    const approvedVP = await Complaint.count({ where: { ...where, status: 'Approved by Vice Principal' } });
    const rejectedVP = await Complaint.count({ where: { ...where, status: 'Rejected by Vice Principal' } });
    const underReview = await Complaint.count({ where: { ...where, status: 'Under Review' } });
    const investigationStarted = await Complaint.count({ where: { ...where, status: 'Investigation Started' } });
    const inProgress = await Complaint.count({ where: { ...where, status: 'In Progress' } });
    const awaitingInfo = await Complaint.count({ where: { ...where, status: 'Awaiting Information' } });
    const escalated = await Complaint.count({ where: { ...where, status: 'Escalated' } });
    const resolved = await Complaint.count({ where: { ...where, status: 'Resolved' } });
    const closed = await Complaint.count({ where: { ...where, status: 'Closed' } });

    // Category-wise stats
    const categoryStats = await Complaint.findAll({
      where,
      attributes: [
        ['category', '_id'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    res.json({
      success: true,
      stats: {
        total,
        pendingVP,
        approvedVP,
        rejectedVP,
        underReview,
        investigationStarted,
        inProgress,
        awaitingInfo,
        escalated,
        resolved,
        closed
      },
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update complaint priority (Vice Principal / Admin)
// @route   PUT /api/complaints/:id/priority
// @access  Private/Vice Principal
exports.updatePriority = async (req, res) => {
  try {
    const { priority } = req.body;
    const complaint = await Complaint.findByPk(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const oldPriority = complaint.priority;
    complaint.priority = priority;

    const actorRole = req.user.role === 'principal' ? 'Principal'
      : req.user.role === 'vice_principal' ? 'Vice Principal'
      : req.user.role === 'admin' ? 'Admin'
      : (req.user.name || 'Staff');

    const timeline = complaint.timeline || [];
    timeline.push({
      status: complaint.status,
      message: `Priority updated from ${oldPriority} to ${priority} by ${actorRole}`,
      changedBy: req.user.id,
      timestamp: new Date()
    });
    complaint.timeline = timeline;

    await complaint.save();

    // Create audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'complaint',
      resourceId: complaint.id,
      details: { oldPriority, newPriority: priority },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    const reloaded = await Complaint.findByPk(complaint.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({
      success: true,
      data: formatComplaint(reloaded)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add Principal / Executive Remarks
// @route   POST /api/complaints/:id/remarks
// @access  Private (Principal, Vice Principal, Admin)
exports.addPrincipalRemarks = async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks) {
      return res.status(400).json({ message: 'Remarks are required' });
    }

    const complaint = await Complaint.findByPk(req.params.id, {
      include: [{ model: User, as: 'student' }]
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const roleName = req.user.role === 'principal' ? 'Principal' : (req.user.role === 'vice_principal' ? 'Vice Principal' : 'Admin');
    const timeline = complaint.timeline || [];
    timeline.push({
      status: complaint.status,
      message: `[${roleName} Executive Remarks] ${remarks}`,
      changedBy: req.user.id,
      timestamp: new Date()
    });
    complaint.timeline = timeline;

    await complaint.save();

    // Create Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'add_remarks',
      resource: 'complaint',
      resourceId: complaint.id,
      details: { remarks },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    const reloaded = await Complaint.findByPk(complaint.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({ success: true, data: formatComplaint(reloaded) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: format complaint for API response
function formatComplaint(complaint) {
  if (!complaint) return null;
  const json = complaint.toJSON();
  json._id = json.id;
  if (json.student) json.student._id = json.student.id;
  if (json.assignedTo) json.assignedTo._id = json.assignedTo.id;
  return json;
}
