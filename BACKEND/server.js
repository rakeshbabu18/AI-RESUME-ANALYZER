import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import analyzeRoute from "./routes/analyze.js";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error("CRITICAL ERROR: MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fail.");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const app = express();

// Security and Logging
app.use(helmet({
  contentSecurityPolicy: false, // Disable for easier deployment of frontend/backend as one
}));
app.use(morgan("dev"));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests, please try again later." }
});
app.use("/api/", limiter);

app.use(cors());
app.use(express.json());

// Simple request logger to help debug network requests
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// Health endpoint for quick connectivity checks
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/api", analyzeRoute);

// Serve Static Files from Frontend for Deployment
const frontendPath = path.join(__dirname, "../FRONTEND/dist");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
