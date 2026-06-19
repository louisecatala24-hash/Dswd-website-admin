import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, onSnapshot } from '../lib/firebase';
import { AppointmentData } from '../types';
import { Clock, CheckCircle, XCircle, Calendar, User, Search, Filter, Copy, Check, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLocalAppointments, setLocalAppointments } from '../lib/database';

interface AppointmentQueueProps {
  initialFilter?: 'All' | 'Pending' | 'Approved' | 'Rejected';
}

const getCategoryBadgeClass = (cat?: string) => {
  const norm = (cat || '').toLowerCase();
  if (norm.includes('senior')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (norm.includes('pwd')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (norm.includes('solo')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
};

const getCategoryLabel = (cat?: string) => {
  const norm = (cat || '').toLowerCase();
  if (norm.includes('senior')) return 'Senior Citizen';
  if (norm.includes('pwd')) return 'PWD';
  if (norm.includes('solo')) return 'Solo Parent';
  return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'General';
};

export const AppointmentQueue: React.FC<AppointmentQueueProps> = ({ initialFilter = 'Pending' }) => {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>(initialFilter);
  const [loading, setLoading] = useState(true);
  const [verifyCodeQuery, setVerifyCodeQuery] = useState('');
  const [successCopyId, setSuccessCopyId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setSuccessCopyId(id);
    setTimeout(() => setSuccessCopyId(null), 2000);
  };

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appData = snapshot.docs.map(doc => {
        const data = doc.data();
        let targetId = doc.id;
        // Clean characters for clean code
        let suffix = targetId.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase();
        if (suffix.length < 5) suffix = Math.floor(10000 + Math.random() * 90000).toString();
        const verificationCode = data.verificationCode || `DSWD-SP-${suffix}`;
        return {
          ...data,
          id: doc.id,
          verificationCode
        } as AppointmentData;
      });
      
      // Sort by createdAt descending
      const sorted = appData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAppointments(sorted);
      setLoading(false);
    }, (error) => {
      console.error("[QUEUE] Firestore query error:", error);
      setAppointments([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    // 1. Update local React state instantly for zero-latency UI feedback
    setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));

    // 2. Write straight to Firestore Cloud
    try {
      const appRef = doc(db, 'appointments', id);
      await updateDoc(appRef, { 
        status, 
        updatedAt: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error("[QUEUE] Firestore update failed:", error);
      alert(`Firestore status update failed: ${error.message || error}. Please verify your Admin access permissions.`);
    }
  };

  const filteredApps = appointments.filter(a => filter === 'All' ? true : a.status === filter);

  const verifiedMatch = verifyCodeQuery.trim()
    ? appointments.find(
        (a) =>
          a.verificationCode?.toLowerCase().includes(verifyCodeQuery.trim().toLowerCase()) ||
          a.id.toLowerCase().includes(verifyCodeQuery.trim().toLowerCase())
      )
    : null;

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Support Queue</h2>
          <p className="text-slate-400 text-sm font-medium">Real-time application stream</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {['Pending', 'Approved', 'Rejected', 'All'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filter === f 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Terminal */}
      <div className="bg-slate-900 text-white p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="absolute left-1/3 bottom-0 translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_2fr] items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                Verification Desk
              </h3>
            </div>
            <p className="text-slate-400 text-xs font-medium">Verify appointments instantly using their unique slip code / reference code.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={verifyCodeQuery}
                onChange={(e) => setVerifyCodeQuery(e.target.value.toUpperCase())}
                placeholder="Type or paste Verification Code (e.g., DSWD-SP-...)"
                className="w-full pl-12 pr-12 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-white font-mono placeholder:text-slate-500 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm tracking-widest uppercase"
              />
              {verifyCodeQuery && (
                <button 
                  onClick={() => setVerifyCodeQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-2 py-1 rounded-md"
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Verification Match Drawer */}
        {verifyCodeQuery && (
          <div className="mt-6 pt-6 border-t border-slate-800 relative z-10 transition-all">
            {verifiedMatch ? (
              <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="bg-emerald-500 text-[9px] font-black uppercase tracking-widest text-emerald-950 px-2 py-0.5 rounded-full">✓ Authentic Appointment Verified</span>
                      <span className="text-emerald-300 font-mono text-xs font-black bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-800/30">{verifiedMatch.verificationCode}</span>
                    </div>
                    <h4 className="text-lg font-black text-white tracking-tight">{verifiedMatch.userName}</h4>
                    <p className="text-slate-400 text-xs font-medium mt-1">
                      Policy/Benefit Desired: <strong className="text-white">{verifiedMatch.benefitTitle}</strong> • Category: <strong className="text-white">{getCategoryLabel(verifiedMatch.appliedCategory || verifiedMatch.category)}</strong> • Scheduled: <strong className="text-white">{verifiedMatch.date}</strong>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                  {verifiedMatch.status === 'Pending' ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(verifiedMatch.id, 'Approved')}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
                      >
                        Approve Benefit
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(verifiedMatch.id, 'Rejected')}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${
                      verifiedMatch.status === 'Approved' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-rose-900/30 text-rose-400 border-rose-800/50'
                    }`}>
                      Current Status: {verifiedMatch.status}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 font-black uppercase text-xs tracking-widest bg-slate-800/30 rounded-2xl border border-slate-800/50">
                ❌ No matching appointment found for "{verifyCodeQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
          Synchronizing Real-Time Data...
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Clock className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Queue is Empty</h3>
          <p className="text-slate-400 font-medium max-w-xs mx-auto text-center">No {filter.toLowerCase()} appointments found in the system.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredApps.map((app) => (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-lg transition-all flex flex-col lg:flex-row lg:items-center gap-6 group"
              >
                {/* Status Icon */}
                <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center ${
                  app.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                  app.status === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                  'bg-amber-50 text-amber-600 animate-pulse'
                }`}>
                  {app.status === 'Approved' ? <CheckCircle className="w-7 h-7" /> :
                   app.status === 'Rejected' ? <XCircle className="w-7 h-7" /> :
                   <Clock className="w-7 h-7" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Benefit Request</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(app.appliedCategory || app.category)}`}>
                      {getCategoryLabel(app.appliedCategory || app.category)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight truncate mb-2">{app.benefitTitle}</h3>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                      <User className="w-4 h-4 text-slate-300" />
                      {app.userName}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                      <Calendar className="w-4 h-4 text-slate-300" />
                      Appt Date: <span className="text-slate-900 font-bold">{app.date}</span>
                    </div>
                    {app.verificationCode && (
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-xl">
                        <Ticket className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-xs font-black text-slate-700 tracking-wider select-all">{app.verificationCode}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(app.verificationCode!, app.id);
                          }}
                          className="p-1 hover:bg-slate-200/60 rounded-lg transition-colors ml-1 text-slate-400 hover:text-blue-600 active:scale-90"
                          title="Copy reference code"
                        >
                          {successCopyId === app.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                  {app.status === 'Pending' ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'Approved')}
                        className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all active:scale-90 shadow-lg shadow-emerald-600/20"
                        title="Approve Policy"
                      >
                        <CheckCircle className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'Rejected')}
                        className="p-3 bg-rose-600 text-white rounded-2xl hover:bg-rose-500 transition-all active:scale-90 shadow-lg shadow-rose-600/20"
                        title="Reject Policy"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </>
                  ) : (
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      app.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      Terminal {app.status}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
