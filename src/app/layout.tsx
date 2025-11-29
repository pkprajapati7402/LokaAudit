import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { HeaderProvider } from "./components/HeaderContext";
import { WalletProvider } from "./components/WalletContext";
import ConditionalLayout from "./components/ConditionalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LokaAudit - Non-EVM Smart Contract Auditing",
  description: "LokaAudit is a developer-first non-EVM smart contract auditing platform supporting Solana, Aptos, and Sui ecosystems with automated vulnerability detection, gas optimization, and security insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <WalletProvider>
            <HeaderProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </HeaderProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}