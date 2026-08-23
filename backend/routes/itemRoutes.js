const express = require("express");
const router = express.Router();
const {
  getItems,
  getMyItems,
  createItem,
  createClaim,
  getMyClaims,
} = require("../controllers/itemController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/mine", protect, getMyItems);
router.get("/claims/mine", protect, getMyClaims);
router.get("/", protect, getItems);
router.post("/", protect, upload.single("image"), createItem);
router.post("/:id/claim", protect, createClaim);

module.exports = router;