"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { io } from "socket.io-client";

export default function DrawLobbyPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  const generateCode = () => Math.random().toString(36).substring(2, 8);

  const handleCreate = () => {
    console.log("🟢 Creating room...");
    const code = generateCode();
    const socket = io("http://localhost:8080");

    socket.emit("create-room", code, () => {
      console.log("✅ Room created:", code);
      socket.disconnect();
      router.push(`/draw/${code}`);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
    });
  };

  const handleJoin = () => {
    const code = joinCode.trim();
    if (!code) return alert("Please enter room code.");

    const socket = io("http://localhost:8080");
    socket.emit("check-room", code, (exists) => {
      if (exists) {
        socket.disconnect();
        router.push(`/draw/${code}`);
      } else {
        alert("This room does not exist yet. Please check again or create a new room.");
        socket.disconnect();
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-8 p-6">
      <h1 className="text-3xl font-bold">🎨 Collaborative Drawing</h1>

      <button
        onClick={handleCreate}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        + Create new room
      </button>

      <div className="flex flex-col items-center gap-3">
        <input
          type="text"
          placeholder="Enter room code..."
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="border p-2 rounded w-64"
        />
        <button
          onClick={handleJoin}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Join room
        </button>
      </div>
    </div>
  );
}
