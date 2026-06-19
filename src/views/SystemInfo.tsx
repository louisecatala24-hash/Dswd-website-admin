import React from 'react';
import { Shield, Key, Database, Globe, Layers, Copy, CheckCircle } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { motion } from 'motion/react';

export const SystemInfo: React.FC = () => {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = React.useState<'checking' | 'connected' | 'error'>('checking');

  const checkConnectivity = async () => {
    try {
      const { doc, getDocFromServer } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      // Try to fetch a dummy doc from server to check real connectivity
      await getDocFromServer(doc(db, '_internal_', 'healthcheck')).catch(() => {});
      setConnectionStatus('connected');
    } catch (err) {
      console.error("Connection check failed:", err);
      setConnectionStatus('error');
    }
  };

  React.useEffect(() => {
    checkConnectivity();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const [isSeeding, setIsSeeding] = React.useState(false);

  const seedSampleData = async () => {
    setIsSeeding(true);
    try {
      const { collection, doc, setDoc, serverTimestamp, addDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      const sampleUsers = [
        { uid: 'user_1', firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan@example.com', mobile: '09171234567', category: 'Senior', address: 'Brgy. 123, Quezon City', civilStatus: 'Married', sex: 'Male' },
        { uid: 'user_2', firstName: 'Maria', lastName: 'Santos', email: 'maria@example.com', mobile: '09187654321', category: 'Solo Parent', address: 'Sampaloc, Manila', civilStatus: 'Single', sex: 'Female' },
        { uid: 'user_3', firstName: 'Pedro', lastName: 'Penduko', email: 'pedro@example.com', mobile: '09221112223', category: 'PWD', address: 'Davao City', civilStatus: 'Single', sex: 'Male' }
      ];

      for (const u of sampleUsers) {
        await setDoc(doc(db, 'users', u.uid), {
          ...u,
          fullName: `${u.firstName} ${u.lastName}`,
          createdAt: new Date().toISOString()
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
        // Historical data for trends
        { id: 'app_3', benefitTitle: 'Social Pension', appliedCategory: 'senior', category: 'senior', date: '2026-01-15', status: 'Approved', userId: 'user_1', userName: 'Juan Dela Cruz', createdAt: new Date('2026-01-15').toISOString() },
        { id: 'app_4', benefitTitle: 'PWD Allowance', appliedCategory: 'pwd', category: 'pwd', date: '2026-02-10', status: 'Approved', userId: 'user_3', userName: 'Pedro Penduko', createdAt: new Date('2026-02-10').toISOString() },
        { id: 'app_5', benefitTitle: 'Solo Parent Grant', appliedCategory: 'solo-parent', category: 'solo-parent', date: '2026-03-20', status: 'Approved', userId: 'user_2', userName: 'Maria Santos', createdAt: new Date('2026-03-20').toISOString() },
        { id: 'app_6', benefitTitle: 'Social Pension', appliedCategory: 'senior', category: 'senior', date: '2026-04-05', status: 'Approved', userId: 'user_1', userName: 'Juan Dela Cruz', createdAt: new Date('2026-04-05').toISOString() },
        { id: 'app_7', benefitTitle: 'PWD Allowance', appliedCategory: 'pwd', category: 'pwd', date: '2026-04-25', status: 'Approved', userId: 'user_3', userName: 'Pedro Penduko', createdAt: new Date('2026-04-25').toISOString() },
      ];

      for (const app of sampleAppointments) {
        await setDoc(doc(db, 'appointments', app.id), app);
      }

      alert('Sample data seeded successfully! You can now see the registry and appointments.');
    } catch (err) {
      console.error("Seeding failed:", err);
      alert('Seeding failed. Check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  const configItems = [
    { label: 'Project ID', value: firebaseConfig.projectId, icon: Shield },
    { label: 'App ID', value: firebaseConfig.appId, icon: Layers },
    { label: 'API Key', value: firebaseConfig.apiKey, icon: Key },
    { label: 'Auth Domain', value: firebaseConfig.authDomain, icon: Globe },
    { label: 'Firestore DB ID', value: firebaseConfig.firestoreDatabaseId, icon: Database },
    { label: 'Storage Bucket', value: firebaseConfig.storageBucket, icon: Database },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <span className="inline-block px-4 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20">System Credentials</span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              connectionStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400' :
              connectionStatus === 'checking' ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
              'bg-rose-500/20 text-rose-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-400' :
                connectionStatus === 'checking' ? 'bg-amber-400' :
                'bg-rose-400'
              }`} />
              {connectionStatus === 'connected' ? 'Database Online' : connectionStatus === 'checking' ? 'Syncing...' : 'Database Offline'}
            </div>
          </div>
          <h2 className="text-4xl font-black mb-4 tracking-tighter leading-tight">Firebase <span className="text-blue-400 font-serif italic">Environment</span></h2>
          <p className="text-slate-400 text-lg max-w-xl font-medium">These credentials connect this application to your Firebase project. You can use these to initialize external tools or scripts.</p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 blur-[80px] opacity-20 rounded-full -m-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {configItems.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">{item.label}</h3>
              </div>
              <button 
                onClick={() => copyToClipboard(item.value, item.label)}
                className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
              >
                {copied === item.label ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <code className="text-sm font-mono text-slate-800 break-all bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold">
              {item.value}
            </code>
          </motion.div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Database Utilities</h3>
          <p className="text-slate-500 font-medium leading-relaxed">If your registry and appointments are empty, use this utility to populate your database with dummy records for testing and demonstration.</p>
        </div>
        <button 
          onClick={seedSampleData}
          disabled={isSeeding}
          className={`flex items-center gap-3 px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 whitespace-nowrap ${
            isSeeding ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
          }`}
        >
          {isSeeding ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full" />
            </motion.div>
          ) : (
            <Database className="w-5 h-5" />
          )}
          {isSeeding ? 'Seeding Data...' : 'Seed Sample Citizens'}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-8 rounded-3xl">
        <h4 className="font-bold text-amber-800 mb-2">Security Warning</h4>
        <p className="text-sm text-amber-700 leading-relaxed font-medium">
          These credentials are required for the web application to function. While the API Key and App ID are public information in client-side code, always ensure your <b>Firestore Security Rules</b> are properly configured to prevent unauthorized access to your data.
        </p>
      </div>
    </div>
  );
};
