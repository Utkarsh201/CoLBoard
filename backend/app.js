import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { userRoutes } from "./routers/userrouter.js";
import { refreshrouter } from "./routers/refreshrouter.js";
import { canvasrouter } from "./routers/canvasrouter.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv"

dotenv.config();

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use(limiter);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use('/user', userRoutes);
app.use('/user', refreshrouter);
app.use('/canvas', canvasrouter);

app.get('/',(req,res)=>{
  return res.send("app is running")
})

// 404 handler for unknown routes
app.use((req, res) => {
  return res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler — catches any unhandled errors from routes/middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  return res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;
