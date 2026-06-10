import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { 
  ShoppingCart, Home, LayoutDashboard, Package, Trash2, Plus, 
  X, Image as ImageIcon, CheckCircle, Clock, ChevronDown, BarChart3, 
  AlertCircle, Search, Menu, LogOut, User, Settings as SettingsIcon, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Upload, Shield, 
  Briefcase, FileText, Download, UploadCloud, Terminal,
  UserPlus, Award, Gift, Users, Edit3, ClipboardList, Heart, Printer, MessageCircle, ExternalLink, MoreVertical, Database, Tag, Star, TrendingUp, Sparkles, Grid, History
} from 'lucide-react';

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// ============================================================================
// KONFIGURASI FIREBASE & SERVER GAMBAR
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAtiK53dCj69ec0BRCwz4uJNuCAsV9dlUE",
  authDomain: "aisyawardrobe01.firebaseapp.com",
  projectId: "aisyawardrobe01",
  storageBucket: "aisyawardrobe01.firebasestorage.app",
  messagingSenderId: "87038023584",
  appId: "1:87038023584:web:bb193e8cb3f4970bcd76c5",
  measurementId: "G-M28EY2ZYDG"
};

const app = initializeApp(firebaseConfig);
const dbFirestore = getFirestore(app);
const stateDocRef = doc(dbFirestore, "aisya_database", "main_state");

const IMGBB_API_KEY = "aab30f3a1714c46f739b7d56dd87a5b3"; 

const compressImage = (file, preserveTransparency = false) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; 
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) { height = Math.round((height *= MAX_WIDTH / width)); width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); 
        
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        if (preserveTransparency) {
           resolve(canvas.toDataURL('image/png')); 
        } else {
           resolve(canvas.toDataURL('image/jpeg', 0.6)); 
        }
      };
    };
  });
};

const uploadImageToServer = async (base64Image) => {
  if (!IMGBB_API_KEY) return null; 
  try {
    const base64Data = base64Image.split(',')[1]; 
    const formData = new FormData();
    formData.append('image', base64Data);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
    const data = await response.json();
    if (data.success) return data.data.url; 
    return null; 
  } catch (error) { return null; }
};

const AppStateContext = createContext();
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
const getSocialLink = (type, value) => {
  if (!value) return '#';
  const cleanValue = value.replace('@', '').trim();
  const t = type.toLowerCase();
  if (t.includes('wa') || t.includes('whatsapp')) return `https://wa.me/${value.replace(/\D/g, '')}`;
  if (t.includes('instagram') || t.includes('ig')) return `https://instagram.com/${cleanValue}`;
  if (t.includes('tiktok')) return `https://tiktok.com/@${cleanValue}`;
  if (value.startsWith('http')) return value;
  return '#'; 
};

// ============================================================================
// KOMPONEN GLOBAL (TOAST & WA)
// ============================================================================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(() => onClose(), type === 'error' ? 5000 : 3000); return () => clearTimeout(timer); }, [onClose, type]);
  return (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in-down w-[90%] md:w-max max-w-lg">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-2 ${type === 'success' ? 'bg-green-50 border-green-400 text-green-800' : type === 'error' ? 'bg-red-50 border-red-500 text-red-900' : 'bg-blue-50 border-blue-400 text-blue-800'}`}>
        {type === 'success' ? <CheckCircle className="w-6 h-6 flex-shrink-0 text-green-500" /> : type === 'error' ? <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-600" /> : <Shield className="w-6 h-6 flex-shrink-0 text-blue-500" />}
        <span className="font-medium text-sm leading-relaxed">{message}</span>
      </div>
    </div>
  );
};

const FloatingWA = () => {
  const { db } = useContext(AppStateContext);
  const waNumber = db.brandConfig?.socialMedia?.find(s => s.type === 'WhatsApp' || s.type === 'WA')?.value || '';
  if (!waNumber) return null;
  const text = encodeURIComponent(`Halo Admin ${db.brandConfig.appName}, saya butuh bantuan nih...`);
  const link = `https://wa.me/${waNumber.replace(/\D/g,'')}?text=${text}`;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="fixed bottom-8 left-8 z-[90] flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-700 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(212,175,55,0.5)] hover:scale-110 transition-all duration-300 group">
      <span className="absolute w-full h-full rounded-full bg-amber-500 opacity-50 animate-ping"></span>
      <MessageCircle className="w-7 h-7 relative z-10" />
    </a>
  );
};

// ============================================================================
// STATE MANAGEMENT & PROVIDER
// ============================================================================
const getInitialData = () => {
  let cachedBrandConfig = null;
  try {
    const stored = localStorage.getItem('aisya_brand_config');
    if (stored) cachedBrandConfig = JSON.parse(stored);
  } catch(e) {}

  return {
    products: [], categories: ['Kebaya', 'Jas', 'Batik', 'Gaun', 'Aksesoris'], orders: [],
    users: [
      { id: 'U0', username: 'dev', password: 'dev', name: 'Developer System', role: 'developer' },
      { id: 'U1', username: 'owner', password: 'owner123', name: 'Owner Aisya', role: 'owner' },
      { id: 'U2', username: 'manager', password: 'manager123', name: 'Manajer Operasional', role: 'manager' },
      { id: 'U3', username: 'admin', password: 'admin123', name: 'Admin Kasir', role: 'admin' }
    ],
    members: [], prizes: [{ id: 'PRZ-01', name: 'Voucher Rp 50k', points: 500, image: '', desc: 'Diskon sewa' }],
    promos: [], logs: [], approvals: [],
    brandConfig: cachedBrandConfig || {
      appName: 'Aisya Wardrobe', slogan: 'Sewa Pakaian Premium & Eksklusif', companyBio: 'Penyedia layanan sewa pakaian premium terpercaya untuk momen spesial Anda.',
      logoUrl: '', appIcon: '', themeColor: 'rose', logoFont: 'Playfair Display', companyEmail: 'admin@aisyawardrobe.com',
      socialMedia: [{ type: 'WhatsApp', value: '6281234567890', label: 'Hubungi Kami' }],
      bentoCategories: ['Kebaya', 'Gaun', 'Jas'] 
    }
  };
};

