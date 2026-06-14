import React, { createContext, useState, useEffect } from 'react';
import { onSnapshot, setDoc } from "firebase/firestore";
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { CheckCircle, AlertCircle, Shield, MessageCircle } from 'lucide-react';

// Mengambil fungsi koneksi yang sudah kita buat di Langkah 1
import { auth, getDocRef } from '../config/firebase';

export const AppStateContext = createContext();

// ============================================================================
// FUNGSI HELPER GLOBAL
// ============================================================================
const IMGBB_API_KEY = "aab30f3a1714c46f739b7d56dd87a5b3"; 

export const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
};

export const getSocialLink = (type, value) => {
  if (!value) return '#';
  const cleanValue = value.replace('@', '').trim();
  const t = type.toLowerCase();
  if (t.includes('wa') || t.includes('whatsapp')) return `https://wa.me/${value.replace(/\D/g, '')}`;
  if (t.includes('instagram') || t.includes('ig')) return `https://instagram.com/${cleanValue}`;
  if (t.includes('tiktok')) return `https://tiktok.com/@${cleanValue}`;
  if (value.startsWith('http')) return value;
  return '#'; 
};

export const compressImage = (file, preserveTransparency = false) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; 
        let width = img.width; let height = img.height;
        if (width > MAX_WIDTH) { height = Math.round((height *= MAX_WIDTH / width)); width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); 
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        if (preserveTransparency) { resolve(canvas.toDataURL('image/png')); } 
        else { resolve(canvas.toDataURL('image/jpeg', 0.6)); }
      };
    };
  });
};

export const uploadImageToServer = async (base64Image) => {
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

// Data awal (Kosong) sebelum data asli turun dari Firebase
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
    promos: [], logs: [], approvals: [], stats: { allTimeRevenue: 0, activeOrdersCount: 0, membersCount: 0 },
    brandConfig: cachedBrandConfig || {
      appName: 'Aisya Wardrobe', slogan: 'Sewa Pakaian Premium & Eksklusif', companyBio: 'Penyedia layanan sewa pakaian premium terpercaya.',
      logoUrl: '', appIcon: '', themeColor: 'rose', logoFont: 'Playfair Display', companyEmail: 'admin@aisyawardrobe.com',
      socialMedia: [{ type: 'WhatsApp', value: '6281234567890', label: 'Hubungi Kami' }], bentoCategories: ['Kebaya', 'Gaun', 'Jas'] 
    }
  };
};

// Komponen Notifikasi Cantik (Toast)
export const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(() => onClose(), type === 'error' ? 5000 : 3000); return () => clearTimeout(timer); }, [onClose, type]);
  return (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in-down w-[90%] md:w-max max-w-lg">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-2 ${type === 'success' ? 'bg-green-50 border-green-400 text-green-800' : type === 'error' ? 'bg-red-50 border-red-500 text-red-900' : 'bg-blue-50 border-blue-400 text-blue-800'}`}>
        {type === 'success' ? <CheckCircle className="w-6 h-6 flex-shrink-0 text-green-500" /> : type === 'error' ? <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-600" /> : <Shield className="w-6 h-6 flex-shrink-0 text-blue-500" />}
        <span className="font-medium text-sm leading-relaxed">{String(message)}</span>
      </div>
    </div>
  );
};

