"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet, WalletType } from "./components/WalletContext";

export default function Home() {
  const router = useRouter();
  const { isConnected, connectWallet, connecting } = useWallet();

  // Redirect to audit page if wallet is connected
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        router.push("/audit");
      }, 1500); // 1.5s delay to show success
      return () => clearTimeout(timer);
    }
  }, [isConnected, router]);

  const handleWalletConnect = async (walletType: WalletType) => {
    await connectWallet(walletType);
  };

  return (
    <div className="min-h-screen lg:h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>

        {/* Moving Particles */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-purple-300/40 rounded-full animate-bounce" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-pink-300/40 rounded-full animate-bounce" style={{ animationDelay: '5s' }}></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-indigo-300/30 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>

        {/* Gradient Lines */}
        <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {!isConnected ? (
        <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen relative z-10 overflow-y-auto lg:overflow-hidden">
          {/* Left Column - Branding (Top on mobile) */}
          <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 order-1 lg:order-1 min-h-[50vh] lg:min-h-0">
            <div className="max-w-lg text-center text-white">
              {/* Logo */}
              <div className="mb-6 lg:mb-8">
                {/* Logo Container */}
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                  <img
                    src="/lokachakra.png"       // Place the image in your project's public folder
                    alt="LokaAudit Logo"
                    className="w-12 h-12 lg:w-25 lg:h-25 object-contain animate-pulse"
                  />
                </div>

                {/* Title */}
                <h1 className="text-3xl lg:text-5xl font-bold mb-2 lg:mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  LokaAudit
                </h1>

                {/* Subtitle */}
                <p className="text-lg lg:text-xl text-white/90 font-medium">
                  Non-EVM Smart Contract Auditing Platform
                </p>
              </div>


              {/* Feature Highlights */}
              <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
                <div className="flex items-center gap-3 text-white/80 justify-center lg:justify-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm lg:text-base">Comprehensive security analysis</span>
                </div>
                <div className="flex items-center gap-3 text-white/80 justify-center lg:justify-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <span className="text-sm lg:text-base">Multi-blockchain support</span>
                </div>
                <div className="flex items-center gap-3 text-white/80 justify-center lg:justify-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <span className="text-sm lg:text-base">Real-time vulnerability detection</span>
                </div>
              </div>

              {/* Bottom Information */}
              <div className="text-sm text-white/60 space-y-3 hidden lg:block">
                <p className="leading-relaxed">
                  Supporting Solana, Aptos, and Sui ecosystems for comprehensive
                  non-EVM smart contract auditing with advanced security protocols.
                </p>
                <div className="pt-4 border-t border-white/20">
                  <p className="text-xs text-white/50">
                    Trusted by developers worldwide for secure smart contract deployment
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Wallet Options (Bottom on mobile) */}
          <div className="flex-1 flex items-center justify-center p-6 lg:p-12 order-2 lg:order-2 min-h-[50vh] lg:min-h-0 pb-8 lg:pb-12">
            <div className="w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-xl p-6 lg:p-8 rounded-3xl shadow-2xl border border-white/20 transform hover:scale-[1.02] transition-all duration-300">
                <div className="text-center mb-6 lg:mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 lg:mb-3">Connect Wallet</h2>
                  <p className="text-white/70 text-sm lg:text-base">
                    Choose your preferred wallet to get started
                  </p>
                </div>

                {/* Wallet Options */}
                <div className="space-y-3">
                  {/* Phantom - Solana */}
                  <button
                    onClick={() => handleWalletConnect('phantom')}
                    disabled={connecting}
                    className={`w-full p-3 lg:p-4 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 flex items-center gap-3 lg:gap-4 group backdrop-blur-sm
                      ${connecting ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"}`}
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-lg lg:text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      👻
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white text-sm lg:text-base">Phantom</h3>
                      <p className="text-xs lg:text-sm text-white/60">Solana ecosystem</p>
                    </div>
                    <div className="text-white/40 group-hover:text-white transition-colors text-lg group-hover:translate-x-1 duration-300">→</div>
                  </button>

                  {/* Petra - Aptos */}
                  <button
                    onClick={() => handleWalletConnect('petra')}
                    disabled={connecting}
                    className={`w-full p-3 lg:p-4 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 flex items-center gap-3 lg:gap-4 group backdrop-blur-sm
                      ${connecting ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"}`}
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-lg lg:text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      🏛️
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white text-sm lg:text-base">Petra</h3>
                      <p className="text-xs lg:text-sm text-white/60">Aptos ecosystem</p>
                    </div>
                    <div className="text-white/40 group-hover:text-white transition-colors text-lg group-hover:translate-x-1 duration-300">→</div>
                  </button>

                  {/* Martian - Aptos */}
                  <button
                    onClick={() => handleWalletConnect('martian')}
                    disabled={connecting}
                    className={`w-full p-3 lg:p-4 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 flex items-center gap-3 lg:gap-4 group backdrop-blur-sm
                      ${connecting ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"}`}
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center text-lg lg:text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      🚀
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white text-sm lg:text-base">Martian</h3>
                      <p className="text-xs lg:text-sm text-white/60">Aptos alternative</p>
                    </div>
                    <div className="text-white/40 group-hover:text-white transition-colors text-lg group-hover:translate-x-1 duration-300">→</div>
                  </button>

                  {/* Sui Wallet */}
                  <button
                    onClick={() => handleWalletConnect('sui')}
                    disabled={connecting}
                    className={`w-full p-3 lg:p-4 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 flex items-center gap-3 lg:gap-4 group backdrop-blur-sm
                      ${connecting ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"}`}
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-lg lg:text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      🌊
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white text-sm lg:text-base">Sui Wallet</h3>
                      <p className="text-xs lg:text-sm text-white/60">Sui ecosystem</p>
                    </div>
                    <div className="text-white/40 group-hover:text-white transition-colors text-lg group-hover:translate-x-1 duration-300">→</div>
                  </button>
                </div>

                {connecting && (
                  <div className="text-center mt-6 pt-6 border-t border-white/20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
                    <p className="text-sm text-white/80">Connecting wallet...</p>
                  </div>
                )}

                {/* Help Links */}
                <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-white/20 text-center">
                  <p className="text-xs text-white/50 mb-3">Don't have a wallet?</p>
                  <div className="flex flex-wrap justify-center gap-2 lg:gap-3 text-xs">
                    <a
                      href="https://phantom.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-purple-200 hover:underline transition-colors"
                    >
                      Install Phantom
                    </a>
                    <span className="text-white/30">|</span>
                    <a
                      href="https://petra.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 hover:underline transition-colors"
                    >
                      Install Petra
                    </a>
                    <span className="text-white/30">|</span>
                    <a
                      href="https://suiwallet.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 hover:text-cyan-200 hover:underline transition-colors"
                    >
                      Install Sui
                    </a>
                  </div>
                </div>

                {/* Mobile bottom information */}
                <div className="lg:hidden mt-6 pt-6 border-t border-white/20 text-center">
                  <p className="text-xs text-white/50 leading-relaxed mb-4">
                    Supporting Solana, Aptos, and Sui ecosystems for comprehensive non-EVM smart contract auditing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen lg:h-screen relative z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">Wallet Connected!</h2>
            <p className="text-white/80 text-lg">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}