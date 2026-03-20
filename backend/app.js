import express , {json, urlencoded} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { userRoutes } from "./routers/userrouter.js";

const app = express();

app.use(cors({
    origin: "https://whiteboard-application-black.vercel.app",
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({limit : '10kb'}));
app.use(express.urlencoded({ extended: true , limit : '10kb'}));


app.use('/user', userRoutes);

app.get('/',(req,res)=>{
  return res.send("app is running")
})


export default app;