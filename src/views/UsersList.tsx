import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, onSnapshot } from '../lib/firebase';
import { UserData, AppointmentData } from '../types';
import { Search, MoreHorizontal, User, Mail, Smartphone, MapPin, X, ClipboardList, Shield, Download, Gift, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLocalUsers, getLocalAppointments, setLocalUsers, setLocalAppointments } from '../lib/database';

export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userAppointments, setUserAppointments] = useState<AppointmentData[]>([]);
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

    } catch (err) {
      console.warn("Firestore seeding from UsersList failed because of rules / permissions: ", err);
      firestoreSuccess = false;
    } finally {
      localStorage.removeItem('dswd_seeded'); // Reset database configuration state to force clean re-populate
      const localUsers = getLocalUsers();
      const sorted = [...localUsers].sort((a, b) => {
        const nameA = (a.fullName || `${a.firstName} ${a.lastName}`).toLowerCase();
        const nameB = (b.fullName || `${b.firstName} ${b.lastName}`).toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setUsers(sorted);
      setIsSeeding(false);
      if (firestoreSuccess) {
        alert('Database populated successfully!');
      } else {
        alert('Console pre-populated successfully in local sandbox fallback! All components are fully interactable using backed-up sample files.');
      }
    }
  };

  useEffect(() => {
    if (!selectedUser) {
      setUserAppointments([]);
      return;
    }

    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', selectedUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppointmentData));

      // Sort by date descending
      const sorted = appData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUserAppointments(sorted);
    }, (error) => {
      console.error("[USERS] Live appointment fetch error:", error);
      setUserAppointments([]);
    });

    return () => unsubscribe();
  }, [selectedUser]);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserData));

      // Sort locally instead to ensure consistent view regardless of field presence
      const sorted = [...userData].sort((a, b) => {
        const nameA = (a.fullName || `${a.firstName} ${a.lastName}`).toLowerCase();
        const nameB = (b.fullName || `${b.firstName} ${b.lastName}`).toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setUsers(sorted);
      setErrorStatus(null);
    }, (err) => {
      console.error("[USERS] Live list fetch error:", err);
      setUsers([]);
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => {
    const displayName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase();
    return displayName.includes(searchTerm.toLowerCase()) || 
           u.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getDisplayName = (user: UserData) => {
    if (user.fullName) return user.fullName;
    if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return 'Unknown Citizen';
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'solo-parent') return 'Solo Parent';
    return cat;
  };

  const handleExport = () => {
    const headers = ['Full Name', 'Category', 'Email', 'Mobile', 'Civil Status', 'Sex', 'Address'];
    const data = filteredUsers.map(u => [
      getDisplayName(u),
      getCategoryLabel(u.category),
      u.email,
      u.mobile,
      u.civilStatus || '',
      u.sex || '',
      u.address || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `citizen_database_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {errorStatus && (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-700">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-wider">Database Access Restricted</p>
            <p className="text-xs font-medium opacity-80">Your account is an admin in the code, but the database rules are blocking the connection. Please paste the rules in Firebase Console.</p>
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Citizen Database</h2>
          <p className="text-slate-400 text-sm font-medium">Managing {users.length} registered beneficiaries</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
            />
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 whitespace-nowrap shadow-sm"
          >
            <Download className="w-5 h-5 text-blue-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map((user, idx) => (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedUser(user)}
              className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-5 h-5 text-slate-400" />
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center font-black text-xl border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                  {getDisplayName(user).charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">{getDisplayName(user)}</h3>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
                  <Mail className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
                  <Smartphone className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>{user.mobile}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-dashed border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Verified Identity</span>
                <span className="text-emerald-500 font-black">Active</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-6 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
             <User className="w-8 h-8 text-slate-300" />
           </div>
           <h3 className="text-xl font-black text-slate-900 mb-2">No Citizens Found</h3>
           <p className="text-slate-400 font-medium text-center max-w-sm mb-6">
             There are no records in your database yet. Setup your system in one click with demo citizen entries.
           </p>
           <button
             onClick={seedSampleData}
             disabled={isSeeding}
             className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-blue-600/20 cursor-pointer"
           >
             {isSeeding ? 'Creating Records...' : 'Populate Citizens database'}
           </button>
        </div>
      )}

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Modal Header */}
              <div className="h-32 bg-slate-900 relative">
                <div className="absolute inset-0 opacity-20 overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-10 pb-12 relative">
                <div className="absolute -top-12 left-10">
                  <div className="w-24 h-24 bg-white border-4 border-white shadow-xl rounded-3xl flex items-center justify-center text-slate-400">
                    <User className="w-12 h-12" />
                  </div>
                </div>

                <div className="pt-16 mb-8">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{getDisplayName(selectedUser)}</h2>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-black uppercase tracking-wider">{getCategoryLabel(selectedUser.category)}</span>
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-bold">{selectedUser.civilStatus || 'Status Not Specified'}</span>
                    {selectedUser.sex && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase">{selectedUser.sex}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-y border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Contact Email</p>
                    <p className="text-slate-900 font-bold flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      {selectedUser.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Mobile Number</p>
                    <p className="text-slate-900 font-bold flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-blue-500" />
                      {selectedUser.mobile}
                    </p>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Permanent Address</p>
                    <div className="bg-slate-50 p-4 rounded-2xl flex gap-3 text-slate-700 font-medium text-sm leading-relaxed border border-slate-100">
                      <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                      {selectedUser.address || 'Address information is currently withheld or not provided.'}
                    </div>
                  </div>
                </div>

                <div className="mt-10 py-8 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                       <History className="w-5 h-5 text-blue-600" />
                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-1">Benefits Taken History</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                      {userAppointments.filter(a => a.status === 'Approved').length} Record(s)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {userAppointments.filter(a => a.status === 'Approved').length > 0 ? (
                      userAppointments.filter(a => a.status === 'Approved').map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                              <Gift className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight">{app.benefitTitle}</p>
                              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{new Date(app.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                            Delivered
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                        <Gift className="w-8 h-8 text-slate-200 mb-3" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No benefits registered yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-4">
                  <button className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Service History
                  </button>
                  <button className="px-6 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors">
                    Edit Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
