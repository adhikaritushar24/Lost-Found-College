const axios = require("axios");
const FormData = require("form-data");
const mongoose = require("mongoose");

const Item = require("../models/Item");
const Notification = require("../models/Notification");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
const MATCH_THRESHOLD = 0.75; // tune this later based on real testing

// Calls the AI microservice to store this item's image embedding in Qdrant.
const storeEmbedding = async (item, buffer) => {
  const form = new FormData();
  form.append("item_id", item._id.toString());
  form.append("file", buffer, { filename: "image.jpg" });

  await axios.post(`${AI_SERVICE_URL}/store`, form, {
    headers: form.getHeaders(),
  });
};

// Calls the AI microservice to find visually similar items, then creates
// a Notification for both the new item's reporter and the matched item's
// reporter.
const findMatchesAndNotify = async (item, buffer) => {
  const form = new FormData();
  form.append("file", buffer, { filename: "image.jpg" });
  form.append("top_k", "5");

  const response = await axios.post(`${AI_SERVICE_URL}/search`, form, {
    headers: form.getHeaders(),
  });

  const matches = response.data.matches || [];
  const oppositeStatus = item.status === "lost" ? "found" : "lost";

  for (const match of matches) {
    if (match.item_id === item._id.toString()) continue;
    if (match.score < MATCH_THRESHOLD) continue;
    if (!mongoose.Types.ObjectId.isValid(match.item_id)) continue;

    const matchedItem = await Item.findById(match.item_id);
    if (!matchedItem) continue;
    if (matchedItem.status !== oppositeStatus) continue;

    await Notification.create({
      user: item.reportedBy,
      item: item._id,
      matchedItem: matchedItem._id,
      score: match.score,
      message: `Your ${item.status} item "${item.title}" might match a ${matchedItem.status} item "${matchedItem.title}"`,
    });

    await Notification.create({
      user: matchedItem.reportedBy,
      item: matchedItem._id,
      matchedItem: item._id,
      score: match.score,
      message: `A new ${item.status} item "${item.title}" might match your ${matchedItem.status} item "${matchedItem.title}"`,
    });
  }
};

module.exports = { storeEmbedding, findMatchesAndNotify };