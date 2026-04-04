import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { apiClient } from "../utils/apiClient";
import { SOCKET_EVENTS } from "../socketEvents";
import { CanvasContext } from "./CanvasHistory";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const SOCKET_TIMEOUT_MS = 10000;
const ROOM_SESSION_STORAGE_KEY = "colboard-room-session";

const readStoredRoomSession = () => {
  if (typeof window === "undefined") return null;

  try {
    const rawSession = window.sessionStorage.getItem(ROOM_SESSION_STORAGE_KEY);
    if (!rawSession) return null;

    const parsedSession = JSON.parse(rawSession);
    if (!parsedSession?.roomId || !parsedSession?.password) {
      return null;
    }

    return {
      roomId: String(parsedSession.roomId).trim().toUpperCase(),
      password: String(parsedSession.password),
    };
  } catch (error) {
    console.warn("Failed to read room session", error);
    return null;
  }
};

const persistRoomSession = (roomSession) => {
  if (typeof window === "undefined") return;

  if (!roomSession?.roomId || !roomSession?.password) {
    window.sessionStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    ROOM_SESSION_STORAGE_KEY,
    JSON.stringify({
      roomId: String(roomSession.roomId).trim().toUpperCase(),
      password: String(roomSession.password),
    })
  );
};

const clearStoredRoomSession = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
};

