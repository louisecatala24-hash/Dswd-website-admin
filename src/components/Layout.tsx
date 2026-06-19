import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Clock, LogOut, ShieldCheck, Menu, X, Search, Bell, Settings, Lock, Megaphone, ClipboardList, MessageSquare, RotateCw, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import logoImg from '@/images/DSWD.png';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { db, onSnapshot } from '../lib/firebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string, filter?: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Layout: React.FC<{ 
  children: React.ReactNode; 
  activeTab: string; 
  setActiveTab: (tab: string, filter?: any) => void;
  onRetry?: () => void;
}> = ({ children, activeTab, setActiveTab, onRetry }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [isPinVerified, setIsPinVerified] = React.useState(false);
  const [pinInput, setPinInput] = React.useState('');
  const [pinError, setPinError] = React.useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const { user, logout } = useAuth();

  const handleReload = () => {
    if (isReloading) return;
    setIsReloading(true);
    
    // 1. Re-initialize and force re-fetch Firebase listeners by incrementing key
    if (onRetry) {
      onRetry();
    }
    
    // 2. Perform safe frame reload with fallback check if blocked
    setTimeout(() => {
      try {
        window.location.reload();
      } catch (err) {
        console.warn("Iframe sandbox restricted page reload. Active subscription refreshed in-place:", err);
      }
    }, 600);

    // 3. Fallback to reset spinner animation
    setTimeout(() => {
      setIsReloading(false);
    }, 2500);
  };

  useEffect(() => {
    const q = query(
      collection(db, 'appointments'),
      where('status', '==', 'Pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    }, (error) => {
      console.warn("Layout notification fetch error:", error);
    });

    return () => unsubscribe();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Citizens', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Clock },
    { id: 'benefits', label: 'Benefits', icon: ClipboardList },
    { id: 'contacts', label: 'DSWD Contacts', icon: Phone },
    { id: 'system', label: 'System', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'users' && !isPinVerified) {
      setShowPinModal(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const verifyPin = () => {
    if (pinInput === '00000000') {
      setIsPinVerified(true);
      setShowPinModal(false);
      setActiveTab('users');
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col border-r border-slate-800 shadow-2xl z-[60] relative overflow-hidden`}
      >
        <button 
          onClick={handleReload}
          className={`w-full p-5 flex items-center ${isSidebarOpen ? 'justify-start px-6' : 'justify-center px-0'} gap-3 border-b border-slate-800 bg-slate-950 transition-all duration-300 hover:bg-slate-900 cursor-pointer text-left relative group`}
          title="Reload/Retry loading database"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-blue-600/10 flex items-center justify-center bg-white border border-slate-700/50 p-0.5">
            {isReloading ? (
              <RotateCw className="w-5 h-5 text-slate-800 animate-spin" />
            ) : (
              <img 
                src={logoImg} 
                alt="DSWD Logo" 
                className="w-full h-full object-contain transition-transform group-hover:scale-110" 
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-slate-100 tracking-tight whitespace-nowrap flex flex-col"
            >
              <nav className="text-sm font-black whitespace-nowrap">DSWD <span className="text-blue-400">Admin</span></nav>
              <span className="text-[9px] text-blue-400 font-black uppercase tracking-wider mt-0.5 animate-pulse">
                {isReloading ? "Reloading..." : "Click to Retry"}
              </span>
            </motion.div>
          )}
        </button>

        <nav className="flex-1 mt-6 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-start' : 'justify-center'} gap-3 px-3 py-3 rounded-lg transition-colors group relative ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && (
                <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
              )}
              {item.id === 'appointments' && pendingCount > 0 && (
                <span className={`absolute ${isSidebarOpen ? 'right-3' : 'right-1 top-1'} flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full shadow-lg border border-slate-900 group-hover:scale-110 transition-transform`}>
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          {isSidebarOpen && user && (
            <div className="px-2 py-3 bg-slate-800/50 rounded-lg flex items-center gap-3 mb-4 overflow-hidden transition-all">
              <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-slate-700 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-100 truncate">{user.displayName}</p>
                <p className="text-[10px] text-slate-400 truncate tracking-wide uppercase">Support Officer</p>
              </div>
            </div>
          )}
          {!isSidebarOpen && user && (
            <div className="flex justify-center mb-4 transition-all">
              <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-slate-700" />
            </div>
          )}
          <button
            onClick={() => logout()}
            className={`w-full flex items-center ${isSidebarOpen ? 'justify-start' : 'justify-center'} gap-3 px-3 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-colors group`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && (
              <span className="font-medium text-sm whitespace-nowrap">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200/60 transition-colors max-w-xs md:max-w-md truncate">
              <span className={`w-2 h-2 rounded-full shrink-0 ${user ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[9px] font-black uppercase text-slate-550 tracking-wider truncate">
                {user ? `Cloud Sync Active (${user.email})` : "Local Sandbox Mode"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search resources..."
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-full relative">
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#fdfdfe]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* PIN Modal */}
        <AnimatePresence>
          {showPinModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPinModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-10 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-900 shadow-sm border border-slate-100">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Restricted Access</h3>
                  <p className="text-slate-500 font-medium mb-8">Enter the 8-digit PIN to access the citizen database.</p>
                  
                  <div className="space-y-4">
                    <input 
                      type="password"
                      maxLength={8}
                      value={pinInput}
                      autoFocus
                      onChange={(e) => {
                        setPinInput(e.target.value.replace(/\D/g, ''));
                        setPinError(false);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
                      className={`w-full text-center text-4xl tracking-[0.5em] py-4 bg-slate-50 border-2 rounded-2xl focus:outline-none transition-all ${
                        pinError ? 'border-rose-500 text-rose-600 bg-rose-50 animate-shake' : 'border-slate-100 focus:border-blue-600'
                      }`}
                      placeholder="••••••••"
                    />
                    
                    {pinError && (
                      <p className="text-rose-500 text-xs font-black uppercase tracking-widest">Incorrect Security PIN</p>
                    )}

                    <button 
                      onClick={verifyPin}
                      className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                    >
                      Authenticate
                    </button>
                    
                    <button 
                      onClick={() => setShowPinModal(false)}
                      className="text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
