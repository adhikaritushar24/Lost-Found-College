const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    category: {
      type: String,
      enum: ["Electronics", "ID Card", "Bag", "Documents", "Other"],
      default: "Other",
    },
    status: {
      type: String,
      enum: ["lost", "found", "claimed"],
      default: "found",
    },
    image: { type: String, default: "" },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);