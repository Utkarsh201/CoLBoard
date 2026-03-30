import {
  getRoomState,
  sanitizeElements,
  sanitizeRoomId,
  scheduleRoomPersistence,
} from "../roomState.js";
import { SOCKET_EVENTS } from "../socketEvents.js";

export const registerCanvasHandlers = (io, socket) => {
  socket.on(SOCKET_EVENTS.CANVAS_UPDATE, async ({ roomId, elements } = {}) => {
    try {
      const activeRoomId = sanitizeRoomId(roomId) || socket.currentRoom;
      const roomState = getRoomState(activeRoomId);

      if (!activeRoomId || socket.currentRoom !== activeRoomId || !roomState) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          message: "Join a room before updating the canvas",
        });
        return;
      }

      const nextElements = sanitizeElements(elements);
      roomState.drawingCache = nextElements;
      scheduleRoomPersistence(activeRoomId);

      io.to(activeRoomId).emit(SOCKET_EVENTS.CANVAS_UPDATED, {
        roomId: activeRoomId,
        elements: nextElements,
        updatedBy: socket.userId,
      });
    } catch (error) {
      console.error("Error updating canvas:", error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: "Failed to update canvas" });
    }
  });

  socket.on(SOCKET_EVENTS.CLEAR_CANVAS, async ({ roomId } = {}) => {
    try {
      const activeRoomId = sanitizeRoomId(roomId) || socket.currentRoom;
      const roomState = getRoomState(activeRoomId);

      if (!activeRoomId || socket.currentRoom !== activeRoomId || !roomState) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          message: "Join a room before clearing the canvas",
        });
        return;
      }

      roomState.drawingCache = [];
      scheduleRoomPersistence(activeRoomId);

      io.to(activeRoomId).emit(SOCKET_EVENTS.CANVAS_UPDATED, {
        roomId: activeRoomId,
        elements: [],
        updatedBy: socket.userId,
      });
    } catch (error) {
      console.error("Error clearing canvas:", error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: "Failed to clear canvas" });
    }
  });
};
