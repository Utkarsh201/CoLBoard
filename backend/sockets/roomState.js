import { Room } from "../models/RoomModel.js";
import { SOCKET_EVENTS } from "./socketEvents.js";

const ROOM_DELETION_DELAY_MS = 5 * 60 * 1000;
const ROOM_PERSIST_DELAY_MS = 750;

const activeRooms = {};
const persistTimers = {};

export const ROOM_USER_LIMIT = 5;

export const sanitizeRoomId = (roomId = "") =>
  typeof roomId === "string" ? roomId.trim().toUpperCase() : "";

export const sanitizePassword = (password = "") =>
  typeof password === "string" ? password.trim() : "";

export const sanitizeElements = (elements) =>
  Array.isArray(elements)
    ? elements.filter((element) => element && typeof element === "object" && !Array.isArray(element))
    : [];

export const hasActiveRoom = (roomId) => Boolean(activeRooms[roomId]);

export const getRoomState = (roomId) => activeRooms[roomId] || null;

export const getPublicUsers = (roomState) =>
  roomState.users.map(({ socketId, userId }) => ({ socketId, userId }));

export const getOrCreateRoomState = (roomId, drawingData = []) => {
  if (!activeRooms[roomId]) {
    activeRooms[roomId] = {
      users: [],
      drawingCache: sanitizeElements(drawingData),
      deletionTimer: null,
    };
  }

  return activeRooms[roomId];
};

const clearDeletionTimer = (roomState) => {
  if (roomState?.deletionTimer) {
    clearTimeout(roomState.deletionTimer);
    roomState.deletionTimer = null;
  }
};

const clearPersistTimer = (roomId) => {
  if (persistTimers[roomId]) {
    clearTimeout(persistTimers[roomId]);
    delete persistTimers[roomId];
  }
};

export const persistRoomState = async (roomId) => {
  const roomState = activeRooms[roomId];
  if (!roomState) return;

  await Room.updateOne(
    { roomId },
    { $set: { drawingData: roomState.drawingCache } }
  );
};

export const scheduleRoomPersistence = (roomId) => {
  clearPersistTimer(roomId);

  persistTimers[roomId] = setTimeout(async () => {
    try {
      await persistRoomState(roomId);
    } catch (error) {
      console.error("Failed to persist room state:", error);
    } finally {
      delete persistTimers[roomId];
    }
  }, ROOM_PERSIST_DELAY_MS);
};

export const emitRoomUsers = (io, roomId) => {
  const roomState = activeRooms[roomId];
  if (!roomState) return;

  io.to(roomId).emit(SOCKET_EVENTS.USER_LIST_UPDATE, getPublicUsers(roomState));
};

export const emitRoomState = (socket, roomId, roomState) => {
  socket.emit(SOCKET_EVENTS.ROOM_STATE, {
    roomId,
    elements: roomState.drawingCache,
    users: getPublicUsers(roomState),
  });
};

const scheduleRoomDeletion = (io, roomId) => {
  const roomState = activeRooms[roomId];
  if (!roomState) return;

  clearDeletionTimer(roomState);

  roomState.deletionTimer = setTimeout(async () => {
    try {
      await persistRoomState(roomId);
      await Room.deleteOne({ roomId });
      clearPersistTimer(roomId);
      delete activeRooms[roomId];
      console.log(`Room ${roomId} was deleted after staying empty.`);
    } catch (error) {
      console.error("Failed to auto-delete room:", error);
    }
  }, ROOM_DELETION_DELAY_MS);
};



export const removeSocketFromRoom = async (
  io,
  socket,
  roomId,
  { leaveSocketRoom = true } = {}
) => {
  if (!roomId) return;

  const roomState = activeRooms[roomId];
  if (leaveSocketRoom && socket.rooms?.has(roomId)) {
    socket.leave(roomId);
  }

  if (socket.currentRoom === roomId) {
    socket.currentRoom = null;
  }

  if (!roomState) return;

  const usersBeforeRemoval = roomState.users.length;
  roomState.users = roomState.users.filter(({ socketId }) => socketId !== socket.id);
  const userWasRemoved = roomState.users.length !== usersBeforeRemoval;

  if (!userWasRemoved) return;

  emitRoomUsers(io, roomId);

  if (roomState.users.length === 0) {
    scheduleRoomDeletion(io, roomId);
  }
};

export const joinSocketToRoom = async (io, socket, roomId, roomState) => {
  if (socket.currentRoom && socket.currentRoom !== roomId) {
    await removeSocketFromRoom(io, socket, socket.currentRoom);
  }

  clearDeletionTimer(roomState);
  socket.join(roomId);
  socket.currentRoom = roomId;

  const alreadyTracked = roomState.users.some(({ socketId }) => socketId === socket.id);
  if (!alreadyTracked) {
    roomState.users.push({ socketId: socket.id, userId: socket.userId });
  }

  emitRoomUsers(io, roomId);
};
