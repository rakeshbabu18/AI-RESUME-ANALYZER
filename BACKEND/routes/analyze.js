import express from "express";
import multer from "multer";
import pdf from "pdf-parse";
import { extractSkills } from "../services/aiService.js";
import { calculateMatch } from "../services/matchService.js";
import Analysis from "../models/analysis.js"

const router = express.Router();
const upload = multer();

router.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const resumeBuffer = req.file.buffer;
    const jdText = req.body.jobDescription;

    const resumeData = await pdf(resumeBuffer);
    const resumeText = resumeData.text;

    const resumeSkills = await extractSkills(resumeText);
    const jdSkills = await extractSkills(jdText);

    const result = calculateMatch(resumeSkills, jdSkills);

    const saved = await Analysis.create({
      resumeSkills,
      jdSkills,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      score: result.score
});

router.get("/history", async (req, res) => {
  const data = await Analysis.find().sort({ createdAt: -1 });
  res.json(data);
});

    res.json(saved);

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

export default router;
