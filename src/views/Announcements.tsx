import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Send, 
  Loader2, 
  CheckCircle, 
  Clock, 
  User,
  Plus,
  Search,
  MoreVertical,
  X,
  FileText,
  Calendar,
  Trash2,
  AlertTriangle,
  ChevronDown,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, limit, setDoc, doc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, onSnapshot } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  requirements?: string | null;
  time?: string | null;
  date: string;
  day?: string;
  updatedAt: any;
  author: string;
}

export const Announcements: React.FC = () => {
  const { isAdmin } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [requirements, setRequirements] = useState('');
  const [eventTime, setEventTime] = useState('9:00 AM - 5:00 PM');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);

  const getDayName = (dateString: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // We add a zero-time suffix to avoid timezone shifts when parsing YYYY-MM-DD
    const d = new Date(dateString + 'T12:00:00');
    return days[d.getDay()];
  };

  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [history, setHistory] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<Announcement | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'News for users'), orderBy('updatedAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      setHistory(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'News for users');
    });

    return () => unsubscribe();
  }, []);

  const handlePost = async () => {
    if (!title.trim() || !content.trim() || !eventDate.trim() || !eventTime.trim()) return;
    
    setIsPosting(true);
    try {
      const now = serverTimestamp();
      const newsItem = {
        title: title.trim(),
        content: content.trim(),
        requirements: requirements.trim() || null,
        time: eventTime.trim(),
        date: eventDate,
        day: getDayName(eventDate),
        updatedAt: now,
        author: 'Administrator'
      };

      await setDoc(doc(collection(db, 'News for users')), newsItem);

      setPostSuccess(true);
      setTitle('');
      setContent('');
      setRequirements('');
      setEventTime('9:00 AM - 5:00 PM');
      setTimeout(() => {
        setPostSuccess(false);
        setShowCreateForm(false);
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'News for users');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'News for users', itemToDelete.id));
      setItemToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `News for users/${itemToDelete.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredHistory = history.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] -mt-8 -mx-8 px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">System News Ledger</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">Announcements</h1>
            <p className="text-slate-500 font-medium mt-2">Manage and publish critical updates to the citizen network</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium w-64 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Launch Broadcast
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing with registry...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Megaphone className="w-8 h-8 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Registry Empty</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">No broadcast history found matching your current parameters.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="hidden md:grid grid-cols-12 px-10 py-5 bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <div className="col-span-6">Heading & Description</div>
                <div className="col-span-2">Event Date</div>
                <div className="col-span-2">Publisher</div>
                <div className="col-span-2 text-right">Options</div>
              </div>

              <div className="overflow-hidden">
                <AnimatePresence initial={false}>
                  {filteredHistory.map((item, idx) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setSelectedAnnouncement(item)}
                        className="grid grid-cols-1 md:grid-cols-12 items-center px-10 py-7 hover:bg-slate-50 transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-600"
                      >
                        <div className="col-span-10 md:col-span-6 pr-8 mb-4 md:mb-0">
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight mb-2">
                            {item.title}
                          </h3>
                          {item.date && (
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-md">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                                  {item.day ? `${item.day}, ` : ''}{new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              {item.time && (
                                <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-2 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {item.time}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-slate-500 font-medium line-clamp-1 opacity-70">
                            {item.content}
                          </p>
                        </div>
                        <div className="col-span-5 md:col-span-2 flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-black text-slate-900 tracking-tight">
                            {item.date ? `${item.day ? item.day + ', ' : ''}${new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'N/A'}
                          </span>
                        </div>
                        <div className="col-span-5 md:col-span-2 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="text-xs font-bold text-slate-600 tracking-tight">{item.author}</span>
                        </div>
                        <div className="col-span-2 md:col-span-2 text-right">
                           {isAdmin ? (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setItemToDelete(item);
                               }}
                               className="p-3 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all text-slate-300 group/btn"
                             >
                               <Trash2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                             </button>
                           ) : (
                             <button className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-300">
                               <MoreVertical className="w-5 h-5" />
                             </button>
                           )}
                        </div>
                      </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Announcement Detail Popover */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnnouncement(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[150]"
            />
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[151] pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-900 rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden pointer-events-auto border border-white/10"
              >
                <div className="relative p-12">
                  <button 
                    onClick={() => setSelectedAnnouncement(null)}
                    className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                  >
                    <X className="w-8 h-8" />
                  </button>

                  <div className="mb-10">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-xl mb-6">
                      <Megaphone className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-blue-400">Global Announcement</span>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
                      {selectedAnnouncement.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-10 pb-10 border-b border-white/5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Scheduled Event</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{selectedAnnouncement.day || 'Date'}</p>
                          <p className="text-xs text-slate-400 font-medium">{selectedAnnouncement.date}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Event Window</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{selectedAnnouncement.time || 'All Day'}</p>
                          <p className="text-xs text-slate-400 font-medium">Standard broadcast</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 px-1">Message Content</p>
                      <div className="bg-white/5 rounded-[2rem] p-8 text-slate-300 font-medium leading-relaxed">
                        {selectedAnnouncement.content}
                      </div>
                    </div>

                    {selectedAnnouncement.requirements && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4 px-1">Special Requirements</p>
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-[1.5rem] p-6 text-blue-100 font-bold text-sm italic">
                          "{selectedAnnouncement.requirements}"
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xs">
                        {selectedAnnouncement.author?.[0]}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{selectedAnnouncement.author}</p>
                        <p className="text-[10px] font-bold text-slate-500">Verified System Official</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedAnnouncement(null)}
                      className="px-8 py-4 bg-slate-800 hover:bg-slate-750 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-over Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateForm(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-yellow-400 shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[101] overflow-y-auto"
            >
              <div className="p-12">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Post Update</h2>
                    <p className="text-slate-900/60 font-medium text-lg mt-1">Configure your global broadcast</p>
                  </div>
                  <button 
                    onClick={() => setShowCreateForm(false)}
                    className="w-12 h-12 flex items-center justify-center hover:bg-black/5 rounded-2xl transition-colors text-slate-900"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 block px-1">News Headline</label>
                    <input 
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter Announcement Title"
                      className="w-full px-8 py-5 bg-white/90 border-2 border-white/20 rounded-[1.5rem] text-slate-900 font-black text-lg focus:outline-none focus:bg-white focus:border-slate-900 transition-all shadow-sm placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 block px-1">Event Date</label>
                      <div className="relative">
                        <CalendarDays className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-900 pointer-events-none z-10" />
                        <input 
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full pl-16 pr-8 py-5 bg-white/90 border-2 border-white/20 rounded-[1.5rem] text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-slate-900 transition-all shadow-sm cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 block px-1">Schedule Time</label>
                      <div className="relative">
                        <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-900 pointer-events-none" />
                        <input 
                          type="text"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          placeholder="e.g. 9am to 5pm"
                          className="w-full pl-16 pr-8 py-5 bg-white/90 border-2 border-white/20 rounded-[1.5rem] text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-slate-900 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 block px-1">Message Body</label>
                    <textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Describe the announcement"
                      className="w-full h-48 px-8 py-8 bg-white/90 border-2 border-white/20 rounded-[2rem] text-slate-900 font-medium text-base focus:outline-none focus:bg-white focus:border-slate-900 transition-all shadow-sm resize-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 block px-1">Requirements (Optional)</label>
                    <textarea 
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="e.g. Bring identification, Wear formal attire..."
                      className="w-full h-32 px-8 py-6 bg-white/90 border-2 border-white/20 rounded-[2rem] text-slate-900 font-medium text-base focus:outline-none focus:bg-white focus:border-slate-900 transition-all shadow-sm resize-none placeholder:text-slate-400"
                    />
                  </div>

                  <button 
                    onClick={handlePost}
                    disabled={isPosting || !title.trim() || !content.trim() || !eventDate.trim() || !eventTime.trim()}
                    className="w-full py-8 bg-slate-900 text-white font-black rounded-3xl hover:bg-black transition-all flex items-center justify-center gap-4 shadow-2xl shadow-black/20 disabled:opacity-50 disabled:grayscale group active:scale-[0.98] text-sm uppercase tracking-[0.4em]"
                  >
                    {isPosting ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <>
                        <span>Push to Citizens</span>
                        <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {postSuccess && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-emerald-500 text-white rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-emerald-500/20"
                      >
                        <CheckCircle className="w-12 h-12 mb-3" />
                        <h3 className="text-xl font-black uppercase tracking-[0.2em]">Broadcast Successful</h3>
                        <p className="text-xs font-bold opacity-80 mt-1 uppercase tracking-widest">Network updated in real-time</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[201] pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden pointer-events-auto"
              >
                <div className="p-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Confirm Removal</h3>
                  <p className="text-slate-500 font-medium text-sm mb-10">
                    Are you certain you want to delete <span className="text-slate-900 font-bold">"{itemToDelete.title}"</span>? This action is irreversible.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <button 
                      onClick={() => setItemToDelete(null)}
                      className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-2xl transition-all text-xs uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Permanently'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
