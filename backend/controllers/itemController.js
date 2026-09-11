const streamifier = require("streamifier");

const Item = require("../models/Item");
const Claim = require("../models/Claim");
const cloudinary = require("../config/cloudinary");
const agenda = require("../jobs/aiMatchingJob");

// @desc    Get items, optionally filtered by status. When status=claimed,
//          each item is also annotated with claimedByUser (who claimed it).
// @route   GET /api/items
// @access  Private
const getItems = async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const items = await Item.find(filter)
      .populate("reportedBy", "name email avatar")
      .sort({ createdAt: -1 });

    if (req.query.status === "claimed") {
      const itemIds = items.map((i) => i._id);
      const approvedClaims = await Claim.find({
        item: { $in: itemIds },
        status: "approved",
      }).populate("claimedBy", "name email avatar");

      const claimerByItemId = {};
      approvedClaims.forEach((c) => {
        claimerByItemId[c.item.toString()] = c.claimedBy;
      });

      const itemsWithClaimer = items.map((item) => {
        const obj = item.toObject();
        obj.claimedByUser = claimerByItemId[item._id.toString()] || null;
        return obj;
      });

      return res.json(itemsWithClaimer);
    }

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

// Uploads an image buffer to Cloudinary and resolves with the secure URL.
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "lost-and-found" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const createItem = async (req, res, next) => {
  try {
    const { title, description, location, status, category } = req.body;

    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const item = await Item.create({
      title,
      description,
      location,
      category: category || "Other",
      status: status || "found",
      image: imageUrl,
      reportedBy: req.user._id,
    });

    res.status(201).json(item);

    // Queue AI matching as a background job instead of running it inline.
    // agenda persists this in MongoDB, so it survives server restarts and
    // retries automatically if the AI service is temporarily down.
    if (imageUrl) {
      agenda.now("ai-matching", { itemId: item._id.toString() });
    }
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

    const populated = await claim.populate("claimedBy", "name email avatar");

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
      .populate("claimedBy", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (err) {
    next(err);
  }
};

// @desc    Approve a claim on one of my items — marks the item as claimed,
//          reveals the claimer's contact email, and auto-rejects any other
//          pending claims on the same item.
// @route   PUT /api/items/claims/:claimId/approve
// @access  Private
const approveClaim = async (req, res, next) => {
  try {
    const { claimId } = req.params;

    const claim = await Claim.findById(claimId).populate("item");

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.item.reportedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You're not authorized to approve this claim" });
    }

    if (claim.status !== "pending") {
      return res
        .status(400)
        .json({ message: "This claim has already been handled" });
    }

    claim.status = "approved";
    await claim.save();

    claim.item.status = "claimed";
    await claim.item.save();

    await Claim.updateMany(
      { item: claim.item._id, _id: { $ne: claim._id }, status: "pending" },
      { status: "rejected" }
    );

    const populated = await Claim.findById(claim._id)
      .populate("item", "title status category image")
      .populate("claimedBy", "name email avatar");

    res.status(200).json(populated);
  } catch (err) {
    next(err);
  }
};

// @desc    Reject a claim on one of my items
// @route   PUT /api/items/claims/:claimId/reject
// @access  Private
const rejectClaim = async (req, res, next) => {
  try {
    const { claimId } = req.params;

    const claim = await Claim.findById(claimId).populate("item");

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.item.reportedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You're not authorized to reject this claim" });
    }

    if (claim.status !== "pending") {
      return res
        .status(400)
        .json({ message: "This claim has already been handled" });
    }

    claim.status = "rejected";
    await claim.save();

    res.status(200).json(claim);
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
  approveClaim,
  rejectClaim,
};