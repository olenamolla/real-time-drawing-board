"use client";
import { useEffect, useState } from "react";
import { auth, provider, signInWithPopup } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user || null);
      if (user) {
        router.push("/draw"); // Redirect when signed in
      } 
      else {
        setCheckingAuth(false); // <- now we’re done checking
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    await signInWithPopup(auth, provider);
  };

  // Don’t render anything while checking auth
  if (checkingAuth) return null;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Drawing Board</h1>
      <p className="mb-4">Please sign in with Google to start drawing</p>
      <button
        onClick={handleLogin}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        Sign in with Google
      </button>
    </main>
  );
}
