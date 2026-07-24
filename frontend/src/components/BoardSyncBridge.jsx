import { useContext, useEffect, useRef } from "react";
import { SOCKET_EVENTS } from "../socketEvents";
import { BoardContext } from "../store/BoardContext";
import { CanvasContext } from "../store/CanvasHistory";
import { serializeElements } from "../utils/Elemenst";

export default function BoardSyncBridge() {
  const { currentRoom, socket } = useContext(CanvasContext);
  const { elements, SetelementsOnApicall } = useContext(BoardContext);
  const skipNextEmitRef = useRef(false);
  const roomReadyRef = useRef(false);

  useEffect(() => {
    if (!socket || !currentRoom) return undefined;
    roomReadyRef.current = false;

    const applyIncomingElements = (payload) => {
      const nextElements = Array.isArray(payload) ? payload : payload?.elements;
      if (!Array.isArray(nextElements)) return;

      skipNextEmitRef.current = true;
      SetelementsOnApicall(nextElements);
      roomReadyRef.current = true;
    };

    const handleCanvasUpdated = (payload) => {
      if (payload?.roomId && payload.roomId !== currentRoom) return;
      applyIncomingElements(payload);
    };

    socket.on(SOCKET_EVENTS.LOAD_CANVAS, applyIncomingElements);
    socket.on(SOCKET_EVENTS.CANVAS_UPDATED, handleCanvasUpdated);
    socket.emit(SOCKET_EVENTS.GET_ROOM_STATE);

    return () => {
      socket.off(SOCKET_EVENTS.LOAD_CANVAS, applyIncomingElements);
      socket.off(SOCKET_EVENTS.CANVAS_UPDATED, handleCanvasUpdated);
      roomReadyRef.current = false;
    };
  }, [currentRoom, socket, SetelementsOnApicall]);

  useEffect(() => {
    if (!socket || !currentRoom) return undefined;
    if (!roomReadyRef.current) return undefined;

    if (skipNextEmitRef.current) {
      skipNextEmitRef.current = false;
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.CANVAS_UPDATE, {
        roomId: currentRoom,
        elements: serializeElements(elements),
      });
    }, 220);

    return () => clearTimeout(timeoutId);
  }, [currentRoom, elements, socket]);

  return null;
}
