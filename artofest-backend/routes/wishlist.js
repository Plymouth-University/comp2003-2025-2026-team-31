const express = require("express");
const wishlistController = require("../controllers/wishlistController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, wishlistController.getWishlist);
router.post("/", authMiddleware, wishlistController.addToWishlist);
router.delete("/:festivalId", authMiddleware, wishlistController.removeFromWishlist);

module.exports = router;