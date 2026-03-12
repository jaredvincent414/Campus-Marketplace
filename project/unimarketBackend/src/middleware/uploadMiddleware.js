const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname || "").toLowerCase();
        const fallbackExtension = file.mimetype && file.mimetype.startsWith("video/") ? ".mp4" : ".jpg";
        const safeExtension = extension && extension.length <= 8 ? extension : fallbackExtension;
        cb(null, `listing-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`);
    }
});

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

module.exports = { upload, uploadsDir };
