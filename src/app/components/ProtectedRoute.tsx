"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "./WalletContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isConnected, isInitialized } = useWallet();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only redirect if we've finished initializing and wallet is not connected
    if (isInitialized && !isConnected) {
      setIsRedirecting(true);
      
      // Small delay to show the redirect message
      const timer = setTimeout(() => {
        router.push('/');
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setIsRedirecting(false);
    }
  }, [isConnected, isInitialized, router]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="text-center bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20 max-w-md mx-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          
          <h2 className="text-2xl font-bold mb-3">Loading...</h2>
          <p className="text-white/80">
            Checking wallet connection...
          </p>
        </div>
      </div>
    );
  }

  // Show redirect message if not connected and redirecting
  if (!isConnected || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="text-center bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20 max-w-md mx-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          
          <h2 className="text-2xl font-bold mb-3">🔒 Access Restricted</h2>
          <p className="text-white/80 mb-4">
            You need to connect your wallet to access this page
          </p>
          
          <div className="text-sm text-white/60">
            <p>Redirecting to wallet connection...</p>
          </div>
          
          {/* Manual redirect button */}
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 text-white font-medium"
          >
            Go to Wallet Connect
          </button>
        </div>
      </div>
    );
  }

  // If wallet is connected, render the protected content
  return <>{children}</>;
}
