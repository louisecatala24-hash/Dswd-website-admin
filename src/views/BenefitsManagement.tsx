import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, ChevronRight, User, 
  Clock, CheckCircle, XCircle, MoreVertical, 
  FileText, ArrowLeft, Users, AlertCircle, ShieldAlert, X, Delete, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, doc, deleteDoc, getDocs, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db, onSnapshot } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { getLocalBenefits, setLocalBenefits, getLocalAppointments } from '../lib/database';

interface Benefit {
  id: string;
  category: 'solo-parent' | 'senior' | 'pwd' | string;
  titleEn: string;
  titleFil: string;
  descEn: string;
  descFil: string;
  amount: string;
  icon: string;
  color: string;
}

interface Applicant {
  id: string;
  userId: string;
  userName: string;
  status: string;
  createdAt: string;
  benefitTitle: string;
}

export const BenefitsManagement: React.FC = () => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  
  // Deletion States
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form States
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [benefitForm, setBenefitForm] = useState({
    category: 'senior',
    titleEn: '',
    titleFil: '',
    descEn: '',
    descFil: '',
    amount: '',
    icon: 'FileText',
    color: 'blue'
  });

  const SYSTEM_PIN = '00000000';

  // Fetch Benefits
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'benefits'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Benefit));
      setBenefits(data);
      setLoading(false);
    }, (error) => {
      console.error("[BENEFITS] Live benefits query error:", error);
      setBenefits([]);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Fetch Applicants when a benefit is selected
  useEffect(() => {
    if (selectedBenefit) {
      setLoadingApplicants(true);
      const q = query(
        collection(db, 'appointments'), 
        where('benefitTitle', '==', selectedBenefit.titleEn)
      );
      
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Applicant));
        setApplicants(data);
        setLoadingApplicants(false);
      }, (error) => {
        console.error("[BENEFITS] Applicants live listing error:", error);
        setApplicants([]);
        setLoadingApplicants(false);
      });

      return () => unsub();
    }
  }, [selectedBenefit]);

  const handleOpenCreate = () => {
    setEditingBenefit(null);
    setBenefitForm({
      category: 'senior',
      titleEn: '',
      titleFil: '',
      descEn: '',
      descFil: '',
      amount: '',
      icon: 'FileText',
      color: 'blue'
    });
    setShowBenefitModal(true);
  };

  const handleOpenEdit = (benefit: Benefit) => {
    setEditingBenefit(benefit);
    setBenefitForm({
      category: benefit.category,
      titleEn: benefit.titleEn,
      titleFil: benefit.titleFil,
      descEn: benefit.descEn,
      descFil: benefit.descFil,
      amount: benefit.amount,
      icon: benefit.icon || 'FileText',
      color: benefit.color || 'blue'
    });
    setShowBenefitModal(true);
  };

  const handleSaveBenefit = async () => {
    try {
      const { addDoc, updateDoc, doc } = await import('firebase/firestore');
      const newId = editingBenefit ? editingBenefit.id : `ben_${Date.now()}`;
      
      const newBenefit = {
        ...benefitForm,
        id: newId
      };

      // 1. Save to local storage first
      const local = getLocalBenefits();
      let updatedLocal: any[];
      if (editingBenefit) {
        updatedLocal = local.map(b => b.id === editingBenefit.id ? { ...b, ...benefitForm } : b);
      } else {
        updatedLocal = [...local, newBenefit];
      }
      setLocalBenefits(updatedLocal);
      
      // Update local React state instantly
      setBenefits(updatedLocal as any);

      // 2. Try Firestore updates
      if (editingBenefit) {
        await updateDoc(doc(db, 'benefits', editingBenefit.id), benefitForm);
      } else {
        await setDoc(doc(db, 'benefits', newId), newBenefit);
      }
      setShowBenefitModal(false);
    } catch (error) {
      console.warn("[BENEFITS] Firestore action restricted. Updates are safe in local sandbox:", error);
      setShowBenefitModal(false);
    }
  };

  const handleUpdateApplicantStatus = async (applicantId: string, newStatus: string) => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'appointments', applicantId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appointments');
    }
  };

  const handleDeleteInitiate = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirmDelete(false);
    setShowPinEntry(true);
    setPin('');
    setPinError(false);
  };

  const handlePinSubmit = async () => {
    if (pin === SYSTEM_PIN) {
      if (!selectedBenefit) return;
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, 'benefits', selectedBenefit.id));
        setSelectedBenefit(null);
        setShowPinEntry(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'benefits');
      } finally {
        setIsDeleting(false);
      }
    } else {
      setPinError(true);
      setPin('');
      // Error visual feedback
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handlePinKey = (val: string) => {
    if (pin.length < 8) {
      setPin(prev => prev + val);
    }
  };

  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 8) {
      handlePinSubmit();
    }
  }, [pin]);

  const filteredBenefits = benefits.filter(b => 
    b.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AnimatePresence mode="wait">
        {!selectedBenefit ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">GOVERNMENT BENEFITS</h1>
                <p className="text-slate-500 font-medium">Manage programs, grants, and monitor citizen applications.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search benefits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <button 
                  onClick={handleOpenCreate}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Benefit Program</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount/Grant</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Applicants</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBenefits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
                            <p className="text-slate-400 font-medium">No benefits found matching your search.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredBenefits.map((benefit) => (
                        <tr 
                          key={benefit.id} 
                          onClick={() => setSelectedBenefit(benefit)}
                          className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${benefit.color || 'blue'}-100 text-${benefit.color || 'blue'}-600 font-black`}>
                                {benefit.titleEn ? benefit.titleEn.charAt(0) : 'B'}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                  {benefit.titleEn || 'Unnamed Benefit'}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium truncate max-w-[250px]">
                                  {benefit.descEn}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                              {benefit.category}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="font-mono text-sm text-slate-900 font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                              {benefit.amount || 'N/A'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                              <Users className="w-4 h-4" />
                              <span>View</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Applicant Details Header */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setSelectedBenefit(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Benefits
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleOpenEdit(selectedBenefit)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all active:scale-95"
                >
                  Edit Program
                </button>
                <button 
                  onClick={handleDeleteInitiate}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-2"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Delete Program
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
               {/* Background Accent */}
               <div className={`absolute top-0 right-0 w-64 h-64 bg-${selectedBenefit.color || 'blue'}-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50`} />
               
               <div className="relative z-10">
                <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4 inline-block">
                  {selectedBenefit.category} Program
                </span>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">
                  {selectedBenefit.titleEn}
                </h2>
                <p className="text-lg text-slate-500 font-medium max-w-3xl leading-relaxed">
                  {selectedBenefit.descEn}
                </p>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Applicants</p>
                    <p className="text-2xl font-black text-slate-900">{applicants.length}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Benefit Grant</p>
                    <p className="text-2xl font-black text-emerald-600">{selectedBenefit.amount || 'N/A'}</p>
                  </div>
                </div>
               </div>
            </div>

            {/* Applicants Table */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-xl flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    Applied Citizens
                  </h3>
                  <p className="text-slate-400 font-medium text-sm mt-1">List of individuals who have submitted applications for this benefit.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category (Context)</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date Applied</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingApplicants ? (
                      <tr>
                        <td colSpan={5} className="px-10 py-12 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        </td>
                      </tr>
                    ) : applicants.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-10 py-16 text-center">
                          <p className="text-slate-400 font-medium">No citizens have applied for this benefit yet.</p>
                        </td>
                      </tr>
                    ) : (
                      applicants.map((applicant) => (
                        <tr key={applicant.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                                {applicant.userName?.charAt(0) || <User className="w-5 h-5" />}
                              </div>
                              <span className="font-bold text-slate-900">{applicant.userName || 'Anonymous User'}</span>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <span className="text-xs font-bold text-slate-500 tracking-tight">
                              {selectedBenefit.category}
                            </span>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(applicant.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              applicant.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                              applicant.status === 'Cancelled' ? 'bg-rose-100 text-rose-600' :
                              'bg-amber-100 text-amber-600'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                applicant.status === 'Approved' ? 'bg-emerald-600' :
                                applicant.status === 'Cancelled' ? 'bg-rose-600' :
                                'bg-amber-600'
                              }`} />
                              {applicant.status}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-right relative group/menu">
                             <button className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                               <MoreVertical className="w-5 h-5 text-slate-300 group-hover/menu:text-slate-600" />
                             </button>
                             <div className="absolute right-10 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all">
                                <button 
                                  onClick={() => handleUpdateApplicantStatus(applicant.id, 'Approved')}
                                  className="w-full px-4 py-2 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Approve Application
                                </button>
                                <button 
                                  onClick={() => handleUpdateApplicantStatus(applicant.id, 'Cancelled')}
                                  className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject / Cancel
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Benefit Modal */}
      <AnimatePresence>
        {showBenefitModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBenefitModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                      {editingBenefit ? 'Edit Benefit' : 'Create Benefit'}
                    </h3>
                    <p className="text-slate-500 font-medium text-xs mt-1">Fill in the official details for this program.</p>
                  </div>
                  <button onClick={() => setShowBenefitModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                   <div className="space-y-6">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-l-2 border-blue-600 pl-3">English Details</p>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Program Title (EN)</label>
                        <input 
                          value={benefitForm.titleEn}
                          onChange={e => setBenefitForm({...benefitForm, titleEn: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                          placeholder="e.g. Social Pension"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description (EN)</label>
                        <textarea 
                          value={benefitForm.descEn}
                          onChange={e => setBenefitForm({...benefitForm, descEn: e.target.value})}
                          rows={3}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm resize-none"
                          placeholder="Program details..."
                        />
                      </div>
                   </div>

                   <div className="space-y-6">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-l-2 border-emerald-600 pl-3">Tagalog Details</p>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Program Title (FIL)</label>
                        <input 
                          value={benefitForm.titleFil}
                          onChange={e => setBenefitForm({...benefitForm, titleFil: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                          placeholder="e.g. Sosyal na Pensyon"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description (FIL)</label>
                        <textarea 
                          value={benefitForm.descFil}
                          onChange={e => setBenefitForm({...benefitForm, descFil: e.target.value})}
                          rows={3}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-sm resize-none"
                          placeholder="Mga detalye ng programa..."
                        />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                    <select 
                      value={benefitForm.category}
                      onChange={e => setBenefitForm({...benefitForm, category: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-sm"
                    >
                      <option value="senior">Senior Citizen</option>
                      <option value="solo-parent">Solo Parent</option>
                      <option value="pwd">PWD</option>
                      <option value="indigent">Indigent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Grant Amount</label>
                    <input 
                      value={benefitForm.amount}
                      onChange={e => setBenefitForm({...benefitForm, amount: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-sm"
                      placeholder="e.g. 500/mo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                    <select 
                      value={benefitForm.status}
                      onChange={e => setBenefitForm({...benefitForm, status: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-sm"
                    >
                      <option value="Active">Active / Live</option>
                      <option value="Inactive">Archive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowBenefitModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={handleSaveBenefit}
                    disabled={!benefitForm.titleEn || !benefitForm.titleFil}
                    className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                  >
                    {editingBenefit ? 'Save Changes' : 'Create Program'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmDelete(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-10"
            >
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">Are you sure?</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm">
                This action will permanently delete <span className="text-slate-900 font-bold">{selectedBenefit?.titleEn}</span> and all related application history.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleConfirmDelete}
                  className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95 uppercase tracking-widest text-[11px]"
                >
                  Yes, proceed to verify
                </button>
                <button 
                  onClick={() => setShowConfirmDelete(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PIN entry modal */}
       <AnimatePresence>
        {showPinEntry && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-xs rounded-[3rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Security PIN</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Authorized access only</p>
              </div>

              <div className="flex justify-center gap-3 mb-10 overflow-x-auto py-2">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 shrink-0 ${
                      i < pin.length ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-transparent border-slate-200'
                    } ${pinError ? 'bg-rose-500 border-rose-500' : ''}`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button 
                    key={num}
                    onClick={() => handlePinKey(num.toString())}
                    className="aspect-square flex items-center justify-center text-xl font-black text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all active:scale-90"
                  >
                    {num}
                  </button>
                ))}
                <div className="aspect-square" />
                <button 
                  onClick={() => handlePinKey('0')}
                  className="aspect-square flex items-center justify-center text-xl font-black text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all active:scale-90"
                >
                  0
                </button>
                <button 
                  onClick={handlePinBackspace}
                  className="aspect-square flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-3xl transition-all active:scale-90"
                >
                  <Delete className="w-6 h-6" />
                </button>
              </div>

              <button 
                onClick={() => setShowPinEntry(false)}
                className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-slate-600 transition-colors"
                disabled={isDeleting}
              >
                Close Security Panel
              </button>

              {isDeleting && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
