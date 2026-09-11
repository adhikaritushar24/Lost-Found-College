const Notification = require("../models/Notification");

// @desc    Get AI image-match notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate("item", "title image location status category")
      .populate("matchedItem", "title image location status category")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyNotifications };