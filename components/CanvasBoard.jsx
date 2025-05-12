"use client";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

const SOCKET_URL = "http://localhost:8080";

export default function CanvasBoard({ roomId }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const socketRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef({});
  const localPosRef = useRef(null);
  const drawHistoryRef = useRef([]);
  const [isEraser, setIsEraser] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000"); // default black color
  const selectedColorRef = useRef(selectedColor);
  const isEraserRef = useRef(isEraser); 
  const [users, setUsers] = useState([]);
  const [cursorPos, setCursorPos] = useState(null); // For showing local user name during draw

  const router = useRouter();

  function getColor(isEraser, selectedColor) {
    return isEraser ? "white" : selectedColor;
  }

  function createDrawingHandlers(ctxRef, socketRef, drawing, localPosRef, drawHistoryRef, selectedColorRef, isEraserRef) {
    const down = (e) => {
      drawing.current = true;
      const { offsetX: x, offsetY: y } = e;
      const color = getColor(isEraserRef.current, selectedColorRef.current);
      const lineWidth = isEraserRef.current ? 20 : 2;
      
      setCursorPos({ x, y }); //  Show name near stroke


      localPosRef.current = { x, y };
      ctxRef.current.beginPath();
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = lineWidth;
      ctxRef.current.moveTo(x, y);
      socketRef.current.emit("start", { x, y, color, lineWidth }); // send name
      drawHistoryRef.current.push({ id: socketRef.current.id, x, y, color, lineWidth, type: "start" });
    };

    const move = (e) => {
      if (!drawing.current) return;
      const { offsetX: x, offsetY: y } = e;
      const prev = localPosRef.current;
      setCursorPos({ x, y }); // Update name label position

      if (!prev) {
        localPosRef.current = { x, y };
        return;
      }
      const color = getColor(isEraserRef.current, selectedColorRef.current);
      const lineWidth = isEraserRef.current ? 20 :2;
      

      ctxRef.current.beginPath();
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = lineWidth;
      ctxRef.current.moveTo(prev.x, prev.y);
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();

      

      localPosRef.current = { x, y };
      socketRef.current.emit("draw", { x, y, color, lineWidth });
      drawHistoryRef.current.push({ id: socketRef.current.id, x, y, color, lineWidth, type: "draw" });
    };

    const up = () => {
      if (drawing.current) {
        socketRef.current.emit("end", { id: socketRef.current.id });
        ctxRef.current.beginPath();
        localPosRef.current = null;
        setCursorPos(null); //  Hide name when done
      }
      drawing.current = false;
    };

    return { down, move, up };
  }

  useEffect(() => {
    selectedColorRef.current = selectedColor;
  }, [selectedColor]);
  
  useEffect(() => {
    isEraserRef.current = isEraser;
  }, [isEraser]);
  

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    const socket = io(SOCKET_URL, { query: { roomId } });
    socketRef.current = socket;

    socket.emit("join-room", {
      roomId,
      displayName: auth.currentUser?.displayName || "Anonymous",
    });

    // Check if the room exists
    socket.on("update-users", (userList) => {
      setUsers(userList);
    });

    socket.on("history", (events) => {
      const lp = {};
      for (const ev of events) {
        ctx.beginPath();
        ctx.strokeStyle = ev.color;
        ctx.lineWidth = ev.lineWidth;
        if (ev.type === "start") {
          ctx.moveTo(ev.x, ev.y);
          lp[ev.id] = { x: ev.x, y: ev.y };
        } else if (ev.type === "draw") {
          const prev = lp[ev.id];
          if (!prev) continue;
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(ev.x, ev.y);
          ctx.stroke();
          lp[ev.id] = { x: ev.x, y: ev.y };
        }
        drawHistoryRef.current.push(ev);
      }
      lastPos.current = lp;
    });

    socket.emit("request-history");

    socket.on("start", ({ id, x, y, color, lineWidth }) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.moveTo(x, y);
      lastPos.current[id] = { x, y };
      drawHistoryRef.current.push({ id, x, y, color, lineWidth, name, type: "start" });

    });

    socket.on("draw", ({ id, x, y, color, lineWidth }) => {
      const prev = lastPos.current[id];
      if (!prev) return;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      
      lastPos.current[id] = { x, y };
      drawHistoryRef.current.push({ id, x, y, color, lineWidth, name, type: "draw" });
    });

    socket.on("end", ({ id }) => {
      delete lastPos.current[id];
    });

    socket.on("clear", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastPos.current = {};
      drawHistoryRef.current = [];
    });

    const { down, move, up } = createDrawingHandlers(
      ctxRef,
      socketRef,
      drawing,
      localPosRef,
      drawHistoryRef,
      selectedColorRef,
      isEraserRef
    );


    canvas.addEventListener("mousedown", down);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", up);
    canvas.addEventListener("mouseleave", up);

    return () => {
      canvas.removeEventListener("mousedown", down);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", up);
      canvas.removeEventListener("mouseleave", up);
      socket.disconnect();
    };
  }, [roomId]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    lastPos.current = {};
    localPosRef.current = null;
    drawHistoryRef.current = [];
    socketRef.current.emit("clear");
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleDownload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvasRef.current.width;
    canvas.height = canvasRef.current.height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const last = {};

    for (const ev of drawHistoryRef.current) {
      ctx.beginPath();
      ctx.strokeStyle = ev.color;
      ctx.lineWidth = ev.lineWidth;

      if (ev.type === "start") {
        ctx.moveTo(ev.x, ev.y);
        last[ev.id] = { x: ev.x, y: ev.y };
      } else if (ev.type === "draw") {
        const prev = last[ev.id] || { x: ev.x, y: ev.y };
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(ev.x, ev.y);
        ctx.stroke();
        last[ev.id] = { x: ev.x, y: ev.y };
      }
    }

    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <> 
    
    {/* 🔹 Floating name during draw */}
    {cursorPos && (
        <div
          className="absolute pointer-events-none text-xs font-medium text-black bg-white/80 px-1 rounded z-50"
          style={{
            top: cursorPos.y + 2,
            left: cursorPos.x + 6,
          }}
        >
          {auth.currentUser?.displayName || "Anonymous"}
        </div>
      )}

    {/* Connected Users Panel */}
    <div className="absolute top-20 left-6 w-52 max-h-64 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md p-3 text-sm z-50">
      <h3 className="font-semibold mb-2">👥 Connected:</h3>
      <ul className="space-y-1">
        {users.map((user) => (
          <li key={user.id} className="text-gray-700">
            • {user.name}
          </li>
        ))}
      </ul>
    </div>


    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-6">
      <div className="mb-3 flex gap-3 justify-center flex-wrap">

      <div className="flex items-center gap-3">
      <label htmlFor="colorPicker" className="text-lg font-semibold text-gray-800">
        Brush
      </label>

          <div className="w-12 h-10 rounded-md border-2 border-gray-400 bg-white shadow-sm p-0.5">
          <input
            id="colorPicker"
            type="color"
            value={selectedColor}
            onChange={(e) => {
              setSelectedColor(e.target.value);
              setIsEraser(false);
            }}
            className="w-full h-full cursor-pointer border-none hover:scale-105"
            title="Select brush color"
            style={{
              WebkitAppearance: "none",
              MozAppearance: "none",
              appearance: "none",
              background: "none",
              padding: 0,
              border: "none",
            }}
          />
        </div>
      </div>

        <button
          onClick={handleClear}
          className="px-4 py-1 rounded bg-red-600 text-white hover:bg-red-700"
        >
          Clear board
        </button>
        <button
          onClick={() => setIsEraser((prev) => !prev)}
          className={`px-4 py-1 rounded ${
            isEraser ? "bg-yellow-500" : "bg-gray-600"
          } text-white hover:opacity-90`}
        >
          {isEraser ? "Eraser: ON" : "Eraser: OFF"}
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Download
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-1 rounded bg-gray-800 text-white hover:bg-gray-900"
        >
          Log out
        </button>
      </div>

      <div className="w-full max-w-6xl aspect-video">
        <canvas
          ref={canvasRef}
          className="w-full h-full block border border-gray-400 rounded shadow"
          style={{
            cursor: isEraser
              ? 'url("/icons/eraser-cursor.png") 12 12, auto'
              : "crosshair",
          }}
        />
      </div>
    </div>

    </> 
  );
}
