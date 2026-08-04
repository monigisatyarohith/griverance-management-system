const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, checkEmail } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/check-email', checkEmail);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/me', protect, (req, res) => res.json(req.user));

module.exports = router;
