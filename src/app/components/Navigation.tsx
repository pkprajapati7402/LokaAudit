// File: components/Navigation.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useHeader } from "./HeaderContext";
import { useWallet } from "./WalletContext";
import {
  FileText,
  FileSearch,
  BookOpenText,
  ShieldCheck,
  Sun,
  Moon,
  Mail,
  Bell,
  User,
  Settings,
  X,
  LogOut
} from "lucide-react";

const navItems = [
  { label: "Audit", icon: <ShieldCheck className="w-5 h-5" />, href: "/audit" },
  { label: "Test Case", icon: <FileSearch className="w-5 h-5" />, href: "/test-case" },
  { label: "Reports & Files", icon: <FileText className="w-5 h-5" />, href: "/reports" },
  { label: "Documentation", icon: <BookOpenText className="w-5 h-5" />, href: "/documentation" },
];

const sampleMails = [
  { id: 1, from: "security@audit.com", subject: "Audit Report Ready", time: "2 mins ago", unread: true },
  { id: 2, from: "team@lokachakra.com", subject: "Weekly Security Update", time: "1 hour ago", unread: true },
  { id: 3, from: "alerts@blockchain.com", subject: "Vulnerability Alert", time: "3 hours ago", unread: false },
  { id: 4, from: "support@audit.com", subject: "Your audit is complete", time: "1 day ago", unread: false },
];

const sampleNotifications = [
  { id: 1, message: "New vulnerability detected in Contract XYZ", time: "5 mins ago", type: "warning" },
  { id: 2, message: "Audit completed successfully", time: "30 mins ago", type: "success" },
  { id: 3, message: "Gas optimization suggestions available", time: "2 hours ago", type: "info" },
  { id: 4, message: "Security report generated", time: "4 hours ago", type: "info" },
];

