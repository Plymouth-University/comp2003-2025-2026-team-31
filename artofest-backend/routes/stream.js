const express = require('express');
const router = express.Router();

const {
  getAllStreams,
  getStreamsByFestival,
  createStreams,
  updateStream,
  deleteStream// ✅ ADD THIS
} = require('../controllers/streamController');

const { authenticate, isAdmin } = require("../middleware/authMiddleware");
// ✅ ADMIN ROUTE
router.post('/admin', authenticate, isAdmin, createStreams);
router.put('/admin/:id', authenticate, isAdmin, updateStream);
router.delete('/admin/:id', authenticate, isAdmin, deleteStream);

// GET routes for users
router.get('/', getAllStreams);
router.get('/:festivalId', getStreamsByFestival);




module.exports = router;