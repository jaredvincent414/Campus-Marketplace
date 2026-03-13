#!/usr/bin/env node
const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Listing = require("../src/models/Listing");
const User = require("../src/models/User");
const Conversation = require("../src/models/Conversation");
const { uploadBufferToMediaStorage } = require("../src/utils/mediaStorage");

dotenv.config({ path: path.join(__dirname, "../.env") });

const LEGACY_UPLOAD_SEGMENT = "/uploads/";
const API_MEDIA_SEGMENT = "/api/media/";
const uploadsDir = path.resolve(__dirname, "../uploads");

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getArgValue = (key) => {
  const prefix = `${key}=`;
  const entry = args.find((arg) => arg.startsWith(prefix));
  return entry ? entry.slice(prefix.length).trim() : "";
};

const printUsage = () => {
  console.log([
    "Usage:",
    "  node scripts/migrateLegacyUploadsToGridFs.js [--dry-run] [--base-url=<url>]",
    "",
    "Examples:",
    "  node scripts/migrateLegacyUploadsToGridFs.js --dry-run",
    "  node scripts/migrateLegacyUploadsToGridFs.js --base-url=http://127.0.0.1:5001",
  ].join("\n"));
};

if (hasFlag("--help")) {
  printUsage();
  process.exit(0);
}

const dryRun = hasFlag("--dry-run");
const explicitBaseUrl = getArgValue("--base-url");

const normalizeBaseUrl = (value = "") => String(value || "").trim().replace(/\/+$/, "");
const baseUrl = normalizeBaseUrl(
  explicitBaseUrl ||
  process.env.MIGRATION_MEDIA_BASE_URL ||
  process.env.API_BASE_URL ||
  `http://127.0.0.1:${process.env.PORT || "5001"}`
);

const isLegacyUploadUrl = (value = "") =>
  String(value || "").toLowerCase().includes(LEGACY_UPLOAD_SEGMENT);

const extractLegacyFilename = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const lowered = raw.toLowerCase();
  const segmentIndex = lowered.lastIndexOf(LEGACY_UPLOAD_SEGMENT);
  if (segmentIndex < 0) return "";

  const afterSegment = raw.slice(segmentIndex + LEGACY_UPLOAD_SEGMENT.length);
  const cleanPath = afterSegment.split(/[?#]/)[0];
  const decoded = decodeURIComponent(cleanPath);
  return path.basename(decoded);
};

const safeJoinUploadPath = (filename = "") => {
  const candidate = path.resolve(uploadsDir, filename);
  const normalizedUploads = uploadsDir.endsWith(path.sep) ? uploadsDir : `${uploadsDir}${path.sep}`;
  if (!candidate.startsWith(normalizedUploads)) {
    return "";
  }
  return candidate;
};

const guessMimeType = (filename = "") => {
  const extension = path.extname(String(filename || "")).toLowerCase();
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".bmp": "image/bmp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".m4v": "video/x-m4v",
    ".webm": "video/webm",
    ".mkv": "video/x-matroska",
  };
  return map[extension] || "application/octet-stream";
};

const createMediaUrl = (mediaId) => `${baseUrl}${API_MEDIA_SEGMENT}${String(mediaId || "").trim()}`;

const stats = {
  listingDocsScanned: 0,
  listingDocsUpdated: 0,
  userDocsScanned: 0,
  userDocsUpdated: 0,
  conversationDocsScanned: 0,
  conversationDocsUpdated: 0,
  urlFieldsUpdated: 0,
  legacyUrlsMissingSourceFile: 0,
  uploadedToGridFs: 0,
  reusedFromCache: 0,
  skippedInvalidLegacyUrl: 0,
};

const missingFileWarnings = [];
const fileToMediaUrlCache = new Map();

const migrateLegacyUrl = async ({ currentUrl, collection, docId, fieldPath }) => {
  if (!isLegacyUploadUrl(currentUrl)) {
    return currentUrl;
  }

  const filename = extractLegacyFilename(currentUrl);
  if (!filename) {
    stats.skippedInvalidLegacyUrl += 1;
    return currentUrl;
  }

  const absolutePath = safeJoinUploadPath(filename);
  if (!absolutePath) {
    stats.skippedInvalidLegacyUrl += 1;
    return currentUrl;
  }

  if (!fsSync.existsSync(absolutePath)) {
    stats.legacyUrlsMissingSourceFile += 1;
    missingFileWarnings.push(
      `${collection}:${docId}:${fieldPath} -> missing file ${absolutePath}`
    );
    return currentUrl;
  }

  const cachedUrl = fileToMediaUrlCache.get(absolutePath);
  if (cachedUrl) {
    stats.reusedFromCache += 1;
    return cachedUrl;
  }

  if (dryRun) {
    const placeholderUrl = `${baseUrl}${API_MEDIA_SEGMENT}DRY_RUN_${filename}`;
    fileToMediaUrlCache.set(absolutePath, placeholderUrl);
    stats.reusedFromCache += 1;
    return placeholderUrl;
  }

  const buffer = await fs.readFile(absolutePath);
  const mimeType = guessMimeType(filename);
  const mediaId = await uploadBufferToMediaStorage({
    buffer,
    mimeType,
    originalName: filename,
    metadata: {
      source: "legacy-uploads-migration",
      collection,
      fieldPath,
      originalPath: absolutePath,
    },
  });
  const nextUrl = createMediaUrl(mediaId);
  fileToMediaUrlCache.set(absolutePath, nextUrl);
  stats.uploadedToGridFs += 1;
  return nextUrl;
};

