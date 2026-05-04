const express = require("express");
const wishlistController = require("../controllers/wishlistController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, wishlistController.getWishlist);
router.post("/", authenticate, wishlistController.addToWishlist);
router.delete("/:festivalId", authenticate, wishlistController.removeFromWishlist);

module.exports = router;