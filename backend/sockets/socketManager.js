import { socketAuthMiddleware } from "../middlewares/socketAuthMiddleware.js";
import { registerCanvasHandlers } from "./handlers/canvasHandlers.js";
import { registerRoomHandlers } from "./handlers/roomHandlers.js";

export const setupSocket = (io) => {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id, "| DB User ID:", socket.userId);
    registerRoomHandlers(io, socket);
    registerCanvasHandlers(io, socket);
  });
};
