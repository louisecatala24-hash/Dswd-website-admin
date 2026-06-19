import React, { useEffect, useState } from 'react';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, onSnapshot, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { getLocalContacts, setLocalContacts } from '../lib/database';
import { 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Briefcase, 
  Building2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Sparkles, 
  Info,
  Globe,
  CheckCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DswdContactData } from '../types';

export const DswdContacts: React.FC = () => {
  const [contacts, setContacts] = useState<DswdContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [isCloudEmpty, setIsCloudEmpty] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeCollection, setActiveCollection] = useState<string>('DSWD CONTACTS');

  // Modal forms
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<DswdContactData, 'id'>>({
    name: '',
    contactPerson: '',
    position: '',
    email: '',
    phone: '',
    address: ''
  });

  // Real-time snapshot listener directly on Firestore collection 'DSWD CONTACTS'
  useEffect(() => {
    setIsLive(true);
    setLoading(true);

    const unsub = onSnapshot(collection(db, 'DSWD CONTACTS'), (snapshot) => {
      const records = snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.value !== undefined && data.name === undefined) {
          // It's a raw hotline record! Do NOT simulate fields. Retrieve exactly details stored.
          return {
            id: doc.id,
            name: doc.id,
            value: data.value,
            _isRawHotline: true
          } as any;
        }
        return {
          id: doc.id,
          ...data
        } as DswdContactData;
      });

      if (records.length > 0) {
        records.sort((a, b) => {
          const isRawA = !!(a as any)._isRawHotline;
          const isRawB = !!(b as any)._isRawHotline;
          if (isRawA && !isRawB) return -1;
          if (!isRawA && isRawB) return 1;
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        });
        setContacts(records);
        setIsCloudEmpty(false);
      } else {
        setContacts([]);
        setIsCloudEmpty(true);
      }
      setLoading(false);
    }, (error) => {
      console.warn("[CONTACTS] Live collection sync read error:", error.message);
      setContacts([]);
      setIsLive(false);
      setLoading(false);
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Pre-populate data to cloud db
  const handleSeedToCloud = async () => {
    setLoading(true);
    try {
      const local = getLocalContacts();
      for (const contact of local) {
        const contactRef = doc(db, activeCollection, contact.id);
        await setDoc(contactRef, contact);
      }
      showStatus("Sample directory records published to Cloud Firestore!", "success");
      setIsCloudEmpty(false);
    } catch (err: any) {
      console.error("[CONTACTS] Seeding Firestore collection failed:", err);
      showStatus("Seed failed: write permission blocked by rules", "error");
      try {
        handleFirestoreError(err, OperationType.WRITE, activeCollection);
      } catch (e) {
        console.error("Firestore WRITE exception logged:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      contactPerson: '',
      position: '',
      email: '',
      phone: '',
      address: ''
    });
    setIsEditing(false);
    setIsEditingRaw(false);
    setEditingId(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (contact: DswdContactData) => {
    const isRaw = (contact as any)._isRawHotline;
    if (isRaw) {
      setFormData({
        name: contact.id,
        contactPerson: '',
        position: '',
        email: contact.id.toLowerCase().includes('email') ? (contact as any).value : '',
        phone: !contact.id.toLowerCase().includes('email') ? (contact as any).value : '',
        address: ''
      });
      setIsEditingRaw(true);
    } else {
      setFormData({
        name: contact.name,
        contactPerson: contact.contactPerson,
        position: contact.position,
        email: contact.email,
        phone: contact.phone,
        address: contact.address
      });
      setIsEditingRaw(false);
    }
    setIsEditing(true);
    setEditingId(contact.id);
    setShowFormModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showStatus("Office or agency name is required", "error");
      return;
    }

    const contactId = isEditing && editingId ? editingId : 'contact_' + Date.now();
    let newContact: any;

    if (isEditingRaw) {
      newContact = {
        value: formData.phone.trim() || formData.email.trim() || '',
        updatedAt: new Date().toISOString()
      };
    } else {
      newContact = {
        id: contactId,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        position: formData.position.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        updatedAt: new Date().toISOString()
      };
    }

    try {
      // Save directly to live Firestore
      const contactRef = doc(db, activeCollection, contactId);
      await setDoc(contactRef, newContact);
      showStatus(isEditing ? "Contact edited successfully!" : "New contact successfully added!", "success");
      setShowFormModal(false);
    } catch (err: any) {
      console.error("[CONTACTS] Firestore write failed:", err);
      showStatus(`Firestore Write Failed: ${err.message}`, "error");
      
      try {
        handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, `${activeCollection}/${contactId}`);
      } catch (e) {
        console.error("Firestore SAVE exception logged:", e);
      }
    }
  };

  const initiateDelete = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    setDeleteConfirmName(null);

    try {
      await deleteDoc(doc(db, activeCollection, id));
      showStatus("Contact removed from register!", "success");
    } catch (err: any) {
      console.error("[CONTACTS] Database delete failed:", err);
      showStatus(`Delete Failed: ${err.message}`, "error");

      try {
        handleFirestoreError(err, OperationType.DELETE, `${activeCollection}/${id}`);
      } catch (e) {
        console.error("Firestore DELETE exception logged:", e);
      }
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showStatus(`${label} copied to clipboard!`, 'success');
  };

  const filteredContacts = contacts.filter(c => {
    const query = searchQuery.toLowerCase();
    const isRaw = (c as any)._isRawHotline;
    if (isRaw) {
      return (
        (c.id || '').toLowerCase().includes(query) ||
        ((c as any).value || '').toLowerCase().includes(query)
      );
    }
    return (
      (c.name || '').toLowerCase().includes(query) ||
      (c.contactPerson || '').toLowerCase().includes(query) ||
      (c.position || '').toLowerCase().includes(query) ||
      (c.address || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.phone || '').toLowerCase().includes(query)
    );
  });

  return (
    <div id="contacts-container" className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col h-[78vh] min-h-[550px] relative overflow-hidden">
      
      {/* Toast Alert Status */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-[110] px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 text-xs font-black uppercase tracking-wider ${
              statusMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Header */}
      <div className="p-6 md:p-8 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-600" />
            DSWD Contacts Directory
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Real-time contact details fetched directly from the cloud collection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isLive && isCloudEmpty && (
            <button
              onClick={handleSeedToCloud}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm shadow-emerald-600/10 flex items-center gap-2"
              title="Publish default DSWD contacts to Cloud DB"
            >
              <Sparkles className="w-4 h-4" />
              <span>Publish Defaults</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-550 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-blue-600/10 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Search and Database State Indicator */}
      <div className="px-6 md:px-8 py-4 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search offices, liaisons, phone numbers, or emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-930 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-semibold text-xs text-left"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-150/70 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Database: {isLive ? 'Firestore Live Synchronized' : 'Offline Local Sandbox'}
            </span>
          </div>

          <span className="text-xs font-bold text-slate-400">
            {filteredContacts.length} Record{filteredContacts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Contact Cards Grid Display */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/20">
        {loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              Syncing Directory Database...
            </span>
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact, idx) => {
              const isRaw = (contact as any)._isRawHotline;
              const initials = (contact.name || "DSWD").substring(0, 2).toUpperCase();
              return (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.2) }}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
                >
                  {isRaw ? (
                    <div className="space-y-4">
                      {/* Raw Hotline Card layout (Direct unmodified DB output) */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                            <Phone className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-sm tracking-tight truncate uppercase">
                              {contact.id}
                            </h4>
                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-mono uppercase tracking-widest">
                              Official Hotline Detail
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 text-xs font-semibold text-slate-700">
                        <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100/70">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {contact.id.toLowerCase().includes('email') ? (
                              <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                            )}
                            <span className="truncate font-mono font-bold select-all text-slate-800 text-xs">
                              {(contact as any).value || "No detail listed"}
                            </span>
                          </div>
                          {(contact as any).value && (
                            <button
                              onClick={() => copyToClipboard((contact as any).value, contact.id)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                              title={`Copy ${contact.id}`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Card Title Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-xs tracking-tight line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                              {contact.name || "Unnamed Office"}
                            </h4>
                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-mono">
                              ID: {contact.id.substring(0, 16)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Officer/Liaison Details */}
                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200/40 flex items-center justify-center text-slate-500 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Liaison Contact</p>
                          <p className="text-xs font-bold text-slate-800 leading-tight truncate mt-0.5">
                            {contact.contactPerson || "No Liaison Listed"}
                          </p>
                          {contact.position && (
                            <p className="text-[10px] text-slate-500 font-semibold truncate leading-none mt-0.5">
                              {contact.position}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Communication Parameters (Phone & Email) */}
                      <div className="space-y-3 pt-2 text-xs font-semibold text-slate-700">
                        {/* Phone Number row */}
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100/50">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="truncate font-mono font-bold select-all text-slate-800">
                              {contact.phone || "No details listed"}
                            </span>
                          </div>
                          {contact.phone && (
                            <button
                              onClick={() => copyToClipboard(contact.phone, 'Phone number')}
                              className="p-1 hover:bg-slate-250 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                              title="Copy phone details"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Email address row */}
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100/50">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="truncate text-slate-800 select-all font-bold">
                              {contact.email || "No details listed"}
                            </span>
                          </div>
                          {contact.email && (
                            <button
                              onClick={() => copyToClipboard(contact.email, 'Email address')}
                              className="p-1 hover:bg-slate-250 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                              title="Copy email address"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Street address details */}
                        <div className="flex items-start gap-2.5 p-2.5">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                            {contact.address || "No address particulars listed."}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar Footer */}
                  <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(contact)}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Contact</span>
                    </button>

                    <button
                      onClick={() => initiateDelete(contact.id, contact.name || contact.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-105 text-rose-600 rounded-xl transition-all border border-rose-100 cursor-pointer"
                      title="Delete Contact Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-[2.5rem] p-12 max-w-md mx-auto">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-bounce" />
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight mb-1">No Contacts Available</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
              There are no matching directory contacts inside the registry. Add your first record now!
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-6 py-2.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-550 transition-all shadow-md cursor-pointer"
            >
              Add Contact Rec
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Pop-up Form Modal Layout (Add / Edit Action) */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Dark blur backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFormModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Modal card content wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col relative z-10"
            >
              {/* Modal header details */}
              <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-905 tracking-tight leading-normal">
                      {isEditing ? `Edit Office Contact` : "Add New Contact Register"}
                    </h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DSWD Directory Hub Entry</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Scroll Body area */}
              <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {/* Office Name item */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                      Office / Agency Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DSWD Field Office NCR"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-550 transition-all font-semibold"
                    />
                  </div>

                  {/* Contact Liaison Person details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Maria Clara"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-550 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                        Position / Designation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Regional Director"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-550 transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone & Email item keys */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. (02) 8931-8101"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-550 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. info@dswd.gov.ph"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-550 transition-all"
                      />
                    </div>
                  </div>

                  {/* Physical Address description */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                      Physical Head Office Address
                    </label>
                    <textarea
                      placeholder="e.g. Constitution Hills, Quezon City, Philippines"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-550 transition-all resize-none font-semibold"
                    />
                  </div>

                  {/* Safe Connection Status Badge */}
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Sync Gate: {isLive ? 'Active (Pushes live to Cloud Firestore)' : 'Offline Cache Mode'}
                    </span>
                  </div>
                </div>

                {/* Form Footer Action panel */}
                <div className="px-8 py-4 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-105 transition-all text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-550 text-white font-black rounded-xl hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-blue-600/10"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Contact</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Brand-new Custom Delete Confirmation Popup Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setDeleteConfirmId(null);
                setDeleteConfirmName(null);
              }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 max-w-md w-full p-6 relative z-10 overflow-hidden"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-sm animate-pulse">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight leading-normal">
                    Confirm Deletion
                  </h3>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-0.5">
                    Irreversible Action
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 mb-6">
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  Are you absolutely sure you want to permanently remove this contact details from the registry database?
                </p>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {deleteConfirmName}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 uppercase tracking-wider text-xs font-black">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeleteConfirmName(null);
                  }}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl hover:shadow-lg transition-all active:scale-95 cursor-pointer shadow-rose-600/10"
                >
                  Delete Contact
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
