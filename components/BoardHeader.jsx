"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function BoardHeader({ roomId }) {   // Get directly from prop
  const [userName, setUserName] = useState("Guest");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserName(user.displayName || user.email || "User");
    });
    return () => unsub();
  }, []);

  return (
    <header className="flex justify-between items-center mb-3 p-3 bg-gray-800 text-white rounded shadow">
      <span>
        Welcome, <strong>{userName}</strong> 👋
      </span>
      <span>
        Room: <strong>{roomId}</strong>
      </span>
    </header>
  );
}
