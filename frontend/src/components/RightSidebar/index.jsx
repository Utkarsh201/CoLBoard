import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdDelete } from "react-icons/md";
import { toast } from "react-toastify";
import { BoardContext } from "../../store/BoardContext";
import { CanvasContext } from "../../store/CanvasHistory";
import { apiClient } from "../../utils/apiClient";
import { serializeElements } from "../../utils/Elemenst";

export default function RightSidebar() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    sidebarOpen,
    currentCanvas,
    currentRoom,
    roomUsers,
    socketStatus,
    socketError,
    setSidebarOpen,
    toggleSidebar,
    setCurrentCanvas,
    logout,
    createRoom,
    joinRoom,
    leaveRoom,
    clearSharedCanvas,
  } = useContext(CanvasContext);
  const { SetelementsOnApicall, elements } = useContext(BoardContext);

  const skipNextSaveRef = useRef(false);
  const [allcanvas, setallcanvas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [createRoomPassword, setCreateRoomPassword] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinRoomPassword, setJoinRoomPassword] = useState("");
  const [roomSubmitting, setRoomSubmitting] = useState(false);

  const fetchAllCanvas = useCallback(async () => {
    if (!sidebarOpen || !isAuthenticated) return;

    try {
      setLoading(true);
      setLoadError("");

      const { data } = await apiClient.get("/canvas/getall");
      if (data?.success) {
        setallcanvas(Array.isArray(data.data) ? data.data : []);
      } else {
        setLoadError(data?.message || "Failed to load canvases");
      }
    } catch (error) {
      setLoadError(
        error?.response?.data?.message || error?.message || "Failed to load canvases"
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, sidebarOpen]);

  useEffect(() => {
    fetchAllCanvas();
  }, [fetchAllCanvas]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    if (!isAuthenticated || !currentCanvas || currentRoom) return undefined;

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        await apiClient.put(
          "/canvas/update",
          {
            canvasId: currentCanvas,
            elements: serializeElements(elements),
          },
          { signal: controller.signal }
        );
      } catch (error) {
        if (error?.name !== "CanceledError") {
          console.error(error);
        }
      }
    }, 800);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [currentCanvas, currentRoom, elements, isAuthenticated]);

  const connectionLabel = useMemo(() => {
    switch (socketStatus) {
      case "connected":
        return { text: "Realtime connected", color: "bg-emerald-100 text-emerald-700" };
      case "connecting":
        return { text: "Realtime connecting", color: "bg-amber-100 text-amber-700" };
      case "error":
        return { text: "Realtime error", color: "bg-red-100 text-red-700" };
      case "disconnected":
        return { text: "Realtime disconnected", color: "bg-slate-200 text-slate-700" };
      default:
        return { text: "Realtime idle", color: "bg-slate-200 text-slate-700" };
    }
  }, [socketStatus]);

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login", { replace: true });
  };

  const handleDelete = async (canvasId) => {
    if (!window.confirm("Are you sure you want to delete this canvas?")) return;
    try {
      const { data } = await apiClient.delete(`/canvas/delete/${canvasId}`);
      if (data?.success) {
        if (currentCanvas === canvasId) {
          setCurrentCanvas("");
          skipNextSaveRef.current = true;
          SetelementsOnApicall([]);
        }

        await fetchAllCanvas();
        toast.success(data.message || "Canvas deleted");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  const handleCreateCanvas = async () => {
    try {
      if (currentRoom) {
        await leaveRoom(currentRoom);
      }

      const { data } = await apiClient.post("/canvas/create", {});
      if (data?.success) {
        const canvasId = data?.data?.canvasId || "";
        setCurrentCanvas(canvasId);
        skipNextSaveRef.current = true;
        SetelementsOnApicall([]);
        await fetchAllCanvas();
        toast.success(data.message || "Canvas created");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not create canvas");
    }
  };

  const handleSelectCanvas = async (canvas) => {
    try {
      if (!canvas?._id) return;

      if (currentRoom) {
        await leaveRoom(currentRoom);
      }

      skipNextSaveRef.current = true;
      setCurrentCanvas(canvas._id);
      SetelementsOnApicall(Array.isArray(canvas.elements) ? canvas.elements : []);
      setSidebarOpen(false);
      toast.success("Canvas loaded");
    } catch (error) {
      toast.error(error?.message || "Could not open canvas");
    }
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    if (!createRoomPassword.trim()) {
      toast.error("Enter a room password");
      return;
    }

    try {
      setRoomSubmitting(true);
      const result = await createRoom(createRoomPassword);
      setCurrentCanvas("");
      setCreateRoomPassword("");
      setSidebarOpen(false);
      toast.success(`Room ${result?.roomId || ""} created`);
    } catch (error) {
      toast.error(error?.message || "Could not create room");
    } finally {
      setRoomSubmitting(false);
    }
  };

  const handleJoinRoom = async (event) => {
    event.preventDefault();
    if (!joinRoomId.trim() || !joinRoomPassword.trim()) {
      toast.error("Enter room ID and password");
      return;
    }

    try {
      setRoomSubmitting(true);
      await joinRoom({
        roomId: joinRoomId,
        password: joinRoomPassword,
      });
      setCurrentCanvas("");
      setJoinRoomId("");
      setJoinRoomPassword("");
      setSidebarOpen(false);
      toast.success(`Joined room ${joinRoomId.trim().toUpperCase()}`);
    } catch (error) {
      toast.error(error?.message || "Could not join room");
    } finally {
      setRoomSubmitting(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      skipNextSaveRef.current = true;
      SetelementsOnApicall([]);
      toast.success("Left room");
    } catch (error) {
      toast.error(error?.message || "Could not leave room");
    }
  };

  const handleClearRoom = () => {
    clearSharedCanvas();
    toast.info("Clear request sent to the room");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed right-6 top-6 z-40 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700"
      >
        Workspace
      </button>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeSidebar}
            aria-hidden="true"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">Workspace</p>
                <p className="text-sm text-slate-500">
                  {currentRoom
                    ? `Connected to room ${currentRoom}`
                    : currentCanvas
                      ? "Working on a personal canvas"
                      : "Choose a canvas or join a room"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${connectionLabel.color}`}
                >
                  {connectionLabel.text}
                </span>
                <button
                  type="button"
                  onClick={closeSidebar}
                  className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                  aria-label="Close sidebar"
                >
                  X
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <section className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Personal Canvases</h2>
                    <p className="text-sm text-slate-500">
                      Save your own whiteboards to the backend.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateCanvas}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Create Canvas
                  </button>
                </div>

                <div className="space-y-3">
                  {loading ? <p className="text-sm text-slate-500">Loading canvases...</p> : null}
                  {!loading && loadError ? (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                      {loadError}
                    </p>
                  ) : null}
                  {!loading && !loadError && allcanvas.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No personal canvases yet. Create one to start saving your work.
                    </p>
                  ) : null}

                  {allcanvas.map((canvas, index) => (
                    <div
                      key={canvas._id}
                      className={`flex items-center justify-between rounded-2xl border p-3 transition ${
                        currentCanvas === canvas._id && !currentRoom
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectCanvas(canvas)}
                        className="flex-1 text-left"
                      >
                        <p className="font-medium text-slate-900">Canvas {index + 1}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(canvas.updatedAt || canvas.createdAt || Date.now()).toLocaleString()}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(canvas._id);
                        }}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete canvas"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-slate-200 p-4">
                <div className="mb-3">
                  <h2 className="text-base font-semibold text-slate-900">Collaboration Room</h2>
                  <p className="text-sm text-slate-500">
                    Create a private room or join one with its password.
                  </p>
                </div>

                {socketError ? (
                  <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                    {socketError}
                  </p>
                ) : null}

                {currentRoom ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Active Room
                      </p>
                      <p className="mt-1 text-2xl font-bold tracking-[0.2em] text-slate-900">
                        {currentRoom}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {roomUsers.length} collaborator{roomUsers.length === 1 ? "" : "s"} connected
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-3">
                      <p className="mb-2 text-sm font-semibold text-slate-700">Connected users</p>
                      <div className="flex flex-wrap gap-2">
                        {roomUsers.map((user) => (
                          <span
                            key={user.socketId}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {user.userId?.slice(-6) || "user"}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleLeaveRoom}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Leave Room
                      </button>
                      <button
                        type="button"
                        onClick={handleClearRoom}
                        className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
                      >
                        Clear Shared Canvas
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <form className="space-y-3 rounded-2xl bg-slate-50 p-4" onSubmit={handleCreateRoom}>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Create room</p>
                        <p className="text-xs text-slate-500">
                          Start a new private collaboration session.
                        </p>
                      </div>
                      <input
                        type="password"
                        value={createRoomPassword}
                        onChange={(event) => setCreateRoomPassword(event.target.value)}
                        placeholder="Room password"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                      />
                      <button
                        type="submit"
                        disabled={roomSubmitting || socketStatus !== "connected"}
                        className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Create Room
                      </button>
                    </form>

                    <form className="space-y-3 rounded-2xl bg-slate-50 p-4" onSubmit={handleJoinRoom}>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Join room</p>
                        <p className="text-xs text-slate-500">
                          Enter the room ID and password shared with you.
                        </p>
                      </div>
                      <input
                        type="text"
                        value={joinRoomId}
                        onChange={(event) => setJoinRoomId(event.target.value.toUpperCase())}
                        placeholder="Room ID"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase outline-none transition focus:border-blue-400"
                      />
                      <input
                        type="password"
                        value={joinRoomPassword}
                        onChange={(event) => setJoinRoomPassword(event.target.value)}
                        placeholder="Room password"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                      />
                      <button
                        type="submit"
                        disabled={roomSubmitting || socketStatus !== "connected"}
                        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Join Room
                      </button>
                    </form>
                  </div>
                )}
              </section>
            </div>

            <div className="border-t px-5 py-4">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Logout
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
