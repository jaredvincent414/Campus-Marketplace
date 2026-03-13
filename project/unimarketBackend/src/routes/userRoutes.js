const express = require("express");
const router = express.Router();
const { upload } = require("../middleware/uploadMiddleware");
const {
  createOrUpdateUser,
  getUserByEmail,
  uploadUserProfilePhoto,
  updateUserProfilePhoto,
  getSavedListings,
  saveListingForUser,
  removeSavedListingForUser,
} = require("../controllers/userController");

router.post("/", createOrUpdateUser);
router.post("/upload-photo", (req, res, next) => {
  upload.single("media")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Photo upload failed" });
    }
    return next();
  });
}, uploadUserProfilePhoto);
router.get("/:email/saved-listings", getSavedListings);
router.post("/:email/saved-listings/:listingId", saveListingForUser);
router.delete("/:email/saved-listings/:listingId", removeSavedListingForUser);
router.put("/:email/profile-photo", updateUserProfilePhoto);
router.get("/:email", getUserByEmail);

module.exports = router;
