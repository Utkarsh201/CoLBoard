import express , {json, urlencoded} from "express";
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

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use(limiter);

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({limit : '10kb'}));
app.use(express.urlencoded({ extended: true , limit : '10kb'}));


app.use('/user', userRoutes);
app.use('/user', refreshrouter);
app.use('/canvas', canvasrouter);

app.get('/',(req,res)=>{
  return res.send("app is running")
})


export default app;