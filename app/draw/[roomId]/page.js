"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import BoardHeader from "@/components/BoardHeader";

const CanvasBoard = dynamic(() => import("@/components/CanvasBoard"), {
  ssr: false,
});

export default function DrawRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const [isValidRoom, setIsValidRoom] = useState(null); // null = loading

  useEffect(() => {
    const socket = io("http://localhost:8080");

    socket.emit("check-room", roomId, (exists) => {
      if (exists) {
        setIsValidRoom(true);
      } else {
        alert("Room does not exist. Please check the room code or create a new room.");
        router.push("/");
      }
    });

    return () => socket.disconnect();
  }, [roomId]);

  if (isValidRoom === null) return <p className="text-center mt-10">Checking room code...</p>;
  if (!isValidRoom) return null;

  return (
    <div className="p-4">
      <BoardHeader roomId={roomId} />
      <CanvasBoard roomId={roomId} />
    </div>
  );
}
