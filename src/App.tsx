/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Layout } from './components/Layout';
import { ShieldCheck, LogIn, Loader2, AlertCircle, LogOut, ClipboardList, CheckCircle } from 'lucide-react';
import { Dashboard } from './views/Dashboard';
import { UsersList } from './views/UsersList';
import { AppointmentQueue } from './views/AppointmentQueue';
import { SystemInfo } from './views/SystemInfo';
import { Announcements } from './views/Announcements';
import { BenefitsManagement } from './views/BenefitsManagement';
import { DswdContacts } from './views/Contacts';
import { auth } from './lib/firebase';
import logoImg from '@/images/dswd logo.png';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading, error, loginWithGoogle, loginAsDemo } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appointmentFilter, setAppointmentFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [copied, setCopied] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1);
  };

  const handleTabChange = (tab: string, filter?: any) => {
    setActiveTab(tab);
    if (filter) {
      setAppointmentFilter(filter);
    } else {
      if (tab === 'appointments') {
        setAppointmentFilter('Pending');
      }
    }
  };

  const copyUid = () => {
    if (user) {
      navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyConfig = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Loading Portal...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-sans p-6 overflow-hidden relative">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-300 blur-[120px] rounded-full" />
        </div>

        <div className="w-full max-w-md bg-white border border-slate-200/80 p-10 rounded-[2rem] shadow-xl relative z-10">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-24 h-24 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mb-6 shadow-md p-1 shrink-0 overflow-hidden">
              <img 
                src={logoImg} 
                alt="DSWD Logo" 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">DSWD <span className="text-blue-600">Admin</span></h1>
            <p className="text-slate-500 font-semibold text-xs">Department of Social Welfare and Development Support System</p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs flex flex-col gap-2.5 shadow-sm shadow-red-100">
                <div className="flex items-center gap-2 font-black uppercase tracking-wider text-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Access Restricted</span>
                </div>
                
                <p className="font-semibold leading-relaxed">
                  {error.includes('Unauthorized Domain') 
                    ? 'Login attempt failed. This source site is not whitelisted. Please open this portal in a new browser tab or request administrator authorization.' 
                    : error}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-4 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold rounded-2xl transition-all active:scale-95 shadow-md group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <LogIn className="w-5 h-5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                )}
                {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-sans p-6 overflow-y-auto">
        <div className="max-w-md w-full bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-xl text-center">
          <div className="w-20 h-20 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md p-1 overflow-hidden shrink-0">
            <img 
              src={logoImg} 
              alt="DSWD Logo" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl font-extrabold text-rose-600 mb-2 tracking-tight">Access Denied</h2>
          <p className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3.5 py-1.5 rounded-full w-fit mx-auto uppercase tracking-widest mb-6">
            Unauthorized Account
          </p>

          <div className="text-left space-y-4 mb-8">
            <div className="text-center space-y-1.5">
              <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                You are currently logged in with <span className="font-extrabold text-slate-900 block mt-0.5">{user.email}</span>.
              </p>
              <p className="text-[11px] text-rose-500 font-bold">
                ⚠️ Please use your real DSWD email account
              </p>
            </div>
            <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Next Steps:</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Access is restricted to authorized DSWD administrative emails. If this is an oversight, please contact your technical administrator or supervisor to authorize this account.
              </p>
            </div>
          </div>

          <button 
            onClick={() => auth.signOut()}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Switch Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={handleTabChange} onRetry={handleRetry}>
      {activeTab === 'dashboard' && <Dashboard key={`dashboard-${retryKey}`} setActiveTab={handleTabChange} />}
      {activeTab === 'users' && <UsersList key={`users-${retryKey}`} />}
      {activeTab === 'appointments' && <AppointmentQueue key={`appointments-${retryKey}`} initialFilter={appointmentFilter} />}
      {activeTab === 'benefits' && <BenefitsManagement key={`benefits-${retryKey}`} />}
      {activeTab === 'announcements' && <Announcements key={`announcements-${retryKey}`} />}
      {activeTab === 'contacts' && <DswdContacts key={`contacts-${retryKey}`} />}
      {activeTab === 'system' && <SystemInfo key={`system-${retryKey}`} />}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

