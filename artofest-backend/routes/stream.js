const express = require('express');
const router = express.Router();

const {
  getAllStreams,
  getStreamsByFestival
} = require('../controllers/streamController');

router.get('/', getAllStreams);
router.get('/:festivalId', getStreamsByFestival);

module.exports = router;