const CanvasContextProvider = ({ children }) => {
  const [accessToken, setAccessTokenState] = useState(
    () => localStorage.getItem("token") || ""
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentCanvas, setCurrentCanvasState] = useState("");
  const [currentRoom, setCurrentRoomState] = useState("");
  const [roomUsers, setRoomUsers] = useState([]);
  const [socketStatus, setSocketStatus] = useState("idle");
  const [socketError, setSocketError] = useState("");
  const socketRef = useRef(null);
  const roomSessionRef = useRef(readStoredRoomSession());

  const isAuthenticated = Boolean(accessToken);

  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("token", accessToken);
      return;
    }

    localStorage.removeItem("token");
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !backendUrl) {
      cleanupSocket();
      setSocketStatus(accessToken ? "unavailable" : "idle");
      setSocketError(accessToken && !backendUrl ? "Missing VITE_BACKEND_URL" : "");
      setCurrentRoomState("");
      setRoomUsers([]);
      return undefined;
    }

    const socket = io(backendUrl, {
      transports: ["websocket"],
      auth: { token: `Bearer ${accessToken}` },
      reconnection: true,
      timeout: SOCKET_TIMEOUT_MS,
    });

    socketRef.current = socket;
    setSocketStatus("connecting");
    setSocketError("");

    const handleConnect = () => {
      setSocketStatus("connected");
      setSocketError("");

      const roomSession = roomSessionRef.current;
      if (roomSession?.roomId && roomSession?.password) {
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomSession);
      }
    };

    const handleDisconnect = () => {
      setSocketStatus("disconnected");
      setRoomUsers([]);
    };

    const handleConnectError = (error) => {
      setSocketStatus("error");
      setSocketError(error?.message || "Failed to connect to realtime server");
      setRoomUsers([]);
    };

    const handleRoomJoined = ({ roomId } = {}) => {
      setCurrentRoomState(roomId || "");
      setCurrentCanvasState("");
      setSocketError("");
    };

    const handleRoomLeft = () => {
      setCurrentRoomState("");
      setRoomUsers([]);
      roomSessionRef.current = null;
      clearStoredRoomSession();
    };

    const handleRoomState = ({ roomId, users } = {}) => {
      if (roomId) {
        setCurrentRoomState(roomId);
      }
      setRoomUsers(Array.isArray(users) ? users : []);
    };

    const handleUserListUpdate = (users = []) => {
      setRoomUsers(Array.isArray(users) ? users : []);
    };

    const handleRoomError = ({ message } = {}) => {
      const nextMessage = message || "Realtime request failed";
      setSocketError(nextMessage);

      if (
        nextMessage === "Room does not exist" ||
        nextMessage === "Invalid password" ||
        nextMessage === "Room ID and password are required"
      ) {
        roomSessionRef.current = null;
        clearStoredRoomSession();
        setCurrentRoomState("");
        setRoomUsers([]);
      }
    };

    const handleRoomFull = ({ message } = {}) => {
      setSocketError(message || "Room is already full");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
    socket.on(SOCKET_EVENTS.ROOM_LEFT, handleRoomLeft);
    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    socket.on(SOCKET_EVENTS.USER_LIST_UPDATE, handleUserListUpdate);
    socket.on(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
    socket.on(SOCKET_EVENTS.ROOM_FULL, handleRoomFull);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
      socket.off(SOCKET_EVENTS.ROOM_LEFT, handleRoomLeft);
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
      socket.off(SOCKET_EVENTS.USER_LIST_UPDATE, handleUserListUpdate);
      socket.off(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
      socket.off(SOCKET_EVENTS.ROOM_FULL, handleRoomFull);
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [accessToken, cleanupSocket]);

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token || "");
    if (!token) {
      setCurrentCanvasState("");
      setCurrentRoomState("");
      setRoomUsers([]);
      setSidebarOpen(false);
      setSocketError("");
      roomSessionRef.current = null;
      clearStoredRoomSession();
      cleanupSocket();
    }
  }, [cleanupSocket]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((value) => !value);
  }, []);

  const setCurrentCanvas = useCallback((canvasId) => {
    setCurrentCanvasState(canvasId || "");
  }, []);

  const emitWithResponse = useCallback(
    ({ emitEvent, payload, successEvent, match = () => true }) =>
      new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket || socketStatus === "error") {
          reject(new Error("Realtime connection is not ready"));
          return;
        }

        let timeoutId;

        const cleanup = () => {
          clearTimeout(timeoutId);
          socket.off(successEvent, handleSuccess);
          socket.off(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
          socket.off(SOCKET_EVENTS.ROOM_FULL, handleRoomFull);
          socket.off("connect_error", handleConnectError);
        };

        const handleSuccess = (data) => {
          if (!match(data)) return;
          cleanup();
          resolve(data);
        };

        const handleRoomError = ({ message } = {}) => {
          cleanup();
          reject(new Error(message || "Realtime request failed"));
        };

        const handleConnectError = (error) => {
          cleanup();
          reject(error instanceof Error ? error : new Error("Realtime connection failed"));
        };

        const handleRoomFull = ({ message } = {}) => {
          cleanup();
          reject(new Error(message || "Room is already full"));
        };

        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`Timed out waiting for ${successEvent}`));
        }, SOCKET_TIMEOUT_MS);

        socket.on(successEvent, handleSuccess);
        socket.on(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
        socket.on(SOCKET_EVENTS.ROOM_FULL, handleRoomFull);
        socket.on("connect_error", handleConnectError);
        socket.emit(emitEvent, payload);
      }),
    [socketStatus]
  );

  const login = useCallback(async ({ email, password }) => {
    const { data } = await apiClient.post("/user/login", { email, password });
    const token = data?.data?.access_token;
    if (!token) {
      throw new Error("Login succeeded but no access token was returned");
    }

    setAccessTokenState(token);
    return data;
  }, []);

  const signup = useCallback(
    async ({ username, email, password }) => {
      await apiClient.post("/user/register", { username, email, password });
      return login({ email, password });
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/user/logout", {});
    } catch (error) {
      console.warn("Logout request failed, clearing session locally", error);
    } finally {
      setAccessToken("");
    }
  }, [setAccessToken]);

  const createRoom = useCallback(
    async (password) => {
      const sanitizedPassword = String(password || "").trim();
      const result = await emitWithResponse({
        emitEvent: SOCKET_EVENTS.CREATE_ROOM,
        payload: { password: sanitizedPassword },
        successEvent: SOCKET_EVENTS.ROOM_CREATED,
      });

      if (result?.roomId) {
        roomSessionRef.current = {
          roomId: result.roomId,
          password: sanitizedPassword,
        };
        persistRoomSession(roomSessionRef.current);
      }

      setCurrentCanvasState("");
      return result;
    },
    [emitWithResponse]
  );

  const joinRoom = useCallback(
    async ({ roomId, password }) => {
      const normalizedRoomId = String(roomId || "").trim().toUpperCase();
      const sanitizedPassword = String(password || "").trim();
      const result = await emitWithResponse({
        emitEvent: SOCKET_EVENTS.JOIN_ROOM,
        payload: { roomId: normalizedRoomId, password: sanitizedPassword },
        successEvent: SOCKET_EVENTS.ROOM_JOINED,
        match: (payload) =>
          !normalizedRoomId ||
          !payload?.roomId ||
          payload.roomId.toUpperCase() === normalizedRoomId,
      });

      if (result?.roomId) {
        roomSessionRef.current = {
          roomId: result.roomId,
          password: sanitizedPassword,
        };
        persistRoomSession(roomSessionRef.current);
      }

      setCurrentCanvasState("");
      return result;
    },
    [emitWithResponse]
  );

  const leaveRoom = useCallback(
    async (roomId = currentRoom) => {
      if (!roomId) return null;

      const result = await emitWithResponse({
        emitEvent: SOCKET_EVENTS.LEAVE_ROOM,
        payload: { roomId },
        successEvent: SOCKET_EVENTS.ROOM_LEFT,
        match: (payload) => !payload?.roomId || payload.roomId === roomId,
      });

      setCurrentRoomState("");
      setRoomUsers([]);
      roomSessionRef.current = null;
      clearStoredRoomSession();
      return result;
    },
    [currentRoom, emitWithResponse]
  );

  const clearSharedCanvas = useCallback(() => {
    if (!socketRef.current || !currentRoom) return;

    socketRef.current.emit(SOCKET_EVENTS.CLEAR_CANVAS, { roomId: currentRoom });
  }, [currentRoom]);

  const requestRoomState = useCallback(() => {
    if (!socketRef.current || !currentRoom) return;

    socketRef.current.emit(SOCKET_EVENTS.GET_ROOM_STATE);
  }, [currentRoom]);

  const value = useMemo(
    () => ({
      accessToken,
      isAuthenticated,
      sidebarOpen,
      currentCanvas,
      currentRoom,
      roomUsers,
      socketStatus,
      socketError,
      socket: socketRef.current,
      setAccessToken,
      setSidebarOpen,
      toggleSidebar,
      setCurrentCanvas,
      login,
      signup,
      logout,
      createRoom,
      joinRoom,
      leaveRoom,
      clearSharedCanvas,
      requestRoomState,
    }),
    [
      accessToken,
      clearSharedCanvas,
      createRoom,
      currentCanvas,
      currentRoom,
      isAuthenticated,
      joinRoom,
      leaveRoom,
      login,
      logout,
      requestRoomState,
      roomUsers,
      setAccessToken,
      setCurrentCanvas,
      sidebarOpen,
      signup,
      socketError,
      socketStatus,
      toggleSidebar,
    ]
  );

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};

export default CanvasContextProvider;
