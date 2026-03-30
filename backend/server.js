import app from "./app.js";
import dotenv from "dotenv";
import { ConnectDB } from "./config/connectDB.js";
import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./sockets/socketManager.js";

dotenv.config();

const server = http.createServer(app);
// Socket.io needs direct access to the raw Node.js http.Server so it can "listen" for WebSocket upgrade requests before Express gets a chance to look at them.
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
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
