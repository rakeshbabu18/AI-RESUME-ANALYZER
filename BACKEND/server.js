import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeRoute from "./routes/analyze.js";
import mongoose from "mongoose";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", analyzeRoute);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
