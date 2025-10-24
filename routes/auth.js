const express = require("express");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// POST /api/auth/register
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, email, password } = req.body;
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ error: "User already exists" });

      user = new User({ name, email, password });
      await user.save();

      return res.json({ success: true, userId: user._id });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail(),
    body("password").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "Invalid credentials" });

      const match = await user.comparePassword(password);
      if (!match) return res.status(400).json({ error: "Invalid credentials" });

      const payload = { userId: user._id, email: user.email, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET || "secret", {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      });

      return res.json({ success: true, token, user: { email: user.email, name: user.name, role: user.role } });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
