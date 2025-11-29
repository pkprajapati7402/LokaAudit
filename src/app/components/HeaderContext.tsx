"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface HeaderContextType {
  title: string;
  setTitle: (title: string) => void;
}

const HeaderContext = createContext<HeaderContextType>({
  title: "Smart Contract Auditing",
  setTitle: () => {},
});

export const useHeader = () => useContext(HeaderContext);

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState("Smart Contract Auditing");
  const pathname = usePathname();

  useEffect(() => {
    // Update title based on current route
    switch (pathname) {
      case "/audit":
        setTitle("Smart Contract Audit");
        break;
      case "/test-case":
        setTitle("Test Case Generation");
        break;
      case "/reports":
        setTitle("Files & Reports");
        break;
      case "/documentation":
        setTitle("Documentation");
        break;
      default:
        setTitle("Smart Contract Auditing");
    }
  }, [pathname]);

  return (
    <HeaderContext.Provider value={{ title, setTitle }}>
      {children}
    </HeaderContext.Provider>
  );
}
