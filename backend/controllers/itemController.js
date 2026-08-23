const Item = require("../models/Item");
const Claim = require("../models/Claim");

const getItems = async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const items = await Item.find(filter)
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// @desc    Get items reported by the logged-in user
// @route   GET /api/items/mine
// @access  Private
const getMyItems = async (req, res, next) => {
  try {
    const items = await Item.find({ reportedBy: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const createItem = async (req, res, next) => {
  try {
    const { title, description, location, status, category } = req.body;
    const item = await Item.create({
      title,
      description,
      location,
      category: category || "Other",
      status: status || "found",
      image: req.file ? `/uploads/${req.file.filename}` : "",
      reportedBy: req.user._id,
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

// @desc    Submit a claim request on an item (e.g. "this is mine" / "I found this")
// @route   POST /api/items/:id/claim
// @access  Private
const createClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.reportedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't claim your own item" });
    }

    const claim = await Claim.create({
      item: id,
      claimedBy: req.user._id,
      message: req.body.message || "",
    });

    const populated = await claim.populate("claimedBy", "name email");

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// @desc    Get claims made on items reported by the logged-in user
// @route   GET /api/items/claims/mine
// @access  Private
const getMyClaims = async (req, res, next) => {
  try {
    const myItems = await Item.find({ reportedBy: req.user._id }).select("_id");
    const myItemIds = myItems.map((i) => i._id);

    const claims = await Claim.find({ item: { $in: myItemIds } })
      .populate("item", "title status category image")
      .populate("claimedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getItems,
  getMyItems,
  createItem,
  createClaim,
  getMyClaims,
};