const AppStateProvider = ({ children }) => {
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  const [db, setDb] = useState(getInitialData());
  const [view, setView] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loggedInMember, setLoggedInMember] = useState(null);

  const themeColors = {
    rose: { bg: 'bg-rose-600', hover: 'hover:bg-rose-700', text: 'text-rose-600', border: 'border-rose-600', light: 'bg-rose-50 text-rose-600' },
    amber: { bg: 'bg-amber-600', hover: 'hover:bg-amber-700', text: 'text-amber-600', border: 'border-amber-600', light: 'bg-amber-50 text-amber-600' },
    emerald: { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', text: 'text-emerald-600', border: 'border-emerald-600', light: 'bg-emerald-50 text-emerald-600' },
    slate: { bg: 'bg-slate-800', hover: 'hover:bg-slate-900', text: 'text-slate-800', border: 'border-slate-800', light: 'bg-slate-100 text-slate-800' },
  };
  const cTheme = themeColors[db.brandConfig?.themeColor] || themeColors.rose;

  // 1. Dynamic Font Loader
  useEffect(() => {
    const font = db.brandConfig?.logoFont || 'Playfair Display';
    const linkId = 'custom-logo-font';
    let link = document.getElementById(linkId);
    if (!link) { link = document.createElement('link'); link.id = linkId; link.rel = 'stylesheet'; document.head.appendChild(link); }
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;700&display=swap`;
  }, [db.brandConfig?.logoFont]);

  // 2. Dynamic PWA (Progressive Web App) Injector Sayang
  useEffect(() => {
    if (!db.brandConfig) return;
    const { appName, themeColor, logoUrl } = db.brandConfig;
    
    // Fungsi pembuat Meta Tag
    const setMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) { 
         meta = document.createElement('meta'); 
         meta.name = name; 
         document.head.appendChild(meta); 
      }
      meta.content = content;
    };

    // Meta Tags ajaib untuk iOS & PWA
    setMeta('apple-mobile-web-app-capable', 'yes');
    setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMeta('apple-mobile-web-app-title', appName || 'Aisya Wardrobe');
    setMeta('theme-color', themeColor === 'slate' ? '#1e293b' : '#fafaf9');

    // Suntikkan Ikon Layar Utama (Apple Touch Icon)
    if (logoUrl) {
      let linkIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (!linkIcon) { 
         linkIcon = document.createElement('link'); 
         linkIcon.rel = 'apple-touch-icon'; 
         document.head.appendChild(linkIcon); 
      }
      linkIcon.href = logoUrl;
    }

    // Bangun file Manifest buatan (Blob) agar bisa di-install
    const manifest = {
      name: appName || 'Aisya Wardrobe', 
      short_name: appName || 'Aisya',
      display: 'standalone', 
      start_url: '/', 
      background_color: '#fafaf9', 
      theme_color: '#1c1917',
      icons: logoUrl ? [
        { src: logoUrl, sizes: '192x192', type: 'image/png' }, 
        { src: logoUrl, sizes: '512x512', type: 'image/png' }
      ] : []
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) { 
       manifestLink = document.createElement('link'); 
       manifestLink.rel = 'manifest'; 
       document.head.appendChild(manifestLink); 
    }
    manifestLink.href = manifestUrl;

    // Pembersihan memori saat komponen di-unmount
    return () => URL.revokeObjectURL(manifestUrl);
  }, [db.brandConfig?.appName, db.brandConfig?.logoUrl, db.brandConfig?.themeColor]);

  useEffect(() => {
    const unsubscribe = onSnapshot(stateDocRef, (docSnap) => {
      if (docSnap.exists()) {
         const serverData = docSnap.data();
         if(!serverData.users) serverData.users = getInitialData().users;
         if(!serverData.categories) serverData.categories = getInitialData().categories;
         if(!serverData.orders) serverData.orders = [];
         if(!serverData.products) serverData.products = [];
         if(!serverData.members) serverData.members = [];
         if(!serverData.approvals) serverData.approvals = [];
         if(!serverData.logs) serverData.logs = [];
         if(!serverData.prizes) serverData.prizes = [];
         if(!serverData.promos) serverData.promos = [];
         if(!serverData.brandConfig.logoFont) serverData.brandConfig.logoFont = 'Playfair Display';
         if(!serverData.brandConfig.bentoCategories) serverData.brandConfig.bentoCategories = ['Kebaya', 'Gaun', 'Jas'];

         setDb(serverData);
         try { localStorage.setItem('aisya_brand_config', JSON.stringify(serverData.brandConfig)); } catch(e) {}
         
         setLoggedInUser(prev => { if (!prev) return null; return serverData.users.find(u => u.id === prev.id) || null; });
         setLoggedInMember(prev => { if (!prev) return null; return serverData.members.find(m => m.id === prev.id) || null; });
      } else {
         setDoc(stateDocRef, getInitialData());
      }
      setIsDbLoading(false);
    }, (error) => { showToast(`Gagal Terhubung Firebase: ${error.message}`, "error"); setIsDbLoading(false); });
    return () => unsubscribe();
  }, []);

  const saveToDatabase = async (newDbState) => {
    if (db.products && db.products.length > 0 && (!newDbState.products || newDbState.products.length === 0)) { showToast("Mencegah Penghapusan Massal.", "error"); return; }
    setDb(newDbState); setSaveStatus('Menyimpan...');
    try { await setDoc(stateDocRef, newDbState); setSaveStatus('Tersimpan ✓'); setTimeout(() => setSaveStatus(''), 2000); } 
    catch (error) { setSaveStatus('Gagal ✗'); showToast(`Gagal Disimpan!`, "error"); }
  };

  const updateDb = (key, value) => { saveToDatabase({ ...db, [key]: value }); };
  const createLog = (dbState, action, detail, user = loggedInUser?.name || 'Sistem') => { return [{ id: `LOG-${Date.now()}-${Math.floor(Math.random()*1000)}`, timestamp: new Date().toLocaleString(), user, action, detail }, ...(dbState.logs || [])]; };

  const login = (username, password) => {
    if (isDbLoading) return false;
    const currentUsers = (db.users && db.users.length > 0) ? db.users : getInitialData().users;
    const user = currentUsers.find(u => u.username === username && u.password === password);
    
    if (user) { 
       setLoggedInUser(user); setView('admin'); 
       if (!isDbLoading) { saveToDatabase({ ...db, logs: createLog(db, 'Otorisasi', 'Login Admin', user.name) }); }
       return true; 
    }
    
    if (username === 'dev' && password === 'dev') {
       setLoggedInUser({ id: 'U0', username: 'dev', password: 'dev', name: 'Developer System', role: 'developer' }); setView('admin'); 
       if (!isDbLoading) { saveToDatabase({ ...db, logs: createLog(db, 'Otorisasi', 'Bypass Login Developer', 'Developer') }); }
       return true;
    }
    return false;
  };
  
  const logout = () => { saveToDatabase({ ...db, logs: createLog(db, 'Otorisasi', 'Logout Admin', loggedInUser?.name) }); setLoggedInUser(null); setView('dashboard'); };
  const memberLogin = (username, password) => {
    const member = (db.members || []).find(m => m.username === username && m.password === password && m.status === 'approved');
    if (member) { setLoggedInMember(member); setView('member_profile'); showToast(`Selamat datang, ${member.name}!`); return true; }
    return false;
  };
  const memberLogout = () => { setLoggedInMember(null); setView('dashboard'); showToast('Berhasil keluar akun.'); };

  const requireApproval = (actionType, payload, successMsg) => {
    if (!loggedInUser) return false;
    if (['developer', 'owner'].includes(loggedInUser.role) || (loggedInUser.role === 'manager' && actionType !== 'UPDATE_USER')) { executeAction(actionType, payload); showToast(successMsg); return true; }
    const newApp = { id: `APP-${Date.now()}`, actionType, payload, requestedBy: loggedInUser.name, requesterRole: loggedInUser.role, date: new Date().toLocaleString() };
    saveToDatabase({ ...db, approvals: [newApp, ...(db.approvals || [])], logs: createLog(db, 'Persetujuan', `Mengajukan: ${actionType}`) });
    showToast('Tindakan butuh persetujuan Manager/Owner', 'info'); return false;
  };

  const executeAction = (actionType, payload) => {
    let newDb = { ...db }; let actStr = ''; let detStr = '';
    switch (actionType) {
      case 'ADD_PRODUCT': newDb.products = [payload, ...(newDb.products||[])]; actStr='Inventaris'; detStr=`Tambah: ${payload.name}`; break;
      case 'EDIT_PRODUCT': newDb.products = (newDb.products||[]).map(p => p.id === payload.id ? payload : p); actStr='Inventaris'; detStr=`Edit: ${payload.id}`; break;
      case 'DELETE_PRODUCT': newDb.products = (newDb.products||[]).filter(p => p.id !== payload.id); actStr='Inventaris'; detStr=`Hapus: ${payload.id}`; break;
      case 'UPDATE_PRODUCT_STATUS': newDb.products = (newDb.products||[]).map(p => p.id === payload.id ? { ...p, status: payload.status } : p); actStr='Inventaris'; detStr=`Status ${payload.id} -> ${payload.status}`; break;
      case 'ADD_CATEGORY': newDb.categories = [...(newDb.categories||[]), payload]; actStr='Kategori'; detStr=`Tambah: ${payload}`; break;
      case 'DELETE_CATEGORY': newDb.categories = (newDb.categories||[]).filter(c => c !== payload); actStr='Kategori'; detStr=`Hapus: ${payload}`; break;
      case 'UPDATE_ORDER': newDb.orders = (newDb.orders||[]).map(o => o.id === payload.id ? { ...o, status: payload.status, denda: payload.denda||0, totalRefundDeposit: payload.refund||0 } : o); actStr='Pesanan'; detStr=`Status ${payload.id} -> ${payload.status}`; break;
      case 'COMPLETE_ORDER': 
        newDb.orders = (newDb.orders||[]).map(o => o.id === payload.orderId ? { ...o, status: payload.newStatus, denda: payload.denda||0, totalRefundDeposit: payload.refund||0 } : o);
        newDb.products = (newDb.products||[]).map(p => payload.itemIds.includes(p.id) ? { ...p, status: 'Maintenance' } : p); actStr='Pesanan'; detStr=`Selesai & Baju ke Maintenance: ${payload.orderId}`; break;
      case 'CANCEL_ORDER': 
        newDb.orders = (newDb.orders||[]).map(o => o.id === payload.orderId ? { ...o, status: payload.newStatus } : o);
        newDb.products = (newDb.products||[]).map(p => payload.itemIds.includes(p.id) ? { ...p, status: 'Maintenance' } : p); actStr='Pesanan'; detStr=`Batal & Baju ke Maintenance: ${payload.orderId}`; break;
      case 'REGISTER_MEMBER':
        const newId = `MEM-${new Date().getFullYear().toString().slice(-2)}${String((newDb.members||[]).length + 1).padStart(3, '0')}`;
        newDb.members = [{ ...payload, id: newId, points: 0, status: 'approved', wishlist: [] }, ...(newDb.members||[])]; actStr='Member'; detStr=`Setuju member: ${newId}`; break;
      case 'UPDATE_MEMBER':
        newDb.members = (newDb.members||[]).map(m => m.id === payload.id ? { ...m, ...payload } : m);
        if(loggedInMember?.id === payload.id) setLoggedInMember(prev => ({...prev, ...payload}));
        actStr='Member'; detStr=`Update Profil Member: ${payload.name}`; break;
      case 'UPDATE_USER': 
        newDb.users = (newDb.users||[]).map(u => u.id === payload.userId ? { ...u, ...payload } : u);
        if(loggedInUser?.id === payload.userId) setLoggedInUser(prev => ({...prev, ...payload})); actStr='Pengguna'; detStr=`Update Profil/Pass: ${payload.username}`; break;
      case 'ADD_PRIZE': newDb.prizes = [payload, ...(newDb.prizes||[])]; actStr='Hadiah'; detStr=`Tambah: ${payload.name}`; break;
      case 'DELETE_PRIZE': newDb.prizes = (newDb.prizes||[]).filter(p => p.id !== payload.id); actStr='Hadiah'; detStr=`Hapus: ${payload.id}`; break;
      default: break;
    }
    if(actStr) { newDb.logs = createLog(newDb, actStr, detStr); } saveToDatabase(newDb);
  };

  const handleApproval = (id, action) => {
    const req = (db.approvals||[]).find(a => a.id === id); if (!req) return;
    if (action === 'approve') { executeAction(req.actionType, req.payload); showToast('Disetujui'); } else { showToast('Ditolak', 'info'); }
    saveToDatabase({ ...db, approvals: db.approvals.filter(a => a.id !== id), logs: createLog(db, 'Persetujuan', `${action === 'approve' ? 'Setuju' : 'Tolak'}: ${req.actionType}`) });
  };

  const getAvailableStock = (productId) => {
    const product = (db.products||[]).find(p => p.id === productId); if (!product || product.status === 'Maintenance') return 0;
    const rented = (db.orders||[]).filter(o => ['Menunggu Konfirmasi', 'Siap Diambil', 'Sedang Disewa'].includes(o.status)).reduce((total, order) => { const item = order.items.find(i => i.id === productId); return total + (item ? item.quantity : 0); }, 0);
    return product.totalStock - rented;
  };

  const toggleWishlist = (productId) => {
    if (!loggedInMember) return showToast('Login member untuk menyimpan ke wishlist.', 'info');
    const wishlist = loggedInMember.wishlist || [];
    const isWished = wishlist.includes(productId);
    const newWishlist = isWished ? wishlist.filter(id => id !== productId) : [...wishlist, productId];
    const updatedMember = { ...loggedInMember, wishlist: newWishlist }; setLoggedInMember(updatedMember);
    const newMembers = (db.members||[]).map(m => m.id === updatedMember.id ? updatedMember : m);
    saveToDatabase({ ...db, members: newMembers }); showToast(isWished ? 'Dihapus dari wishlist' : 'Tersimpan di wishlist!');
  };

  const processOrder = (formData, isWA = false) => {
    const subtotal = cart.reduce((sum, item) => sum + ((item.discountPrice > 0 ? item.discountPrice : item.price) * item.quantity), 0);
    const totalDeposit = cart.reduce((sum, item) => sum + ((item.deposit || 0) * item.quantity), 0);
    const duration = formData.duration || 1;
    const totalSewa = subtotal * duration; const totalBiaya = totalSewa + totalDeposit; 
    const earnedPoints = loggedInMember ? Math.floor(totalSewa / 10000) : 0;
    const newOrderId = `ORD-${2000 + (db.orders ? db.orders.length : 0) + 1}`;

    const newOrder = {
      id: newOrderId, date: new Date().toISOString().split('T')[0],
      customer: { name: formData.name, phone: formData.phone, identity: formData.identity, ktpUrl: formData.ktpUrl },
      items: cart.map(c => ({ id: c.id, name: c.name, price: c.price, discountPrice: c.discountPrice || 0, deposit: c.deposit||0, quantity: c.quantity, images: c.images||[] })),
      duration, startDate: formData.startDate, endDate: formData.endDate, totalSewa, totalDeposit, total: totalBiaya, status: 'Menunggu Konfirmasi', memberId: loggedInMember?.id || null, earnedPoints, denda: 0
    };
    
    let newDb = { ...db, orders: [newOrder, ...(db.orders || [])], logs: createLog(db, 'Pelanggan', `Pesanan masuk: ${newOrder.id}`, 'Pelanggan') };
    if (loggedInMember) {
      const um = { ...loggedInMember, points: loggedInMember.points + earnedPoints }; setLoggedInMember(um);
      newDb.members = (newDb.members || []).map(m => m.id === um.id ? um : m);
    }
    saveToDatabase(newDb); setCart([]); setView('success'); 

    if (isWA) {
      const waNumber = db.brandConfig?.socialMedia?.find(s => s.type === 'WhatsApp' || s.type === 'WA')?.value || '';
      const text = `Halo Admin ${db.brandConfig.appName}, saya ingin menyewa pakaian.\n\n*ID Pesanan:* ${newOrderId}\n*Nama:* ${formData.name}\n*Tgl Sewa:* ${formData.startDate} (${duration} Hari)\n\n*Total Biaya (Inc. Deposit):* ${formatRupiah(totalBiaya)}\n\nMohon konfirmasinya. Terima kasih!`;
      window.open(`https://wa.me/${waNumber.replace(/\D/g,'')}?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const printInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Invoice ${order.id}</title>
      <style>body { font-family: sans-serif; padding: 40px; } .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; } .title { font-size: 24px; font-family: '${db.brandConfig.logoFont}', serif; font-weight: bold; } .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #fafafa; padding-bottom: 10px; } .total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 15px; margin-top: 15px; } table { width: 100%; border-collapse: collapse; margin-bottom: 30px; } th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }</style></head><body>
      <div class="header"><h1 class="title">${db.brandConfig.appName}</h1><p>INVOICE PENYEWAAN</p></div>
      <div class="row"><span>ID Pesanan:</span> <strong>${order.id}</strong></div><div class="row"><span>Pelanggan:</span> <strong>${order.customer.name} (${order.customer.phone})</strong></div><div class="row"><span>Tanggal Sewa:</span> <strong>${order.startDate} s/d ${order.endDate} (${order.duration} Hari)</strong></div>
      <table><tr><th>Barang</th><th>Qty</th><th>Harga/Hr</th><th>Deposit</th></tr>${order.items.map(i => { const effPrice = i.discountPrice > 0 ? i.discountPrice : i.price; return `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${formatRupiah(effPrice)}</td><td>${formatRupiah(i.deposit)}</td></tr>`; }).join('')}</table>
      <div class="row"><span>Total Biaya Sewa:</span> <span>${formatRupiah(order.totalSewa)}</span></div><div class="row"><span>Total Uang Jaminan:</span> <span>${formatRupiah(order.totalDeposit)}</span></div><div class="row total"><span>TOTAL KESELURUHAN:</span> <span>${formatRupiah(order.total)}</span></div>
      ${order.status === 'Selesai' ? `<div class="row"><span>Denda Keterlambatan/Kerusakan:</span> <span style="color:red">-${formatRupiah(order.denda)}</span></div><div class="row total"><span>DEPOSIT DIKEMBALIKAN:</span> <span>${formatRupiah(order.totalRefundDeposit)}</span></div>` : ''}
      <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #888;">Terima kasih telah mempercayakan momen spesial Anda pada ${db.brandConfig.appName}.<br/>Barang sewaan wajib dikembalikan tepat waktu untuk menghindari denda.</div>
      <script>window.print(); window.onafterprint = function(){ window.close(); }</script></body></html>
    `);
    printWindow.document.close();
  };

  const submitMemberRegistration = (formData) => {
    const newApp = { id: `APP-${Date.now()}`, actionType: 'REGISTER_MEMBER', payload: formData, requestedBy: formData.name, requesterRole: 'Calon Member', date: new Date().toLocaleString() };
    saveToDatabase({ ...db, approvals: [newApp, ...(db.approvals || [])], logs: createLog(db, 'Persetujuan', `Daftar Member: ${formData.name}`, 'Calon Member') }); showToast('Pendaftaran diajukan. Menunggu persetujuan Admin.', 'info');
  };

  const redeemPrize = (prize) => {
    if (!loggedInMember) return;
    if (loggedInMember.points >= prize.points) {
      const updatedMember = { ...loggedInMember, points: loggedInMember.points - prize.points }; setLoggedInMember(updatedMember);
      const newMembers = (db.members||[]).map(m => m.id === updatedMember.id ? updatedMember : m);
      saveToDatabase({ ...db, members: newMembers, logs: createLog(db, 'Hadiah', `Tukar poin dengan: ${prize.name}`, updatedMember.name) }); showToast(`Berhasil menukar poin dengan ${prize.name}!`, 'success');
    } else { showToast('Poin Anda tidak mencukupi.', 'error'); }
  };

  const setBentoCategory = (index, category) => {
    const newBento = [...(db.brandConfig.bentoCategories || ['','',''])];
    newBento[index] = category;
    updateDb('brandConfig', { ...db.brandConfig, bentoCategories: newBento });
  };

  const value = {
    db, setDb, isDbLoading, saveStatus, updateDb, saveToDatabase, showToast,
    view, setView, cart, setCart, loggedInUser, loggedInMember, cTheme,
    login, logout, memberLogin, memberLogout, submitMemberRegistration, redeemPrize,
    getAvailableStock, toggleWishlist, uploadImageToServer, compressImage, setBentoCategory,
    addToCart: (p) => { setCart([...cart, { ...p, quantity: 1 }]); showToast(`${p.name} masuk keranjang.`); },
    removeFromCart: (id) => setCart(cart.filter(i => i.id !== id)),
    updateCartQuantity: (id, d) => setCart(cart.map(i => i.id === id && i.quantity + d > 0 ? { ...i, quantity: i.quantity + d } : i)),
    processOrder, requireApproval, handleApproval, printInvoice,
    exportData: () => { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db)); const dl = document.createElement('a'); dl.href = dataStr; dl.download = `aisya_backup_${Date.now()}.json`; dl.click(); },
    importData: (json) => { try { setDb(JSON.parse(json)); showToast('Restore sukses!'); } catch(e) { showToast('Gagal parse JSON', 'error'); } }
  };

  return <AppStateContext.Provider value={value}>{toast && <Toast {...toast} onClose={() => setToast(null)} />}{children}</AppStateContext.Provider>;
};

// ============================================================================
// SPLASH SCREEN EXCLUSIVE
// ============================================================================
const SplashScreen = () => {
  const { db } = useContext(AppStateContext);
  return (
    <div className="fixed inset-0 bg-stone-900 flex flex-col items-center justify-center z-[9999]">
      <div className="w-24 h-24 bg-gradient-to-tr from-amber-500 to-amber-700 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(212,175,55,0.4)] animate-pulse">
        {db?.brandConfig?.logoUrl ? (
          <img src={db.brandConfig.logoUrl} className="w-16 h-16 object-contain filter drop-shadow-md" alt="Logo" />
        ) : db?.brandConfig?.appIcon ? (
          <span className="text-4xl">{db.brandConfig.appIcon}</span>
        ) : (
          <Package className="w-10 h-10 text-white" />
        )}
      </div>
      <h1 style={{ fontFamily: db?.brandConfig?.logoFont || 'Playfair Display' }} className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 font-bold tracking-widest mb-3 animate-fade-in-down drop-shadow-md">
        {db?.brandConfig?.appName || 'Aisya Wardrobe'}
      </h1>
      <p className="text-stone-400 text-sm tracking-widest uppercase font-light">Mempersiapkan Koleksi...</p>
      <div className="mt-10 w-56 h-0.5 bg-stone-800 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-600 to-amber-300 w-1/2 animate-[spin_1.5s_linear_infinite]" style={{ animationName: 'loadingBar', animationDuration: '1.5s', animationIterationCount: 'infinite' }}></div>
      </div>
      <style>{`@keyframes loadingBar { 0% { width: 0%; transform: translateX(-100%); } 100% { width: 100%; transform: translateX(200%); } }`}</style>
    </div>
  );
};

// ============================================================================
// LAYOUT CUSTOMER
// ============================================================================
const CustomerLayout = ({ children }) => {
  const { view, setView, cart, db, cTheme, loggedInUser, loggedInMember } = useContext(AppStateContext);
  const [showNav, setShowNav] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-10">
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-3 h-16 flex items-center justify-between">
          <button onClick={() => setShowNav(true)} className="md:hidden p-2 text-stone-600"><Menu className="w-6 h-6"/></button>
          
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('dashboard')}>
            {db.brandConfig.logoUrl ? <img src={db.brandConfig.logoUrl} className="h-9 object-contain group-hover:scale-105 transition-transform" alt="Logo"/> : 
             db.brandConfig.appIcon ? <span className="text-3xl group-hover:scale-105 transition-transform">{db.brandConfig.appIcon}</span> : <Package className={`w-8 h-8 ${cTheme.text}`} />}
            <span style={{ fontFamily: db.brandConfig.logoFont || 'Playfair Display' }} className="text-2xl font-bold text-stone-900 tracking-wide hidden sm:block">
              {db.brandConfig.appName}
            </span>
          </div>

          <nav className="hidden md:flex gap-8 absolute left-1/2 transform -translate-x-1/2">
            <button onClick={() => setView('dashboard')} className={`font-bold transition-colors ${view==='dashboard'?cTheme.text:'text-stone-500 hover:text-stone-900'}`}>Beranda</button>
            <button onClick={() => setView('catalog')} className={`font-bold transition-colors ${view==='catalog'?cTheme.text:'text-stone-500 hover:text-stone-900'}`}>Katalog Eksklusif</button>
          </nav>

          <div className="flex items-center gap-3 relative">
            <button onClick={() => loggedInMember ? setView('member_profile') : setView('member_auth')} className={`p-2.5 rounded-full transition-all hover:bg-stone-100 ${loggedInMember ? cTheme.text : 'text-stone-600'}`}>
              {loggedInMember?.photoUrl ? <img src={loggedInMember.photoUrl} className="w-8 h-8 rounded-full object-cover border" alt="Member"/> : <User className="w-6 h-6" />}
            </button>
            <button onClick={() => setView('cart')} className="p-2.5 rounded-full relative hover:bg-stone-100 text-stone-600">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && <span className={`absolute top-0 right-0 ${cTheme.bg} text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white`}>{cartCount}</span>}
            </button>
            
            <button onClick={() => setShowAdminMenu(!showAdminMenu)} className="p-2.5 rounded-full transition-colors text-stone-500 hover:text-stone-800 hover:bg-stone-100" title="Menu Lainnya">
              <MoreVertical className="w-6 h-6" />
            </button>

            {showAdminMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAdminMenu(false)}></div>
                <div className="absolute top-12 right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 overflow-hidden animate-fade-in-down">
                  <button onClick={() => { setView('admin'); setShowAdminMenu(false); }} className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-bold transition-colors ${loggedInUser ? `${cTheme.light} ${cTheme.text}` : 'text-stone-700 hover:bg-stone-50'}`}>
                    <Shield className={`w-4 h-4 ${loggedInUser ? cTheme.text : 'text-stone-500'}`} /> {loggedInUser ? 'Sistem Admin' : 'Login Staf'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {showNav && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm md:hidden flex justify-end" onClick={() => setShowNav(false)}>
          <div className="w-[80vw] max-w-sm bg-white h-full p-6 shadow-2xl animate-fade-in-down" onClick={e=>e.stopPropagation()}>
            <button onClick={() => setShowNav(false)} className="mb-8 p-2 bg-stone-100 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors"><X className="w-5 h-5"/></button>
            <div className="space-y-6 flex flex-col">
              <button onClick={() => {setView('dashboard'); setShowNav(false)}} className="flex items-center gap-4 font-bold text-stone-700 text-lg hover:text-rose-600"><Home/> Beranda</button>
              <button onClick={() => {setView('catalog'); setShowNav(false)}} className="flex items-center gap-4 font-bold text-stone-700 text-lg hover:text-rose-600"><Package/> Katalog Eksklusif</button>
              <button onClick={() => {loggedInMember ? setView('member_profile') : setView('member_auth'); setShowNav(false)}} className="flex items-center gap-4 font-bold text-stone-700 text-lg hover:text-rose-600"><User/> {loggedInMember ? 'Profil Member' : 'Akun Member'}</button>
              <div className="mt-auto pt-8 border-t border-stone-200">
                <button onClick={() => {setView('admin'); setShowNav(false)}} className="flex items-center gap-4 font-bold text-stone-500 hover:text-rose-600"><Shield/> Sistem Admin</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 relative">
         {children}
         <FloatingWA />
      </main>

      <footer className="bg-stone-900 text-stone-400 py-12 mt-12 border-t-4 border-amber-600">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => setView('dashboard')}>
               {db.brandConfig.logoUrl ? <img src={db.brandConfig.logoUrl} alt="Logo" className="h-8 object-contain" /> : 
                db.brandConfig.appIcon ? <span className="text-3xl">{db.brandConfig.appIcon}</span> : <Package className={`w-8 h-8 text-amber-500`} />}
               <span style={{ fontFamily: db.brandConfig.logoFont || 'Playfair Display' }} className="text-2xl font-bold text-white tracking-wider">{db.brandConfig.appName}</span>
            </div>
            <p className="text-sm leading-relaxed pr-4 font-light text-stone-400">{db.brandConfig.companyBio}</p>
          </div>
          <div>
            <h4 className="text-white font-serif tracking-wide text-lg mb-6">Layanan Cepat</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => setView('catalog')} className="hover:text-amber-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3"/> Katalog Pakaian</button></li>
              <li><button onClick={() => setView('member_auth')} className="hover:text-amber-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3"/> Keuntungan Member</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-serif tracking-wide text-lg mb-6">Pusat Bantuan</h4>
            <ul className="space-y-4 text-sm text-stone-400">
              <li className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-300"><FileText className="w-4 h-4"/></div> {db.brandConfig.companyEmail}</li>
              {(db.brandConfig.socialMedia || []).map((soc, idx) => (
                <li key={`ft-soc-${idx}`} className="flex items-center gap-3">
                  <a href={getSocialLink(soc.type, soc.value)} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-300"><span className="font-bold text-xs uppercase">{soc.type.charAt(0)}</span></div>
                    <span className="font-medium text-stone-300">{soc.type}:</span> <span className="underline decoration-stone-600 underline-offset-4">{soc.value}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-12 pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} {db.brandConfig.appName}. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
};

// ============================================================================
// KOMPONEN: MICRO-SLIDESHOW BENTO BOX (BERANDA)
// ============================================================================
const BentoCategoryBox = ({ categoryName, className }) => {
  const { db, setView } = useContext(AppStateContext);
  const [currentIdx, setCurrentIdx] = useState(0);

  const categoryImages = useMemo(() => {
    const productsInCat = (db.products || []).filter(p => p.category === categoryName && p.status !== 'Maintenance');
    let images = [];
    productsInCat.forEach(p => { if (p.images && p.images.length > 0) images.push(p.images[0]); });
    return images.length > 0 ? images.slice(0, 5) : ['https://images.unsplash.com/photo-1550639524-a6f58345a278?q=80&w=800&auto=format&fit=crop']; 
  }, [db.products, categoryName]);

  useEffect(() => {
    if (categoryImages.length <= 1) return;
    const interval = setInterval(() => { setCurrentIdx(prev => (prev + 1) % categoryImages.length); }, 3500);
    return () => clearInterval(interval);
  }, [categoryImages.length]);

  return (
    <div onClick={() => setView('catalog')} className={`relative overflow-hidden rounded-3xl cursor-pointer group shadow-sm hover:shadow-xl transition-all duration-500 ${className}`}>
      {categoryImages.map((img, idx) => (
         <div key={idx} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 group-hover:scale-110 ease-in-out ${idx === currentIdx ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url(${img})` }}></div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      
      <div className="absolute bottom-6 left-6 right-6">
         <div className="bg-white/20 backdrop-blur-md border border-white/30 p-5 rounded-2xl flex items-center justify-between group-hover:bg-amber-600/90 group-hover:border-amber-500 transition-colors duration-300">
            <div>
               <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-amber-100 transition-colors">Koleksi Terpilih</p>
               <h3 className="text-2xl font-serif font-bold text-white leading-none">{categoryName || 'Kategori'}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-white text-stone-900 flex items-center justify-center transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
               <ChevronRight className="w-5 h-5"/>
            </div>
         </div>
      </div>
    </div>
  );
};

// ============================================================================
// KOMPONEN CARD PRODUK
// ============================================================================
const ProductCardItem = ({ product, openDetail }) => {
  const { cart, addToCart, getAvailableStock, cTheme, loggedInMember, toggleWishlist } = useContext(AppStateContext);
  const avail = getAvailableStock(product.id);
  const inCart = cart.find(i => i.id === product.id)?.quantity || 0;
  const canAdd = avail > inCart;
  const isWished = loggedInMember?.wishlist?.includes(product.id);
  const isPromo = product.discountPrice > 0;
  const effPrice = isPromo ? product.discountPrice : product.price;

  return (
    <div onClick={() => openDetail(product)} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group relative cursor-pointer">
      <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:scale-110 transition-transform">
        <Heart className={`w-5 h-5 ${isWished ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
      </button>

      <div className="h-64 overflow-hidden relative bg-stone-100">
        {product.images?.length > 1 ? (
          <div className="flex overflow-x-auto snap-x snap-mandatory h-full w-full no-scrollbar" onClick={e => e.stopPropagation()}>
            {product.images.map((img, idx) => (
              <img key={idx} src={img} alt={`${product.name} - Gambar ${idx + 1}`} className="w-full h-full object-cover shrink-0 snap-center lg:group-hover:scale-110 transition-transform duration-700" />
            ))}
          </div>
        ) : (
          <img src={product.images?.[0] || 'https://placehold.co/400?text=No+Image'} alt={product.name} className="w-full h-full object-cover lg:group-hover:scale-110 transition-transform duration-700" />
        )}
        
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
           <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold text-stone-800 uppercase tracking-wider shadow-sm pointer-events-none">{product.category}</div>
           {isPromo && <div className="bg-red-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse z-10 pointer-events-none">SALE</div>}
        </div>
        
        {avail === 0 && <div className="absolute inset-0 z-10 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center pointer-events-none"><span className="bg-red-600 text-white px-6 py-2.5 rounded-full font-bold uppercase tracking-wider">Stok Habis</span></div>}
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
           <h3 className="font-serif font-bold text-xl text-stone-900 leading-tight group-hover:text-amber-600 transition-colors pr-2">{product.name}</h3>
        </div>
        
        <p className="text-[10px] text-stone-400 font-mono bg-stone-50 px-2 py-1 rounded w-max mb-4">{product.id}</p>
        <div className="mb-4">
          {isPromo ? (
            <div className="flex flex-col">
               <span className="text-xs text-stone-400 line-through">Normal: {formatRupiah(product.price)}</span>
               <p className="text-red-600 font-bold text-xl">{formatRupiah(effPrice)} <span className="text-sm font-light text-stone-500">/ hari</span></p>
            </div>
          ) : (
            <p className={`${cTheme.text} font-bold text-xl`}>{formatRupiah(effPrice)} <span className="text-sm font-light text-stone-500">/ hari</span></p>
          )}
          {product.deposit > 0 && <p className="text-xs font-bold text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded mt-2">+ Deposit: {formatRupiah(product.deposit)}</p>}
        </div>
        
        <div className="flex flex-col flex-grow"><p className={`text-sm text-stone-500 font-light flex-grow mb-6 line-clamp-2`}>{product.desc}</p></div>

        <div className="mt-auto pt-5 border-t border-stone-100 flex items-center justify-between">
          <span className="text-sm text-stone-500 font-medium">Sisa: {avail}</span>
          <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} disabled={!canAdd} className={`px-5 py-2.5 rounded-full font-bold transition-all active:scale-95 flex items-center gap-2 ${canAdd ? `${cTheme.bg} text-white shadow-md hover:shadow-lg` : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}><ShoppingCart className="w-4 h-4" /> Sewa</button>
        </div>
      </div>
    </div>
  );
};


// ============================================================================
// VIEWS (DASHBOARD, CATALOG, DLL)
// ============================================================================
const DashboardView = () => {
  const { setView, db, cTheme } = useContext(AppStateContext);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const promoProducts = useMemo(() => { return (db.products||[]).filter(p => p.discountPrice > 0 && p.status !== 'Maintenance').slice(0, 4); }, [db.products]);
  const bestSellerIds = useMemo(() => {
    const counts = {};
    (db.orders||[]).filter(o => o.status === 'Selesai').forEach(o => { o.items.forEach(i => { counts[i.id] = (counts[i.id] || 0) + i.quantity; }); });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(e=>e[0]);
  }, [db.orders]);

  const bestSellers = useMemo(() => { return (db.products||[]).filter(p => bestSellerIds.includes(p.id) && p.status !== 'Maintenance').sort((a,b) => bestSellerIds.indexOf(a.id) - bestSellerIds.indexOf(b.id)).slice(0, 4); }, [db.products, bestSellerIds]);
  const latestProducts = useMemo(() => { return (db.products||[]).filter(p => p.status !== 'Maintenance').slice(-4).reverse(); }, [db.products]);
  const displayProducts = bestSellers.length > 0 ? bestSellers : latestProducts;

  const openDetail = (product) => { setSelectedDetail(product); setCurrentImgIdx(0); };
  const closeDetail = () => setSelectedDetail(null);

  const renderDetailModal = () => {
    if (!selectedDetail) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm" onClick={closeDetail}>
           <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-fade-in-down" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-stone-100 relative group flex-shrink-0">
                 <img src={selectedDetail.images?.[currentImgIdx] || 'https://placehold.co/400?text=No+Image'} className="w-full h-full object-cover" alt={selectedDetail.name} />
                 {selectedDetail.images?.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === 0 ? selectedDetail.images.length - 1 : prev - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-5 h-5"/></button>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === selectedDetail.images.length - 1 ? 0 : prev + 1); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-5 h-5"/></button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-stone-900/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                         {selectedDetail.images.map((_, idx) => <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(idx); }} className={`w-2 h-2 rounded-full transition-all ${idx === currentImgIdx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`} /> )}
                      </div>
                    </>
                 )}
                 <button onClick={closeDetail} className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full md:hidden text-stone-800 shadow-sm"><X className="w-5 h-5"/></button>
              </div>

              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-start mb-2">
                      <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">{selectedDetail.category}</span>
                      <button onClick={closeDetail} className="hidden md:block p-2 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-500 transition-colors"><X className="w-5 h-5"/></button>
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-stone-900 leading-tight mb-1">{selectedDetail.name}</h2>
                  <p className="text-sm font-mono text-stone-400 mb-6">{selectedDetail.id}</p>
                  
                  <div className="mb-8 bg-stone-50 p-5 rounded-2xl border border-stone-100 relative">
                      {selectedDetail.discountPrice > 0 && <span className="absolute -top-3 -right-3 bg-red-600 text-white font-bold px-4 py-1.5 rounded-full shadow-lg transform rotate-12">SALE</span>}
                      {selectedDetail.discountPrice > 0 ? (
                        <>
                          <p className="text-sm text-stone-400 line-through mb-1">Normal: {formatRupiah(selectedDetail.price)}</p>
                          <p className="text-red-600 font-bold text-3xl mb-2">{formatRupiah(selectedDetail.discountPrice)} <span className="text-sm font-light text-stone-500">/ hari</span></p>
                        </>
                      ) : (<p className={`${cTheme.text} font-bold text-3xl mb-2`}>{formatRupiah(selectedDetail.price)} <span className="text-sm font-light text-stone-500">/ hari</span></p>)}
                      {selectedDetail.deposit > 0 && <p className="text-xs font-bold text-amber-600 bg-amber-100/50 inline-block px-3 py-1.5 rounded-lg border border-amber-200">+ Deposit Jaminan: {formatRupiah(selectedDetail.deposit)}</p>}
                  </div>

                  <div className="mb-8"><h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-3 border-b border-stone-100 pb-2">Deskripsi Pakaian</h4><p className="text-base text-stone-600 leading-relaxed font-light whitespace-pre-line">{selectedDetail.desc}</p></div>
                  <div className="mt-auto pt-6 border-t border-stone-100 space-y-4">
                      <button onClick={() => { closeDetail(); setView('catalog'); }} className="w-full bg-stone-900 hover:bg-black text-white text-lg font-bold py-4 rounded-xl transition-colors shadow-lg flex justify-center items-center">Lihat Lebih Detail di Katalog</button>
                  </div>
              </div>
           </div>
        </div>
    );
  }

  const bentoCats = db.brandConfig?.bentoCategories || ['Kebaya', 'Gaun', 'Jas'];

  return (
    <div className="space-y-12 md:space-y-16 animate-fade-in-down w-full flex-grow">
      
      <div className={`relative ${cTheme.bg} rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[400px] flex items-center`}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
        <div className="relative z-10 px-8 md:px-16 py-12 max-w-3xl">
          <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-widest mb-6">Pusat Sewa Pakaian Eksklusif</span>
          <h1 style={{ fontFamily: db.brandConfig.logoFont || 'Playfair Display' }} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-lg">
            {db.brandConfig.appName}
          </h1>
          <p className="text-lg md:text-xl text-stone-200 mb-10 font-light max-w-xl leading-relaxed">{db.brandConfig.slogan}</p>
          <div className="flex flex-wrap gap-4"><button onClick={() => setView('catalog')} className="bg-white text-stone-900 px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform shadow-xl flex items-center gap-2">Jelajahi Katalog <ChevronRight className="w-5 h-5"/></button></div>
        </div>
      </div>

      <div className="relative">
         <div className="flex justify-between items-end mb-8">
            <div><h2 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3"><Grid className="w-8 h-8 text-amber-500"/> Kategori Unggulan</h2><p className="text-stone-500 mt-2">Pilihan utama pelanggan untuk berbagai momen.</p></div>
         </div>
         
         <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-6 h-[500px]">
            <BentoCategoryBox categoryName={bentoCats[0]} className="col-span-2 row-span-2" />
            <BentoCategoryBox categoryName={bentoCats[1]} className="col-span-1 row-span-1" />
            <BentoCategoryBox categoryName={bentoCats[2]} className="col-span-1 row-span-1" />
         </div>

         <div className="md:hidden flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x snap-mandatory">
            <BentoCategoryBox categoryName={bentoCats[0]} className="w-[85vw] h-[350px] shrink-0 snap-center" />
            <BentoCategoryBox categoryName={bentoCats[1]} className="w-[85vw] h-[350px] shrink-0 snap-center" />
            <BentoCategoryBox categoryName={bentoCats[2]} className="w-[85vw] h-[350px] shrink-0 snap-center" />
         </div>
      </div>

      {promoProducts.length > 0 && (
        <div className="relative">
           <div className="flex justify-between items-end mb-8">
              <div><h2 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3"><Tag className="w-8 h-8 text-red-600"/> Penawaran Spesial</h2><p className="text-stone-500 mt-2">Dapatkan gaun dan setelan impianmu dengan harga khusus.</p></div>
              <button onClick={() => setView('catalog')} className="hidden sm:flex text-rose-600 font-bold items-center hover:text-rose-800 transition-colors">Lihat Semua <ChevronRight className="w-4 h-4 ml-1"/></button>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{promoProducts.map(p => <ProductCardItem key={p.id} product={p} openDetail={openDetail} />)}</div>
           <button onClick={() => setView('catalog')} className="w-full mt-6 sm:hidden border-2 border-stone-200 text-stone-700 font-bold py-3 rounded-xl hover:bg-stone-50">Lihat Semua Promo</button>
        </div>
      )}

      {displayProducts.length > 0 && (
        <div>
           <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">{bestSellers.length > 0 ? <><Star className="w-8 h-8 text-yellow-500 fill-yellow-500"/> Paling Diminati</> : <><Sparkles className="w-8 h-8 text-amber-500"/> Koleksi Terbaru</>}</h2>
                <p className="text-stone-500 mt-2">Pilihan favorit para pelanggan untuk tampil memukau.</p>
              </div>
              <button onClick={() => setView('catalog')} className="hidden sm:flex text-rose-600 font-bold items-center hover:text-rose-800 transition-colors">Katalog Lengkap <ChevronRight className="w-4 h-4 ml-1"/></button>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{displayProducts.map(p => <ProductCardItem key={p.id} product={p} openDetail={openDetail} />)}</div>
           <button onClick={() => setView('catalog')} className="w-full mt-6 sm:hidden border-2 border-stone-200 text-stone-700 font-bold py-3 rounded-xl hover:bg-stone-50">Lihat Semua Koleksi</button>
        </div>
      )}
      {renderDetailModal()}
    </div>
  );
};

const CatalogView = () => {
  const { db } = useContext(AppStateContext);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const filteredProducts = (db.products||[]).filter(p => 
    p.status !== 'Maintenance' && 
    (activeCategory === 'Semua' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openDetail = (product) => { setSelectedDetail(product); setCurrentImgIdx(0); };
  const closeDetail = () => setSelectedDetail(null);

  const renderDetailModal = () => {
    if (!selectedDetail) return null;
    const hasDiscount = selectedDetail.discountPrice > 0;
    const { getAvailableStock, cTheme, loggedInMember, toggleWishlist, cart, addToCart } = useContext(AppStateContext);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm" onClick={closeDetail}>
           <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-fade-in-down" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-stone-100 relative group flex-shrink-0">
                 <img src={selectedDetail.images?.[currentImgIdx] || 'https://placehold.co/400?text=No+Image'} className="w-full h-full object-cover" alt={selectedDetail.name} />
                 {selectedDetail.images?.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === 0 ? selectedDetail.images.length - 1 : prev - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-5 h-5"/></button>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === selectedDetail.images.length - 1 ? 0 : prev + 1); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-5 h-5"/></button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-stone-900/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                         {selectedDetail.images.map((_, idx) => <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(idx); }} className={`w-2 h-2 rounded-full transition-all ${idx === currentImgIdx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`} /> )}
                      </div>
                    </>
                 )}
                 <button onClick={closeDetail} className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full md:hidden text-stone-800 shadow-sm"><X className="w-5 h-5"/></button>
              </div>

              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-start mb-2"><span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">{selectedDetail.category}</span><button onClick={closeDetail} className="hidden md:block p-2 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-500 transition-colors"><X className="w-5 h-5"/></button></div>
                  <h2 className="text-3xl font-serif font-bold text-stone-900 leading-tight mb-1">{selectedDetail.name}</h2>
                  <p className="text-sm font-mono text-stone-400 mb-6">{selectedDetail.id}</p>
                  
                  <div className="mb-8 bg-stone-50 p-5 rounded-2xl border border-stone-100 relative">
                      {hasDiscount && <span className="absolute -top-3 -right-3 bg-red-600 text-white font-bold px-4 py-1.5 rounded-full shadow-lg transform rotate-12">SALE</span>}
                      {hasDiscount ? (
                        <><p className="text-sm text-stone-400 line-through mb-1">Normal: {formatRupiah(selectedDetail.price)}</p><p className="text-red-600 font-bold text-3xl mb-2">{formatRupiah(selectedDetail.discountPrice)} <span className="text-sm font-light text-stone-500">/ hari</span></p></>
                      ) : (<p className={`${cTheme.text} font-bold text-3xl mb-2`}>{formatRupiah(selectedDetail.price)} <span className="text-sm font-light text-stone-500">/ hari</span></p>)}
                      {selectedDetail.deposit > 0 && <p className="text-xs font-bold text-amber-600 bg-amber-100/50 inline-block px-3 py-1.5 rounded-lg border border-amber-200">+ Deposit Jaminan: {formatRupiah(selectedDetail.deposit)}</p>}
                  </div>

                  <div className="mb-8"><h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-3 border-b border-stone-100 pb-2">Deskripsi Pakaian</h4><p className="text-base text-stone-600 leading-relaxed font-light whitespace-pre-line">{selectedDetail.desc}</p></div>
                  {selectedDetail.productLink && (<a href={selectedDetail.productLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-5 py-3 rounded-xl mb-8 w-full transition-colors"><ExternalLink className="w-4 h-4"/> Lihat Referensi Eksternal / Video</a>)}

                  <div className="mt-auto pt-6 border-t border-stone-100 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                          <span className="text-stone-500 font-medium">Stok Tersedia Saat Ini:</span>
                          <span className={`font-bold px-4 py-1.5 rounded-lg text-sm ${getAvailableStock(selectedDetail.id) > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{getAvailableStock(selectedDetail.id)} dari {selectedDetail.totalStock} Pcs</span>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(selectedDetail.id); }} className={`p-4 rounded-xl border border-stone-200 flex items-center justify-center transition-colors ${loggedInMember?.wishlist?.includes(selectedDetail.id) ? 'bg-rose-50 border-rose-200' : 'hover:bg-stone-50'}`}>
                              <Heart className={`w-6 h-6 ${loggedInMember?.wishlist?.includes(selectedDetail.id) ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(selectedDetail); closeDetail(); }} disabled={getAvailableStock(selectedDetail.id) <= (cart.find(i => i.id === selectedDetail.id)?.quantity || 0)} className={`flex-1 py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-lg shadow-lg ${getAvailableStock(selectedDetail.id) > (cart.find(i => i.id === selectedDetail.id)?.quantity || 0) ? `${cTheme.bg} text-white hover:brightness-110` : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>
                              <ShoppingCart className="w-5 h-5" /> Sewa Sekarang
                          </button>
                      </div>
                  </div>
              </div>
           </div>
        </div>
    );
  };

  const { cTheme } = useContext(AppStateContext);

  return (
    <>
      <div className="animate-fade-in-down w-full flex-grow">
        <div className="text-center mb-8 md:mb-12 pt-4">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-4 tracking-wide">Katalog Eksklusif</h1>
          <p className="text-stone-500 font-light text-base md:text-lg">Temukan pilihan pakaian terbaik untuk momen istimewa Anda.</p>
        </div>

        <div className="relative mb-6 md:mb-8 max-w-3xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input type="text" className="w-full pl-14 pr-6 py-4 border border-stone-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 text-[16px] shadow-sm transition-all" placeholder="Cari nama atau ID pakaian..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        
        <div className="flex overflow-x-auto pb-4 mb-8 gap-3 no-scrollbar justify-start md:justify-center">
          <button onClick={() => setActiveCategory('Semua')} className={`px-6 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${activeCategory === 'Semua' ? 'bg-stone-900 text-white shadow-md' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}>Semua Koleksi</button>
          {(db.categories||[]).map(cat => (
            <button key={`btn-cat-${cat}`} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${activeCategory === cat ? `${cTheme.bg} text-white shadow-md` : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}>{cat}</button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
                <Package className="w-16 h-16 mx-auto mb-4 text-stone-300"/><h3 className="text-xl font-bold text-stone-800 mb-2">Katalog Kosong</h3><p className="text-stone-500">Saat ini belum ada produk yang cocok dengan pencarianmu.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(p => <ProductCardItem key={p.id} product={p} openDetail={openDetail} />)}
            </div>
        )}
      </div>
      {renderDetailModal()}
    </>
  );
};

const CartView = () => {
  const { cart, removeFromCart, updateCartQuantity, setView, getAvailableStock, cTheme } = useContext(AppStateContext);
  const subtotalSewa = cart.reduce((sum, item) => sum + ((item.discountPrice > 0 ? item.discountPrice : item.price) * item.quantity), 0);
  const subtotalDeposit = cart.reduce((sum, item) => sum + ((item.deposit||0) * item.quantity), 0);

  if (cart.length === 0) return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-16 text-center max-w-2xl mx-auto mt-10">
      <ShoppingCart className="w-20 h-20 text-stone-200 mx-auto mb-6" /><h2 className="text-2xl font-serif font-bold text-stone-800 mb-4">Keranjang Kosong</h2>
      <button onClick={() => setView('catalog')} className={`px-10 py-4 rounded-full font-bold shadow-lg transition-all ${cTheme.bg} text-white`}>Eksplorasi Katalog</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-down">
      <h1 className="text-3xl font-serif font-bold text-stone-800 mb-8">Keranjang Sewa</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow space-y-5">
          {cart.map(item => {
            const avail = getAvailableStock(item.id);
            const effPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
            return (
              <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex flex-col sm:flex-row gap-5 relative">
                {item.discountPrice > 0 && <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] px-2 py-1 rounded shadow z-10 font-bold">SALE</div>}
                <img src={item.images?.[0]} alt={item.name} className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-xl bg-stone-100" />
                <div className="flex-grow flex flex-col justify-center">
                  <h3 className="font-bold font-serif text-lg text-stone-900 mb-1">{item.name}</h3>
                  <div className="mb-4">
                    <p className={`${cTheme.text} font-bold text-lg`}>{formatRupiah(effPrice)} <span className="text-xs text-stone-500 font-normal">/ hari</span></p>
                    {item.discountPrice > 0 && <p className="text-xs text-stone-400 line-through">Normal: {formatRupiah(item.price)}</p>}
                    {item.deposit > 0 && <p className="text-xs text-amber-600 font-bold mt-1">Uang Jaminan: {formatRupiah(item.deposit)}</p>}
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-5">
                    <div className="flex items-center border border-stone-200 rounded-full overflow-hidden h-10 bg-stone-50">
                      <button onClick={() => updateCartQuantity(item.id, -1)} className="px-4 h-full hover:bg-stone-200 font-bold text-stone-600">-</button>
                      <span className="w-10 text-center font-bold text-stone-800">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, 1)} disabled={item.quantity >= avail} className="px-4 h-full hover:bg-stone-200 font-bold text-stone-600 disabled:opacity-30">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl sticky top-24">
            <h3 className="font-serif font-bold text-xl mb-6 border-b border-stone-700 pb-4">Ringkasan</h3>
            <div className="space-y-4 mb-8 text-sm">
              <div className="flex justify-between text-stone-300"><span>Total Produk</span><span className="font-bold text-white">{cart.reduce((s, i) => s + i.quantity, 0)} Pcs</span></div>
              <div className="flex justify-between text-stone-300"><span>Subtotal Sewa/Hari</span><span className="font-bold text-white">{formatRupiah(subtotalSewa)}</span></div>
              <div className="flex justify-between text-amber-400"><span>Total Deposit (Dikembalikan)</span><span className="font-bold">{formatRupiah(subtotalDeposit)}</span></div>
            </div>
            <button onClick={() => setView('checkout')} className={`w-full ${cTheme.bg} text-white py-4 rounded-full font-bold shadow-lg hover:brightness-110 transition-all text-lg`}>Lanjut Checkout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutView = () => {
  const { cart, processOrder, setView, cTheme, loggedInMember, showToast, compressImage, uploadImageToServer } = useContext(AppStateContext);
  const [formData, setFormData] = useState({ name: loggedInMember?.name||'', identity: loggedInMember?.identity||'', phone: loggedInMember?.phone||'', address: loggedInMember?.address||'', startDate: '', endDate: '', ktpUrl: loggedInMember?.ktpUrl||null });
  const [isUploading, setIsUploading] = useState(false);

  const getDuration = () => {
    if(!formData.startDate || !formData.endDate) return 1;
    const start = new Date(formData.startDate); const end = new Date(formData.endDate);
    const diff = Math.ceil((end - start) / (1000*60*60*24)) + 1; return diff > 0 ? diff : 1;
  };
  
  const duration = getDuration();
  const subtotalSewa = cart.reduce((sum, item) => sum + ((item.discountPrice > 0 ? item.discountPrice : item.price) * item.quantity), 0) * duration;
  const totalDeposit = cart.reduce((sum, item) => sum + ((item.deposit||0) * item.quantity), 0);
  const totalBiaya = subtotalSewa + totalDeposit;

  const handleKtpUpload = async (e) => { 
    const file = e.target.files[0]; if (!file) return; setIsUploading(true);
    const compressed = await compressImage(file); const url = await uploadImageToServer(compressed);
    if(url) { setFormData(p => ({...p, ktpUrl: url})); } else { showToast("Gagal upload KTP ke server gambar.", "error"); }
    setIsUploading(false);
  };
  
  const handleWASubmit = () => {
    if(!formData.name || !formData.phone || !formData.identity || !formData.address || !formData.startDate || !formData.endDate) { showToast("Harap isi semua formulir yang wajib (*)", "error"); return; }
    if(new Date(formData.endDate) < new Date(formData.startDate)) { showToast("Tanggal akhir tidak valid!", "error"); return; }
    processOrder({...formData, duration}, true); 
  };

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    if(new Date(formData.endDate) < new Date(formData.startDate)) { showToast("Tanggal akhir tidak valid!", "error"); return; }
    processOrder({...formData, duration}, false); 
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-down">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('cart')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-stone-200 shadow-sm hover:bg-stone-50"><ChevronLeft className="w-6 h-6"/></button>
        <h1 className="text-3xl font-serif font-bold text-stone-900">Checkout Penyewaan</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <form id="co-form" onSubmit={handleSubmit} className="flex-grow bg-white p-8 rounded-3xl shadow-sm border border-stone-200 space-y-8">
          <section>
            <h2 className="font-bold text-xl text-stone-800 mb-6 border-b border-stone-100 pb-3 flex items-center gap-2"><User className="w-6 h-6 text-stone-400"/> Data Penyewa (Sesuai KTP)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-stone-700 mb-2">Nama Lengkap *</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px] transition-colors" /></div>
              <div><label className="block text-sm font-bold text-stone-700 mb-2">NIK KTP *</label><input required type="number" value={formData.identity} onChange={e => setFormData({...formData, identity: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px] transition-colors" /></div>
              <div><label className="block text-sm font-bold text-stone-700 mb-2">WhatsApp *</label><input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px] transition-colors" /></div>
              <div><label className="block text-sm font-bold text-stone-700 mb-2">Upload KTP *</label><label className="flex items-center gap-3 bg-stone-50 border border-stone-200 px-5 py-3.5 rounded-xl cursor-pointer hover:bg-stone-100 text-sm font-bold text-stone-600"><Upload className="w-5 h-5" /> <span className="truncate">{isUploading ? 'Uploading...' : formData.ktpUrl ? 'KTP OK' : 'Upload File'}</span><input required={!formData.ktpUrl} type="file" accept="image/*" onChange={handleKtpUpload} className="hidden" /></label></div>
              <div className="md:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Alamat Domisili *</label><textarea required rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px]"></textarea></div>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-xl text-stone-800 mb-6 border-b border-stone-100 pb-3 flex items-center gap-2"><CalendarIcon className="w-6 h-6 text-stone-400"/> Rencana Sewa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-stone-700 mb-2">Tgl Mulai (Ambil) *</label><input required type="date" min={new Date().toISOString().split('T')[0]} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px]" /></div>
              <div><label className="block text-sm font-bold text-stone-700 mb-2">Tgl Akhir (Kembali) *</label><input required type="date" min={formData.startDate || new Date().toISOString().split('T')[0]} value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px]" /></div>
            </div>
          </section>
        </form>

        <div className="w-full lg:w-96 flex-shrink-0 space-y-6">
          <div className="bg-stone-900 p-8 rounded-3xl shadow-xl text-white sticky top-24">
            <h3 className="font-bold font-serif text-xl mb-6 border-b border-stone-700 pb-4">Tagihan Final</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-stone-400 text-sm"><span>Sewa ({duration} Hari)</span><span className="font-bold text-white">{formatRupiah(subtotalSewa)}</span></div>
              <div className="flex justify-between text-amber-500 text-sm border-b border-stone-700 pb-4"><span>Deposit Jaminan</span><span className="font-bold">{formatRupiah(totalDeposit)}</span></div>
              <div className="flex justify-between items-end pt-2"><span className="font-bold text-stone-300">Total Biaya</span><span className={`font-bold text-2xl ${cTheme.text}`}>{formatRupiah(totalBiaya)}</span></div>
            </div>

            {loggedInMember ? (
              <button type="button" onClick={handleWASubmit} className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 shadow-lg active:scale-95 flex justify-center items-center gap-2 mb-3"><MessageCircle className="w-6 h-6"/> Pesan via WhatsApp</button>
            ) : (
              <button form="co-form" type="submit" className={`w-full ${cTheme.bg} text-white py-4 rounded-xl font-bold text-lg hover:brightness-110 shadow-lg active:scale-95 mb-3`}>Kirim Pesanan</button>
            )}
            
            <div className="text-center text-xs text-stone-500 mt-4">*Uang Deposit akan dikembalikan penuh jika barang kembali tanpa cacat/telat.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuccessView = () => {
  const { setView } = useContext(AppStateContext);
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-12 text-center max-w-2xl mx-auto mt-10 animate-fade-in-down">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-12 h-12 text-green-500" /></div>
      <h2 className="text-3xl font-serif font-bold text-stone-900 mb-3">Pesanan Diterima!</h2>
      <p className="text-stone-500 mb-8 text-lg">Tunggu konfirmasi admin kami atau kunjungi butik pada tanggal yang ditentukan.</p>
      <button onClick={() => setView('dashboard')} className="bg-stone-900 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-black transition-colors shadow-lg active:scale-95">Selesai</button>
    </div>
  );
};

const MemberAuthView = () => {
  const { memberLogin, submitMemberRegistration, cTheme, showToast, compressImage, uploadImageToServer } = useContext(AppStateContext);
  const [tab, setTab] = useState('login');
  const [uname, setUname] = useState(''); const [pwd, setPwd] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '', name: '', identity: '', phone: '', birthPlace: '', birthDate: '', gender: 'Perempuan', address: '', email: '', socialMedia: '', photoUrl: null, ktpUrl: null });
  const [isUploading, setIsUploading] = useState({ photoUrl: false, ktpUrl: false });

  const handleLogin = (e) => { e.preventDefault(); if(!memberLogin(uname, pwd)) showToast('Akun tidak ditemukan atau belum disetujui!', 'error'); };
  const handleRegister = (e) => { e.preventDefault(); submitMemberRegistration(formData); setTab('login'); };
  
  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(prev => ({ ...prev, [type]: true }));
      showToast(`Mengunggah gambar...`, 'info');
      try {
        const compressed = await compressImage(file);
        const serverUrl = await uploadImageToServer(compressed);
        if (serverUrl) { setFormData(prev => ({ ...prev, [type]: serverUrl })); showToast(`Gambar OK`, 'success'); } 
        else { showToast(`Gagal mengunggah gambar ke server`, 'error'); }
      } catch (error) { showToast(`Gagal mengunggah gambar`, 'error'); } 
      finally { setIsUploading(prev => ({ ...prev, [type]: false })); }
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in-down">
      <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
        <div className="flex border-b border-stone-100 bg-stone-50">
          <button onClick={() => setTab('login')} className={`flex-1 py-5 font-bold text-sm uppercase tracking-wider ${tab === 'login' ? `${cTheme.text} bg-white border-b-2 ${cTheme.border}` : 'text-stone-400'}`}>Masuk</button>
          <button onClick={() => setTab('register')} className={`flex-1 py-5 font-bold text-sm uppercase tracking-wider ${tab === 'register' ? `${cTheme.text} bg-white border-b-2 ${cTheme.border}` : 'text-stone-400'}`}>Daftar</button>
        </div>
        
        <div className="p-8 md:p-10">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-center mb-8"><User className={`w-16 h-16 mx-auto mb-4 ${cTheme.text}`}/><h2 className="text-2xl font-serif font-bold text-stone-800">Login Member</h2></div>
              <div><label className="block text-sm font-bold text-stone-700 mb-2">Username</label><input required type="text" value={uname} onChange={e=>setUname(e.target.value)} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px]" /></div>
              <div><label className="block text-sm font-bold text-stone-700 mb-2">Password</label><input required type="password" value={pwd} onChange={e=>setPwd(e.target.value)} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px]" /></div>
              <button type="submit" className={`w-full ${cTheme.bg} text-white py-4 rounded-full font-bold shadow-lg mt-4 text-lg`}>Masuk</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
               <h2 className="font-bold text-xl text-stone-800 border-b pb-4">Data Member Baru</h2>
               <div className="flex gap-4">
                  <label className="flex-1 flex flex-col items-center p-4 border-2 border-dashed border-stone-300 rounded-2xl cursor-pointer hover:bg-stone-50 text-sm font-bold text-stone-600 bg-white"><UserPlus className="w-6 h-6 mb-2 text-stone-400" /> {isUploading.photoUrl ? 'Uploading...' : formData.photoUrl ? 'Foto OK' : 'Foto Diri'}<input required={!formData.photoUrl} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'photoUrl')} /></label>
                  <label className="flex-1 flex flex-col items-center p-4 border-2 border-dashed border-stone-300 rounded-2xl cursor-pointer hover:bg-stone-50 text-sm font-bold text-stone-600 bg-white"><Upload className="w-6 h-6 mb-2 text-stone-400" /> {isUploading.ktpUrl ? 'Uploading...' : formData.ktpUrl ? 'KTP OK' : 'Foto KTP'}<input required={!formData.ktpUrl} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'ktpUrl')} /></label>
               </div>
               <div><label className="block text-xs font-bold text-stone-600 mb-1">Username (Login)</label><input required type="text" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2.5 bg-stone-50 border rounded-lg text-sm outline-none focus:border-rose-500" /></div>
               <div><label className="block text-xs font-bold text-stone-600 mb-1">Password</label><input required type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 bg-stone-50 border rounded-lg text-sm outline-none focus:border-rose-500" /></div>
               <div><label className="block text-xs font-bold text-stone-600 mb-1">Nama Sesuai KTP</label><input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-stone-50 border rounded-lg text-sm outline-none focus:border-rose-500" /></div>
               <div><label className="block text-xs font-bold text-stone-600 mb-1">NIK & WhatsApp</label><div className="flex gap-2"><input required type="number" placeholder="NIK" value={formData.identity} onChange={e=>setFormData({...formData, identity: e.target.value})} className="w-1/2 px-4 py-2.5 bg-stone-50 border rounded-lg text-sm outline-none" /><input required type="tel" placeholder="WA" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-1/2 px-4 py-2.5 bg-stone-50 border rounded-lg text-sm outline-none" /></div></div>
               <button type="submit" className={`w-full ${cTheme.bg} text-white py-4 rounded-xl font-bold shadow-lg mt-6`}>Daftar Sekarang</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const MemberProfileView = () => {
  const { db, loggedInMember, memberLogout, cTheme, redeemPrize, addToCart } = useContext(AppStateContext);
  const [tab, setTab] = useState('wishlist');
  if (!loggedInMember) return null;
  const myOrders = (db.orders||[]).filter(o => o.memberId === loggedInMember.id);
  const myWishlist = (db.products||[]).filter(p => (loggedInMember.wishlist||[]).includes(p.id));

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-down flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 text-center">
          {loggedInMember.photoUrl ? <img src={loggedInMember.photoUrl} alt="Pic" className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-stone-100 shadow-md" /> : <div className="w-32 h-32 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md"><User className="w-12 h-12 text-stone-300"/></div>}
          <h2 className="text-2xl font-serif font-bold text-stone-900">{loggedInMember.name}</h2>
          <p className="text-sm font-mono text-stone-500 bg-stone-50 px-3 py-1 rounded-full border border-stone-200 mt-2">{loggedInMember.id}</p>
          <div className="w-full mt-8 bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-2xl p-6 shadow-inner">
            <p className="text-xs font-bold text-rose-800 uppercase tracking-widest mb-2">Total Poin Reward</p>
            <div className="text-4xl font-bold text-rose-600 flex items-center justify-center gap-3"><Award className="w-8 h-8"/> {loggedInMember.points}</div>
          </div>
          <button onClick={memberLogout} className="w-full mt-8 py-3.5 bg-stone-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-black shadow-lg"><LogOut className="w-5 h-5"/> Keluar Akun</button>
        </div>
      </div>

      <div className="flex-grow bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="flex border-b border-stone-200 bg-stone-50">
           <button onClick={() => setTab('wishlist')} className={`flex-1 py-5 font-bold text-sm flex items-center justify-center gap-2 ${tab === 'wishlist' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white` : 'text-stone-500 hover:bg-stone-100'}`}><Heart className="w-4 h-4"/> Wishlist</button>
           <button onClick={() => setTab('history')} className={`flex-1 py-5 font-bold text-sm flex items-center justify-center gap-2 ${tab === 'history' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white` : 'text-stone-500 hover:bg-stone-100'}`}><Clock className="w-4 h-4"/> Riwayat</button>
           <button onClick={() => setTab('rewards')} className={`flex-1 py-5 font-bold text-sm flex items-center justify-center gap-2 ${tab === 'rewards' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white` : 'text-stone-500 hover:bg-stone-100'}`}><Gift className="w-4 h-4"/> Hadiah</button>
        </div>
        
        <div className="p-8">
          {tab === 'wishlist' && (
            <div className="space-y-6">
              <h3 className="font-bold text-xl text-stone-800 mb-6">Lemari Impian (Wishlist)</h3>
              {myWishlist.length === 0 ? <p className="text-stone-500">Belum ada barang di wishlist Anda.</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myWishlist.map(p => (
                    <div key={p.id} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm relative">
                      {p.discountPrice > 0 && <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">SALE</span>}
                      <img src={p.images?.[0] || 'https://placehold.co/400?text=No+Image'} className="w-full h-40 object-cover rounded-xl mb-4 bg-stone-100" alt="img"/>
                      <h4 className="font-bold text-stone-800">{p.name}</h4>
                      <p className={`${cTheme.text} font-bold mt-1 mb-4`}>{formatRupiah(p.discountPrice > 0 ? p.discountPrice : p.price)}</p>
                      <button onClick={() => addToCart(p)} className={`w-full py-2.5 rounded-xl font-bold text-white ${cTheme.bg}`}>Sewa Sekarang</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-6">
              <h3 className="font-bold text-xl text-stone-800 mb-6">Riwayat Transaksi</h3>
              {myOrders.length === 0 ? <p className="text-stone-500">Belum ada transaksi.</p> : 
                myOrders.map(o => (
                  <div key={o.id} className="border border-stone-200 p-6 rounded-2xl bg-stone-50">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-stone-200">
                       <span className="font-mono text-stone-600 font-bold">{o.id}</span>
                       <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border shadow-sm uppercase">{o.status}</span>
                    </div>
                    {o.items.map(i => <div key={i.id} className="text-sm font-medium text-stone-800 mb-2">{i.quantity}x {i.name}</div>)}
                    <div className="flex justify-between items-end mt-6">
                       <div><p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Total Biaya</p><p className="font-bold text-stone-900 text-xl">{formatRupiah(o.total)}</p></div>
                       <p className="text-sm font-bold text-rose-600 bg-rose-100 px-3 py-1.5 rounded-lg">+ {o.earnedPoints} Poin</p>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {tab === 'rewards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(db.prizes||[]).map(p => {
                const canRedeem = loggedInMember.points >= p.points;
                return (
                  <div key={p.id} className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
                    <div className="h-40 bg-stone-100"><img src={p.image} className="w-full h-full object-cover" alt="prize"/></div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h4 className="font-bold text-stone-800 text-lg mb-2">{p.name}</h4>
                      <p className="text-sm text-stone-500 mb-6 flex-grow">{p.desc}</p>
                      <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                         <span className="font-bold text-rose-600 flex items-center gap-1 text-lg"><Award className="w-5 h-5"/> {p.points}</span>
                         <button onClick={() => redeemPrize(p)} disabled={!canRedeem} className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${canRedeem ? `${cTheme.bg} text-white` : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>Tukar</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminLogin = () => {
  const { login, setView } = useContext(AppStateContext);
  const [uname, setUname] = useState(''); const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if(!login(uname, pwd)) setErr('Username atau Password salah!');
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md animate-fade-in-down">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6"><Shield className="w-10 h-10 text-stone-800" /></div>
        <h2 className="text-2xl font-serif font-bold text-center text-stone-900 mb-2">Admin Panel</h2>
        <p className="text-center text-stone-500 mb-8 text-sm">Masuk untuk mengelola sistem.</p>
        
        {err && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-200">{err}</div>}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div><label className="block text-sm font-bold text-stone-700 mb-2">Username</label><input required type="text" value={uname} onChange={e=>setUname(e.target.value)} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none text-[16px]" /></div>
          <div><label className="block text-sm font-bold text-stone-700 mb-2">Password</label><input required type="password" value={pwd} onChange={e=>setPwd(e.target.value)} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none text-[16px]" /></div>
          <button type="submit" className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors mt-4 text-lg">Masuk Panel</button>
        </form>
        <div className="mt-8 text-center"><button onClick={() => setView('dashboard')} className="text-sm text-stone-400 hover:text-stone-800 font-bold">&larr; Kembali ke Beranda</button></div>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const { loggedInUser, logout, db, setView } = useContext(AppStateContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSidebar, setShowSidebar] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Statistik & Laporan', icon: BarChart3 },
    { id: 'orders', label: 'Pesanan Masuk', icon: Package },
    { id: 'inventory', label: 'Katalog Barang', icon: Briefcase },
    { id: 'calendar', label: 'Jadwal Sewa', icon: CalendarIcon },
    { id: 'customers', label: 'Database Pelanggan', icon: Users },
    { id: 'prizes', label: 'Katalog Hadiah', icon: Gift },
    { id: 'approvals', label: 'Antrean Persetujuan', icon: CheckCircle },
    { id: 'account', label: 'Setelan Akun', icon: User },
    ...(loggedInUser?.role === 'owner' || loggedInUser?.role === 'developer' ? [
      { id: 'logs', label: 'Log Audit Sistem', icon: ClipboardList },
      { id: 'settings', label: 'Pengaturan Merek', icon: SettingsIcon }
    ] : []),
    ...(loggedInUser?.role === 'developer' ? [{ id: 'developer', label: 'Developer Console', icon: Terminal }] : [])
  ];

  return (
    <div className="flex h-screen bg-stone-50 font-sans">
      {showSidebar && <div className="fixed inset-0 bg-stone-900/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setShowSidebar(false)}></div>}
      
      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-[80vw] max-w-sm lg:w-72 bg-stone-900 text-stone-300 flex flex-col shadow-2xl lg:shadow-none transition-transform duration-300 ${showSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-stone-800">
          <div className="overflow-hidden">
            <h2 style={{ fontFamily: db.brandConfig.logoFont || 'Playfair Display' }} className="font-bold text-xl text-white truncate uppercase">{db.brandConfig.appName}</h2>
            <p className="text-[10px] text-rose-400 uppercase tracking-widest mt-2 font-bold">{loggedInUser.role} Panel</p>
          </div>
          <button className="lg:hidden p-2 text-stone-400 hover:bg-stone-800 rounded-lg transition-colors" onClick={() => setShowSidebar(false)}><X className="w-6 h-6"/></button>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 no-scrollbar">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => {setActiveTab(item.id); setShowSidebar(false);}} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-rose-600 text-white shadow-md' : 'hover:bg-stone-800 hover:text-white'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" /> <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-4 bg-stone-950 space-y-3">
          <button onClick={() => setView('dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-stone-800 text-white hover:bg-stone-700 transition-colors"><Home className="w-5 h-5 flex-shrink-0"/> Ke Website</button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"><LogOut className="w-5 h-5 flex-shrink-0"/> Logout</button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-stone-200 px-6 py-5 flex justify-between items-center z-10 shadow-sm supports-[padding-top:env(safe-area-inset-top)]:pt-[calc(16px+env(safe-area-inset-top))]">
           <div className="flex items-center gap-3">
             <button className="lg:hidden p-2 -ml-2 text-stone-600 bg-stone-100 rounded-lg" onClick={() => setShowSidebar(true)}><Menu className="w-6 h-6"/></button>
             <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-800 capitalize truncate">{activeTab.replace('-', ' ')}</h1>
           </div>
           <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center space-x-2 bg-stone-100 py-1.5 px-4 rounded-full border border-stone-200">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-xs font-bold text-stone-600 uppercase tracking-widest">Real-time Aktif</span>
             </div>
             <div className="text-right hidden sm:block"><p className="text-sm font-bold text-stone-800">{loggedInUser.name}</p></div>
             <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200"><User className="w-5 h-5 text-stone-600"/></div>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full overflow-x-hidden">
          {activeTab === 'dashboard' && <AdminStats />}
          {activeTab === 'orders' && <AdminOrderManager />}
          {activeTab === 'inventory' && <AdminInventory />}
          {activeTab === 'calendar' && <AdminCalendar />}
          {activeTab === 'customers' && <AdminCustomers />}
          {activeTab === 'prizes' && <AdminPrizes />}
          {activeTab === 'approvals' && <AdminApprovals />}
          {activeTab === 'account' && <AdminAccountSettings />}
          {activeTab === 'settings' && (loggedInUser.role === 'owner' || loggedInUser.role === 'developer') && <AdminSystemSettings />}
          {activeTab === 'logs' && <AdminLogs />}
          {activeTab === 'developer' && <AdminDeveloperPanel />}
        </div>
      </main>
    </div>
  );
};

const AdminStats = () => {
  const { db } = useContext(AppStateContext);
  const [timeRange, setTimeRange] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const filterByTime = (ordersList) => {
    const now = new Date();
    return ordersList.filter(o => {
      if (timeRange === 'all') return true;
      const oDate = new Date(o.date || o.startDate);
      if (timeRange === 'today') return oDate.toDateString() === now.toDateString();
      if (timeRange === '7days') { const d = new Date(); d.setDate(d.getDate() - 7); return oDate >= d; }
      if (timeRange === 'thismonth') return oDate.getMonth() === now.getMonth() && oDate.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const completed = filterByTime((db.orders||[]).filter(o => o.status === 'Selesai'));
  const active = filterByTime((db.orders||[]).filter(o => ['Menunggu Konfirmasi', 'Siap Diambil', 'Sedang Disewa'].includes(o.status)));
  const revenue = completed.reduce((s, o) => s + (o.total - (o.totalDeposit||0) + (o.denda||0)), 0);

  return (
    <div className="space-y-8 animate-fade-in-down w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div><h2 className="text-xl font-bold text-stone-800">Performa Toko</h2><p className="text-sm text-stone-500">Angka akan berubah sesuai filter waktu.</p></div>
        <div className="flex items-center bg-white border border-stone-200 rounded-xl px-4 shadow-sm w-max">
           <Clock className="w-5 h-5 text-stone-400 mr-2"/>
           <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="py-3 bg-transparent text-sm font-bold text-stone-700 outline-none cursor-pointer">
             <option value="today">Hari Ini</option><option value="7days">7 Hari Terakhir</option><option value="thismonth">Bulan Ini</option><option value="all">Semua Waktu (All Time)</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm"><div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4"><BarChart3 className="w-6 h-6"/></div><div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Pendapatan Selesai</div><div className="text-2xl font-bold text-stone-800 truncate">{formatRupiah(revenue)}</div></div>
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm"><div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Package className="w-6 h-6"/></div><div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Pesanan Aktif</div><div className="text-2xl font-bold text-stone-800">{active.length}</div></div>
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm"><div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4"><Users className="w-6 h-6"/></div><div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Total Member</div><div className="text-2xl font-bold text-stone-800">{(db.members||[]).filter(m=>m.status === 'approved').length}</div></div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden mt-8 w-full">
        <div className="p-6 md:p-8 border-b border-stone-100 bg-stone-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><History className="w-6 h-6"/></div>
          <div>
            <h3 className="font-bold text-lg text-stone-800">Riwayat Pemasukan</h3>
            <p className="text-sm text-stone-500">Detail pesanan yang telah selesai dan menghasilkan pendapatan.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 space-y-4">
          {completed.length === 0 ? (
            <div className="text-center py-10 bg-stone-50 border border-dashed border-stone-300 rounded-2xl text-stone-500">
               Belum ada data pemasukan pada periode ini.
            </div>
          ) : (
            completed.map(o => {
              const isExpanded = expandedOrderId === o.id;
              const netIncome = o.total - (o.totalDeposit || 0) + (o.denda || 0);

              return (
                <div key={`inc-${o.id}`} className="border border-stone-200 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow bg-white">
                  <div 
                    onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                    className="flex flex-col sm:flex-row justify-between sm:items-center p-4 cursor-pointer hover:bg-stone-50 gap-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-stone-100 text-stone-500 rounded-full flex items-center justify-center shrink-0 border border-stone-200">
                        <CheckCircle className="w-5 h-5 text-green-500"/>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm md:text-base text-stone-800">{o.customer.name}</h4>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">{o.id} &bull; Selesai Tgl: {o.endDate || o.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-14 sm:pl-0 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Pendapatan Bersih</p>
                        <span className="font-bold text-green-600 text-base md:text-lg">+{formatRupiah(netIncome)}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 md:p-6 bg-stone-50 border-t border-stone-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                          <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 border-b border-stone-100 pb-3 flex items-center gap-2"><Package className="w-4 h-4"/> Rincian Sewa Pakaian</h5>
                          <div className="space-y-3">
                            {o.items.map(item => (
                              <div key={`inc-item-${item.id}`} className="flex items-center gap-3">
                                <img src={item.images?.[0] || 'https://placehold.co/400'} alt={item.name} className="w-12 h-12 rounded-xl border border-stone-100 object-cover shadow-sm"/>
                                <div>
                                  <p className="font-bold text-sm text-stone-800">{item.quantity}x {item.name}</p>
                                  <p className="text-[10px] text-stone-500 font-mono">{item.id}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-center">
                          <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 border-b border-stone-100 pb-3 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Kalkulasi Keuangan</h5>
                          <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between text-stone-600"><span>Tagihan Kotor (Total):</span> <span className="font-medium">{formatRupiah(o.total)}</span></div>
                            <div className="flex justify-between text-stone-600"><span>Durasi Sewa:</span> <span className="font-medium">{o.duration} Hari</span></div>
                            <div className="flex justify-between text-amber-600"><span>Deposit Jaminan:</span> <span className="font-medium">{formatRupiah(o.totalDeposit || 0)}</span></div>
                            <div className="flex justify-between text-red-500"><span>Denda (Kerusakan/Telat):</span> <span className="font-medium">+{formatRupiah(o.denda || 0)}</span></div>
                            <div className="flex justify-between text-blue-600"><span>Pengembalian Deposit (Refund):</span> <span className="font-medium">-{formatRupiah(o.totalRefundDeposit || 0)}</span></div>
                            <div className="pt-3 mt-3 border-t border-stone-200 flex justify-between items-center">
                              <span className="font-bold text-stone-800">Pendapatan Bersih:</span>
                              <span className="font-bold text-green-600 text-xl">{formatRupiah(netIncome)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const AdminOrderManager = () => {
  const { db, requireApproval, printInvoice } = useContext(AppStateContext);
  const [tab, setTab] = useState('aktif');
  const [expandedId, setExpandedId] = useState(null);
  const [dendaModal, setDendaModal] = useState({ isOpen: false, order: null, amount: 0, newStatus: '' });

  const displayedOrders = tab === 'aktif' ? (db.orders||[]).filter(o => ['Menunggu Konfirmasi', 'Siap Diambil', 'Sedang Disewa'].includes(o.status)) : (db.orders||[]).filter(o => ['Selesai', 'Dibatalkan'].includes(o.status));
  
  const handleStatusChange = (order, newStatus) => {
    if (order.status === newStatus) return;
    if (newStatus === 'Selesai') { setDendaModal({ isOpen: true, order, amount: 0, newStatus }); return; }
    if (newStatus === 'Dibatalkan') { requireApproval('CANCEL_ORDER', { orderId: order.id, newStatus: newStatus, itemIds: order.items.map(i => i.id) }, `Pesanan Dibatalkan & barang masuk Maintenance.`); return; }
    requireApproval('UPDATE_ORDER', { id: order.id, status: newStatus, denda: 0, refund: order.totalDeposit || 0 }, `Status pesanan ${order.id} diubah ke ${newStatus}.`);
  };

  const confirmSelesai = () => {
    const denda = parseInt(dendaModal.amount) || 0;
    let refund = (dendaModal.order.totalDeposit || 0) - denda; if (refund < 0) refund = 0;
    requireApproval('COMPLETE_ORDER', { orderId: dendaModal.order.id, newStatus: dendaModal.newStatus, denda, refund, itemIds: dendaModal.order.items.map(i => i.id) }, `Pesanan Selesai & barang masuk Maintenance.`);
    setDendaModal({ isOpen: false, order: null, amount: 0, newStatus: '' });
  };

  return (
    <div className="animate-fade-in-down w-full relative">
      <div className="flex bg-white border border-stone-200 p-1.5 rounded-2xl w-max shadow-sm mb-6">
        <button onClick={() => setTab('aktif')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'aktif' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>Pesanan Berjalan</button>
        <button onClick={() => setTab('riwayat')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'riwayat' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>Riwayat Selesai</button>
      </div>

      <div className="space-y-5">
        {displayedOrders.length === 0 ? <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-300 text-stone-500"><Package className="w-12 h-12 mx-auto mb-3 text-stone-300"/>Tidak ada pesanan di kategori ini.</div> : displayedOrders.map(order => (
          <div key={`ord-${order.id}`} className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5 md:p-6 flex justify-between items-center cursor-pointer hover:bg-stone-50 gap-4" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${order.memberId ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-stone-100 border-stone-200 text-stone-500'}`}>
                  {order.memberId ? <Award className="w-6 h-6"/> : <FileText className="w-6 h-6"/>}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-stone-800 flex items-center gap-2">{order.customer.name} {order.memberId && <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm">Member</span>}</h4>
                  <p className="text-sm text-stone-500 font-mono mt-1">{order.id} &bull; <span className="font-sans">Tgl Sewa: {order.startDate}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-5"><span className="text-xs font-bold px-4 py-2 rounded-full bg-stone-100 border border-stone-200 uppercase tracking-wide">{order.status}</span><ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} /></div>
            </div>
            
            {expandedId === order.id && (
              <div className="p-6 bg-stone-50 border-t border-stone-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                    <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Biodata Pelanggan</h5>
                    <p className="font-bold text-stone-800 mb-1">{order.customer.name}</p>
                    <p className="text-sm text-stone-600 mb-1">{order.customer.phone}</p>
                    <p className="text-sm text-stone-600 font-mono mb-3">NIK: {order.customer.identity}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                    <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Durasi & Waktu</h5>
                    <p className="text-sm text-stone-600 mb-2">Mulai: <span className="font-bold text-stone-800">{order.startDate}</span></p>
                    <p className="text-sm text-stone-600 mb-4">Selesai: <span className="font-bold text-stone-800">{order.endDate}</span></p>
                    <span className="text-xs font-bold text-rose-800 bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg uppercase tracking-wider">Durasi: {order.duration} Hari</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between">
                    <div>
                       <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Tindakan Admin</h5>
                       <select value={order.status} onChange={(e) => handleStatusChange(order, e.target.value)} className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none bg-stone-50 cursor-pointer">
                         <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                         <option value="Siap Diambil">Siap Diambil</option>
                         <option value="Sedang Disewa">Sedang Disewa</option>
                         <option value="Selesai">Pesanan Selesai</option>
                         <option value="Dibatalkan">Batalkan Pesanan</option>
                       </select>
                    </div>
                    <button onClick={() => printInvoice(order)} className="mt-4 w-full bg-stone-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black"><Printer className="w-4 h-4"/> Cetak Struk/Nota</button>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-stone-100">
                    <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Daftar Pakaian</h5>
                    <div className="space-y-3">
                      {order.items.map(item => {
                        const effPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
                        return (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                           <div className="flex items-center gap-3">
                              <img src={item.images?.[0] || 'https://placehold.co/400'} className="w-12 h-12 rounded-lg object-cover border" alt="img"/>
                              <span className="font-bold text-stone-800">{item.quantity}x {item.name}</span>
                           </div>
                           <div className="text-right">
                              <span className="font-medium text-stone-500 block">{formatRupiah(effPrice * item.quantity * order.duration)} (Sewa)</span>
                              <span className="font-medium text-amber-600 block">{formatRupiah(item.deposit * item.quantity)} (Deposit)</span>
                           </div>
                        </div>
                      )})}
                    </div>
                  </div>
                  <div className="bg-stone-900 p-5 text-white flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                     <div>
                       <span className="font-bold text-sm uppercase tracking-wider text-stone-400 block mb-1">Total Tagihan Awal</span>
                       <span className="font-bold text-xl">{formatRupiah(order.total)}</span>
                     </div>
                     {order.status === 'Selesai' && (
                       <div className="bg-stone-800 p-3 rounded-xl border border-stone-700 text-right">
                          <span className="text-xs text-red-400 font-bold block mb-1">Denda: -{formatRupiah(order.denda)}</span>
                          <span className="font-bold text-sm text-green-400">Refund Deposit: {formatRupiah(order.totalRefundDeposit)}</span>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {dendaModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-down">
            <h3 className="font-bold font-serif text-xl mb-2 text-stone-900">Konfirmasi Pengembalian</h3>
            <p className="text-sm text-stone-500 mb-6">Pesanan ini memiliki total Uang Deposit sebesar <span className="font-bold text-amber-600">{formatRupiah(dendaModal.order?.totalDeposit || 0)}</span>. Apakah ada denda kerusakan atau keterlambatan?</p>
            <div className="mb-6">
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Potongan Denda (Rp)</label>
              <input type="number" min="0" value={dendaModal.amount} onChange={e => setDendaModal({...dendaModal, amount: e.target.value})} className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-xl outline-none text-lg font-bold text-red-600 focus:border-red-400" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setDendaModal({ isOpen: false, order: null, amount: 0, newStatus: '' })} className="flex-1 py-3.5 bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-colors">Batal</button>
              <button onClick={confirmSelesai} className="flex-1 py-3.5 bg-stone-900 text-white font-bold rounded-xl hover:bg-black shadow-lg">Selesai & Proses</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminInventory = () => {
  const { db, requireApproval, getAvailableStock, cTheme, showToast, compressImage, uploadImageToServer } = useContext(AppStateContext);
  const [invTab, setInvTab] = useState('katalog'); 
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', price: '', discountPrice: '', deposit: '', category: db.categories[0] || '', desc: '', images: [], totalStock: 1, productLink: '' });
  const [editData, setEditData] = useState({ price: '', discountPrice: '', totalStock: '', deposit: '', productLink: '', images: [] });

  const handleImageUpload = async (e, isEdit = false) => { 
    const files = Array.from(e.target.files); 
    if (!files.length) return; 
    
    showToast('Mengkompresi & Mengunggah gambar...', 'info');
    try {
      const uploadPromises = files.map(async (f) => {
        const compressed = await compressImage(f); 
        const url = await uploadImageToServer(compressed);
        if(!url) throw new Error("Gagal ImgBB");
        return url;
      });
      const validUrls = await Promise.all(uploadPromises);
      
      if (isEdit) {
        setEditData(prev => ({ ...prev, images: [...(prev.images || []), ...validUrls] }));
      } else {
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...validUrls] }));
      }
      showToast('Gambar berhasil diunggah!', 'success');
    } catch (error) {
      showToast('Gagal mengunggah gambar. Simpan saja teksnya.', 'error');
    }
  };

  const removeImage = (idx, isEdit = false) => {
    if (isEdit) {
      setEditData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    } else {
      setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    }
  };

  const generateId = (cat) => { const prefix = cat ? cat.substring(0,2).toUpperCase() : 'XX'; const count = (db.products||[]).filter(p => p.id.startsWith(prefix)).length + 1; return `${prefix}-${1000 + count}`; };
  
  const handleAddProduct = (e) => { 
    e.preventDefault(); 
    requireApproval('ADD_PRODUCT', { 
      id: generateId(formData.category), 
      ...formData, 
      price: parseInt(formData.price), 
      discountPrice: formData.discountPrice ? parseInt(formData.discountPrice) : 0,
      deposit: parseInt(formData.deposit||0), 
      totalStock: parseInt(formData.totalStock), 
      status: 'Tersedia' 
    }, 'Produk disimpan.'); 
    setShowAddForm(false); 
    setFormData({ name: '', price: '', discountPrice: '', deposit:'', category: db.categories[0] || '', desc: '', images: [], totalStock: 1, productLink: '' }); 
  };
  const handleAddCategory = (e) => { e.preventDefault(); if (newCategoryName.trim() && !(db.categories||[]).includes(newCategoryName.trim())) { requireApproval('ADD_CATEGORY', newCategoryName.trim(), 'Kategori dibuat.'); setNewCategoryName(''); } };
  
  const handleSaveEdit = (p) => { 
    if(editData.price && editData.totalStock) { 
      requireApproval('EDIT_PRODUCT', {
        ...p, 
        price: parseInt(editData.price), 
        discountPrice: editData.discountPrice ? parseInt(editData.discountPrice) : 0,
        deposit: parseInt(editData.deposit||0), 
        totalStock: parseInt(editData.totalStock), 
        productLink: editData.productLink, 
        images: editData.images
      }, 'Perubahan disimpan.'); 
      setEditingId(null); 
    } 
  };

  const filteredProducts = (db.products||[]).filter(p => p.status !== 'Maintenance' && (activeCategory === 'Semua' || p.category === activeCategory) && (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase())));
  const maintenanceProducts = (db.products||[]).filter(p => p.status === 'Maintenance');

  return (
    <div className="animate-fade-in-down w-full">
      <div className="w-full overflow-x-auto mb-6 pb-2">
        <div className="flex bg-white border border-stone-200 p-1.5 rounded-2xl w-max shadow-sm">
          <button onClick={() => setInvTab('katalog')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${invTab === 'katalog' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>Katalog Aktif</button>
          <button onClick={() => setInvTab('maintenance')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${invTab === 'maintenance' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>Masuk Maintenance {maintenanceProducts.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{maintenanceProducts.length}</span>}</button>
        </div>
      </div>

      {invTab === 'katalog' && (
        <>
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm mb-6">
             <h3 className="font-bold text-stone-800 mb-5 flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-stone-400"/> Pengaturan Kategori</h3>
             <div className="flex flex-wrap items-center gap-3 mb-6">
                <button onClick={() => setActiveCategory('Semua')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeCategory === 'Semua' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>Semua Filter</button>
                {(db.categories||[]).map(cat => (
                   <div key={`cat-${cat}`} className={`flex items-center rounded-full border transition-all ${activeCategory === cat ? `${cTheme.bg} text-white border-transparent shadow-md` : 'bg-white border-stone-200 text-stone-700 shadow-sm'}`}>
                     <button onClick={() => setActiveCategory(cat)} className="px-5 py-2.5 text-sm font-medium">{cat}</button>
                     <div className="w-px h-5 bg-stone-300"></div>
                     <button onClick={() => requireApproval('DELETE_CATEGORY', cat, 'Kategori dihapus.', true)} className={`p-2.5 rounded-r-full transition-colors ${activeCategory === cat ? 'hover:bg-black/20 text-white' : 'text-stone-400 hover:text-red-500 hover:bg-red-50'}`}><X className="w-4 h-4"/></button>
                   </div>
                ))}
             </div>
             <form onSubmit={handleAddCategory} className="flex gap-3 w-full max-w-sm">
                <input type="text" placeholder="Tambah kategori baru..." value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)} required className="flex-1 px-5 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400" />
                <button type="submit" className="bg-stone-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-black transition-colors"><Plus className="w-5 h-5"/></button>
             </form>
          </div>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
             <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input type="text" placeholder="Cari ID atau nama baju..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-[16px] focus:outline-none focus:border-stone-400 shadow-sm" />
             </div>
             <button onClick={() => setShowAddForm(!showAddForm)} disabled={(db.categories||[]).length === 0} className={`text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 shadow-lg active:scale-95 ${(db.categories||[]).length === 0 ? 'bg-stone-300 cursor-not-allowed' : cTheme.bg}`}><Plus className="w-5 h-5"/> {showAddForm ? 'Tutup Formulir' : 'Tambah Produk'}</button>
          </div>

          {showAddForm && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm mb-8 animate-fade-in-down">
               <h3 className="font-bold text-xl text-stone-800 mb-6 border-b pb-3">Formulir Produk Baru</h3>
               <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-bold text-stone-700 mb-2">Nama Baju / Produk</label><input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400" /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-sm font-bold text-stone-700 mb-2">Harga Asli Sewa/Hari</label><input required type="number" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400" /></div>
                     <div><label className="block text-sm font-bold text-rose-600 mb-2 flex items-center gap-1">Harga Diskon <Tag className="w-4 h-4"/></label><input type="number" value={formData.discountPrice} onChange={e=>setFormData({...formData, discountPrice: e.target.value})} className="w-full px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-[16px] outline-none focus:border-rose-400 placeholder-rose-300" placeholder="Kosongkan = Normal" /></div>
                  </div>
                  <div><label className="block text-sm font-bold text-stone-700 mb-2">Pilih Kategori</label><select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400 cursor-pointer">{(db.categories||[]).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-sm font-bold text-stone-700 mb-2">Jumlah Fisik Barang</label><input required type="number" min="1" value={formData.totalStock} onChange={e=>setFormData({...formData, totalStock: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400" /></div>
                     <div><label className="block text-sm font-bold text-amber-700 mb-2">Deposit (Jaminan)</label><input type="number" value={formData.deposit} onChange={e=>setFormData({...formData, deposit: e.target.value})} className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-[16px] outline-none focus:border-amber-400" /></div>
                  </div>
                  <div className="sm:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Link Referensi/Eksternal (Opsional)</label><input type="url" placeholder="https://" value={formData.productLink} onChange={e=>setFormData({...formData, productLink: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400" /></div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-stone-700 mb-2">Upload Foto Barang (Bisa Banyak)</label>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                       {formData.images.map((img, idx) => (
                         <div key={idx} className="relative shrink-0">
                           <img src={img} className="w-20 h-20 object-cover rounded-xl border border-stone-200 shadow-sm" alt="up"/>
                           <button type="button" onClick={() => removeImage(idx, false)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><X className="w-3 h-3"/></button>
                         </div>
                       ))}
                       <label className="w-20 h-20 shrink-0 flex items-center justify-center border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-50 text-stone-400 bg-white">
                         <Plus className="w-6 h-6" />
                         <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                       </label>
                    </div>
                  </div>

                  <div className="sm:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Deskripsi Detail</label><textarea required rows="3" value={formData.desc} onChange={e=>setFormData({...formData, desc: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400"></textarea></div>
                  <div className="sm:col-span-2 mt-4"><button type="submit" className={`w-full py-4 ${cTheme.bg} text-white font-bold text-lg rounded-xl shadow-lg active:scale-95`}>Simpan ke Katalog</button></div>
               </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map(p => {
              const avail = getAvailableStock(p.id);
              const isExpanded = expandedId === p.id;
              const isEditing = editingId === p.id;
              const hasDiskon = p.discountPrice > 0;
              const effPrice = hasDiskon ? p.discountPrice : p.price;

              return (
                <div key={p.id} className="bg-white border border-stone-100 rounded-3xl shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-shadow relative">
                   {hasDiskon && <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow z-10">SALE</span>}
                   <div className="p-5 flex gap-5 cursor-pointer hover:bg-stone-50 transition-colors" onClick={() => {setExpandedId(isExpanded ? null : p.id); setEditingId(null);}}>
                      <img src={p.images?.[0] || 'https://placehold.co/400?text=No+Image'} alt={p.name} className="w-20 h-20 rounded-2xl object-cover border border-stone-100 shadow-sm" />
                      <div className="flex-1 overflow-hidden">
                         <h4 className="font-bold text-stone-800 text-base leading-tight mb-1 truncate">{p.name}</h4>
                         <p className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded w-max mb-2">{p.id} &bull; {p.category}</p>
                         <div className="flex justify-between items-center">
                            <p className="text-sm font-bold text-stone-900">{formatRupiah(effPrice)}</p>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-md border ${avail>0?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>Sisa: {avail}/{p.totalStock}</span>
                         </div>
                      </div>
                   </div>
                   {isExpanded && (
                     <div className="p-5 bg-stone-50 border-t border-stone-200 flex-1 flex flex-col">
                        <p className="text-sm text-stone-600 mb-5 flex-grow leading-relaxed">{p.desc}</p>
                        
                        <div className="bg-white p-3 rounded-lg border border-stone-100 mb-5 text-sm font-bold text-amber-700">Uang Jaminan: {formatRupiah(p.deposit)}</div>
                        
                        {isEditing ? (
                          <div className="space-y-4 mb-5 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                             <div><label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ubah Harga Normal</label><input type="number" value={editData.price} onChange={e=>setEditData({...editData, price: e.target.value})} className="w-full mt-2 px-4 py-2 border border-stone-200 rounded-xl text-[16px] outline-none" /></div>
                             <div><label className="text-xs font-bold text-rose-600 uppercase tracking-wider">Ubah Harga Diskon</label><input type="number" value={editData.discountPrice} onChange={e=>setEditData({...editData, discountPrice: e.target.value})} className="w-full mt-2 px-4 py-2 border border-rose-200 bg-rose-50 rounded-xl text-[16px] outline-none focus:border-rose-400" placeholder="Kosongkan jika tidak promo" /></div>
                             <div><label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ubah Stok Fisik</label><input type="number" value={editData.totalStock} onChange={e=>setEditData({...editData, totalStock: e.target.value})} className="w-full mt-2 px-4 py-2 border border-stone-200 rounded-xl text-[16px] outline-none" /></div>
                             <div><label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ubah Deposit</label><input type="number" value={editData.deposit} onChange={e=>setEditData({...editData, deposit: e.target.value})} className="w-full mt-2 px-4 py-2 border border-stone-200 rounded-xl text-[16px] outline-none" /></div>
                             <div><label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ubah Link Eksternal</label><input type="url" value={editData.productLink} onChange={e=>setEditData({...editData, productLink: e.target.value})} className="w-full mt-2 px-4 py-2 border border-stone-200 rounded-xl text-[16px] outline-none" /></div>
                             
                             <div>
                               <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Album Foto Produk</label>
                               <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
                                  {editData.images?.map((img, idx) => (
                                    <div key={idx} className="relative shrink-0">
                                      <img src={img} className="w-12 h-12 object-cover rounded-lg border border-stone-200 shadow-sm" alt="e"/>
                                      <button type="button" onClick={() => removeImage(idx, true)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"><X className="w-3 h-3"/></button>
                                    </div>
                                  ))}
                                  <label className="w-12 h-12 shrink-0 flex items-center justify-center border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:bg-stone-50 text-stone-400 bg-white">
                                    <Plus className="w-4 h-4" />
                                    <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                                  </label>
                               </div>
                             </div>

                             <div className="flex gap-3 pt-3">
                               <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-bold hover:bg-stone-200">Batal</button>
                               <button onClick={() => handleSaveEdit(p)} className={`flex-1 py-2.5 ${cTheme.bg} text-white rounded-xl text-sm font-bold shadow-md`}>Simpan</button>
                             </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap sm:flex-nowrap gap-3 mt-auto">
                            <button onClick={() => requireApproval('UPDATE_PRODUCT_STATUS', {id: p.id, status: 'Maintenance'}, 'Pakaian masuk ruang perawatan.')} className="w-full sm:flex-1 py-3 bg-yellow-50 text-yellow-700 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 hover:bg-yellow-100 border border-yellow-200"><Edit3 className="w-4 h-4"/> Perawatan</button>
                            <button onClick={() => requireApproval('DELETE_PRODUCT', {id: p.id}, 'Katalog dihapus.', true)} className="flex-1 py-3 bg-white text-red-600 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 hover:bg-red-50 border border-stone-200 shadow-sm"><Trash2 className="w-4 h-4"/> Hapus</button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditData({price: p.price, discountPrice: p.discountPrice || '', totalStock: p.totalStock, deposit: p.deposit, productLink: p.productLink||'', images: p.images || [p.image]}); }} className="flex-1 py-3 bg-stone-900 text-white rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 hover:bg-black shadow-md"><Edit3 className="w-4 h-4"/> Edit</button>
                          </div>
                        )}
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {invTab === 'maintenance' && (
        <div className="bg-white p-6 md:p-10 rounded-3xl border border-stone-200 shadow-sm">
           <h3 className="font-bold text-xl text-stone-800 mb-2 flex items-center gap-3"><SettingsIcon className="w-6 h-6 text-yellow-500"/> Gudang Perawatan</h3>
           <p className="text-stone-500 mb-8">Pakaian yang dikembalikan dari pelanggan ada di sini. Disembunyikan dari katalog publik secara otomatis.</p>
           {maintenanceProducts.length === 0 ? <div className="text-center py-16 bg-stone-50 border border-dashed border-stone-300 rounded-3xl text-stone-500"><CheckCircle className="w-12 h-12 mx-auto mb-4 text-stone-300"/>Semua barang dalam kondisi baik.</div> : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {maintenanceProducts.map(p => (
                 <div key={p.id} className="border border-stone-200 rounded-3xl p-5 flex flex-col hover:shadow-md transition-shadow bg-stone-50">
                    <img src={p.images?.[0] || 'https://placehold.co/400?text=No+Image'} className="w-full h-40 object-cover rounded-2xl mb-4 shadow-sm" alt="Item"/>
                    <h4 className="font-bold text-stone-800 text-lg mb-1">{p.name}</h4>
                    <p className="text-xs font-mono text-stone-500 mb-5">{p.id}</p>
                    <button onClick={() => requireApproval('UPDATE_PRODUCT_STATUS', {id: p.id, status: 'Tersedia'}, 'Pakaian siap disewakan kembali.')} className="mt-auto w-full py-3 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 flex items-center justify-center gap-2 shadow-md active:scale-95"><CheckCircle className="w-5 h-5"/> Selesai Diperbaiki</button>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

const AdminCalendar = () => {
  const { db } = useContext(AppStateContext);
  const [search, setSearch] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const filteredOrders = (db.orders||[]).filter(order => {
    if (!search) return true;
    const s = search.toLowerCase();
    return order.items.some(item => item.name.toLowerCase().includes(s) || item.id.toLowerCase().includes(s));
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); };
  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); };
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const getOrdersForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const targetDate = new Date(dateStr);
    return filteredOrders.filter(o => {
       const start = new Date(o.startDate);
       const end = new Date(o.endDate || o.startDate);
       if(!o.endDate) end.setDate(end.getDate() + (o.duration - 1));
       return targetDate >= start && targetDate <= end && ['Menunggu Konfirmasi', 'Siap Diambil', 'Sedang Disewa'].includes(o.status);
    });
  };

  return (
    <div className="space-y-8 animate-fade-in-down w-full">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-6">
         <div>
            <h2 className="font-bold font-serif text-2xl text-stone-900 flex items-center gap-3"><CalendarIcon className="w-7 h-7 text-rose-600"/> Kalender Penyewaan</h2>
            <p className="text-stone-500 mt-2">Mencegah bentrok penyewaan (Double-Booking) secara visual.</p>
         </div>
         <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input type="text" placeholder="Lacak ID Pakaian..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] focus:outline-none focus:border-rose-600 transition-colors shadow-inner" />
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 md:p-10">
         <div className="flex justify-between items-center mb-8">
            <button onClick={prevMonth} className="p-3 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200"><ChevronLeft className="w-6 h-6 text-stone-700"/></button>
            <h3 className="font-bold text-2xl font-serif text-stone-900 uppercase tracking-widest">{monthNames[currentMonth]} {currentYear}</h3>
            <button onClick={nextMonth} className="p-3 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200"><ChevronRight className="w-6 h-6 text-stone-700"/></button>
         </div>

         <div className="grid grid-cols-7 gap-2 md:gap-4 text-center mb-4">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => <div key={`dow-${i}`} className="text-xs font-bold text-stone-400 uppercase tracking-widest">{d}</div>)}
         </div>
         <div className="grid grid-cols-7 gap-2 md:gap-4">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`pad-${i}`} className="p-2 md:p-4 rounded-2xl bg-stone-50 border border-dashed border-stone-200"></div>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
               const day = i + 1;
               const dayOrders = getOrdersForDate(day);
               const hasOrders = dayOrders.length > 0;
               return (
                 <div key={`day-${day}`} onClick={() => hasOrders && setSelectedDate({ day, month: currentMonth, year: currentYear, orders: dayOrders })} className={`p-3 md:p-5 rounded-2xl border flex flex-col items-center justify-center min-h-[70px] md:min-h-[100px] transition-all ${hasOrders ? 'bg-rose-50 border-rose-200 cursor-pointer hover:bg-rose-100 shadow-sm hover:scale-105' : 'bg-white border-stone-100 text-stone-400'}`}>
                    <span className={`text-base md:text-xl font-bold ${hasOrders ? 'text-rose-900' : ''}`}>{day}</span>
                    {hasOrders && <span className="mt-2 text-[10px] md:text-xs font-bold bg-rose-600 text-white px-3 py-1 rounded-full uppercase tracking-wider">{dayOrders.length} Event</span>}
                 </div>
               );
            })}
         </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md" onClick={() => setSelectedDate(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-down" onClick={e=>e.stopPropagation()}>
            <div className="p-6 md:p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50">
               <h3 className="font-bold font-serif text-xl text-stone-900">Jadwal: {selectedDate.day} {monthNames[selectedDate.month]}</h3>
               <button onClick={() => setSelectedDate(null)} className="p-2 bg-white hover:bg-stone-100 rounded-full text-stone-500 border border-stone-200 shadow-sm"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto space-y-5">
               {selectedDate.orders.map(o => (
                 <div key={`modal-ord-${o.id}`} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 pb-4 border-b border-stone-100 gap-3">
                       <div><p className="font-bold text-base text-stone-800">{o.customer.name}</p><p className="text-xs text-stone-500 font-mono mt-1">{o.id}</p></div>
                       <span className="text-[10px] font-bold px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-lg text-stone-600 w-max uppercase tracking-wider">{o.status}</span>
                    </div>
                    <ul className="space-y-3">
                       {o.items.map(item => (
                         <li key={`modal-item-${item.id}`} className="flex items-center gap-4 text-sm">
                            <img src={item.images?.[0]} alt={item.name} className="w-12 h-12 rounded-xl border border-stone-100 object-cover shadow-sm"/>
                            <div><p className="font-bold text-stone-800 leading-tight">{item.quantity}x {item.name}</p><p className="text-[10px] text-stone-400 font-mono mt-1">{item.id}</p></div>
                         </li>
                       ))}
                    </ul>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminCustomers = () => {
  const { db, handleApproval, loggedInUser, cTheme } = useContext(AppStateContext);
  const [tab, setTab] = useState('member');
  
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  const approvedMembers = (db.members||[]).filter(m => m.status === 'approved');
  const nonMembers = (db.orders||[]).filter(o => !o.memberId).reduce((acc, order) => {
     const existing = acc.find(c => c.identity === order.customer.identity);
     if (existing) { existing.totalSpent += order.total; existing.orderCount += 1; } else { acc.push({ ...order.customer, totalSpent: order.total, orderCount: 1 }); }
     return acc;
  }, []);
  const memberApps = (db.approvals||[]).filter(a => a.actionType === 'REGISTER_MEMBER');

  const canEdit = ['owner', 'developer'].includes(loggedInUser?.role);

  const startEdit = (e, m) => {
    e.stopPropagation();
    setEditingMemberId(m.id);
    setEditForm({
      name: m.name || '', username: m.username || '', identity: m.identity || '', 
      phone: m.phone || '', gender: m.gender || 'Perempuan', 
      birthPlace: m.birthPlace || '', birthDate: m.birthDate || '', 
      address: m.address || '', socialMedia: m.socialMedia || ''
    });
  };

  const saveEdit = (originalMember) => {
    if (canEdit) {
      requireApproval('UPDATE_MEMBER', { id: originalMember.id, ...editForm }, 'Data pelanggan berhasil diperbarui.', true);
    }
    setEditingMemberId(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden animate-fade-in-down w-full">
      <div className="flex border-b border-stone-200 bg-stone-50 w-full overflow-x-auto no-scrollbar">
         <button onClick={() => setTab('member')} className={`px-6 md:px-8 py-5 font-bold text-sm uppercase tracking-wider ${tab === 'member' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white shadow-sm` : 'text-stone-500 hover:text-stone-800'}`}>Member Aktif ({approvedMembers.length})</button>
         <button onClick={() => setTab('nonmember')} className={`px-6 md:px-8 py-5 font-bold text-sm uppercase tracking-wider ${tab === 'nonmember' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white shadow-sm` : 'text-stone-500 hover:text-stone-800'}`}>Non Member ({nonMembers.length})</button>
         <button onClick={() => setTab('approval')} className={`px-6 md:px-8 py-5 font-bold text-sm uppercase tracking-wider flex items-center gap-2 ${tab === 'approval' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white shadow-sm` : 'text-stone-500 hover:text-stone-800'}`}>Persetujuan {memberApps.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{memberApps.length}</span>}</button>
      </div>

      <div className="w-full overflow-x-auto">
        {tab === 'member' && (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead><tr className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 text-xs uppercase tracking-wider"><th className="p-5">Profil</th><th className="p-5">Kontak</th><th className="p-5 text-right">Poin</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {approvedMembers.length === 0 ? <tr><td colSpan="3" className="text-center py-10 text-stone-500">Belum ada member.</td></tr> : approvedMembers.map(m => {
                const isExpanded = expandedMemberId === m.id;
                const isEditing = editingMemberId === m.id;

                return (
                  <React.Fragment key={m.id}>
                    <tr onClick={() => { if(!isEditing) { setExpandedMemberId(isExpanded ? null : m.id); setEditingMemberId(null); } }} className={`transition-colors ${isEditing ? 'bg-amber-50 cursor-default' : 'cursor-pointer hover:bg-stone-50/50'} ${isExpanded && !isEditing ? 'bg-stone-50' : ''}`}>
                      <td className="p-5 flex items-center gap-4">
                        {m.photoUrl ? <img src={m.photoUrl} alt="Pic" className="w-12 h-12 rounded-full object-cover border"/> : <div className="w-12 h-12 rounded-full bg-stone-100 border flex items-center justify-center"><User className="w-6 h-6 text-stone-400"/></div>}
                        <div><p className="font-bold text-stone-800 text-base">{m.name}</p><p className="text-xs font-mono text-stone-500 mt-1">{m.id}</p></div>
                      </td>
                      <td className="p-5"><p className="font-bold text-stone-700">{m.phone}</p><p className="text-xs text-stone-500 mt-1">{m.email}</p></td>
                      <td className="p-5 text-right">
                         <div className="flex items-center justify-end gap-4">
                           <span className="font-bold text-rose-700 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 inline-flex items-center gap-2 shadow-sm"><Award className="w-5 h-5"/> {m.points}</span>
                           <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                         </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="3" className="p-0 border-b-0">
                          <div className={`p-6 md:p-8 border-t border-stone-200 shadow-inner ${isEditing ? 'bg-amber-50/30' : 'bg-stone-50'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm col-span-1 md:col-span-2">
                                  <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-3">
                                      <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4"/> Informasi Lengkap Member</h5>
                                      {canEdit && !isEditing && (
                                          <button onClick={(e) => startEdit(e, m)} className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"><Edit3 className="w-3 h-3"/> Edit Data Pelanggan</button>
                                      )}
                                  </div>
                                  
                                  {isEditing ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                                         <div><label className="text-xs font-bold text-stone-500 mb-1 block">Nama Lengkap</label><input type="text" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-500 text-sm" /></div>
                                         <div><label className="text-xs font-bold text-stone-500 mb-1 block">Username Login</label><input type="text" value={editForm.username} onChange={e=>setEditForm({...editForm, username: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-500 text-sm" /></div>
                                         <div><label className="text-xs font-bold text-stone-500 mb-1 block">NIK KTP</label><input type="text" value={editForm.identity} onChange={e=>setEditForm({...editForm, identity: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-500 text-sm" /></div>
                                         <div><label className="text-xs font-bold text-stone-500 mb-1 block">No WhatsApp</label><input type="text" value={editForm.phone} onChange={e=>setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-500 text-sm" /></div>
                                         <div><label className="text-xs font-bold text-stone-500 mb-1 block">Jenis Kelamin</label><select value={editForm.gender} onChange={e=>setEditForm({...editForm, gender: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-500 text-sm"><option>Perempuan</option><option>Laki-Laki</option></select></div>
                                         <div className="flex gap-2">
                                            <div className="w-1/2"><label className="text-xs font-bold text-stone-500 mb-1 block">Tempat Lahir</label><input type="text" value={editForm.birthPlace} onChange={e=>setEditForm({...editForm, birthPlace: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-500 text-sm" /></div>
                                            <div className="w-1/2"><label className="text-xs font-bold text-stone-500 mb-1 block">Tanggal Lahir</label><input type="date" value={editForm.birthDate} onChange={e=>setEditForm({...editForm, birthDate: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-500 text-sm" /></div>
                                         </div>
                                         <div className="sm:col-span-2"><label className="text-xs font-bold text-stone-500 mb-1 block">Alamat Domisili</label><textarea value={editForm.address} onChange={e=>setEditForm({...editForm, address: e.target.value})} rows="2" className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-500 text-sm" /></div>
                                         <div className="sm:col-span-2"><label className="text-xs font-bold text-stone-500 mb-1 block">Akun Sosial Media</label><input type="text" value={editForm.socialMedia} onChange={e=>setEditForm({...editForm, socialMedia: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-500 text-sm" /></div>
                                         
                                         <div className="sm:col-span-2 flex gap-3 pt-2 mt-2 border-t border-stone-100">
                                            <button onClick={() => setEditingMemberId(null)} className="flex-1 py-2.5 bg-stone-100 text-stone-600 font-bold rounded-xl text-sm hover:bg-stone-200 transition-colors">Batal</button>
                                            <button onClick={() => saveEdit(m)} className={`flex-1 py-2.5 ${cTheme.bg} text-white font-bold rounded-xl text-sm shadow-md hover:brightness-110 transition-all`}>Simpan Perubahan</button>
                                         </div>
                                      </div>
                                  ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                                         <div><p className="text-xs text-stone-500 mb-1">Username Login</p><p className="font-bold text-stone-800">{m.username}</p></div>
                                         <div><p className="text-xs text-stone-500 mb-1">Nomor Induk Kependudukan (NIK)</p><p className="font-bold text-stone-800 font-mono">{m.identity || '-'}</p></div>
                                         <div><p className="text-xs text-stone-500 mb-1">Jenis Kelamin</p><p className="font-bold text-stone-800">{m.gender || '-'}</p></div>
                                         <div><p className="text-xs text-stone-500 mb-1">Tempat, Tanggal Lahir</p><p className="font-bold text-stone-800">{m.birthPlace || '-'}, {m.birthDate || '-'}</p></div>
                                         <div className="sm:col-span-2"><p className="text-xs text-stone-500 mb-1">Alamat Domisili</p><p className="font-bold text-stone-800">{m.address || '-'}</p></div>
                                         {m.socialMedia && <div className="sm:col-span-2"><p className="text-xs text-stone-500 mb-1">Akun Sosial Media</p><p className="font-bold text-blue-600">{m.socialMedia}</p></div>}
                                      </div>
                                  )}
                               </div>

                               <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col gap-4">
                                  <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 border-b border-stone-100 pb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Dokumen KTP</h5>
                                  {m.ktpUrl ? (
                                     <a href={m.ktpUrl} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-xl border border-stone-200 shadow-sm flex-grow">
                                       <img src={m.ktpUrl} alt="KTP" className="w-full h-32 md:h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500" />
                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <span className="text-white text-xs font-bold px-3 py-1.5 border border-white rounded-lg backdrop-blur-sm">Lihat Penuh</span>
                                       </div>
                                     </a>
                                  ) : (
                                     <div className="w-full h-32 md:h-full min-h-[120px] bg-stone-50 border border-dashed border-stone-300 rounded-xl flex items-center justify-center text-stone-400 text-xs">Dokumen Tidak Tersedia</div>
                                  )}
                               </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
              )})}
            </tbody>
          </table>
        )}

        {tab === 'nonmember' && (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead><tr className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 text-xs uppercase tracking-wider"><th className="p-5">Pelanggan</th><th className="p-5">KTP</th><th className="p-5">Kontak</th><th className="p-5 text-right">Riwayat</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {nonMembers.map((nm, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50">
                  <td className="p-5 font-bold text-stone-800">{nm.name}</td>
                  <td className="p-5 font-mono text-stone-600">{nm.identity}</td>
                  <td className="p-5 font-medium text-stone-700">{nm.phone}</td>
                  <td className="p-5 text-right"><p className="font-bold text-stone-800">{nm.orderCount}x</p><p className="text-xs text-stone-500">{formatRupiah(nm.totalSpent)}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'approval' && (
          <div className="p-6 md:p-8 space-y-5">
            {memberApps.map(app => (
              <div key={app.id} className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                 <div className="flex items-center gap-5">
                    {app.payload.photoUrl ? <img src={app.payload.photoUrl} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md" alt="foto"/> : <div className="w-16 h-16 rounded-full bg-white shadow-md border flex items-center justify-center"><User className="w-8 h-8 text-stone-300"/></div>}
                    <div>
                      <p className="font-bold text-stone-800 text-lg mb-1">{app.requestedBy}</p>
                      <p className="text-xs text-stone-500 font-mono">{app.payload.identity} &bull; {app.payload.phone}</p>
                    </div>
                 </div>
                 <div className="flex gap-3 w-full md:w-auto">
                   <button onClick={() => handleApproval(app.id, 'reject')} className="flex-1 px-6 py-3 bg-white text-red-600 border border-stone-200 rounded-xl text-sm font-bold shadow-sm">Tolak</button>
                   <button onClick={() => handleApproval(app.id, 'approve')} className={`flex-1 px-6 py-3 ${cTheme.bg} text-white rounded-xl text-sm font-bold shadow-lg`}>Terima Member</button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminPrizes = () => {
  const { db, requireApproval, cTheme, showToast, compressImage, uploadImageToServer } = useContext(AppStateContext);
  const [formData, setFormData] = useState({ name: '', points: '', desc: '', image: null });
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => { 
    const file = e.target.files[0]; 
    if (!file) return; 
    setIsUploading(true);
    showToast('Mengkompresi gambar hadiah...', 'info');
    const compressed = await compressImage(file);
    const url = await uploadImageToServer(compressed);
    if(url) { setFormData(p => ({ ...p, image: url })); showToast('Gambar OK', 'success'); } 
    else { showToast('Gagal mengunggah gambar.', 'error'); }
    setIsUploading(false);
  };
  const handleAdd = (e) => { e.preventDefault(); requireApproval('ADD_PRIZE', { id: `PRZ-${Date.now()}`, name: formData.name, points: parseInt(formData.points), desc: formData.desc, image: formData.image || '' }, 'Hadiah tersimpan.'); setFormData({ name: '', points: '', desc: '', image: null }); };

  return (
    <div className="animate-fade-in-down w-full space-y-8">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm">
         <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-3 border-b border-stone-100 pb-4"><Gift className="w-6 h-6 text-rose-600"/> Tambah Katalog Hadiah</h2>
         <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div><label className="block text-sm font-bold text-stone-700 mb-2">Nama Hadiah</label><input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none" /></div>
            <div><label className="block text-sm font-bold text-stone-700 mb-2">Harga (Poin)</label><input required type="number" min="1" value={formData.points} onChange={e=>setFormData({...formData, points: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Deskripsi Singkat</label><textarea required rows="2" value={formData.desc} onChange={e=>setFormData({...formData, desc: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none"></textarea></div>
            <div className="sm:col-span-2"><label className="flex items-center justify-center p-5 border-2 border-dashed border-stone-300 rounded-2xl cursor-pointer hover:bg-stone-50 text-sm font-bold text-stone-500 bg-white"><Upload className="w-5 h-5 mr-3" /> {isUploading ? 'Uploading...' : formData.image ? 'Gambar Siap' : 'Upload Foto Hadiah'}<input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label></div>
            <button type="submit" className={`sm:col-span-2 py-4 ${cTheme.bg} text-white font-bold text-lg rounded-xl mt-4 shadow-lg active:scale-95`}>Masukkan ke Katalog</button>
         </form>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(db.prizes||[]).map(p => (
           <div key={p.id} className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden flex flex-col hover:shadow-lg">
              <div className="h-40 bg-stone-100 relative">
                 <img src={p.image} className="w-full h-full object-cover" alt="prize"/>
                 <button onClick={() => requireApproval('DELETE_PRIZE', {id: p.id}, 'Dihapus.', true)} className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"><Trash2 className="w-4 h-4"/></button>
              </div>
              <div className="p-5 flex flex-col flex-grow">
                 <h4 className="font-bold text-lg text-stone-900 mb-2">{p.name}</h4>
                 <p className="text-sm text-stone-500 mb-5 flex-grow line-clamp-2">{p.desc}</p>
                 <span className="font-bold text-rose-700 flex items-center justify-center gap-2 bg-rose-50 w-full py-2.5 rounded-xl border border-rose-200"><Award className="w-5 h-5"/> {p.points} Poin</span>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};

const AdminApprovals = () => {
  const { db, handleApproval, loggedInUser } = useContext(AppStateContext);
  const sysApps = (db.approvals||[]).filter(a => a.actionType !== 'REGISTER_MEMBER');
  if (sysApps.length === 0) return <div className="text-center py-20 text-stone-500 bg-white rounded-3xl border border-dashed border-stone-300 animate-fade-in-down"><CheckCircle className="w-16 h-16 mx-auto mb-4 text-stone-300"/>Aman, tidak ada antrean.</div>;

  return (
    <div className="space-y-5 w-full animate-fade-in-down">
      <h2 className="text-xl font-serif font-bold text-stone-800 mb-6 flex items-center gap-3"><Shield className="w-6 h-6 text-rose-600"/> Otorisasi Sistem ({sysApps.length})</h2>
      {sysApps.map(app => {
        const canApprove = ['owner','developer'].includes(loggedInUser.role) || (loggedInUser.role === 'manager' && !(app.requesterRole === 'manager' && app.actionType === 'UPDATE_USER'));
        return (
          <div key={app.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="overflow-hidden w-full md:w-auto">
              <div className="flex flex-wrap items-center gap-3 mb-3"><span className="bg-yellow-50 text-yellow-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded border border-yellow-200">Butuh Akses</span><span className="text-[10px] text-stone-400 font-mono">{app.id}</span></div>
              <p className="font-bold text-stone-900 text-lg truncate mb-1">{app.actionType.replace('_', ' ')}</p>
              <p className="text-sm text-stone-600 truncate">Diajukan: <span className="font-bold">{app.requestedBy}</span> <span className="bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-2">{app.requesterRole}</span></p>
            </div>
            {canApprove ? (
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => handleApproval(app.id, 'reject')} className="flex-1 px-6 py-3 bg-white text-red-600 border border-stone-200 rounded-xl text-sm font-bold hover:bg-stone-50">Tolak Paksa</button>
                <button onClick={() => handleApproval(app.id, 'approve')} className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-black">Berikan Izin</button>
              </div>
            ) : (<div className="w-full md:w-auto text-center px-6 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-500 uppercase">Kunci Owner</div>)}
          </div>
        );
      })}
    </div>
  );
};

const AdminAccountSettings = () => {
  const { loggedInUser, requireApproval } = useContext(AppStateContext);
  const [formData, setFormData] = useState({ name: loggedInUser.name, username: loggedInUser.username, password: loggedInUser.password });
  const handleSubmit = (e) => { e.preventDefault(); requireApproval('UPDATE_USER', { userId: loggedInUser.id, ...formData }, 'Pembaruan profil sedang diproses.', true); };

  return (
    <div className="max-w-2xl bg-white p-8 md:p-12 rounded-3xl border border-stone-200 shadow-sm w-full mx-auto animate-fade-in-down">
      <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-md mx-auto"><User className="w-10 h-10 text-stone-400"/></div>
      <h2 className="text-2xl font-serif font-bold mb-8 text-center text-stone-800">Ubah Kredensial Pribadi</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div><label className="block text-sm font-bold text-stone-700 mb-2">Nama Tampilan</label><input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-rose-600" /></div>
        <div><label className="block text-sm font-bold text-stone-700 mb-2">Username Login</label><input required type="text" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-rose-600" /></div>
        <div><label className="block text-sm font-bold text-stone-700 mb-2">Password Akses</label><input required type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-rose-600" /></div>
        <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-black mt-6 shadow-xl active:scale-95 text-lg">Ajukan Pergantian Data</button>
      </form>
    </div>
  );
};

const AdminSystemSettings = () => {
  const { db, updateDb, showToast, loggedInUser, requireApproval, compressImage, uploadImageToServer, setBentoCategory } = useContext(AppStateContext);
  const [bConfig, setBConfig] = useState(db.brandConfig);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { setBConfig(db.brandConfig); }, [db.brandConfig]);

  const handleSaveBrand = (e) => { e.preventDefault(); updateDb('brandConfig', bConfig); showToast('Konfigurasi Toko Disimpan.', 'success'); };
  const updateSocial = (index, field, val) => { const newS = [...bConfig.socialMedia]; newS[index][field] = val; setBConfig({...bConfig, socialMedia: newS}); };
  
  const handleLogoUpload = async (e) => { 
    const file = e.target.files[0]; 
    if (!file) return; 

    if (file.type !== 'image/png' && file.type !== 'image/svg+xml') {
      showToast('Gagal: Logo WAJIB berformat PNG Transparan!', 'error');
      return;
    }

    setIsUploading(true);
    showToast('Mengkompresi gambar logo...', 'info');
    const compressed = await compressImage(file, true); 
    const url = await uploadImageToServer(compressed);
    if (url) { 
      setBConfig({...bConfig, logoUrl: url}); 
      showToast('Logo berhasil disiapkan.', 'success'); 
    } else { 
      showToast('Gagal upload ke server gambar.', 'error'); 
    }
    setIsUploading(false);
  };

  const handlePasswordReset = (userId, newPassword) => {
    const newUsers = (db.users||[]).map(u => u.id === userId ? { ...u, password: newPassword } : u);
    updateDb('users', newUsers); showToast(`Password staf berhasil diubah!`, 'success');
  };

  return (
    <div className="space-y-8 w-full animate-fade-in-down">
      <div className="bg-white p-6 md:p-10 rounded-3xl border border-stone-200 shadow-sm w-full">
         <h2 className="text-xl md:text-2xl font-serif font-bold mb-8 flex items-center gap-3 border-b border-stone-100 pb-5 text-stone-800"><SettingsIcon className="w-7 h-7 text-rose-600"/> Identitas Merek (Whitelabel)</h2>
         <form onSubmit={handleSaveBrand} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-2">
              {bConfig.logoUrl ? <img src={bConfig.logoUrl} className="w-24 h-24 object-contain border border-stone-200 rounded-2xl shadow-sm bg-stone-50 p-2" alt="Logo" /> : <div className="w-24 h-24 bg-stone-100 border border-stone-200 rounded-2xl flex items-center justify-center shadow-sm"><ImageIcon className="w-8 h-8 text-stone-400"/></div>}
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Logo Perusahaan (Wajib PNG Transparan)</label>
                <p className="text-[10px] text-stone-500 mb-2">PENTING: Jangan gunakan gambar PNG palsu dari Google yang ada kotak-kotaknya.</p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center justify-center px-5 py-3 border border-stone-300 rounded-xl cursor-pointer hover:bg-stone-50 text-sm font-bold text-stone-600 bg-white shadow-sm w-max transition-colors"><Upload className="w-4 h-4 mr-2" /> {isUploading ? 'Uploading...' : 'Upload Logo (.png)'}<input type="file" accept=".png, image/png, image/svg+xml" onChange={handleLogoUpload} className="hidden" /></label>
                  {bConfig.logoUrl && <button type="button" onClick={() => setBConfig({...bConfig, logoUrl: ''})} className="px-5 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors">Hapus Logo</button>}
                </div>
              </div>
            </div>

            <div><label className="block text-sm font-bold text-stone-700 mb-2">Nama Aplikasi</label><input type="text" value={bConfig.appName} onChange={e=>setBConfig({...bConfig, appName: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none" /></div>
            <div>
               <label className="block text-sm font-bold text-stone-700 mb-2">Gaya Tulisan Logo (Font)</label>
               <select value={bConfig.logoFont || 'Playfair Display'} onChange={e=>setBConfig({...bConfig, logoFont: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none cursor-pointer">
                 <option value="Playfair Display">Playfair Display (Serif Elegan)</option>
                 <option value="Cinzel">Cinzel (Klasik Mewah)</option>
                 <option value="Montserrat">Montserrat (Modern Ramping)</option>
                 <option value="Great Vibes">Great Vibes (Sambung Estetik)</option>
               </select>
            </div>
            <div><label className="block text-sm font-bold text-stone-700 mb-2">Warna Tema Utama</label><select value={bConfig.themeColor} onChange={e=>setBConfig({...bConfig, themeColor: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"><option value="rose">Rose (Default)</option><option value="amber">Dark Gold / Amber</option><option value="slate">Monochrome Slate</option><option value="emerald">Emerald Green</option></select></div>
            <div className="md:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Slogan Hero Banner</label><input type="text" value={bConfig.slogan} onChange={e=>setBConfig({...bConfig, slogan: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Biografi Perusahaan</label><textarea rows="3" value={bConfig.companyBio} onChange={e=>setBConfig({...bConfig, companyBio: e.target.value})} className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-xl outline-none" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Email Bisnis</label><input type="email" value={bConfig.companyEmail} onChange={e=>setBConfig({...bConfig, companyEmail: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none" /></div>
            
            <div className="md:col-span-2 bg-amber-50 p-6 rounded-2xl border border-amber-200 mt-4">
               <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-2"><Grid className="w-5 h-5 text-amber-600"/> Highlight Beranda (Bento Mosaik)</h3>
               <p className="text-sm text-stone-600 mb-5">Pilih 3 kategori produk untuk ditampilkan secara elegan di halaman beranda.</p>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {[0, 1, 2].map(idx => (
                    <div key={idx}>
                      <label className="block text-xs font-bold text-amber-800 mb-2 uppercase tracking-wider">Slot {idx + 1}</label>
                      <select value={bConfig.bentoCategories?.[idx] || ''} onChange={(e) => setBentoCategory(idx, e.target.value)} className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl outline-none font-bold text-stone-700 cursor-pointer shadow-sm">
                         <option value="" disabled>Pilih Kategori...</option>
                         {(db.categories||[]).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                 ))}
               </div>
            </div>

            <div className="md:col-span-2 bg-stone-50 p-6 rounded-2xl border border-stone-200 mt-4">
              <div className="flex justify-between items-center mb-6"><label className="block text-base font-serif font-bold text-stone-800">Jejaring Sosial Dinamis</label><button type="button" onClick={()=>setBConfig({...bConfig, socialMedia: [...(bConfig.socialMedia || []), {type: 'WhatsApp', value: '', label: ''}]})} className="text-xs bg-stone-900 text-white px-4 py-2.5 rounded-lg font-bold shadow-md hover:bg-black">+ Akun Baru</button></div>
              <div className="space-y-4">
                {(bConfig.socialMedia || []).map((soc, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                    <select value={soc.type} onChange={e=>updateSocial(i, 'type', e.target.value)} className="w-full sm:w-40 px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm font-bold outline-none"><option>WhatsApp</option><option>WA</option><option>Instagram</option><option>TikTok</option></select>
                    <input type="text" placeholder="Username / No HP / Link URL" value={soc.value} onChange={e=>updateSocial(i, 'value', e.target.value)} className="w-full flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg outline-none" />
                    <button type="button" onClick={() => setBConfig({...bConfig, socialMedia: bConfig.socialMedia.filter((_, idx) => idx !== i)})} className="w-full sm:w-auto p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100"><Trash2 className="w-5 h-5"/></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end mt-6"><button type="submit" className="w-full md:w-auto bg-stone-900 text-white px-10 py-4 rounded-xl font-bold shadow-xl active:scale-95 text-lg">Simpan Konfigurasi</button></div>
         </form>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-3xl border border-stone-200 shadow-sm w-full overflow-hidden">
         <h2 className="text-xl md:text-2xl font-serif font-bold mb-8 flex items-center gap-3 border-b border-stone-100 pb-5 text-stone-800"><Users className="w-7 h-7 text-rose-600"/> Kendali Staf (HR)</h2>
         <div className="w-full overflow-x-auto">
           <table className="w-full text-left min-w-[600px] border-collapse">
             <thead><tr className="text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-200 bg-stone-50"><th className="p-4 rounded-tl-xl">Identitas Staf</th><th className="p-4">Username Login</th><th className="p-4">Ubah Password</th><th className="p-4 text-right rounded-tr-xl">Pangkat Akses (Role)</th></tr></thead>
             <tbody className="divide-y divide-stone-100">
               {(db.users||[]).filter(u => u.role !== 'developer').map(u => (
                 <tr key={u.id} className="hover:bg-stone-50/50 transition-colors">
                   <td className="p-4 font-bold text-stone-800 text-base">{u.name} {u.id === loggedInUser?.id && <span className="text-[10px] bg-stone-800 text-white px-2.5 py-1 rounded-md ml-3 uppercase tracking-widest shadow-sm">Anda</span>}</td>
                   <td className="p-4 text-sm font-mono text-stone-500">{u.username}</td>
                   <td className="p-4">
                     <input type="text" placeholder="Ketik password baru..." onBlur={(e) => { if(e.target.value.trim()) { handlePasswordReset(u.id, e.target.value.trim()); e.target.value=''; } }} className="px-4 py-2 border border-stone-200 bg-white rounded-lg text-sm outline-none focus:border-rose-500 w-full max-w-[180px] shadow-sm" />
                   </td>
                   <td className="p-4 text-right">
                      <select value={u.role} disabled={u.id === loggedInUser?.id} onChange={(e) => { requireApproval('UPDATE_USER', {...u, role: e.target.value}, 'Otoritas diubah.', true); showToast(`Email dikirim ke staf.`, 'info'); }} className="px-4 py-2.5 border border-stone-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-40 shadow-sm cursor-pointer">
                        <option value="admin">Admin Kasir (Staf)</option><option value="manager">Manager Operasional</option><option value="owner">Owner (Hak Penuh)</option>
                      </select>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

const AdminLogs = () => {
  const { db } = useContext(AppStateContext);
  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden animate-fade-in-down w-full">
      <div className="p-8 border-b border-stone-100 bg-stone-50">
         <h2 className="text-xl font-serif font-bold flex items-center gap-3 text-stone-800"><ClipboardList className="w-6 h-6 text-stone-500"/> Audit Trail (Log Sistem)</h2>
         <p className="text-sm text-stone-500 mt-2">Pemantauan riwayat absolut khusus untuk tingkat Owner & Developer.</p>
      </div>
      <div className="overflow-x-auto w-full">
         <table className="w-full text-left border-collapse min-w-[800px]">
            <thead><tr className="bg-white text-stone-400 font-bold border-b border-stone-200 text-xs uppercase tracking-wider"><th className="p-5">Waktu Kejadian</th><th className="p-5">Aktor (User)</th><th className="p-5">Kategori</th><th className="p-5">Detail Perubahan</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
               {!(db.logs?.length) ? <tr><td colSpan="4" className="text-center py-16 text-stone-500 font-medium bg-stone-50">Belum ada riwayat aktivitas tercatat.</td></tr> :
                db.logs?.map(log => (
                   <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-5 text-xs font-mono text-stone-500">{log.timestamp}</td>
                      <td className="p-5 font-bold text-stone-800 text-base">{log.user}</td>
                      <td className="p-5"><span className="bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 shadow-sm uppercase tracking-wider">{log.action}</span></td>
                      <td className="p-5 text-sm text-stone-700 font-medium">{log.detail}</td>
                   </tr>
                ))
               }
            </tbody>
         </table>
      </div>
    </div>
  );
};

const AdminDeveloperPanel = () => {
  const { db, updateDb, saveToDatabase, exportData, importData, showToast } = useContext(AppStateContext);
  const handleFileUpload = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { importData(event.target.result); e.target.value = null; }; reader.readAsText(file); };
  
  const handleRoleChange = (userId, newRole) => { 
    const newUsers = (db.users||[]).map(u => u.id === userId ? { ...u, role: newRole } : u);
    const newLog = { id: `LOG-${Date.now()}-${Math.floor(Math.random()*1000)}`, timestamp: new Date().toLocaleString(), user: 'Developer', action: 'Dev Override', detail: `Ubah role user ${userId} jadi ${newRole}` };
    saveToDatabase({ ...db, users: newUsers, logs: [newLog, ...(db.logs||[])] });
    showToast(`Otoritas di-override oleh Developer.`, 'success');
  };
  
  const handlePasswordOverride = (userId, newPassword) => {
    const newUsers = (db.users||[]).map(u => u.id === userId ? { ...u, password: newPassword } : u);
    const newLog = { id: `LOG-${Date.now()}-${Math.floor(Math.random()*1000)}`, timestamp: new Date().toLocaleString(), user: 'Developer', action: 'Dev Override', detail: `Reset password paksa user ${userId}` };
    saveToDatabase({ ...db, users: newUsers, logs: [newLog, ...(db.logs||[])] });
    showToast(`Password berhasil dijebol & diganti!`, 'success');
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in-down w-full font-mono">
      <div className="bg-[#0f172a] p-6 md:p-10 rounded-3xl shadow-2xl text-emerald-50 relative overflow-hidden border border-emerald-900/30">
         <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Terminal className="w-64 h-64 md:w-96 md:h-96 text-emerald-400" /></div>
         <h2 className="text-2xl md:text-3xl font-bold mb-3 flex items-center gap-4 text-emerald-400"><Terminal className="w-8 h-8"/> DEVELOPER ROOT CONSOLE</h2>
         <p className="text-emerald-200/60 mb-10 max-w-3xl text-sm leading-relaxed">Peringatan: Area ini menembus semua pembatasan enkripsi dan RBAC. Perubahan data terjadi langsung di memori state tanpa melalui Middleware Persetujuan.</p>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10">
            <div className="bg-[#1e293b] p-6 md:p-8 rounded-2xl border border-emerald-500/20 shadow-inner">
               <h3 className="text-base font-bold mb-6 flex items-center gap-3 text-emerald-300"><Database className="w-5 h-5"/> MANAJEMEN DATABASE RAW</h3>
               <div className="space-y-4">
                  <button onClick={exportData} className="w-full flex justify-between items-center px-5 py-4 bg-[#0f172a] hover:bg-black rounded-xl transition-colors border border-emerald-900/50"><span className="font-bold text-sm text-emerald-400">Download State (JSON)</span><Download className="w-5 h-5 text-emerald-500"/></button>
                  <label className="w-full flex justify-between items-center px-5 py-4 bg-[#0f172a] hover:bg-black rounded-xl transition-colors cursor-pointer border border-emerald-900/50"><span className="font-bold text-sm text-emerald-400">Force Restore State (JSON)</span><UploadCloud className="w-5 h-5 text-emerald-500"/><input type="file" accept=".json" className="hidden" onChange={handleFileUpload} /></label>
               </div>
            </div>
            <div className="bg-[#1e293b] p-6 md:p-8 rounded-2xl border border-emerald-500/20 shadow-inner">
               <h3 className="text-base font-bold mb-6 flex items-center gap-3 text-emerald-300"><UploadCloud className="w-5 h-5"/> VERSI SISTEM APLIKASI</h3>
               <div className="space-y-4">
                  <div className="px-5 py-4 bg-[#0f172a] rounded-xl flex justify-between items-center border border-emerald-900/50"><span className="text-sm font-bold text-emerald-500">Versi Build Aktif</span><span className="text-xs bg-emerald-900 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-700">v8.0.0-PWA</span></div>
                  <button onClick={() => showToast('Mem-bypass limit HTTP...', 'success')} className="w-full py-4 bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-emerald-900/50">Ping Git Repository Server</button>
               </div>
            </div>
         </div>

         <div className="mt-8 bg-[#1e293b] p-6 md:p-8 rounded-2xl border border-emerald-500/20 relative z-10 shadow-inner">
            <h3 className="text-base font-bold mb-6 flex items-center gap-3 text-emerald-300"><ImageIcon className="w-5 h-5 text-emerald-400"/> OVERRIDE LOGO & ICON APLIKASI</h3>
            <div className="flex gap-4">
              <input type="text" placeholder="Masukkan Emoji Ikon Aplikasi..." maxLength="2" value={db.brandConfig?.appIcon || ''} onChange={(e) => updateDb('brandConfig', {...db.brandConfig, appIcon: e.target.value})} className="w-full md:w-1/3 px-4 py-3 bg-[#0f172a] border border-emerald-700 text-emerald-300 rounded-lg text-lg outline-none focus:border-emerald-400 transition-colors" />
              <button onClick={()=>showToast('Ikon Global diupdate', 'success')} className="px-6 py-3 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-emerald-900/50">Setel Ikon</button>
            </div>
         </div>

         <div className="mt-8 bg-[#1e293b] p-6 md:p-8 rounded-2xl border border-red-500/30 relative z-10 shadow-inner">
            <h3 className="text-base font-bold mb-6 flex items-center gap-3 text-red-400"><Shield className="w-5 h-5"/> PAKSA UBAH OTORITAS & KREDENSIAL (BYPASS)</h3>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left min-w-[700px] border-collapse">
                 <thead><tr className="border-b border-emerald-900/50 text-xs text-emerald-500 tracking-widest"><th className="pb-4">NAMA OBJEK (USER)</th><th className="pb-4">PAKSA UBAH PASSWORD</th><th className="pb-4 text-right">TINGKAT AKSES SAAT INI</th></tr></thead>
                 <tbody className="divide-y divide-emerald-900/30">
                   {(db.users||[]).map(u => (
                     <tr key={`dev-${u.id}`}>
                       <td className="py-4 text-sm font-bold text-emerald-100">{u.name} {u.role === 'developer' && <span className="text-[10px] ml-3 bg-red-900/80 text-red-300 px-2 py-1 rounded border border-red-700">Root Access</span>}</td>
                       <td className="py-4">
                         <input type="text" placeholder="Paksa password baru..." onBlur={(e) => { if(e.target.value.trim()) { handlePasswordOverride(u.id, e.target.value.trim()); e.target.value=''; } }} className="px-4 py-2 bg-[#0f172a] border border-red-700/50 text-red-300 rounded-lg text-sm outline-none focus:border-red-500 placeholder-red-900/50 w-full max-w-[200px]" />
                       </td>
                       <td className="py-4 text-right">
                          <select value={u.role} disabled={u.role === 'developer'} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="px-4 py-2 bg-[#0f172a] border border-emerald-700 text-emerald-300 rounded-lg text-sm outline-none focus:border-emerald-400 cursor-pointer disabled:opacity-40 transition-colors">
                            <option value="admin">Admin Kasir</option><option value="manager">Manager</option><option value="owner">Owner</option>{u.role === 'developer' && <option value="developer">Developer</option>}
                          </select>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};

export default function App() { return <AppStateProvider><AppContent /></AppStateProvider>; }

const AppContent = () => {
  const { view, loggedInUser, isDbLoading } = useContext(AppStateContext);

  if (isDbLoading) return <SplashScreen />;
  if (view === 'admin' && !loggedInUser) return <AdminLogin />;
  if (view === 'admin' && loggedInUser) return <AdminLayout />;
  
  return (
    <CustomerLayout>
      {view === 'dashboard' && <DashboardView />}
      {view === 'catalog' && <CatalogView />}
      {view === 'cart' && <CartView />}
      {view === 'checkout' && <CheckoutView />}
      {view === 'success' && <SuccessView />}
      {view === 'member_auth' && <MemberAuthView />}
      {view === 'member_profile' && <MemberProfileView />}
    </CustomerLayout>
  );
};