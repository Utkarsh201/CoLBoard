import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const setupSocket = (io) => {

  io.use((socket, next) => {
    try {
      const tokenHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization || "";
      const token = tokenHeader.replace(/^Bearer\s+/i, "").trim();
      
      if (!token) {
        return next(new Error("Authentication error: Token is missing"));
      }
      
      const decoded = jwt.verify(token, process.env.ACCESSTOKENSECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id, "| DB User ID:", socket.userId);

    // Create a new room
    socket.on("create_room", () => {
      // Generate a simple 6-character room ID
      const roomId = crypto.randomBytes(3).toString("hex").toUpperCase();
      socket.join(roomId);
      console.log(`Socket ${socket.id} created and joined room: ${roomId}`);
      // Notify the creator
      socket.emit("room_created", { roomId });
    });

    // Join an existing room
    socket.on("join_room", ({ roomId }) => {
      if (!roomId) {
        socket.emit("room_error", { message: "Room ID is required" });
        return;
      }

      // Check room size
      const room = io.sockets.adapter.rooms.get(roomId);
      const roomSize = room ? room.size : 0;

      if (roomSize === 0) {
          socket.emit("room_error", { message: "Room does not exist" });
          return;
      }

      if (roomSize >= 5) {
        socket.emit("room_full", { message: "Room is already full! Maximum 5 users allowed." });
        return;
      }

      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
      
      // Notify the user they joined successfully
      socket.emit("room_joined", { roomId });
      
      // Optionally notify other users in the room
      socket.to(roomId).emit("user_joined", { userId: socket.id, message: "A new user joined the room" });
    });

    socket.on("disconnect", () => {
       console.log("User disconnected:", socket.id);
       // Socket.io automatically handles leaving rooms on disconnect
    });
  });
};
