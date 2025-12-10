const User = require("../models/User");

// Create or update a user by email (no external dependency)
const createOrUpdateUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    let user = await User.findOne({ email });
    if (user) {
      user.name = name;
      await user.save();
      return res.json(user);
    }

    user = await User.create({ name, email });
    return res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrUpdateUser };
