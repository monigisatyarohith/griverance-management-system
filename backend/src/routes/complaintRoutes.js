const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  approveComplaint,
  rejectComplaint,
  addGrievanceUpdate,
  getGrievanceUpdates,
  getStats,
  updateStatus,
  updatePriority,
  addPrincipalRemarks
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .post(authorize('student'), upload.array('attachments', 5), createComplaint)
  .get(getComplaints);

router.get('/stats', getStats);

// Vice Principal & Principal routing approvals, priority updates, and executive remarks
router.put('/:id/approve', authorize('vice_principal', 'principal', 'admin'), approveComplaint);
router.put('/:id/reject', authorize('vice_principal', 'principal', 'admin'), rejectComplaint);
router.put('/:id/priority', authorize('vice_principal', 'principal', 'admin'), updatePriority);
router.post('/:id/remarks', authorize('principal', 'vice_principal', 'admin'), addPrincipalRemarks);

// Coordinator stage and progress updates
router.post('/:id/updates', authorize('coordinator', 'admin'), upload.array('attachments', 2), addGrievanceUpdate);
router.get('/:id/updates', getGrievanceUpdates);

// Backwards compatible status updater
router.put('/:id/status', authorize('faculty', 'hod', 'coordinator', 'admin'), updateStatus);

module.exports = router;
