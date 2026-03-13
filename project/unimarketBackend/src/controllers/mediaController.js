const { getMediaFileById, openMediaDownloadStream } = require("../utils/mediaStorage");

const parseRange = (rangeHeader = "", fileLength = 0) => {
  const normalized = String(rangeHeader || "").trim();
  if (!normalized || !normalized.startsWith("bytes=")) {
    return { hasRange: false };
  }

  const [rawStart, rawEnd] = normalized.replace("bytes=", "").split("-");
  const hasStart = rawStart !== "";
  const hasEnd = rawEnd !== "";
  if (!hasStart && !hasEnd) {
    return { hasRange: true, isValid: false };
  }

  let start = 0;
  let end = fileLength - 1;

  if (hasStart) {
    start = Number(rawStart);
  }
  if (hasEnd) {
    end = Number(rawEnd);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { hasRange: true, isValid: false };
  }

  if (!hasStart && hasEnd) {
    const suffixSize = end;
    if (suffixSize <= 0) {
      return { hasRange: true, isValid: false };
    }
    start = Math.max(fileLength - suffixSize, 0);
    end = fileLength - 1;
  } else if (hasStart && !hasEnd) {
    end = fileLength - 1;
  }

  if (start < 0 || end < start || start >= fileLength) {
    return { hasRange: true, isValid: false };
  }

  end = Math.min(end, fileLength - 1);
  return { hasRange: true, isValid: true, start, end };
};

const getMediaById = async (req, res, next) => {
  try {
    const mediaId = String(req.params.id || "").trim();
    const mediaFile = await getMediaFileById(mediaId);

    if (!mediaFile) {
      return res.status(404).json({ message: "Media not found" });
    }

    const fileLength = Number(mediaFile.length || 0);
    const mimeType = String(mediaFile.contentType || "application/octet-stream");
    const rangeRequest = parseRange(req.headers.range, fileLength);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    if (rangeRequest.hasRange) {
      if (!rangeRequest.isValid) {
        res.setHeader("Content-Range", `bytes */${fileLength}`);
        return res.status(416).end();
      }

      const { start, end } = rangeRequest;
      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileLength}`);
      res.setHeader("Content-Length", String(chunkSize));

      const rangedStream = openMediaDownloadStream(mediaId, { start, end: end + 1 });
      rangedStream.on("error", (err) => {
        if (!res.headersSent) {
          res.status(500).json({ message: "Failed to stream media" });
          return;
        }
        res.destroy(err);
      });
      rangedStream.pipe(res);
      return;
    }

    res.setHeader("Content-Length", String(fileLength));
    const stream = openMediaDownloadStream(mediaId);
    stream.on("error", (err) => {
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to stream media" });
        return;
      }
      res.destroy(err);
    });
    stream.pipe(res);
    return;
  } catch (err) {
    if (String(err?.message || "").toLowerCase().includes("invalid media id")) {
      return res.status(400).json({ message: "Invalid media id" });
    }
    return next(err);
  }
};

module.exports = {
  getMediaById,
};
