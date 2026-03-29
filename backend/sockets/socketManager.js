import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { socketAuthMiddleware } from '../middlewares/socketAuthMiddleware.js';
import { Room } from '../models/RoomModel.js';

// In-Memory cache for live users and drawings
const activeRooms = {};

export const setupSocket = (io) => {

  io.use(socketAuthMiddleware);

  // a room will only be created when the user asks for it

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id, "| DB User ID:", socket.userId);

    // Create a new room
    socket.on("create_room", async ({ password }) => {
      try {
        if (!password) {
          socket.emit("room_error", { message: "Password is required to create a room" });
          return;
        }

        const roomId = crypto.randomBytes(3).toString("hex").toUpperCase();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save new room to MongoDB
        await Room.create({
          roomId,
          password: hashedPassword,
          creatorId: socket.userId
        });

        // Initialize live memory for this room
        activeRooms[roomId] = {
          users: [],
          drawingCache: [],
          deletionTimer: null
        };

        socket.join(roomId);
        console.log(`Socket ${socket.id} created and joined secure room: ${roomId}`);
        
        socket.emit("room_created", { roomId });
      } catch (err) {
        console.error("Error creating room:", err);
        socket.emit("room_error", { message: "Failed to create room" });
      }
    });

    // Join an existing room
    socket.on("join_room", async ({ roomId, password }) => {
      try {
        if (!roomId || !password) {
          socket.emit("room_error", { message: "Room ID and Password are required" });
          return;
        }

        // 1. Verify existence in MongoDB
        const roomDoc = await Room.findOne({ roomId });
        if (!roomDoc) {
          socket.emit("room_error", { message: "Room does not exist" });
          return;
        }

        // 2. Verify password
        const isMatch = await bcrypt.compare(password, roomDoc.password);
        if (!isMatch) {
          socket.emit("room_error", { message: "Invalid Password" });
          return;
        }

        // 3. Ensure memory cache exists for this room (in case server rebooted but DB has the room)
        if (!activeRooms[roomId]) {
          activeRooms[roomId] = {
            users: [],
            drawingCache: roomDoc.drawingData || [],
            deletionTimer: null
          };
        }

        // 4. Check live room size (allowing max 5)
        const currentUsers = activeRooms[roomId].users;
        if (currentUsers.length >= 5) {
          socket.emit("room_full", { message: "Room is already full! Maximum 5 users allowed." });
          return;
        }

        // 5. Cancel any pending deletion timer since someone joined!
        if (activeRooms[roomId].deletionTimer) {
          clearTimeout(activeRooms[roomId].deletionTimer);
          activeRooms[roomId].deletionTimer = null;
        }

        // 6. Join the user logic
        socket.join(roomId);
        // Store room info on this specific socket so we know which room they leave on disconnect
        socket.currentRoom = roomId; 
        
        // Add to active users
        currentUsers.push({ socketId: socket.id, userId: socket.userId });

        console.log(`Socket ${socket.id} securely joined room: ${roomId}`);
        
        // 7. Send success and data
        socket.emit("room_joined", { roomId });
        // Send historic drawing data
        socket.emit("load_canvas", activeRooms[roomId].drawingCache);
        
        // 8. Broadcast updated user list to everyone in room
        io.to(roomId).emit("user_list_update", activeRooms[roomId].users);
      } catch (err) {
        console.error("Error joining room:", err);
        socket.emit("room_error", { message: "Failed to join room" });
      }
    });

    socket.on("disconnect", () => {
       console.log("User disconnected:", socket.id);
       const roomId = socket.currentRoom;

       if (roomId && activeRooms[roomId]) {
         // Remove user from active array
         activeRooms[roomId].users = activeRooms[roomId].users.filter(u => u.socketId !== socket.id);
         
         // Broadcast updated list
         io.to(roomId).emit("user_list_update", activeRooms[roomId].users);

         // Check if room is empty
         if (activeRooms[roomId].users.length === 0) {
           console.log(`Room ${roomId} is empty. Starting 5 minute deletion timer.`);
           
           // Set timer for 5 minutes (300,000 ms)
           activeRooms[roomId].deletionTimer = setTimeout(async () => {
             console.log(`Timer fired! Deleting room ${roomId} from DB and memory.`);
             try {
               await Room.deleteOne({ roomId });
               delete activeRooms[roomId];
             } catch (err) {
               console.error("Failed to auto-delete room:", err);
             }
           }, 5 * 60 * 1000);
         }
       }
    });

  });
};



// When a random visitor is on your site but they haven't logged in:

// They don't have a JWT access token.
// If their browser attempts to connect to your socket server, it will send a connection request(a handshake) without a token.
// Your bouncer middleware(io.use) intercepts this request, sees that!token is true, goes "Nope!", and sends back an Error("Authentication error...").
// The socket connection is immediately dropped.The io.on("connection") event never fires.
// The server goes back to waiting indefinitely.




// What happens when a user does log in?
//   The user logs in and your backend gives them a JWT.
// The frontend saves that JWT and initiates a socket connection, passing the JWT along(e.g., in auth.token).
// The bouncer middleware(io.use) sees the token, successfully verifies it(jwt.verify), and says "You're good to go".It calls next().
// NOW the io.on("connection", (socket) => { ... }) event fires, and the user is officially connected as a socket client allowing them to create / join rooms!