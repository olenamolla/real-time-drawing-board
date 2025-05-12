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
    <main className="relative flex flex-col items-center justify-center min-h-screen">
      
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
        backgroundImage: 'url("pictures/homepg.png")',
        opacity: 0.8,
        zIndex: 0,
      }}
    />


<div className="relative z-10 text-center px-6">
  <div className="bg-blue-200 bg-opacity-90 rounded-lg shadow-lg p-10 max-w-xl mx-auto">
    <h1 className="text-3xl font-bold mb-4 text-gray-900">
      Welcome to the Drawing Board
    </h1>
    <p className="mb-4 text-gray-800">
      Please sign in with Google to start drawing
    </p>
    <button
      onClick={handleLogin}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
    >
      Sign in with Google
    </button>
  </div>
</div>
    </main>
  );
}
