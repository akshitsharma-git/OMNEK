import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import userRoutes from "./routes/user.routes.js";
import homeRoutes from "./routes/home.routes.js";
import videoRoutes from "./routes/video.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 9999;

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB Error:", err.message);
    process.exit(1);
  });

const allowedOrigins = [
  "http://localhost:7199",
  "https://omnek.onrender.com"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", homeRoutes);
app.use("/u", userRoutes);
app.use("/video", videoRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
