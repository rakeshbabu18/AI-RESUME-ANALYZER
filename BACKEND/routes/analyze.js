import express from "express";
import multer from "multer";
import pdf from "pdf-parse";
import { extractSkills } from "../services/aiService.js";
import { calculateMatch } from "../services/matchService.js";
import Analysis from "../models/analysis.js";
import mongoose from "mongoose";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to extract text from PDF or TXT
async function extractTextFromFile(file) {
  if (!file) throw new Error("No file provided");
  
  const mimeType = file.mimetype || "";
  
  if (mimeType === "application/pdf" || file.originalname.endsWith(".pdf")) {
    const resumeData = await pdf(file.buffer);
    return resumeData.text || "";
  } else if (mimeType === "text/plain" || file.originalname.endsWith(".txt")) {
    return file.buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file type. Please upload a PDF or TXT file.");
  }
}

router.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const resumeBuffer = req.file?.buffer;
    const jdText = req.body.jobDescription || "";

    if (!resumeBuffer) {
      return res.status(400).json({ error: "No resume file uploaded" });
    }

    if (!jdText.trim()) {
      return res.status(400).json({ error: "Job description is required" });
    }

    // Extract text from PDF or TXT
    const resumeText = await extractTextFromFile(req.file);

    if (!resumeText.trim()) {
      return res.status(400).json({ error: "Resume file is empty or unreadable" });
    }

    const resumeSkills = await extractSkills(resumeText);
    const jdSkills = await extractSkills(jdText);

    console.log("Extracted resumeSkills:", resumeSkills);
    console.log("Extracted jdSkills:", jdSkills);

    const result = calculateMatch(resumeSkills, jdSkills);

    // Try to save analysis if MongoDB is connected; otherwise skip saving
    let saved = null;
    try {
      if (mongoose.connection.readyState === 1) {
        saved = await Analysis.create({
          resumeSkills,
          jdSkills,
          matchedSkills: result.matchedSkills,
          missingSkills: result.missingSkills,
          score: result.score
        });
      } else {
        console.log('MongoDB not connected - skipping save');
      }
    } catch (saveErr) {
      console.error('Failed to save analysis:', saveErr.message);
    }

    // Return match result at the top level to match frontend expectations
    const responseData = { ...result, analysis: saved };
    console.log("Sending response:", JSON.stringify(responseData, null, 2));
    return res.json(responseData);

  } catch (err) {
    console.error("Full error in /analyze:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ error: err.message || "Analysis failed" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const data = await Analysis.find().sort({ createdAt: -1 });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Helpful GET response so a browser visit doesn't return the default Express message
router.get("/analyze", (req, res) => {
  return res.json({
    message:
      "This endpoint accepts POST requests. Send multipart/form-data with 'resume' (PDF file) and 'jobDescription' (text)."
  });
});

export default router;
