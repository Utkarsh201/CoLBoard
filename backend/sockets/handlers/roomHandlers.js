import bcrypt from "bcrypt";
import crypto from "crypto";
import { Room } from "../../models/RoomModel.js";
import {
  ROOM_USER_LIMIT,
  emitRoomState,
  getOrCreateRoomState,
  getRoomState,
  hasActiveRoom,
  joinSocketToRoom,
  removeSocketFromRoom,
  sanitizePassword,
  sanitizeRoomId,
} from "../roomState.js";
import { SOCKET_EVENTS } from "../socketEvents.js";

const generateUniqueRoomId = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomId = crypto.randomBytes(3).toString("hex").toUpperCase();
    const existsInMemory = hasActiveRoom(roomId);
    const existsInDb = await Room.exists({ roomId });

    if (!existsInMemory && !existsInDb) {
      return roomId;
    }
  }

  throw new Error("Unable to generate a unique room ID");
};

export const registerRoomHandlers = (io, socket) => {
  socket.on(SOCKET_EVENTS.CREATE_ROOM, async ({ password } = {}) => {
    try {
      const cleanPassword = sanitizePassword(password);
      if (!cleanPassword) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          message: "Password is required to create a room",
        });
        return;
      }

      const roomId = await generateUniqueRoomId();
      const hashedPassword = await bcrypt.hash(cleanPassword, 10);

      await Room.create({
        roomId,
        password: hashedPassword,
        creatorId: socket.userId,
        drawingData: [],
      });

      const roomState = getOrCreateRoomState(roomId, []);
      await joinSocketToRoom(io, socket, roomId, roomState);

      console.log(`Socket ${socket.id} created and joined secure room: ${roomId}`);

      socket.emit(SOCKET_EVENTS.ROOM_CREATED, { roomId });
      socket.emit(SOCKET_EVENTS.ROOM_JOINED, { roomId });
      socket.emit(SOCKET_EVENTS.LOAD_CANVAS, roomState.drawingCache);
      emitRoomState(socket, roomId, roomState);
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: "Failed to create room" });
    }
  });

  socket.on(SOCKET_EVENTS.JOIN_ROOM, async ({ roomId, password } = {}) => {
    try {
      const normalizedRoomId = sanitizeRoomId(roomId);
      const cleanPassword = sanitizePassword(password);

      if (!normalizedRoomId || !cleanPassword) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          message: "Room ID and password are required",
        });
        return;
      }

      const roomDoc = await Room.findOne({ roomId: normalizedRoomId });
      if (!roomDoc) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: "Room does not exist" });
        return;
      }

      const isMatch = await bcrypt.compare(cleanPassword, roomDoc.password);
      if (!isMatch) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: "Invalid password" });
        return;
      }

      const roomState = getOrCreateRoomState(normalizedRoomId, roomDoc.drawingData || []);
      const isAlreadyInRoom =
        socket.currentRoom === normalizedRoomId &&
        roomState.users.some(({ socketId }) => socketId === socket.id);

      if (!isAlreadyInRoom && roomState.users.length >= ROOM_USER_LIMIT) {
        socket.emit(SOCKET_EVENTS.ROOM_FULL, {
          message: `Room is already full. Maximum ${ROOM_USER_LIMIT} users allowed.`,
        });
        return;
      }

      await joinSocketToRoom(io, socket, normalizedRoomId, roomState);

      console.log(`Socket ${socket.id} securely joined room: ${normalizedRoomId}`);

      socket.emit(SOCKET_EVENTS.ROOM_JOINED, { roomId: normalizedRoomId });
      socket.emit(SOCKET_EVENTS.LOAD_CANVAS, roomState.drawingCache);
      emitRoomState(socket, normalizedRoomId, roomState);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: "Failed to join room" });
    }
  });

  socket.on(SOCKET_EVENTS.LEAVE_ROOM, async ({ roomId } = {}) => {
    try {
      const roomToLeave = sanitizeRoomId(roomId) || socket.currentRoom;
      if (!roomToLeave) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          message: "You are not connected to any room",
        });
        return;
      }
      if (socket.currentRoom !== roomToLeave) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          message: "You can only leave your current room",
        });
        return;
      }

      await removeSocketFromRoom(io, socket, roomToLeave);
      socket.emit(SOCKET_EVENTS.ROOM_LEFT, { roomId: roomToLeave });
    } catch (error) {
      console.error("Error leaving room:", error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: "Failed to leave room" });
    }
  });

  socket.on(SOCKET_EVENTS.GET_ROOM_STATE, () => {
    const roomId = socket.currentRoom;
    const roomState = getRoomState(roomId);

    if (!roomId || !roomState) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
        message: "Join a room before requesting room state",
      });
      return;
    }

    emitRoomState(socket, roomId, roomState);
    socket.emit(SOCKET_EVENTS.LOAD_CANVAS, roomState.drawingCache);
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    try {
      await removeSocketFromRoom(io, socket, socket.currentRoom, {
        leaveSocketRoom: false,
      });
    } catch (error) {
      console.error("Error cleaning up disconnected socket:", error);
    }
  });
};
