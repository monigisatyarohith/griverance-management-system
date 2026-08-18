const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const AuditLog = require('../models/AuditLog');
const { FRONTEND_URL } = require('../config/constants');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'grievance_system_super_secret_key_2024', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Check if email exists
// @route   POST /api/auth/check-email
// @access  Public
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ exists: false, message: 'Email is required' });
    }
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (user) {
      return res.json({ exists: true, message: 'An account with this email already exists' });
    }
    return res.json({ exists: false, message: 'Email is available' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    // Check if user exists
    const userExists = await User.scope('withPassword').findOne({ where: { email: normalizedEmail } });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      department
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = verificationToken;
    user.resetPasswordExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send verification email
    const verificationUrl = `${FRONTEND_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Email Verification',
      message: `Please verify your email by clicking: ${verificationUrl}`
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user (include password using scope)
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create audit log
    await AuditLog.create({
      userId: user.id,
      action: 'login',
      resource: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get ? req.get('user-agent') : ''
    });

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        coordinatorType: user.coordinatorType,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Login error detail:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send reset email
    const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message: `You requested a password reset. Click here: ${resetUrl}`
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const { Op } = require('sequelize');

    const user = await User.scope('withPassword').findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpire: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = password;
    user.mustChangePassword = false;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update password for logged in user
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.scope('withPassword').findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    await AuditLog.create({
      userId: user.id,
      action: 'update',
      resource: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get ? req.get('user-agent') : ''
    });

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.json({
      success: true,
      message: 'Password updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all coordinators
// @route   GET /api/auth/coordinators
// @access  Private (Principal, VP, Admin)
exports.getCoordinators = async (req, res) => {
  try {
    const coordinators = await User.findAll({
      where: { role: 'coordinator' }
    });
    const data = coordinators.map(u => {
      const j = u.toJSON();
      j._id = j.id;
      return j;
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update a coordinator
// @route   POST /api/auth/coordinators
// @access  Private (Principal, VP, Admin)
exports.createOrUpdateCoordinator = async (req, res) => {
  try {
    const { name, email, coordinatorType, password } = req.body;

    if (!email || !coordinatorType || !name) {
      return res.status(400).json({ message: 'Name, email, and coordinator type are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let coordinator = await User.scope('withPassword').findOne({
      where: { email: normalizedEmail }
    });

    let isNew = false;
    if (!coordinator) {
      isNew = true;
      const initialPassword = password || 'coordinator123';
      coordinator = await User.create({
        name,
        email: normalizedEmail,
        password: initialPassword,
        role: 'coordinator',
        coordinatorType,
        isVerified: true,
        mustChangePassword: true
      });
    } else {
      coordinator.name = name;
      coordinator.role = 'coordinator';
      coordinator.coordinatorType = coordinatorType;
      if (password) {
        coordinator.password = password;
        coordinator.mustChangePassword = true;
      }
      await coordinator.save();
    }

    // Also update system setting for this coordinator type mapping
    const Setting = require('../models/Setting');
    const settingKey = `coordinator_${coordinatorType}_email`;
    const [setting] = await Setting.findOrCreate({ where: { key: settingKey }, defaults: { value: normalizedEmail } });
    setting.value = normalizedEmail;
    await setting.save();

    await AuditLog.create({
      userId: req.user.id,
      action: isNew ? 'create' : 'assign',
      resource: 'user',
      resourceId: coordinator.id,
      ipAddress: req.ip,
      userAgent: req.get ? req.get('user-agent') : ''
    });

    const json = coordinator.toJSON();
    delete json.password;
    json._id = json.id;

    res.json({
      success: true,
      message: isNew ? 'Coordinator created successfully.' : 'Coordinator updated successfully.',
      data: json
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