export default function Navigation({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { title } = useHeader();
  const { walletAddress, chainType, disconnectWallet } = useWallet();
  const [collapsed, setCollapsed] = useState(true); // Changed default to true (collapsed)
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  const handleModalOpen = (setter: (value: boolean) => void, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right
    });
    setter(true);
  };

  const showTooltip = (text: string, event: React.MouseEvent) => {
    if (!collapsed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      text,
      x: rect.right + 8,
      y: rect.top + rect.height / 2
    });
  };

  const hideTooltip = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  };

  // Function to format wallet address
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Handle wallet disconnect with redirect
  const handleDisconnect = () => {
    disconnectWallet();
    router.push('/'); // Redirect to wallet connect page
  };

  const DropdownModal = ({ isOpen, onClose, title, children, position }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    position: { top: number; right: number };
  }) => {
    if (!isOpen) return null;

    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose}></div>
        <div
          className="fixed z-50 bg-background border border-border rounded-lg shadow-lg w-80 max-h-[400px] overflow-hidden"
          style={{ top: position.top, right: position.right }}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-accent"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[320px]">
            {children}
          </div>
        </div>
      </>
    );
  };

  const Tooltip = () => {
    if (!tooltip.show) return null;

    return (
      <div
        className="fixed z-50 bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-lg pointer-events-none transform -translate-y-1/2"
        style={{ left: tooltip.x, top: tooltip.y }}
      >
        {tooltip.text}
        <div
          className="absolute top-1/2 left-0 transform -translate-x-full -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"
        />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-20" : "w-54"} bg-muted p-4 space-y-4 fixed top-0 left-0 h-screen transition-all duration-300 z-40`}
      >
        {/* Logo (Clickable Toggle) */}
        <div
          className={`flex items-center gap-2 mb-6 cursor-pointer p-2 rounded-lg transition-all duration-300 ${collapsed ? "hover:bg-accent justify-center" : "hover:bg-accent/50"
            }`}
          onClick={() => setCollapsed(!collapsed)}
          onMouseEnter={(e) => showTooltip(collapsed ? "Expand Menu" : "Collapse Menu", e)}
          onMouseLeave={hideTooltip}
        >
          <Image
            src="/lokachakra.png"
            alt="Lokachakra Logo"
            width={42}
            height={42}
            className="transition-transform duration-300 hover:scale-110"
          />
          <span
            className={`text-xl font-semibold transition-all duration-300 ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              }`}
          >
            Lokachakra
          </span>
        </div>

        {/* Nav Items */}
        <nav className="space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md hover:bg-accent transition ${collapsed ? "justify-center" : "gap-3"
                }`}
              onMouseEnter={(e) => showTooltip(item.label, e)}
              onMouseLeave={hideTooltip}
            >
              <span className="w-6 h-6 flex items-center justify-center">{item.icon}</span>
              <span
                className={`transition-opacity duration-300 ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                  }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300`} style={{ marginLeft: collapsed ? "81px" : "217px" }}>
        {/* Header */}
        <header
          className="fixed top-0 right-0 z-30 bg-muted border-b border-border p-2 flex justify-between items-center"
          style={{ left: collapsed ? "81px" : "217px" }}
        >
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {title}
          </h1>
          <div className="flex items-center gap-4">

            {/* Wallet Address Button */}
            {walletAddress ? (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="text-xs text-green-700 dark:text-green-300 font-medium flex items-center gap-1">
                    Connected {chainType && (
                      <span className="px-1 py-0.5 bg-green-200 dark:bg-green-800 rounded text-[10px] uppercase">
                        {chainType}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-mono text-green-800 dark:text-green-200">
                    {formatWalletAddress(walletAddress)}
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                className="px-4 py-2 rounded-lg text-white font-medium bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
                     hover:opacity-90 shadow-md transition duration-300"
                onClick={() => alert('Wallet not connected!')}
              >
                Connect Wallet
              </button>
            )}

            {/* Mail icon */}
            <button
              className="p-1 rounded hover:bg-accent relative"
              onClick={(e) => handleModalOpen(setMailModalOpen, e)}
            >
              <Mail className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {sampleMails.filter((mail) => mail.unread).length}
              </span>
            </button>

            {/* Notification icon */}
            <button
              className="p-1 rounded hover:bg-accent relative"
              onClick={(e) => handleModalOpen(setNotificationModalOpen, e)}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {sampleNotifications.length}
              </span>
            </button>

            {/* Profile icon */}
            <button
              className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-accent"
              onClick={(e) => handleModalOpen(setProfileModalOpen, e)}
            >
              <Image
                src="/avatar.png"
                alt="User"
                width={32}
                height={32}
                className="object-cover"
              />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto mt-16">{children}</main>
      </div>


      {/* Mail Modal */}
      <DropdownModal
        isOpen={mailModalOpen}
        onClose={() => setMailModalOpen(false)}
        title="Messages"
        position={modalPosition}
      >
        <div className="space-y-3">
          {sampleMails.map((mail) => (
            <div
              key={mail.id}
              className={`p-3 rounded-lg border cursor-pointer hover:bg-accent/50 ${mail.unread ? 'bg-accent/20 border-blue-200' : 'border-border'
                }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">{mail.from}</span>
                <span className="text-xs text-muted-foreground">{mail.time}</span>
              </div>
              <p className="text-sm text-muted-foreground">{mail.subject}</p>
              {mail.unread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              )}
            </div>
          ))}
        </div>
      </DropdownModal>

      {/* Notifications Modal */}
      <DropdownModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        title="Notifications"
        position={modalPosition}
      >
        <div className="space-y-3">
          {sampleNotifications.map((notification) => (
            <div
              key={notification.id}
              className="p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-2 ${notification.type === 'warning' ? 'bg-yellow-500' :
                  notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                <div className="flex-1">
                  <p className="text-sm">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DropdownModal>

      {/* Profile Modal */}
      <DropdownModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Profile Menu"
        position={modalPosition}
      >
        {/* Header Section */}
        <div className="px-4 py-4 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-100">John Developer</h3>
              <p className="text-xs text-gray-400">john@developer.com</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-800/60 transition-all duration-200 text-left group mx-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                <User className="w-4 h-4 text-gray-300 group-hover:text-blue-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-100">User Profile</span>
                <p className="text-xs text-gray-400">Manage your account</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-800/60 transition-all duration-200 text-left group mx-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-purple-600/20 transition-colors">
                <Settings className="w-4 h-4 text-gray-300 group-hover:text-purple-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-100">Settings</span>
                <p className="text-xs text-gray-400">Configure preferences</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-800/60 transition-all duration-200 text-left group mx-2"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                {theme === "dark" ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}
              </div>
              <div>
                <span className="text-sm font-medium text-gray-100">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
                <p className="text-xs text-gray-400">Switch appearance</p>
              </div>
            </div>
            <div className="w-8 h-4 bg-gray-700 rounded-full relative group-hover:bg-gray-600 transition-colors">
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${theme === "dark" ? "translate-x-4" : "translate-x-0.5"
                }`} />
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700/50 p-3">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </DropdownModal>

      {/* Tooltip */}
      <Tooltip />
    </div>
  );
}