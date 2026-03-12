const express = require("express");
const {
  getListings,
  getListingsByUser,
  getListingById,
  createListing,
  uploadListingMedia,
  updateListing,
  deleteListing,
  purchaseListing,
  markListingPending,
  markListingSold,
} = require("../controllers/listingController");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();
const uploadSingleMedia = (req, res, next) => {
  upload.single("media")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Media upload failed" });
    }
    next();
  });
};

router.get("/", getListings);
router.get("/user/:email", getListingsByUser);
router.post("/upload", uploadSingleMedia, uploadListingMedia);
router.get("/:id", getListingById);
router.post("/", createListing);
router.post("/:id/purchase", purchaseListing);
router.post("/:id/mark-pending", markListingPending);
router.post("/:id/mark-sold", markListingSold);
router.put("/:id", updateListing);
router.delete("/:id", deleteListing);

module.exports = router;
