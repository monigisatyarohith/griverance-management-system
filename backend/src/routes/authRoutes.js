const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  forgotPassword, 
  resetPassword, 
  checkEmail, 
  updatePassword, 
  getCoordinators, 
  createOrUpdateCoordinator 
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/check-email', checkEmail);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/me', protect, (req, res) => res.json(req.user));
router.put('/update-password', protect, updatePassword);
router.get('/coordinators', protect, authorize('principal', 'vice_principal', 'admin'), getCoordinators);
router.post('/coordinators', protect, authorize('principal', 'vice_principal', 'admin'), createOrUpdateCoordinator);

module.exports = router;
