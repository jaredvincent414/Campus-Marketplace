const path = require("path");
const mongoose = require("mongoose");

const MEDIA_BUCKET = "media";
const MEDIA_ROUTE_SEGMENT = "/api/media/";

const getMediaBucket = () => {
  const db = mongoose.connection?.db;
  if (!db) {
    throw new Error("MongoDB connection is not ready");
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: MEDIA_BUCKET });
};

const getMediaFilesCollection = () => {
  const db = mongoose.connection?.db;
  if (!db) {
    throw new Error("MongoDB connection is not ready");
  }
  return db.collection(`${MEDIA_BUCKET}.files`);
};

const toObjectId = (value) => {
  const normalized = String(value || "").trim();
  if (!mongoose.Types.ObjectId.isValid(normalized)) {
    return null;
  }
  return new mongoose.Types.ObjectId(normalized);
};

const sanitizeExtension = (originalName = "", mimeType = "") => {
  const extension = path.extname(String(originalName || "")).toLowerCase();
  if (extension && extension.length <= 8) {
    return extension;
  }
  if (String(mimeType).startsWith("video/")) {
    return ".mp4";
  }
  if (String(mimeType).startsWith("image/")) {
    return ".jpg";
  }
  return "";
};

const createStoredFilename = (originalName = "", mimeType = "") => {
  const extension = sanitizeExtension(originalName, mimeType);
  return `media-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
};

const uploadBufferToMediaStorage = async ({
  buffer,
  mimeType,
  originalName,
  metadata = {},
}) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Upload buffer is required");
  }

  const bucket = getMediaBucket();
  const filename = createStoredFilename(originalName, mimeType);

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: String(mimeType || "application/octet-stream"),
      metadata: {
        ...metadata,
        originalName: String(originalName || "").trim(),
      },
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(String(uploadStream.id)));
    uploadStream.end(buffer);
  });
};

const buildMediaUrl = (req, mediaId) =>
  `${req.protocol}://${req.get("host")}${MEDIA_ROUTE_SEGMENT}${String(mediaId || "").trim()}`;

const extractMediaIdFromUrl = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  const segmentIndex = normalized.lastIndexOf(MEDIA_ROUTE_SEGMENT);
  if (segmentIndex < 0) return null;
  const idCandidate = normalized
    .slice(segmentIndex + MEDIA_ROUTE_SEGMENT.length)
    .split(/[/?#]/)[0];
  return toObjectId(idCandidate);
};

const getMediaFileById = async (mediaId) => {
  const objectId = toObjectId(mediaId);
  if (!objectId) {
    return null;
  }
  return getMediaFilesCollection().findOne({ _id: objectId });
};

const openMediaDownloadStream = (mediaId, options = {}) => {
  const objectId = toObjectId(mediaId);
  if (!objectId) {
    throw new Error("Invalid media id");
  }
  return getMediaBucket().openDownloadStream(objectId, options);
};

const deleteMediaByUrl = async (url = "") => {
  const objectId = extractMediaIdFromUrl(url);
  if (!objectId) return false;
  try {
    await getMediaBucket().delete(objectId);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  buildMediaUrl,
  deleteMediaByUrl,
  getMediaFileById,
  openMediaDownloadStream,
  uploadBufferToMediaStorage,
};
