const express = require("express");
const {
  getListings,
  getListingsByUser,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  purchaseListing,
} = require("../controllers/listingController");

const router = express.Router();

router.get("/", getListings);
router.get("/user/:email", getListingsByUser);
router.get("/:id", getListingById);
router.post("/", createListing);
router.post("/:id/purchase", purchaseListing);
router.put("/:id", updateListing);
router.delete("/:id", deleteListing);

module.exports = router;



