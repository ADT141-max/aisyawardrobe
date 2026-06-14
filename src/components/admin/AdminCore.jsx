import React, { useState, useEffect, useContext } from 'react';
import { 
  Shield, BarChart3, Package, Briefcase, Calendar as CalendarIcon, 
  Users, Gift, Tag, CheckCircle, User, ClipboardList, Settings as SettingsIcon, 
  Terminal, Home, LogOut, X, Menu, Clock, History, ChevronDown 
} from 'lucide-react';
import { AppStateContext, formatRupiah } from '../../context/AppContext';

// ============================================================================
// 1. KOMPONEN LOGIN ADMIN
// ============================================================================
export const AdminLogin = () => {
  const { login, setView } = useContext(AppStateContext);
  const [uname, setUname] = useState(''); 
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');

  const handleLogin = (e) => { 
    e.preventDefault(); 
    if(!login(uname, pwd)) setErr('Username atau Password salah!'); 
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 animate-fade-in-down w-full">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-amber-500"></div>
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-stone-800" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-center text-stone-900 mb-2">Admin Panel</h2>
        <p className="text-center text-stone-500 mb-8 text-sm">Masuk untuk mengelola sistem Aisya Wardrobe.</p>
        
        {err && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-200 animate-pulse">{err}</div>}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Username</label>
            <input required type="text" value={uname} onChange={e=>setUname(e.target.value)} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px] transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Password</label>
            <input required type="password" value={pwd} onChange={e=>setPwd(e.target.value)} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px] transition-colors" />
          </div>
          <button type="submit" className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors mt-4 text-lg active:scale-95">Masuk Panel</button>
        </form>
        <div className="mt-8 text-center">
          <button onClick={() => setView('dashboard')} className="text-sm text-stone-400 hover:text-stone-800 font-bold transition-colors">&larr; Kembali ke Beranda Pelanggan</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. KERANGKA LAYOUT UTAMA ADMIN
// ============================================================================
export const AdminLayout = ({ children, activeTab, setActiveTab }) => {
  const { loggedInUser, logout, db, setView } = useContext(AppStateContext);
  const [showSidebar, setShowSidebar] = useState(false);

  // Navigasi Dinamis Berdasarkan Role User
  const menuItems = [
    { id: 'dashboard', label: 'Statistik & Laporan', icon: BarChart3 },
    { id: 'orders', label: 'Pesanan Masuk', icon: Package },
    { id: 'inventory', label: 'Katalog Barang', icon: Briefcase },
    { id: 'calendar', label: 'Jadwal Sewa', icon: CalendarIcon },
    { id: 'customers', label: 'Database Pelanggan', icon: Users },
    { id: 'prizes', label: 'Katalog Hadiah', icon: Gift },
    { id: 'promos', label: 'Voucher Promo', icon: Tag },
    { id: 'approvals', label: 'Antrean Persetujuan', icon: CheckCircle },
    { id: 'account', label: 'Setelan Akun Pribadi', icon: User },
    ...(loggedInUser?.role === 'owner' || loggedInUser?.role === 'developer' ? [
      { id: 'logs', label: 'Log Audit Sistem', icon: ClipboardList },
      { id: 'settings', label: 'Pengaturan Merek', icon: SettingsIcon }
    ] : []),
    ...(loggedInUser?.role === 'developer' ? [
      { id: 'developer', label: 'Developer Console', icon: Terminal }
    ] : [])
  ];

  return (
    <div className="flex h-screen bg-stone-50 font-sans w-full">
      {/* Overlay Mobile */}
      {showSidebar && <div className="fixed inset-0 bg-stone-900/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setShowSidebar(false)}></div>}
      
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-[80vw] max-w-sm lg:w-72 bg-stone-900 text-stone-300 flex flex-col shadow-2xl lg:shadow-none transition-transform duration-300 ${showSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-stone-800">
          <div className="overflow-hidden">
            <h2 style={{ fontFamily: db.brandConfig.logoFont || 'Playfair Display' }} className="font-bold text-xl text-white truncate uppercase">{String(db.brandConfig.appName)}</h2>
            <p className="text-[10px] text-rose-400 uppercase tracking-widest mt-2 font-bold">{String(loggedInUser.role)} Panel</p>
          </div>
          <button className="lg:hidden p-2 text-stone-400 hover:bg-stone-800 rounded-lg transition-colors" onClick={() => setShowSidebar(false)}><X className="w-6 h-6"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 no-scrollbar">
          {menuItems.map((item, idx) => (
            <button 
              key={`menu-${item.id}-${idx}`} 
              onClick={() => { setActiveTab(item.id); setShowSidebar(false); }} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-rose-600 text-white shadow-md' : 'hover:bg-stone-800 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" /> 
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
        
        <div className="p-4 bg-stone-950 space-y-3">
          <button onClick={() => setView('dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-stone-800 text-white hover:bg-stone-700 transition-colors">
            <Home className="w-5 h-5 flex-shrink-0"/> Ke Website Pelanggan
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-5 h-5 flex-shrink-0"/> Logout
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-stone-200 px-6 py-5 flex justify-between items-center z-10 shadow-sm supports-[padding-top:env(safe-area-inset-top)]:pt-[calc(16px+env(safe-area-inset-top))]">
           <div className="flex items-center gap-3">
             <button className="lg:hidden p-2 -ml-2 text-stone-600 bg-stone-100 rounded-lg transition-colors hover:bg-stone-200" onClick={() => setShowSidebar(true)}>
               <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-800 capitalize truncate">
               {String(activeTab.replace('-', ' '))}
             </h1>
           </div>
           <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center space-x-2 bg-stone-100 py-1.5 px-4 rounded-full border border-stone-200 shadow-sm">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-xs font-bold text-stone-600 uppercase tracking-widest">Real-time Aktif</span>
             </div>
             <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-stone-800">{String(loggedInUser.name)}</p>
             </div>
             <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200 shadow-sm">
               <User className="w-5 h-5 text-stone-600"/>
             </div>
           </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full overflow-x-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
};

// ============================================================================
// 3. KOMPONEN STATISTIK & LAPORAN (DASHBOARD ADMIN)
// ============================================================================
export const AdminStats = () => {
  const { db } = useContext(AppStateContext);
  const [timeRange, setTimeRange] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [timeRange]);

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

  let completed = []; let revenue = 0; let activeCount = 0; let membersCount = 0;
  
  if (timeRange === 'all' && db.stats) {
    completed = (db.orders||[]).filter(o => o.status === 'Selesai');
    revenue = db.stats.allTimeRevenue || 0;
    activeCount = db.stats.activeOrdersCount || 0;
    membersCount = db.stats.membersCount || 0;
  } else {
    completed = filterByTime((db.orders||[]).filter(o => o.status === 'Selesai'));
    const active = filterByTime((db.orders||[]).filter(o => ['Menunggu Konfirmasi', 'Siap Diambil', 'Sedang Disewa'].includes(o.status)));
    revenue = completed.reduce((s, o) => s + (o.total - (o.totalDeposit||0) + (o.denda||0)), 0);
    activeCount = active.length;
    membersCount = (db.members||[]).filter(m=>m.status === 'approved').length;
  }

  const paginatedCompleted = completed.slice(0, page * 10);

  return (
    <div className="space-y-8 animate-fade-in-down w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Performa Toko</h2>
          <p className="text-sm text-stone-500">Angka akan berubah sesuai filter waktu.</p>
        </div>
        <div className="flex items-center bg-white border border-stone-200 rounded-xl px-4 shadow-sm w-max transition-all hover:border-stone-300">
           <Clock className="w-5 h-5 text-stone-400 mr-2"/>
           <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="py-3 bg-transparent text-sm font-bold text-stone-700 outline-none cursor-pointer">
             <option value="today">Hari Ini</option>
             <option value="7days">7 Hari Terakhir</option>
             <option value="thismonth">Bulan Ini</option>
             <option value="all">Semua Waktu (All Time)</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm transition-transform hover:-translate-y-1">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4"><BarChart3 className="w-6 h-6"/></div>
          <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Pendapatan Selesai</div>
          <div className="text-2xl font-bold text-stone-800 truncate">{formatRupiah(revenue)}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm transition-transform hover:-translate-y-1">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Package className="w-6 h-6"/></div>
          <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Pesanan Aktif</div>
          <div className="text-2xl font-bold text-stone-800">{activeCount}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm transition-transform hover:-translate-y-1">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4"><Users className="w-6 h-6"/></div>
          <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Total Member</div>
          <div className="text-2xl font-bold text-stone-800">{membersCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden mt-8 w-full">
        <div className="p-6 md:p-8 border-b border-stone-100 bg-stone-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner"><History className="w-6 h-6"/></div>
          <div>
            <h3 className="font-bold text-lg text-stone-800">Riwayat Pemasukan</h3>
            <p className="text-sm text-stone-500">Detail pesanan yang telah selesai dan menghasilkan pendapatan.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 space-y-4">
          {paginatedCompleted.length === 0 ? (
            <div className="text-center py-10 bg-stone-50 border border-dashed border-stone-300 rounded-2xl text-stone-500">
               Belum ada data pemasukan pada periode ini.
            </div>
          ) : (
            paginatedCompleted.map((o, oIdx) => {
              const isExpanded = expandedOrderId === o.id;
              const netIncome = o.total - (o.totalDeposit || 0) + (o.denda || 0);

              return (
                <div key={`inc-${o.id}-${oIdx}`} className="border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-all bg-white">
                  <div 
                    onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                    className="flex flex-col sm:flex-row justify-between sm:items-center p-4 cursor-pointer hover:bg-stone-50 gap-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-stone-100 text-stone-500 rounded-full flex items-center justify-center shrink-0 border border-stone-200">
                        <CheckCircle className="w-5 h-5 text-green-500"/>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm md:text-base text-stone-800">{String(o.customer.name)}</h4>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">{String(o.id)} &bull; Selesai Tgl: {String(o.endDate || o.date)}</p>
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
                    <div className="p-5 md:p-6 bg-stone-50 border-t border-stone-200 animate-fade-in-down">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:border-stone-300 transition-colors">
                          <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 border-b border-stone-100 pb-3 flex items-center gap-2"><Package className="w-4 h-4"/> Rincian Sewa Pakaian</h5>
                          <div className="space-y-3">
                            {o.items.map((item, iIdx) => (
                              <div key={`inc-item-${item.id}-${iIdx}`} className="flex items-center gap-3">
                                <img src={item.image || item.images?.[0] || 'https://placehold.co/400'} alt={String(item.name)} className="w-12 h-12 rounded-xl border border-stone-100 object-cover shadow-sm"/>
                                <div>
                                  <p className="font-bold text-sm text-stone-800">{item.quantity}x {String(item.name)}</p>
                                  <p className="text-[10px] text-stone-500 font-mono">{String(item.id)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-center hover:border-stone-300 transition-colors">
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
          {completed.length > page * 10 && (
             <div className="flex justify-center mt-6">
                <button onClick={() => setPage(p => p + 1)} className="px-6 py-2.5 bg-stone-100 text-stone-600 font-bold rounded-full hover:bg-stone-200 transition-colors shadow-sm text-sm active:scale-95">Muat Lebih Banyak Riwayat</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};