const express = require("express");
const router = express.Router();
const { createOrUpdateUser } = require("../controllers/userController");

router.post("/", createOrUpdateUser);

module.exports = router;
