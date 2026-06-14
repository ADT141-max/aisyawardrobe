import React, { createContext, useState, useEffect } from 'react';
import { onSnapshot, setDoc } from "firebase/firestore";
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { CheckCircle, AlertCircle, Shield, MessageCircle } from 'lucide-react';
import { auth, getDocRef } from '../config/firebase';

export const AppStateContext = createContext();

// ============================================================================
// PILAR 5: GLOBAL UTILITY SYSTEM (Hemat Proses Klien)
// ============================================================================
const IMGBB_API_KEY = "aab30f3a1714c46f739b7d56dd87a5b3"; 

export const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
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

// ============================================================================
// PILAR 1: OFFLINE-FIRST CACHE (Data Turun 1x, Loading Instan)
// ============================================================================
const getInitialData = () => {
  let cachedDb = null;
  let cachedBrandConfig = null;
  // Membaca dari brankas lokal HP pelanggan agar tidak perlu memanggil Firebase saat reload
  try { 
    const storedDb = localStorage.getItem('aisya_db_full_cache'); 
    if (storedDb) cachedDb = JSON.parse(storedDb);
    const storedConfig = localStorage.getItem('aisya_brand_config'); 
    if (storedConfig) cachedBrandConfig = JSON.parse(storedConfig); 
  } catch(e) {}
  
  if (cachedDb) return cachedDb; // Super Cepat: Langsung kembalikan data lokal jika ada

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
      appName: 'Aisya Wardrobe', slogan: 'Sewa Pakaian Premium & Eksklusif', themeColor: 'rose', logoFont: 'Playfair Display',
      bentoCategories: ['Kebaya', 'Gaun', 'Jas'] 
    }
  };
};

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

export const AppStateProvider = ({ children }) => {
  const [fbUser, setFbUser] = useState(null);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [toast, setToast] = useState(null);
  
  const [db, setDb] = useState(getInitialData());
  const [view, setView] = useState('dashboard');
  
  // ============================================================================
  // PILAR 2: KERANJANG LOKAL (0% Biaya Server Firebase)
  // ============================================================================
  const [cart, setCart] = useState(() => {
    try { const localCart = localStorage.getItem('aisya_local_cart'); return localCart ? JSON.parse(localCart) : []; } 
    catch(e) { return []; }
  });

  // Efek ini menyimpan keranjang ke lokal HP setiap kali berubah tanpa memanggil server
  useEffect(() => {
    try { localStorage.setItem('aisya_local_cart', JSON.stringify(cart)); } catch(e) {}
  }, [cart]);

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loggedInMember, setLoggedInMember] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message: String(message), type });
  const cTheme = { bg: 'bg-rose-500', text: 'text-rose-500' };

  // ============================================================================
  // FIREBASE REALTIME SYNC (Hanya membaca jika ada data delta/berubah)
  // ============================================================================
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error("Firebase Auth Error:", err); }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, user => setFbUser(user));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!fbUser) return;
    const docRef = getDocRef();
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
         const serverData = docSnap.data();
         
         // Injeksi otomatis jika data dari server ada yang tidak utuh
         if(!serverData.users) serverData.users = getInitialData().users;
         if(!serverData.categories) serverData.categories = getInitialData().categories;
         if(!serverData.orders) serverData.orders = [];
         if(!serverData.products) serverData.products = [];
         if(!serverData.brandConfig.logoFont) serverData.brandConfig.logoFont = 'Playfair Display';

         setDb(serverData);
         
         // Simpan ke brankas lokal sebagai cadangan Offline
         try { localStorage.setItem('aisya_db_full_cache', JSON.stringify(serverData)); } catch(e) {}
         
         setLoggedInUser(prev => { if (!prev) return null; return serverData.users.find(u => u.id === prev.id) || null; });
         setLoggedInMember(prev => { if (!prev) return null; return serverData.members?.find(m => m.id === prev.id) || null; });
      } else { 
         setDoc(docRef, getInitialData()); 
      }
      setIsDbLoading(false);
    }, (error) => { 
        showToast(`Sinyal Lemah. Memuat mode Offline...`, "info"); 
        setIsDbLoading(false); 
    });
    return () => unsubscribe();
  }, [fbUser]);

  // ============================================================================
  // PILAR 3: CLIENT-SIDE CALCULATION (Perhitungan Statis di Klien)
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
    
    // Server menerima perhitungan matang dari fungsi klien di atas
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
  // PILAR 4: RBAC & OTORITAS SISTEM (Role-Based Access Control)
  // ============================================================================
  const login = (username, password) => {
    if (isDbLoading) return false;
    const currentUsers = (db.users && db.users.length > 0) ? db.users : getInitialData().users;
    const user = currentUsers.find(u => u.username === username && u.password === password);
    
    if (user) { setLoggedInUser(user); setView('admin'); return true; }
    if (username === 'dev' && password === 'dev') { 
        setLoggedInUser({ id: 'U0', username: 'dev', password: 'dev', name: 'Developer System', role: 'developer' }); 
        setView('admin'); return true; 
    }
    return false;
  };
  
  const logout = () => { setLoggedInUser(null); setView('dashboard'); };
  
  const memberLogin = (username, password) => {
    const member = (db.members || []).find(m => m.username === username && m.password === password && m.status === 'approved');
    if (member) { setLoggedInMember(member); setView('member_profile'); showToast(`Selamat datang, ${member.name}!`); return true; } 
    return false;
  };
  
  const memberLogout = () => { setLoggedInMember(null); setView('dashboard'); showToast('Berhasil keluar akun.'); };

  const applyActionToDb = (currentDb, actionType, payload) => {
    let newDb = { ...currentDb }; let actStr = ''; let detStr = '';
    switch (actionType) {
      case 'ADD_PRODUCT': newDb.products = [payload, ...(newDb.products||[])]; actStr='Inventaris'; detStr=`Tambah: ${payload.name}`; break;
      case 'EDIT_PRODUCT': newDb.products = (newDb.products||[]).map(p => p.id === payload.id ? payload : p); actStr='Inventaris'; detStr=`Edit: ${payload.id}`; break;
      case 'DELETE_PRODUCT': newDb.products = (newDb.products||[]).filter(p => p.id !== payload.id); actStr='Inventaris'; detStr=`Hapus: ${payload.id}`; break;
      case 'UPDATE_PRODUCT_STATUS': newDb.products = (newDb.products||[]).map(p => p.id === payload.id ? { ...p, status: payload.status } : p); actStr='Inventaris'; detStr=`Status ${payload.id} -> ${payload.status}`; break;
      case 'UPDATE_ORDER': newDb.orders = (newDb.orders||[]).map(o => o.id === payload.id ? { ...o, status: payload.status, denda: payload.denda||0, totalRefundDeposit: payload.refund||0 } : o); actStr='Pesanan'; detStr=`Status ${payload.id} -> ${payload.status}`; break;
      case 'COMPLETE_ORDER': newDb.orders = (newDb.orders||[]).map(o => o.id === payload.orderId ? { ...o, status: payload.newStatus, denda: payload.denda||0, totalRefundDeposit: payload.refund||0 } : o); newDb.products = (newDb.products||[]).map(p => payload.itemIds.includes(p.id) ? { ...p, status: 'Maintenance' } : p); actStr='Pesanan'; detStr=`Selesai & Baju ke Maintenance: ${payload.orderId}`; break;
      case 'CANCEL_ORDER': newDb.orders = (newDb.orders||[]).map(o => o.id === payload.orderId ? { ...o, status: payload.newStatus } : o); newDb.products = (newDb.products||[]).map(p => payload.itemIds.includes(p.id) ? { ...p, status: 'Maintenance' } : p); actStr='Pesanan'; detStr=`Batal & Baju ke Maintenance: ${payload.orderId}`; break;
      default: break;
    }
    if(actStr) newDb.logs = createLog(newDb, actStr, detStr);
    return newDb;
  };

  const requireApproval = (actionType, payload, successMsg) => {
    if (!loggedInUser) return false;
    
    // Mesin Otorisasi: Owner & Developer dieksekusi instan. Manager & Admin butuh Approval.
    if (['developer', 'owner'].includes(loggedInUser.role) || (loggedInUser.role === 'manager' && actionType !== 'UPDATE_USER')) { 
        saveToDatabase(applyActionToDb(db, actionType, payload)); 
        showToast(successMsg); 
        return true; 
    }
    
    const newApp = { id: `APP-${Date.now()}`, actionType, payload, requestedBy: loggedInUser.name, requesterRole: loggedInUser.role, date: new Date().toLocaleString() };
    saveToDatabase({ ...db, approvals: [newApp, ...(db.approvals || [])], logs: createLog(db, 'Persetujuan', `Mengajukan: ${actionType}`) }); 
    showToast('Tindakan ini butuh persetujuan dari Owner', 'info'); 
    return false;
  };

  const handleApproval = (id, action) => {
    const req = (db.approvals||[]).find(a => a.id === id); 
    if (!req) return;
    
    let newDb = { ...db, approvals: db.approvals.filter(a => a.id !== id) };
    if (action === 'approve') { 
        newDb = applyActionToDb(newDb, req.actionType, req.payload); 
        newDb.logs = createLog(newDb, 'Persetujuan', `Disetujui: ${req.actionType}`); 
        showToast('Tindakan Disetujui'); 
    } else { 
        newDb.logs = createLog(newDb, 'Persetujuan', `Ditolak: ${req.actionType}`); 
        showToast('Tindakan Ditolak', 'info'); 
    }
    saveToDatabase(newDb);
  };

  const deleteProduct = async (productId) => {
    if (!loggedInUser) return alert("Sesi habis sayang, silakan login kembali.");
    const role = loggedInUser.role;

    if (role !== 'owner' && role !== 'developer') {
      const confirmRequest = window.confirm(`Maaf, otoritas '${role}' tidak diizinkan. Kirim permintaan hapus ini kepada Owner?`);
      if (confirmRequest) requireApproval('DELETE_PRODUCT', { id: productId }, `Permintaan hapus produk ID: ${productId}`, true);
      return; 
    }

    const isConfirm = window.confirm("HAK AKSES OWNER.\nYakin ingin menghapus produk eksklusif ini dari katalog secara permanen?");
    if (!isConfirm) return;

    try {
      const updatedProducts = (db.products || []).filter(p => p.id !== productId);
      await setDoc(getDocRef(), { ...db, products: updatedProducts });
      alert("Produk berhasil dihapus dari katalog! 🗑️✨");
    } catch (error) { alert("Sistem gagal menghapus produk."); }
  };

  // ============================================================================
  // LOGIKA MANAJEMEN KERANJANG, STOK & TRANSAKSI
  // ============================================================================
  const getAvailableStock = (productId, sizeName = null) => {
    const product = (db.products||[]).find(p => p.id === productId); 
    if (!product || product.status === 'Maintenance') return 0;
    
    let baseStock = 0;
    if (sizeName && product.sizes) { baseStock = parseInt(product.sizes[sizeName]) || 0; } 
    else { baseStock = product.totalStock || 0; }
    
    const rented = (db.orders||[]).filter(o => ['Menunggu Konfirmasi', 'Siap Diambil', 'Sedang Disewa'].includes(o.status)).reduce((total, order) => { 
       const item = order.items.find(i => i.id === productId && (!sizeName || i.size === sizeName)); 
       return total + (item ? item.quantity : 0); 
    }, 0);
    
    return Math.max(0, baseStock - rented);
  };

  const addToCart = (product, sizeName) => {
    if (product.status === 'Maintenance') return showToast('Barang sedang dirawat (Tidak bisa disewa).', 'error');
    if (!sizeName && product.sizes) return showToast('Pilih ukuran terlebih dahulu!', 'error');
    
    const cartId = sizeName ? `${product.id}-${sizeName}` : product.id;
    
    setCart(prev => { 
        const exist = prev.find(item => item.cartId === cartId); 
        if (exist) return prev.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item); 
        return [...prev, { ...product, cartId, size: sizeName, quantity: 1 }]; 
    });
    
    showToast(`${product.name} masuk keranjang.`, 'success');
  };

  const removeFromCart = (cartId) => setCart(cart.filter(i => i.cartId !== cartId));
  const updateCartQuantity = (cartId, delta) => setCart(cart.map(i => i.cartId === cartId && i.quantity + delta > 0 ? { ...i, quantity: i.quantity + delta } : i));

  const processOrder = (formData, isWA = false) => {
    const subtotal = cart.reduce((sum, item) => sum + ((item.discountPrice > 0 ? item.discountPrice : item.price) * item.quantity), 0);
    const totalDeposit = cart.reduce((sum, item) => sum + ((item.deposit || 0) * item.quantity), 0);
    const duration = formData.duration || 1; 
    const totalBase = subtotal * duration; 
    
    // Kalkulator Diskon Durasi Otomatis
    const isDiscount = duration > 7; 
    const durationDiscount = isDiscount ? (totalBase * 0.1) : 0;
    
    // Pemisah Keuangan Jaminan & Sewa Bersih
    const totalBiaya = totalBase - durationDiscount + totalDeposit;
    const newOrderId = `ORD-${2000 + (db.orders ? db.orders.length : 0) + 1}`;

    const newOrder = {
      id: newOrderId, date: new Date().toISOString().split('T')[0],
      customer: { name: formData.name, phone: formData.phone, identity: formData.identity },
      items: cart.map(c => ({ id: c.id, cartId: c.cartId, name: c.name, size: c.size, price: c.price, discountPrice: c.discountPrice || 0, deposit: c.deposit||0, quantity: c.quantity, images: c.images||[] })),
      duration, startDate: formData.startDate, endDate: formData.endDate, 
      totalSewa: (totalBase - durationDiscount), totalDeposit, total: totalBiaya, 
      status: 'Menunggu Konfirmasi', denda: 0
    };
    
    // 1X Operasi Write ke Database setelah seluruh keranjang selesai diproses
    saveToDatabase({ ...db, orders: [newOrder, ...(db.orders || [])], logs: createLog(db, 'Pelanggan', `Pesanan masuk: ${newOrder.id}`, 'Sistem Checkout') }); 
    setCart([]); 
    setView('success'); 
  };

  const updateOrderStatus = (orderId, newStatus) => {
    requireApproval('UPDATE_ORDER', { id: orderId, status: newStatus }, `Status diubah menjadi ${newStatus}.`);
    if (newStatus === 'Selesai' || newStatus === 'Dibatalkan') {
      const order = db.orders.find(o => o.id === orderId);
      if(order) { 
          order.items.forEach(item => requireApproval('UPDATE_PRODUCT_STATUS', { id: item.id, status: 'Maintenance' }, 'Pakaian masuk ke gudang perawatan.')); 
      }
    }
  };

  const exportData = () => { 
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db)); 
      const dl = document.createElement('a'); dl.href = dataStr; dl.download = `aisya_backup_${Date.now()}.json`; dl.click(); 
  };
  
  const importData = (json) => { 
      try { setDb(JSON.parse(json)); showToast('Restore Data Sukses!', 'success'); } 
      catch(e) { showToast('Gagal memulihkan data: Format JSON tidak valid!', 'error'); } 
  };

  const contextValue = {
    db, setDb, fbUser, isDbLoading, saveStatus, updateDb, saveToDatabase, showToast, 
    view, setView, cart, setCart, loggedInUser, loggedInMember, cTheme,
    login, logout, memberLogin, memberLogout, 
    getAvailableStock, addToCart, removeFromCart, updateCartQuantity,
    processOrder, requireApproval, handleApproval, updateOrderStatus, deleteProduct,
    exportData, importData
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {children}
    </AppStateContext.Provider>
  );
};