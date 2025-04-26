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
  const router = useRouter();

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
      drawHistoryRef.current.push({ id, x, y, color, lineWidth, type: "start" });
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
      drawHistoryRef.current.push({ id, x, y, color, lineWidth, type: "draw" });
    });

    socket.on("end", ({ id }) => {
      delete lastPos.current[id];
    });

    socket.on("clear", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastPos.current = {};
      drawHistoryRef.current = [];
    });

    const down = (e) => {
      drawing.current = true;
      const { offsetX: x, offsetY: y } = e;
      const color = isEraser ? "white" : "black";
      const lineWidth = isEraser ? 20 : 2;
      localPosRef.current = { x, y };
      socket.emit("start", { x, y, color, lineWidth });
      drawHistoryRef.current.push({ id: socketRef.current.id, x, y, color, lineWidth, type: "start" });
    };

    const move = (e) => {
      if (!drawing.current) return;
      const { offsetX: x, offsetY: y } = e;
      const prev = localPosRef.current;
      if (!prev) {
        localPosRef.current = { x, y };
        return;
      }
      const color = isEraser ? "white" : "black";
      const lineWidth = isEraser ? 20 : 2;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      localPosRef.current = { x, y };
      socket.emit("draw", { x, y, color, lineWidth });
      drawHistoryRef.current.push({ id: socketRef.current.id, x, y, color, lineWidth, type: "draw" });
    };

    const up = () => {
      if (drawing.current) {
        socket.emit("end", { id: socketRef.current.id });
        ctx.beginPath();
        localPosRef.current = null;
      }
      drawing.current = false;
    };

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
  }, [isEraser, roomId]);

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
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-6">
      <div className="mb-3 flex gap-3 justify-center flex-wrap">
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
  );
}
