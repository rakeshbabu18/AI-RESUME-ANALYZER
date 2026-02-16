import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema({
  resumeSkills: [String],
  jdSkills: [String],
  matchedSkills: [String],
  missingSkills: [String],
  score: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Analysis", analysisSchema);