const maybeSet = (target, key, value) => {
  if (target[key] !== value) {
    target[key] = value;
    stats.urlFieldsUpdated += 1;
    return true;
  }
  return false;
};

const migrateListings = async () => {
  const query = {
    $or: [
      { imageUrl: /\/uploads\//i },
      { "media.url": /\/uploads\//i },
    ],
  };
  const cursor = Listing.find(query).cursor();

  for await (const listing of cursor) {
    stats.listingDocsScanned += 1;
    let changed = false;
    const docId = String(listing._id);

    const nextImageUrl = await migrateLegacyUrl({
      currentUrl: listing.imageUrl,
      collection: "Listing",
      docId,
      fieldPath: "imageUrl",
    });
    changed = maybeSet(listing, "imageUrl", nextImageUrl) || changed;

    if (Array.isArray(listing.media) && listing.media.length > 0) {
      for (let index = 0; index < listing.media.length; index += 1) {
        const mediaItem = listing.media[index];
        const nextMediaUrl = await migrateLegacyUrl({
          currentUrl: mediaItem?.url,
          collection: "Listing",
          docId,
          fieldPath: `media[${index}].url`,
        });
        if (mediaItem && mediaItem.url !== nextMediaUrl) {
          mediaItem.url = nextMediaUrl;
          changed = true;
          stats.urlFieldsUpdated += 1;
        }
      }
    }

    if (changed) {
      stats.listingDocsUpdated += 1;
      if (!dryRun) {
        await listing.save();
      }
    }
  }
};

const migrateUsers = async () => {
  const query = { profileImageUrl: /\/uploads\//i };
  const cursor = User.find(query).cursor();

  for await (const user of cursor) {
    stats.userDocsScanned += 1;
    const docId = String(user._id);

    const nextUrl = await migrateLegacyUrl({
      currentUrl: user.profileImageUrl,
      collection: "User",
      docId,
      fieldPath: "profileImageUrl",
    });
    const changed = maybeSet(user, "profileImageUrl", nextUrl);
    if (changed) {
      stats.userDocsUpdated += 1;
      if (!dryRun) {
        await user.save();
      }
    }
  }
};

const migrateConversations = async () => {
  const query = { "listingSnapshot.thumbnailUrl": /\/uploads\//i };
  const cursor = Conversation.find(query).cursor();

  for await (const conversation of cursor) {
    stats.conversationDocsScanned += 1;
    const docId = String(conversation._id);
    const currentUrl = conversation?.listingSnapshot?.thumbnailUrl;

    const nextUrl = await migrateLegacyUrl({
      currentUrl,
      collection: "Conversation",
      docId,
      fieldPath: "listingSnapshot.thumbnailUrl",
    });

    let changed = false;
    if (conversation.listingSnapshot && conversation.listingSnapshot.thumbnailUrl !== nextUrl) {
      conversation.listingSnapshot.thumbnailUrl = nextUrl;
      stats.urlFieldsUpdated += 1;
      changed = true;
    }

    if (changed) {
      stats.conversationDocsUpdated += 1;
      if (!dryRun) {
        await conversation.save();
      }
    }
  }
};

const printSummary = () => {
  console.log("");
  console.log("Migration summary:");
  console.log(`  mode: ${dryRun ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`  baseUrl: ${baseUrl}`);
  console.log(`  uploadsDir: ${uploadsDir}`);
  console.log(`  listingDocsScanned: ${stats.listingDocsScanned}`);
  console.log(`  listingDocsUpdated: ${stats.listingDocsUpdated}`);
  console.log(`  userDocsScanned: ${stats.userDocsScanned}`);
  console.log(`  userDocsUpdated: ${stats.userDocsUpdated}`);
  console.log(`  conversationDocsScanned: ${stats.conversationDocsScanned}`);
  console.log(`  conversationDocsUpdated: ${stats.conversationDocsUpdated}`);
  console.log(`  urlFieldsUpdated: ${stats.urlFieldsUpdated}`);
  console.log(`  uploadedToGridFs: ${stats.uploadedToGridFs}`);
  console.log(`  reusedFromCache: ${stats.reusedFromCache}`);
  console.log(`  missingSourceFiles: ${stats.legacyUrlsMissingSourceFile}`);
  console.log(`  skippedInvalidLegacyUrl: ${stats.skippedInvalidLegacyUrl}`);

  if (missingFileWarnings.length > 0) {
    console.log("");
    console.log("Missing source files:");
    for (const warning of missingFileWarnings.slice(0, 50)) {
      console.log(`  - ${warning}`);
    }
    if (missingFileWarnings.length > 50) {
      console.log(`  ...and ${missingFileWarnings.length - 50} more`);
    }
  }
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }
  if (!baseUrl) {
    throw new Error("A base URL is required. Pass --base-url=<url> or set MIGRATION_MEDIA_BASE_URL.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    await migrateListings();
    await migrateUsers();
    await migrateConversations();
  } finally {
    await mongoose.disconnect();
  }
};

run()
  .then(() => {
    printSummary();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err.message || err);
    process.exit(1);
  });
