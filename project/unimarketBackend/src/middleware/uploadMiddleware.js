const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
    const mimeType = String(file.mimetype || "");
    if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
        cb(null, true);
        return;
    }
    cb(new Error("Only image or video files are allowed"));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 40 * 1024 * 1024
    }
});

module.exports = { upload };
