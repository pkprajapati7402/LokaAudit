"use client";

import { useWallet } from "./WalletContext";
import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import ProtectedRoute from "./ProtectedRoute";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { isConnected } = useWallet();
  const pathname = usePathname();

  // Define routes that don't require wallet connection
  const publicRoutes = ['/'];

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // If it's a public route (wallet connect page), render without protection
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, wrap with ProtectedRoute
  return (
    <ProtectedRoute>
      {isConnected && (
        <Navigation>
          {children}
        </Navigation>
      )}
    </ProtectedRoute>
  );
}
