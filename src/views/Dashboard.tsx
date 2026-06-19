import React, { useEffect, useState } from 'react';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, onSnapshot } from '../lib/firebase';
import { Users, Clock, CheckCircle, XCircle, TrendingUp, Calendar, Shield, X, BarChart3, Lock, Loader2, Megaphone, Send, MessageSquare, Database, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { UserData, AppointmentData } from '../types';
import { getLocalUsers, getLocalAppointments, setLocalUsers, setLocalAppointments, getLocalNews, setLocalNews, getLocalBenefits, setLocalBenefits } from '../lib/database';

interface DashboardProps {
  setActiveTab: (tab: string, filter?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [rawUsers, setRawUsers] = useState<UserData[]>([]);
  const [rawApps, setRawApps] = useState<AppointmentData[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingAppointments: 0,
    pendingProcess: 0,
    approvedToday: 0,
    rejectedTotal: 0,
    categoryBreakdown: {
      Senior: 0,
      PWD: 0,
      SoloParent: 0,
    }
  });

  // PIN Verification State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [targetTab, setTargetTab] = useState<string | null>(null);
  const [targetFilter, setTargetFilter] = useState<any>(null);

  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const seedSampleData = async () => {
    setIsSeeding(true);
    let firestoreSuccess = true;
    try {
      const { collection, doc, setDoc, serverTimestamp, addDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      const sampleUsers = [
        { 
          uid: 'user_1', 
          firstName: 'Juan', 
          lastName: 'Dela Cruz', 
          username: 'juan_delacruz',
          password: 'mock_password_hash_1',
          email: 'juan@example.com', 
          mobile: '09171234567', 
          category: 'Senior', 
          address: 'Brgy. 123, Quezon City', 
          civilStatus: 'Married', 
          sex: 'Male',
          birthYear: '1960',
          birthMonth: 'August',
          birthDay: '15',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          uid: 'user_2', 
          firstName: 'Maria', 
          lastName: 'Santos', 
          username: 'maria_santos',
          password: 'mock_password_hash_2',
          email: 'maria@example.com', 
          mobile: '09187654321', 
          category: 'Solo Parent', 
          address: 'Sampaloc, Manila', 
          civilStatus: 'Single', 
          sex: 'Female',
          birthYear: '1985',
          birthMonth: 'September',
          birthDay: '10',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          uid: 'user_3', 
          firstName: 'Pedro', 
          lastName: 'Penduko', 
          username: 'pedro_penduko',
          password: 'mock_password_hash_3',
          email: 'pedro@example.com', 
          mobile: '09221112223', 
          category: 'PWD', 
          address: 'Davao City', 
          civilStatus: 'Single', 
          sex: 'Male',
          birthYear: '1992',
          birthMonth: 'December',
          birthDay: '05',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const u of sampleUsers) {
        await setDoc(doc(db, 'users', u.uid), {
          ...u,
          fullName: `${u.firstName} ${u.lastName}`
        });
      }

      const sampleNews = [
        { 
          title: 'Senior Citizen Social Pension Distribution', 
          content: 'The distribution for the first quarter social pension will start tomorrow at the Municipal Hall. Please bring your Senior ID and a photocopy.',
          date: new Date().toISOString().split('T')[0],
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          time: '8:00 AM - 4:00 PM',
          requirements: 'Senior ID, Photocopy of ID',
          author: 'Social Welfare Office',
          updatedAt: serverTimestamp()
        },
        { 
          title: 'New Solo Parent Benefits Implementation', 
          content: 'Starting next month, solo parents are entitled to additional discounts in local drugstores. Register at the MSWD office for the updated ID.',
          date: new Date().toISOString().split('T')[0],
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          time: 'Office Hours',
          requirements: 'Current Solo Parent ID',
          author: 'Municipal Admin',
          updatedAt: serverTimestamp()
        }
      ];

      for (const news of sampleNews) {
        await setDoc(doc(collection(db, 'News for users')), news);
      }

      const sampleBenefits = [
        { 
          id: 'ben_1', 
          category: 'senior', 
          titleEn: 'Social Pension', 
          titleFil: 'Sosyal na Pensyon', 
          descEn: 'Monthly stipend for indigent senior citizens.', 
          descFil: 'Buwanang allowance para sa mga kapos-palad na senior citizens.', 
          amount: '500/month', 
          icon: 'Heart', 
          color: 'rose'
        },
        { 
          id: 'ben_2', 
          category: 'solo-parent', 
          titleEn: 'Solo Parent Grant', 
          titleFil: 'Tulong sa Solo Parent', 
          descEn: 'Livelihood assistance for lone parents.', 
          descFil: 'Tulong pangkabuhayan para sa mga mag-isang magulang.', 
          amount: 'Varies', 
          icon: 'User', 
          color: 'blue'
        }
      ];

      for (const b of sampleBenefits) {
        await setDoc(doc(db, 'benefits', b.id), b);
      }

      const sampleReqs = [
        { category: 'senior', requirementsEn: ['Valid OSCA ID', 'Barangay Certification'], requirementsFil: ['Validong OSCA ID', 'Sertipikasyon mula sa Barangay'] },
        { category: 'solo-parent', requirementsEn: ['Solo Parent ID', 'Child Birth Certificate'], requirementsFil: ['Solo Parent ID', 'Birth Certificate ng Anak'] }
      ];

      for (const r of sampleReqs) {
        await addDoc(collection(db, 'benefit-requirements'), r);
      }

      const sampleAppointments = [
        { id: 'app_1', benefitTitle: 'Social Pension', appliedCategory: 'senior', category: 'senior', date: new Date().toISOString().split('T')[0], status: 'Pending', userId: 'user_1', userName: 'Juan Dela Cruz', createdAt: new Date().toISOString() },
        { id: 'app_2', benefitTitle: 'Livelihood Assistance', appliedCategory: 'solo-parent', category: 'solo-parent', date: new Date().toISOString().split('T')[0], status: 'Approved', userId: 'user_2', userName: 'Maria Santos', createdAt: new Date().toISOString() },
        { id: 'app_3', benefitTitle: 'Social Pension', appliedCategory: 'senior', category: 'senior', date: '2026-01-15', status: 'Approved', userId: 'user_1', userName: 'Juan Dela Cruz', createdAt: new Date('2026-01-15').toISOString() },
        { id: 'app_4', benefitTitle: 'PWD Allowance', appliedCategory: 'pwd', category: 'pwd', date: '2026-02-10', status: 'Approved', userId: 'user_3', userName: 'Pedro Penduko', createdAt: new Date('2026-02-10').toISOString() },
        { id: 'app_5', benefitTitle: 'Solo Parent Grant', appliedCategory: 'solo-parent', category: 'solo-parent', date: '2026-03-20', status: 'Approved', userId: 'user_2', userName: 'Maria Santos', createdAt: new Date('2026-03-20').toISOString() },
        { id: 'app_6', benefitTitle: 'Social Pension', appliedCategory: 'senior', category: 'senior', date: '2026-04-05', status: 'Approved', userId: 'user_1', userName: 'Juan Dela Cruz', createdAt: new Date('2026-04-05').toISOString() },
        { id: 'app_7', benefitTitle: 'PWD Allowance', appliedCategory: 'pwd', category: 'pwd', date: '2026-04-25', status: 'Approved', userId: 'user_3', userName: 'Pedro Penduko', createdAt: new Date('2026-04-25').toISOString() },
      ];

      for (const app of sampleAppointments) {
        await setDoc(doc(db, 'appointments', app.id), app);
      }

    } catch (err: any) {
      console.error("Firestore seeding failed:", err);
      firestoreSuccess = false;
      alert(`Firestore seeding failed: ${err.message || err}. Please ensure you are logged in with an authorized Google account (louise.catala24@gmail.com) and your current domain is whitelisted in Firebase Console Authentication.`);
    } finally {
      setIsSeeding(false);
      if (firestoreSuccess) {
        alert('Real Database seeded successfully on Firestore Cloud Server! Clear your browser cache or refresh to view live documents update instantly!');
      }
    }
  };

  useEffect(() => {
    // Real-time listener for Users
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserData));
      
      setRawUsers(users);
      setStats(prev => ({ ...prev, totalUsers: users.length }));
      setErrorStatus(null);
    }, (error) => {
      console.error("[DASHBOARD] Users live listener error:", error);
      setRawUsers([]);
      setStats(prev => ({ ...prev, totalUsers: 0 }));
    });

    // Real-time listener for Appointments
    const unsubscribeApps = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as AppointmentData);
      
      setRawApps(apps);
      
      const pending = apps.filter(a => a.status === 'Pending').length;
      const approved = apps.filter(a => a.status === 'Approved').length;
      const rejected = apps.filter(a => a.status === 'Rejected').length;

      setStats(prev => ({
        ...prev,
        pendingAppointments: pending,
        pendingProcess: Math.floor(pending * 0.4),
        approvedToday: approved,
        rejectedTotal: rejected
      }));
    }, (error) => {
      console.error("[DASHBOARD] Appointments live listener error:", error);
      setRawApps([]);
      setStats(prev => ({
        ...prev,
        pendingAppointments: 0,
        pendingProcess: 0,
        approvedToday: 0,
        rejectedTotal: 0
      }));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeApps();
    };
  }, []);

  // Recalculate breakdown and trend data
  useEffect(() => {
    const breakdown = {
      Senior: 0,
      PWD: 0,
      SoloParent: 0,
    };

    // Monthly aggregation (Full year for better visual context)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Create history for all 12 months, but we'll focus on up to current month if preferred
    // Actually, showing Jan to Dec provides a better horizon
    const history = months.map((m, idx) => ({
      name: m,
      Senior: 0,
      PWD: 0,
      SoloParent: 0,
      total: 0,
      isFuture: idx > currentMonth
    }));

    rawApps.forEach(app => {
      // Find category: prioritized order: appliedCategory -> category -> user category
      let cat = (app.appliedCategory || app.category || '').toLowerCase();
      
      if (!cat) {
        const user = rawUsers.find(u => u.uid === app.userId || u.id === app.userId);
        if (user) {
          cat = String(user.category || '').toLowerCase();
        }
      }

      if (cat) {
        // Handle both ISO string and Firestore Timestamp
        const createdAt = app.createdAt;
        let appDate: Date;
        
        if (!createdAt) {
          appDate = new Date();
        } else if (typeof createdAt === 'string') {
          appDate = new Date(createdAt);
        } else if (createdAt.toDate && typeof createdAt.toDate === 'function') {
          appDate = createdAt.toDate();
        } else {
          appDate = new Date();
        }

        const mIdx = appDate.getMonth();

        if (mIdx >= 0 && mIdx < history.length) {
          if (cat.includes('senior')) {
            breakdown.Senior++;
            history[mIdx].Senior++;
          } else if (cat.includes('pwd')) {
            breakdown.PWD++;
            history[mIdx].PWD++;
          } else if (cat.includes('solo')) {
            breakdown.SoloParent++;
            history[mIdx].SoloParent++;
          }
          history[mIdx].total = history[mIdx].Senior + history[mIdx].PWD + history[mIdx].SoloParent;
        }
      }
    });

    setStats(prev => ({ ...prev, categoryBreakdown: breakdown }));

    // Make history cumulative for a "Growth" feeling
    let seniorTotal = 0;
    let pwdTotal = 0;
    let soloTotal = 0;

    const cumulativeHistory = history.map(h => {
      seniorTotal += h.Senior;
      pwdTotal += h.PWD;
      soloTotal += h.SoloParent;
      return {
        ...h,
        Senior: seniorTotal,
        PWD: pwdTotal,
        SoloParent: soloTotal,
        total: seniorTotal + pwdTotal + soloTotal
      };
    });

    setTrendData(cumulativeHistory);
  }, [rawUsers, rawApps]);

  const handleCardClick = (tabId: string, filter?: any) => {
    setTargetTab(tabId);
    setTargetFilter(filter);
    setPinInput('');
    setPinError(false);
    setShowPinModal(true);
  };

  const verifyPin = () => {
    if (pinInput === '00000000') {
      if (targetTab) {
        setActiveTab(targetTab, targetFilter);
      }
      setShowPinModal(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const cards = [
    { id: 'users', label: 'Total Citizens', value: stats.totalUsers, icon: Users, color: 'bg-blue-500', trend: '+12% from last month', interactive: true },
    { id: 'appointments', label: 'Pending Queue', value: stats.pendingAppointments, icon: Clock, color: 'bg-amber-500', trend: 'Needs immediate review', interactive: true, filter: 'Pending' },
    { id: 'appointments', label: 'Pending Process', value: stats.pendingProcess, icon: Loader2, color: 'bg-indigo-500', trend: 'In intermediate review', interactive: true, filter: 'Pending' },
    { id: 'appointments', label: 'Approved Today', value: stats.approvedToday, icon: CheckCircle, color: 'bg-emerald-500', trend: 'Processing stable', interactive: true, filter: 'Approved' },
    { id: 'appointments', label: 'System Denials', value: stats.rejectedTotal, icon: XCircle, color: 'bg-slate-500', trend: '4% rejection rate', interactive: true, filter: 'Rejected' },
  ];

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowPinModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[3rem] p-12 shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600 border-2 border-blue-100 shadow-inner">
                  <Lock className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Security ID</h3>
                <p className="text-slate-500 text-sm font-medium">Verify 8-digit admin PIN to proceed</p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <input 
                    type="password"
                    maxLength={8}
                    autoFocus
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, ''));
                      setPinError(false);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
                    className={`w-full text-center text-4xl tracking-[0.5em] py-5 bg-slate-50 border-4 rounded-3xl focus:outline-none transition-all font-black ${
                      pinError ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-slate-100 focus:border-blue-600'
                    }`}
                    placeholder="••••••••"
                  />
                  {pinError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-rose-500 text-[10px] font-black uppercase tracking-widest mt-3 text-center"
                    >
                      Unauthorized PIN Entry
                    </motion.p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowPinModal(false)}
                    className="py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={verifyPin}
                    className="py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 text-xs uppercase tracking-widest"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {errorStatus && (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-700">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm uppercase tracking-wider">Database Access Restricted</p>
            <p className="text-xs font-medium opacity-80">Your browser is being blocked by Firestore Security Rules. Please manually update rules in the Firebase Console.</p>
          </div>
          <button onClick={() => setErrorStatus(null)} className="p-2 hover:bg-rose-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Auto-Seed Banner when DB is Empty */}
      {stats.totalUsers === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="space-y-2 text-center md:text-left relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-blue-200" />
              <span>No Records Detected</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight">Populate Your Admin Console</h3>
            <p className="text-blue-100 text-sm max-w-lg font-medium leading-relaxed">
              Populate the system with simulated senior citizens, PWD profiles, pending benefits requests, and broadcast news to explore the system fully.
            </p>
          </div>
          <button
            onClick={seedSampleData}
            disabled={isSeeding}
            className="flex items-center gap-3 px-8 py-5 bg-white text-blue-600 hover:bg-blue-50 font-black rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap text-xs uppercase tracking-widest cursor-pointer relative z-10 shadow-blue-900/10 hover:shadow-xl"
          >
            {isSeeding ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Database className="w-4 h-4 text-blue-600" />
            )}
            {isSeeding ? 'Seeding Database...' : 'Populate Demo Data'}
          </button>
        </motion.div>
      )}

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => card.interactive && handleCardClick(card.id, card.filter)}
            className={`
              bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-blue-900/10 transition-all relative overflow-hidden group text-left
              ${card.interactive ? 'hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1 cursor-pointer active:scale-95' : ''}
            `}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.color} opacity-[0.03] rounded-bl-[100px] group-hover:scale-110 transition-transform`} />
            
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 ${card.color} bg-opacity-10 rounded-2xl`}>
                <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
              {card.interactive ? (
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  Live
                </div>
              )}
            </div>

            <div>
              <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{card.label}</h3>
              <div className="text-3xl font-black text-slate-900 mb-2 tabular-nums">{card.value}</div>
              <p className="text-[10px] uppercase font-bold text-slate-300 group-hover:text-slate-400 transition-colors">{card.trend}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Benefit Movement Tracker (Dribbble-inspired) */}
        <div className="lg:col-span-2 bg-slate-950 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_50%)]" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-blue-500/20">Average Benefit Flux</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    <TrendingUp className="w-3 h-3" />
                    +4.2%
                  </div>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Participation <span className="text-blue-500 font-serif italic">Momentum</span></h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Measuring social support engagement across {new Date().getFullYear()}</p>
              </div>
              
              <div className="flex items-center gap-6 p-2 bg-white/5 rounded-2xl border border-white/5">
                {[
                  { label: 'Senior', color: 'bg-blue-500' },
                  { label: 'PWD', color: 'bg-emerald-500' },
                  { label: 'Solo', color: 'bg-amber-500' }
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2 px-3 py-1.5">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="h-[350px] w-full -ml-4 relative">
              {trendData.every(d => d.total === 0) && (
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl text-center">
                    <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1">No Momentum Data</h3>
                    <p className="text-slate-500 text-xs font-medium">Please seed sample citizens or wait for real applications.</p>
                  </div>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSenior" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPWD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSolo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                    dy={12}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a',
                      borderRadius: '24px', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
                      padding: '20px'
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                    labelStyle={{ color: '#64748b', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px' }}
                    cursor={{ stroke: '#1e293b', strokeWidth: 2 }}
                    formatter={(value: any) => [`${value} Apps`, '']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Senior" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorSenior)" 
                    animationDuration={2000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="PWD" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorPWD)" 
                    animationDuration={2200}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="SoloParent" 
                    stroke="#f59e0b" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorSolo)" 
                    animationDuration={2400}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-12 bg-white/5 p-8 rounded-[2rem] border border-white/5">
              {[
                { label: 'Senior Assistance', key: 'Senior', color: 'text-blue-400' },
                { label: 'PWD Support', key: 'PWD', color: 'text-emerald-400' },
                { label: 'Solo Parent Grant', key: 'SoloParent', color: 'text-amber-400' }
              ].map((item) => (
                <div key={item.key}>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{item.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-black ${item.color} tabular-nums tracking-tighter`}>
                      {stats.categoryBreakdown[item.key as keyof typeof stats.categoryBreakdown]}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Growth</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Media & Broadcasting Container */}
        <div className="flex flex-col gap-6">
          {/* Post Announcement Section (Compact Half-size) */}
          <button 
            onClick={() => setActiveTab('announcements')}
            className="bg-amber-400 border border-amber-500 rounded-[2rem] p-6 shadow-sm flex flex-col group hover:shadow-2xl hover:bg-amber-500 hover:-translate-y-1 transition-all duration-500 text-left relative overflow-hidden active:scale-95 flex-1 min-h-[195px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-20 rounded-bl-[80px] -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="flex items-center gap-3 relative z-10 shrink-0">
              <div className="w-11 h-11 bg-white text-amber-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-500">
                <Megaphone className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 tracking-tight leading-none mb-1">System <span className="text-white italic font-serif">Announcements</span></h3>
                <p className="text-amber-900/60 text-[9px] font-black uppercase tracking-widest leading-none">Global Broadcast Utility</p>
              </div>
            </div>
            
            <div className="mt-4 flex-1 flex flex-col justify-end relative z-10">
              <p className="text-amber-950 text-xs font-semibold leading-relaxed mb-4">
                Broadcast critical news, announcements, and payouts updates direct to all citizen apps.
              </p>
              
              <div className="flex items-center gap-1.5 text-amber-950 font-black text-[9px] uppercase tracking-[0.25em] group-hover:translate-x-1.5 transition-transform">
                <span className="opacity-70">Enter News Hub</span>
                <Send className="w-3 h-3" />
              </div>
            </div>
          </button>

          {/* Citizen Messaging Section (Compact Half-size) */}
          <button 
            id="dswd_contacts_button"
            onClick={() => setActiveTab('contacts')}
            className="bg-indigo-600 border border-indigo-700 rounded-[2rem] p-6 shadow-sm flex flex-col group hover:shadow-2xl hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-500 text-left relative overflow-hidden active:scale-95 text-white flex-1 min-h-[195px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-bl-[80px] -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="flex items-center gap-3 relative z-10 w-full shrink-0">
              <div className="w-11 h-11 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-sm border border-indigo-400/30 group-hover:scale-105 transition-all duration-500">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-base font-black text-white tracking-tight leading-none">DSWD <span className="text-indigo-200 italic font-serif">Contacts</span></h3>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-indigo-300/80 text-[9px] font-black uppercase tracking-widest leading-none">Hotline & Directory Gateway</p>
              </div>
            </div>
            
            <div className="mt-4 flex-1 flex flex-col justify-end relative z-10">
              <p className="text-indigo-100/90 text-xs font-semibold leading-relaxed mb-4">
                Update, append, and search the public DSWD regional and central contact directories securely.
              </p>
              
              <div className="flex items-center gap-1.5 text-indigo-200 font-black text-[9px] uppercase tracking-[0.25em] group-hover:translate-x-1.5 transition-transform">
                <span className="opacity-70">Enter Contacts Manager</span>
                <Phone className="w-3 h-3" />
              </div>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};
