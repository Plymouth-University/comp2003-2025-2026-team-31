const express = require('express');
const router = express.Router();
const { getFestivals, getFestivalById } = require('../controllers/festivalControllers');
console.log('getFestivals is:', getFestivals);

router.get('/', getFestivals);
router.get("/:id", getFestivalById);

module.exports = router;