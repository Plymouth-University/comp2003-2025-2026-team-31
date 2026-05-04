const express = require('express');
const router = express.Router();

const { 
  getFestivals, 
  getFestivalById,
  createFestival,
  updateFestival,
  deleteFestival
} = require('../controllers/festivalControllers'); // ✅ FIXED PATH

const { authenticate, isAdmin } = require("../middleware/authMiddleware");

// GET routes
router.get('/', getFestivals);
router.get('/:id', getFestivalById);

// ✅ ADMIN ROUTE
router.post('/admin', authenticate, isAdmin, createFestival);
router.put('/admin/:id', authenticate, isAdmin, updateFestival);
router.delete('/admin/:id', authenticate, isAdmin, deleteFestival);

module.exports = router;