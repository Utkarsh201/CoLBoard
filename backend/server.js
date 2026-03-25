import app from "./app.js";
import dotenv from "dotenv";
import { ConnectDB } from "./config/connectDB.js";
import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./sockets/socketManager.js";

dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://whiteboard-application-black.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

setupSocket(io);

async function startServer() {
  try {
    await ConnectDB();
    console.log("MongoDB connected");

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      console.log(`the Server is running on the port http://localhost:${port}`);
    });
  } catch (err) {
    console.error("DB connection error", err);
    process.exit(1);
  }
}

startServer();
