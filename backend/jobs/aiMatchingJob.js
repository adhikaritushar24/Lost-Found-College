const axios = require("axios");
const agenda = require("../config/agenda");
const Item = require("../models/Item");
const { storeEmbedding, findMatchesAndNotify } = require("../services/aiMatchingService");

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_SECONDS = 30;

agenda.define("ai-matching", async (job) => {
  const { itemId, attempt = 1 } = job.attrs.data;

  try {
    const item = await Item.findById(itemId);
    if (!item || !item.image) return; // item was deleted or has no image

    // Download the image from Cloudinary as a buffer to send to the AI service
    const imageResponse = await axios.get(item.image, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(imageResponse.data);

    await storeEmbedding(item, buffer);
    await findMatchesAndNotify(item, buffer);

    console.log(`AI matching done for item "${item.title}"`);
  } catch (err) {
    console.error(
      `AI matching failed for item ${itemId} (attempt ${attempt}):`,
      err.message
    );

    if (attempt < MAX_ATTEMPTS) {
      // Retry after a short delay, tracking the attempt count
      await agenda.schedule(`in ${RETRY_DELAY_SECONDS} seconds`, "ai-matching", {
        itemId,
        attempt: attempt + 1,
      });
    } else {
      console.error(`Giving up on AI matching for item ${itemId} after ${MAX_ATTEMPTS} attempts`);
    }
  }
});

module.exports = agenda;