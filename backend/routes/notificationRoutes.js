const express = require("express");
const router = express.Router();
const { getMyNotifications } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getMyNotifications);

module.exports = router;