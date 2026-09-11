const multer = require("multer");

// Memory storage: the file stays in RAM as a buffer (req.file.buffer)
// instead of being written to local disk. This buffer is then uploaded
// to Cloudinary and also sent to the AI microservice, so we never need
// to save it locally.
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;