"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type WalletType = 'phantom' | 'petra' | 'sui' | 'martian';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  walletType: WalletType | null;
  chainType: 'solana' | 'aptos' | 'sui' | null;
  connectWallet: (walletType: WalletType) => Promise<void>;
  disconnectWallet: () => void;
  connecting: boolean;
  isInitialized: boolean;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  walletAddress: null,
  walletType: null,
  chainType: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  connecting: false,
  isInitialized: false,
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [chainType, setChainType] = useState<'solana' | 'aptos' | 'sui' | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if wallet is already connected on page load
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const savedWalletType = localStorage.getItem("walletType") as WalletType;
      
      if (savedWalletType === 'phantom' && (window as any).solana && (window as any).solana.isPhantom) {
        // Solana - Phantom wallet
        const response = await (window as any).solana.connect({ onlyIfTrusted: true });
        if (response.publicKey) {
          setWalletAddress(response.publicKey.toString());
          setWalletType('phantom');
          setChainType('solana');
          setIsConnected(true);
        }
      } else if (savedWalletType === 'petra' && (window as any).aptos) {
        // Aptos - Petra wallet
        try {
          const response = await (window as any).aptos.connect();
          if (response.address) {
            setWalletAddress(response.address);
            setWalletType('petra');
            setChainType('aptos');
            setIsConnected(true);
          }
        } catch (error) {
          console.log("Petra wallet not connected");
        }
      } else if (savedWalletType === 'sui' && (window as any).suiWallet) {
        // Sui wallet
        try {
          const response = await (window as any).suiWallet.connect();
          if (response.address) {
            setWalletAddress(response.address);
            setWalletType('sui');
            setChainType('sui');
            setIsConnected(true);
          }
        } catch (error) {
          console.log("Sui wallet not connected");
        }
      } else if (savedWalletType === 'martian' && (window as any).martian) {
        // Aptos - Martian wallet
        try {
          const response = await (window as any).martian.connect();
          if (response.address) {
            setWalletAddress(response.address);
            setWalletType('martian');
            setChainType('aptos');
            setIsConnected(true);
          }
        } catch (error) {
          console.log("Martian wallet not connected");
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    } finally {
      setIsInitialized(true);
    }
  };

  const connectWallet = async (selectedWalletType: WalletType) => {
    setConnecting(true);

    try {
      let address = '';
      let chain: 'solana' | 'aptos' | 'sui' | null = null;

      if (selectedWalletType === 'phantom') {
        // Solana - Phantom wallet
        if (!(window as any).solana || !(window as any).solana.isPhantom) {
          alert("Please install Phantom wallet to connect!");
          return;
        }

        const response = await (window as any).solana.connect();
        if (response.publicKey) {
          address = response.publicKey.toString();
          chain = 'solana';
        }
      } else if (selectedWalletType === 'petra') {
        // Aptos - Petra wallet
        if (!(window as any).aptos) {
          alert("Please install Petra wallet to connect!");
          return;
        }

        const response = await (window as any).aptos.connect();
        if (response.address) {
          address = response.address;
          chain = 'aptos';
        }
      } else if (selectedWalletType === 'sui') {
        // Sui wallet
        if (!(window as any).suiWallet) {
          alert("Please install Sui wallet to connect!");
          return;
        }

        const response = await (window as any).suiWallet.connect();
        if (response.address) {
          address = response.address;
          chain = 'sui';
        }
      } else if (selectedWalletType === 'martian') {
        // Aptos - Martian wallet
        if (!(window as any).martian) {
          alert("Please install Martian wallet to connect!");
          return;
        }

        const response = await (window as any).martian.connect();
        if (response.address) {
          address = response.address;
          chain = 'aptos';
        }
      }

      if (address && chain) {
        setWalletAddress(address);
        setWalletType(selectedWalletType);
        setChainType(chain);
        setIsConnected(true);
        
        // Store connection status in localStorage
        localStorage.setItem("walletConnected", "true");
        localStorage.setItem("walletAddress", address);
        localStorage.setItem("walletType", selectedWalletType);
        localStorage.setItem("chainType", chain);
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert("Wallet connection failed. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setWalletType(null);
    setChainType(null);
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("walletType");
    localStorage.removeItem("chainType");
  };

  // Listen for account changes
  useEffect(() => {
    // Phantom wallet account changes
    if ((window as any).solana && (window as any).solana.isPhantom) {
      const handleAccountChanged = (publicKey: any) => {
        if (publicKey) {
          setWalletAddress(publicKey.toString());
          localStorage.setItem("walletAddress", publicKey.toString());
        } else {
          disconnectWallet();
        }
      };

      (window as any).solana.on("accountChanged", handleAccountChanged);

      return () => {
        (window as any).solana.removeListener("accountChanged", handleAccountChanged);
      };
    }

    // Petra wallet account changes
    if ((window as any).aptos) {
      const handleAccountChange = (account: any) => {
        if (account) {
          setWalletAddress(account.address);
          localStorage.setItem("walletAddress", account.address);
        } else {
          disconnectWallet();
        }
      };

      (window as any).aptos.onAccountChange(handleAccountChange);
    }
  }, []);

  // Check localStorage on mount
  useEffect(() => {
    const savedConnection = localStorage.getItem("walletConnected");
    const savedAddress = localStorage.getItem("walletAddress");
    const savedWalletType = localStorage.getItem("walletType") as WalletType;
    const savedChainType = localStorage.getItem("chainType") as 'solana' | 'aptos' | 'sui';
    
    if (savedConnection === "true" && savedAddress && savedWalletType && savedChainType) {
      setIsConnected(true);
      setWalletAddress(savedAddress);
      setWalletType(savedWalletType);
      setChainType(savedChainType);
    }
  }, []);

  const value = {
    isConnected,
    walletAddress,
    walletType,
    chainType,
    connectWallet,
    disconnectWallet,
    connecting,
    isInitialized,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