export const FloatingWA = () => {
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
// PROVIDER UTAMA (OTAK APLIKASI)
// ============================================================================
export const AppStateProvider = ({ children }) => {
  const [fbUser, setFbUser] = useState(null);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [toast, setToast] = useState(null);
  
  const [db, setDb] = useState(getInitialData());
  const [view, setView] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loggedInMember, setLoggedInMember] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message: String(message), type });

  const themeColors = {
    rose: { bg: 'bg-rose-500', hover: 'hover:bg-rose-600', text: 'text-rose-500', border: 'border-rose-500', light: 'bg-rose-50 text-rose-600', shadow: 'shadow-rose-200' },
    blue: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-500', border: 'border-blue-500', light: 'bg-blue-50 text-blue-600', shadow: 'shadow-blue-200' },
    emerald: { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-emerald-500', border: 'border-emerald-500', light: 'bg-emerald-50 text-emerald-600', shadow: 'shadow-emerald-200' },
    purple: { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', text: 'text-purple-500', border: 'border-purple-500', light: 'bg-purple-50 text-purple-600', shadow: 'shadow-purple-200' },
    slate: { bg: 'bg-slate-800', hover: 'hover:bg-slate-900', text: 'text-slate-800', border: 'border-slate-800', light: 'bg-slate-100 text-slate-800', shadow: 'shadow-slate-200' },
  };
  const cTheme = themeColors[db.brandConfig?.themeColor] || themeColors.rose;

  // 1. Inisialisasi Kemanan Firebase
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) { 
            await signInWithCustomToken(auth, window.__initial_auth_token); 
        } else { 
            await signInAnonymously(auth); 
        }
      } catch (err) { console.error("Firebase Auth Error:", err); }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, user => setFbUser(user));
    return () => unsubscribeAuth();
  }, []);

  // 2. Sinkronisasi Data Firestore (Real-time)
  useEffect(() => {
    if (!fbUser) return;
    const docRef = getDocRef();
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
         const serverData = docSnap.data();
         // Memastikan struktur data selalu lengkap meskipun dari database kosong
         if(!serverData.users) serverData.users = getInitialData().users;
         if(!serverData.categories) serverData.categories = getInitialData().categories;
         if(!serverData.orders) serverData.orders = [];
         if(!serverData.products) serverData.products = [];
         if(!serverData.members) serverData.members = [];
         if(!serverData.approvals) serverData.approvals = [];
         if(!serverData.logs) serverData.logs = [];
         if(!serverData.prizes) serverData.prizes = [];
         if(!serverData.promos) serverData.promos = [];
         if(!serverData.stats) serverData.stats = getInitialData().stats;
         if(!serverData.brandConfig.logoFont) serverData.brandConfig.logoFont = 'Playfair Display';
         if(!serverData.brandConfig.bentoCategories) serverData.brandConfig.bentoCategories = ['Kebaya', 'Gaun', 'Jas'];

         setDb(serverData);
         try { localStorage.setItem('aisya_brand_config', JSON.stringify(serverData.brandConfig)); } catch(e) {}
         
         setLoggedInUser(prev => { if (!prev) return null; return serverData.users.find(u => u.id === prev.id) || null; });
         setLoggedInMember(prev => { if (!prev) return null; return serverData.members.find(m => m.id === prev.id) || null; });
      } else { 
         setDoc(docRef, getInitialData()); 
      }
      setIsDbLoading(false);
    }, (error) => { 
        console.error("Sinkronisasi gagal:", error); 
        showToast(`Koneksi Terputus. Memuat cache lokal...`, "info"); 
        setIsDbLoading(false); 
    });
    return () => unsubscribe();
  }, [fbUser]);

  // Injector Font & Meta Theme
  useEffect(() => {
    const font = db.brandConfig?.logoFont || 'Playfair Display';
    let link = document.getElementById('custom-logo-font');
    if (!link) { link = document.createElement('link'); link.id = 'custom-logo-font'; link.rel = 'stylesheet'; document.head.appendChild(link); }
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;700&display=swap`;
  }, [db.brandConfig?.logoFont]);

  useEffect(() => {
    if (!db.brandConfig) return;
    const { appName, themeColor, logoUrl } = db.brandConfig;
    const setMeta = (name, content) => { let meta = document.querySelector(`meta[name="${name}"]`); if (!meta) { meta = document.createElement('meta'); meta.name = name; document.head.appendChild(meta); } meta.content = content; };
    setMeta('apple-mobile-web-app-capable', 'yes'); setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent'); setMeta('apple-mobile-web-app-title', String(appName || 'Aisya Wardrobe')); setMeta('theme-color', themeColor === 'slate' ? '#1e293b' : '#fafaf9');
    if (logoUrl) { let linkIcon = document.querySelector('link[rel="apple-touch-icon"]'); if (!linkIcon) { linkIcon = document.createElement('link'); linkIcon.rel = 'apple-touch-icon'; document.head.appendChild(linkIcon); } linkIcon.href = logoUrl; }
  }, [db.brandConfig?.appName, db.brandConfig?.logoUrl, db.brandConfig?.themeColor]);

  // ============================================================================
  // LOGIKA PENYIMPANAN DATABASE (SAVE & UPDATE)
  // ============================================================================
  const computeDenormalizedStats = (currentDb) => {
    const orders = currentDb.orders || []; 
    const members = currentDb.members || [];
    const completed = orders.filter(o => o.status === 'Selesai');
    const active = orders.filter(o => ['Menunggu Konfirmasi', 'Siap Diambil', 'Sedang Disewa'].includes(o.status));
    const revenue = completed.reduce((s, o) => s + (o.total - (o.totalDeposit||0) + (o.denda||0)), 0);
    return { allTimeRevenue: revenue, activeOrdersCount: active.length, membersCount: members.filter(m => m.status === 'approved').length };
  };

  const saveToDatabase = async (newDbState) => {
    if (!fbUser) return;
    if (db.products && db.products.length > 0 && (!newDbState.products || newDbState.products.length === 0)) { 
        showToast("Gagal: Mencegah penghapusan massal data secara paksa.", "error"); return; 
    }
    
    newDbState.stats = computeDenormalizedStats(newDbState);
    setDb(newDbState); 
    setSaveStatus('Menyimpan...');
    
    try { 
        await setDoc(getDocRef(), newDbState); 
        setSaveStatus('Tersimpan ✓'); 
        setTimeout(() => setSaveStatus(''), 2000); 
    } catch (error) { 
        setSaveStatus('Gagal ✗'); 
        showToast(`Data gagal disimpan ke Cloud.`, "error"); 
    }
  };

  const updateDb = (key, value) => { saveToDatabase({ ...db, [key]: value }); };
  
  const createLog = (dbState, action, detail, user = loggedInUser?.name || 'Sistem') => { 
      return [{ id: `LOG-${Date.now()}-${Math.floor(Math.random()*1000)}`, timestamp: new Date().toLocaleString(), user: String(user), action: String(action), detail: String(detail) }, ...(dbState.logs || [])]; 
  };

  // ============================================================================
  // AUTENTIKASI SISTEM (ADMIN & PELANGGAN)
  // ============================================================================
  const login = (username, password) => {
    if (isDbLoading) return false;
    const currentUsers = (db.users && db.users.length > 0) ? db.users : getInitialData().users;
    const user = currentUsers.find(u => u.username === username && u.password === password);
    
    if (user) { 
        setLoggedInUser(user); 
        setView('admin'); 
        saveToDatabase({ ...db, logs: createLog(db, 'Otorisasi', 'Login Admin', user.name) }); 
        return true; 
    }
    if (username === 'dev' && password === 'dev') { 
        setLoggedInUser({ id: 'U0', username: 'dev', password: 'dev', name: 'Developer System', role: 'developer' }); 
        setView('admin'); 
        saveToDatabase({ ...db, logs: createLog(db, 'Otorisasi', 'Bypass Login Developer', 'Developer') }); 
        return true; 
    }
    return false;
  };
  
  const logout = () => { 
    saveToDatabase({ ...db, logs: createLog(db, 'Otorisasi', 'Logout Admin', loggedInUser?.name) }); 
    setLoggedInUser(null); 
    setView('dashboard'); 
  };
  
  const memberLogin = (username, password) => {
    const member = (db.members || []).find(m => m.username === username && m.password === password && m.status === 'approved');
    if (member) { 
        setLoggedInMember(member); 
        setView('member_profile'); 
        showToast(`Selamat datang, ${member.name}!`); 
        return true; 
    } 
    return false;
  };
  
  const memberLogout = () => { 
      setLoggedInMember(null); 
      setView('dashboard'); 
      showToast('Berhasil keluar akun.'); 
  };

  const submitMemberRegistration = (formData) => { 
      const newApp = { id: `APP-${Date.now()}`, actionType: 'REGISTER_MEMBER', payload: formData, requestedBy: formData.name, requesterRole: 'Calon Member', date: new Date().toLocaleString() }; 
      saveToDatabase({ ...db, approvals: [newApp, ...(db.approvals || [])], logs: createLog(db, 'Persetujuan', `Daftar Member: ${formData.name}`, 'Calon Member') }); 
      showToast('Pendaftaran diajukan. Menunggu persetujuan Admin.', 'info'); 
  };

  // ============================================================================
  // LOGIKA AKSI & PERSETUJUAN (APPROVAL)
  // ============================================================================
  const applyActionToDb = (currentDb, actionType, payload) => {
    let newDb = { ...currentDb }; let actStr = ''; let detStr = '';
    switch (actionType) {
      case 'ADD_PRODUCT': newDb.products = [payload, ...(newDb.products||[])]; actStr='Inventaris'; detStr=`Tambah: ${payload.name}`; break;
      case 'EDIT_PRODUCT': newDb.products = (newDb.products||[]).map(p => p.id === payload.id ? payload : p); actStr='Inventaris'; detStr=`Edit: ${payload.id}`; break;
      case 'DELETE_PRODUCT': newDb.products = (newDb.products||[]).filter(p => p.id !== payload.id); actStr='Inventaris'; detStr=`Hapus: ${payload.id}`; break;
      case 'UPDATE_PRODUCT_STATUS': newDb.products = (newDb.products||[]).map(p => p.id === payload.id ? { ...p, status: payload.status } : p); actStr='Inventaris'; detStr=`Status ${payload.id} -> ${payload.status}`; break;
      case 'ADD_CATEGORY': newDb.categories = [...(newDb.categories||[]), payload]; actStr='Kategori'; detStr=`Tambah: ${payload}`; break;
      case 'DELETE_CATEGORY': newDb.categories = (newDb.categories||[]).filter(c => c !== payload); actStr='Kategori'; detStr=`Hapus: ${payload}`; break;
      case 'UPDATE_ORDER': newDb.orders = (newDb.orders||[]).map(o => o.id === payload.id ? { ...o, status: payload.status, denda: payload.denda||0, totalRefundDeposit: payload.refund||0 } : o); actStr='Pesanan'; detStr=`Status ${payload.id} -> ${payload.status}`; break;
      case 'COMPLETE_ORDER': newDb.orders = (newDb.orders||[]).map(o => o.id === payload.orderId ? { ...o, status: payload.newStatus, denda: payload.denda||0, totalRefundDeposit: payload.refund||0 } : o); newDb.products = (newDb.products||[]).map(p => payload.itemIds.includes(p.id) ? { ...p, status: 'Maintenance' } : p); actStr='Pesanan'; detStr=`Selesai & Baju ke Maintenance: ${payload.orderId}`; break;
      case 'CANCEL_ORDER': newDb.orders = (newDb.orders||[]).map(o => o.id === payload.orderId ? { ...o, status: payload.newStatus } : o); newDb.products = (newDb.products||[]).map(p => payload.itemIds.includes(p.id) ? { ...p, status: 'Maintenance' } : p); actStr='Pesanan'; detStr=`Batal & Baju ke Maintenance: ${payload.orderId}`; break;
      case 'REGISTER_MEMBER': const newId = `MEM-${new Date().getFullYear().toString().slice(-2)}${String((newDb.members||[]).length + 1).padStart(3, '0')}`; newDb.members = [{ ...payload, id: newId, points: 0, status: 'approved', wishlist: [] }, ...(newDb.members||[])]; actStr='Member'; detStr=`Setuju member: ${newId}`; break;
      case 'UPDATE_MEMBER': newDb.members = (newDb.members||[]).map(m => m.id === payload.id ? { ...m, ...payload } : m); if(loggedInMember?.id === payload.id) setLoggedInMember(prev => ({...prev, ...payload})); actStr='Member'; detStr=`Update Profil Member: ${payload.name}`; break;
      case 'UPDATE_USER': newDb.users = (newDb.users||[]).map(u => u.id === payload.userId ? { ...u, ...payload } : u); if(loggedInUser?.id === payload.userId) setLoggedInUser(prev => ({...prev, ...payload})); actStr='Pengguna'; detStr=`Update Profil/Pass: ${payload.username}`; break;
      case 'ADD_PRIZE': newDb.prizes = [payload, ...(newDb.prizes||[])]; actStr='Hadiah'; detStr=`Tambah: ${payload.name}`; break;
      case 'DELETE_PRIZE': newDb.prizes = (newDb.prizes||[]).filter(p => p.id !== payload.id); actStr='Hadiah'; detStr=`Hapus: ${payload.id}`; break;
      case 'ADD_PROMO': newDb.promos = [payload, ...(newDb.promos||[])]; actStr='Promo'; detStr=`Tambah: ${payload.code}`; break;
      case 'UPDATE_PROMO_STATUS': newDb.promos = (newDb.promos||[]).map(p => p.id === payload.id ? { ...p, status: payload.status } : p); actStr='Promo'; detStr=`Status ${payload.code} -> ${payload.status}`; break;
      case 'DELETE_PROMO': newDb.promos = (newDb.promos||[]).filter(p => p.id !== payload.id); actStr='Promo'; detStr=`Hapus: ${payload.id}`; break;
      default: break;
    }
    if(actStr) { newDb.logs = createLog(newDb, actStr, detStr); } 
    return newDb;
  };

  const requireApproval = (actionType, payload, successMsg) => {
    if (!loggedInUser) return false;
    
    // Developer & Owner bebas melakukan segalanya tanpa Approval. 
    // Manager bisa melakukan apapun KECUALI memodifikasi user lain.
    if (['developer', 'owner'].includes(loggedInUser.role) || (loggedInUser.role === 'manager' && actionType !== 'UPDATE_USER')) { 
        saveToDatabase(applyActionToDb(db, actionType, payload)); 
        showToast(successMsg); 
        return true; 
    }
    
    // Jika tidak punya akses, lempar ke antrean persetujuan (Approvals)
    const newApp = { id: `APP-${Date.now()}`, actionType, payload, requestedBy: loggedInUser.name, requesterRole: loggedInUser.role, date: new Date().toLocaleString() };
    saveToDatabase({ ...db, approvals: [newApp, ...(db.approvals || [])], logs: createLog(db, 'Persetujuan', `Mengajukan: ${actionType}`) }); 
    showToast('Tindakan butuh persetujuan Manager/Owner', 'info'); 
    return false;
  };

  const handleApproval = (id, action) => {
    const req = (db.approvals||[]).find(a => a.id === id); 
    if (!req) return;
    
    let newDb = { ...db, approvals: db.approvals.filter(a => a.id !== id) };
    if (action === 'approve') { 
        newDb = applyActionToDb(newDb, req.actionType, req.payload); 
        newDb.logs = createLog(newDb, 'Persetujuan', `Setuju: ${req.actionType}`); 
        showToast('Tindakan Disetujui'); 
    } else { 
        newDb.logs = createLog(newDb, 'Persetujuan', `Tolak: ${req.actionType}`); 
        showToast('Tindakan Ditolak', 'info'); 
    }
    saveToDatabase(newDb);
  };

  // ============================================================================
  // LOGIKA TRANSAKSI KERANJANG & STOK
  // ============================================================================
  const getAvailableStock = (productId, sizeName = null) => {
    const product = (db.products||[]).find(p => p.id === productId); 
    if (!product || product.status === 'Maintenance') return 0;
    
    let baseStock = 0;
    if (sizeName && product.sizes) { 
        baseStock = parseInt(product.sizes[sizeName]) || 0; 
    } else { 
        baseStock = product.totalStock || 0; 
    }
    
    const rented = (db.orders||[]).filter(o => ['Menunggu Konfirmasi', 'Siap Diambil', 'Sedang Disewa'].includes(o.status)).reduce((total, order) => { 
       const item = order.items.find(i => i.id === productId && (!sizeName || i.size === sizeName)); 
       return total + (item ? item.quantity : 0); 
    }, 0);
    
    return Math.max(0, baseStock - rented);
  };

  const toggleWishlist = (productId) => {
    if (!loggedInMember) return showToast('Harap login member untuk menyimpan wishlist.', 'info');
    
    const wishlist = loggedInMember.wishlist || []; 
    const isWished = wishlist.includes(productId); 
    const newWishlist = isWished ? wishlist.filter(id => id !== productId) : [...wishlist, productId];
    
    const updatedMember = { ...loggedInMember, wishlist: newWishlist }; 
    setLoggedInMember(updatedMember);
    
    saveToDatabase({ ...db, members: (db.members||[]).map(m => m.id === updatedMember.id ? updatedMember : m) }); 
    showToast(isWished ? 'Dihapus dari wishlist' : 'Tersimpan di wishlist!');
  };

  const addToCart = (product, sizeName) => {
    if (product.status === 'Maintenance') return showToast('Barang sedang dalam masa perawatan (Tidak dapat disewa).', 'error');
    if (!sizeName && product.sizes) return showToast('Silakan pilih ukuran pakaian terlebih dahulu!', 'error');
    
    const cartId = sizeName ? `${product.id}-${sizeName}` : product.id;
    
    setCart(prev => { 
        const exist = prev.find(item => item.cartId === cartId); 
        if (exist) return prev.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item); 
        return [...prev, { ...product, cartId, size: sizeName, quantity: 1 }]; 
    });
    
    showToast(`${product.name} ditambahkan ke keranjang.`, 'success');
  };

  const removeFromCart = (cartId) => {
      setCart(cart.filter(i => i.cartId !== cartId));
  };

  const updateCartQuantity = (cartId, delta) => {
      setCart(cart.map(i => i.cartId === cartId && i.quantity + delta > 0 ? { ...i, quantity: i.quantity + delta } : i));
  };

  const processOrder = (formData, promoData, isWA = false) => {
    const subtotal = cart.reduce((sum, item) => sum + ((item.discountPrice > 0 ? item.discountPrice : item.price) * item.quantity), 0);
    const totalDeposit = cart.reduce((sum, item) => sum + ((item.deposit || 0) * item.quantity), 0);
    
    const duration = formData.duration || 1; 
    const totalBase = subtotal * duration; 
    
    // Logic Diskon Durasi
    const isDiscount = duration > 7; 
    const durationDiscount = isDiscount ? (totalBase * 0.1) : 0;
    
    // Logic Diskon Promo
    let promoDiscountAmount = 0;
    if(promoData) { 
        promoDiscountAmount = promoData.discountType === 'percentage' ? (totalBase * (promoData.discountValue / 100)) : promoData.discountValue; 
    }
    
    const totalBiaya = totalBase - durationDiscount - promoDiscountAmount + totalDeposit;
    const earnedPoints = loggedInMember ? Math.floor((totalBase - durationDiscount - promoDiscountAmount) / 10000) : 0;
    const newOrderId = `ORD-${2000 + (db.orders ? db.orders.length : 0) + 1}`;

    const newOrder = {
      id: newOrderId, date: new Date().toISOString().split('T')[0],
      customer: { name: formData.name, phone: formData.phone, identity: formData.identity, address: formData.address, ktpUrl: formData.ktpUrl },
      items: cart.map(c => ({ id: c.id, cartId: c.cartId, name: c.name, size: c.size, price: c.price, discountPrice: c.discountPrice || 0, deposit: c.deposit||0, quantity: c.quantity, images: c.images||[] })),
      duration, startDate: formData.startDate, endDate: formData.endDate, 
      totalSewa: (totalBase - durationDiscount - promoDiscountAmount), totalDeposit, total: totalBiaya, 
      subtotalBase: totalBase, durationDiscount, promoDiscount: promoDiscountAmount, appliedPromoCode: promoData?.code || null,
      status: 'Menunggu Konfirmasi', memberId: loggedInMember?.id || null, earnedPoints, denda: 0
    };
    
    let newDb = { ...db, orders: [newOrder, ...(db.orders || [])], logs: createLog(db, 'Pelanggan', `Pesanan masuk: ${newOrder.id}`, 'Sistem Checkout') };
    
    if (loggedInMember) { 
        const um = { ...loggedInMember, points: loggedInMember.points + earnedPoints }; 
        setLoggedInMember(um); 
        newDb.members = (newDb.members || []).map(m => m.id === um.id ? um : m); 
    }
    
    saveToDatabase(newDb); 
    setCart([]); 
    setView('success'); 

    if (isWA) {
      const waNumber = db.brandConfig?.socialMedia?.find(s => s.type === 'WhatsApp' || s.type === 'WA')?.value || '';
      const itemsListText = cart.map(c => `- ${c.quantity}x ${c.name} (Ukuran: ${c.size || 'All Size'})`).join('\n');
      const text = `Halo Admin ${db.brandConfig.appName}, saya ingin menyewa pakaian.\n\n*ID Pesanan:* ${newOrderId}\n*Nama:* ${formData.name}\n*Tgl Sewa:* ${formData.startDate} (${duration} Hari)\n\n*Daftar Pakaian:*\n${itemsListText}\n\n*Total Biaya (Inc. Deposit):* ${formatRupiah(totalBiaya)}\n\nMohon konfirmasinya. Terima kasih!`;
      window.open(`https://wa.me/${waNumber.replace(/\D/g,'')}?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    requireApproval('UPDATE_ORDER', { id: orderId, status: newStatus }, `Status diubah menjadi ${newStatus}.`);
    if (newStatus === 'Selesai' || newStatus === 'Dibatalkan') {
      const order = db.orders.find(o => o.id === orderId);
      if(order) { 
          order.items.forEach(item => requireApproval('UPDATE_PRODUCT_STATUS', { id: item.id, status: 'Maintenance' }, 'Pakaian dipindah ke perawatan (Maintenance).')); 
      }
    }
  };

  const setBentoCategory = (index, category) => { 
      const newBento = [...(db.brandConfig.bentoCategories || ['','',''])]; 
      newBento[index] = category; 
      updateDb('brandConfig', { ...db.brandConfig, bentoCategories: newBento }); 
  };

  const redeemPrize = (prize) => { 
      if (!loggedInMember) return; 
      if (loggedInMember.points >= prize.points) { 
          const updatedMember = { ...loggedInMember, points: loggedInMember.points - prize.points }; 
          setLoggedInMember(updatedMember); 
          const newMembers = (db.members||[]).map(m => m.id === updatedMember.id ? updatedMember : m); 
          saveToDatabase({ ...db, members: newMembers, logs: createLog(db, 'Hadiah', `Tukar poin dengan hadiah: ${prize.name}`, updatedMember.name) }); 
          showToast(`Berhasil menukar poin dengan ${prize.name}!`, 'success'); 
      } else { 
          showToast('Poin Anda tidak mencukupi untuk hadiah ini.', 'error'); 
      } 
  };

  // ============================================================================
  // PENGGABUNGAN DATA & FUNGSI (VALUE CONTEXT)
  // ============================================================================
  const contextValue = {
    db, setDb, fbUser, isDbLoading, saveStatus, updateDb, saveToDatabase, showToast, 
    view, setView, cart, setCart, loggedInUser, loggedInMember, cTheme,
    login, logout, memberLogin, memberLogout, submitMemberRegistration, redeemPrize,
    getAvailableStock, toggleWishlist, setBentoCategory,
    addToCart, removeFromCart, updateCartQuantity,
    processOrder, requireApproval, handleApproval, updateOrderStatus,
    
    exportData: () => { 
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db)); 
        const dl = document.createElement('a'); dl.href = dataStr; dl.download = `aisya_backup_${Date.now()}.json`; dl.click(); 
    },
    importData: (json) => { 
        try { setDb(JSON.parse(json)); showToast('Restore Data Sukses!', 'success'); } 
        catch(e) { showToast('Gagal memulihkan data: Format JSON tidak valid!', 'error'); } 
    }
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {children}
    </AppStateContext.Provider>
  );
};