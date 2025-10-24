require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");

// --- Models ---
const contactSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});
const Contact = mongoose.model("Contact", contactSchema);

// --- App setup ---
const app = express();
const PORT = process.env.PORT || 5000;

// CORS - only allow your frontend origin (secure)
const allowedOrigins = [process.env.FRONTEND_ORIGIN || "http://localhost:5173"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

// --- MongoDB connect ---
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bga_contacts";
mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Routes ---
// auth
app.use("/api/auth", authRoutes);

// public contact POST - anyone can submit
app.post("/api/contact", async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;
    if (!firstName || !email || !message) {
      return res.status(400).json({ error: "firstName, email and message are required" });
    }
    const newContact = new Contact({ firstName, lastName, email, subject, message });
    await newContact.save();
    console.log("📩 New contact saved:", newContact);
    return res.json({ success: true });
  } catch (err) {
    console.error("Contact save error:", err);
    return res.status(500).json({ error: "Failed to save message" });
  }
});

// protected messages route - require auth
app.get("/api/messages", authMiddleware, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// quick index
app.get("/", (req, res) => res.send("Backend running"));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
