import React, { useState, useContext } from 'react';
import { 
  Calendar as CalendarIcon, Search, ChevronLeft, ChevronRight, X, 
  User, FileText, Award, Gift, Tag, Trash2, Percent, Shield, CheckCircle, Edit3 
} from 'lucide-react';
import { AppStateContext, formatRupiah } from '../../context/AppContext';

// ============================================================================
// 1. KOMPONEN KALENDER SEWA (MENCEGAH DOUBLE BOOKING)
// ============================================================================
export const AdminCalendar = () => {
  const { db } = useContext(AppStateContext);
  const [search, setSearch] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const filteredOrders = (db.orders||[]).filter(order => {
    if (!search) return true;
    const s = search.toLowerCase();
    return order.items.some(item => String(item.name).toLowerCase().includes(s) || String(item.id).toLowerCase().includes(s));
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); };
  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); };

  const getOrdersForDate = (day) => {
    const targetDate = new Date(currentYear, currentMonth, day);
    return filteredOrders.filter(o => {
       const start = new Date(o.startDate);
       const end = new Date(o.endDate || o.startDate);
       if(!o.endDate) end.setDate(end.getDate() + ((o.duration||1) - 1));
       return targetDate >= start && targetDate <= end && ['Menunggu Konfirmasi', 'Siap Diambil', 'Sedang Disewa'].includes(o.status);
    });
  };

  return (
    <div className="space-y-8 animate-fade-in-down w-full">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-6">
         <div>
            <h2 className="font-bold font-serif text-2xl text-stone-900 flex items-center gap-3"><CalendarIcon className="w-7 h-7 text-rose-600"/> Kalender Penyewaan</h2>
            <p className="text-stone-500 mt-2 text-sm">Mencegah bentrok penyewaan (Double-Booking) secara visual.</p>
         </div>
         <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input type="text" placeholder="Lacak ID Pakaian..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-600 transition-colors shadow-inner" />
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 md:p-10">
         <div className="flex justify-between items-center mb-8">
            <button onClick={prevMonth} className="p-3 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200 shadow-sm"><ChevronLeft className="w-6 h-6 text-stone-700"/></button>
            <h3 className="font-bold text-xl md:text-2xl font-serif text-stone-900 uppercase tracking-widest">{monthNames[currentMonth]} {currentYear}</h3>
            <button onClick={nextMonth} className="p-3 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200 shadow-sm"><ChevronRight className="w-6 h-6 text-stone-700"/></button>
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
               {selectedDate.orders.map((o, oIdx) => (
                 <div key={`modal-cal-ord-${o.id}-${oIdx}`} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 pb-4 border-b border-stone-100 gap-3">
                       <div><p className="font-bold text-base text-stone-800">{String(o.customer.name)}</p><p className="text-xs text-stone-500 font-mono mt-1">{String(o.id)}</p></div>
                       <span className="text-[10px] font-bold px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-lg text-stone-600 w-max uppercase tracking-wider">{String(o.status)}</span>
                    </div>
                    <ul className="space-y-3">
                       {o.items.map((item, iIdx) => (
                         <li key={`modal-cal-item-${item.cartId || item.id}-${iIdx}`} className="flex items-center gap-4 text-sm">
                            <img src={item.images?.[0] || item.image || 'https://placehold.co/400'} alt={String(item.name)} className="w-12 h-12 rounded-xl border border-stone-100 object-cover shadow-sm"/>
                            <div><p className="font-bold text-stone-800 leading-tight">{item.quantity}x {String(item.name)}</p><p className="text-[10px] text-stone-400 font-mono mt-1">{String(item.id)} (Ukuran: {item.size || '-'})</p></div>
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

// ============================================================================
// 2. KOMPONEN MANAJEMEN PELANGGAN (CUSTOMERS & MEMBERS)
// ============================================================================
export const AdminCustomers = () => {
  const { db, handleApproval, loggedInUser, cTheme, requireApproval } = useContext(AppStateContext);
  const [tab, setTab] = useState('member');
  
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

  const startEdit = (m) => {
    setEditingMemberId(m.id);
    setEditForm({ name: m.name || '', phone: m.phone || '', address: m.address || '' });
  };

  const saveEdit = (originalMember) => {
    if (canEdit) { requireApproval('UPDATE_MEMBER', { id: originalMember.id, ...editForm }, 'Data pelanggan berhasil diperbarui.', true); }
    setEditingMemberId(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden animate-fade-in-down w-full">
      <div className="flex border-b border-stone-200 bg-stone-50 w-full overflow-x-auto no-scrollbar">
         <button onClick={() => setTab('member')} className={`px-6 md:px-8 py-5 font-bold text-sm uppercase tracking-wider transition-colors ${tab === 'member' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white shadow-sm` : 'text-stone-500 hover:text-stone-800'}`}>Member ({approvedMembers.length})</button>
         <button onClick={() => setTab('nonmember')} className={`px-6 md:px-8 py-5 font-bold text-sm uppercase tracking-wider transition-colors ${tab === 'nonmember' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white shadow-sm` : 'text-stone-500 hover:text-stone-800'}`}>Reguler ({nonMembers.length})</button>
         <button onClick={() => setTab('approval')} className={`px-6 md:px-8 py-5 font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-colors ${tab === 'approval' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white shadow-sm` : 'text-stone-500 hover:text-stone-800'}`}>Persetujuan {memberApps.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{memberApps.length}</span>}</button>
      </div>

      <div className="w-full overflow-x-auto">
        {tab === 'member' && (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead><tr className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 text-xs uppercase tracking-wider"><th className="p-5">Profil Member</th><th className="p-5">Kontak & Alamat</th><th className="p-5 text-right">Poin & Aksi</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {approvedMembers.length === 0 ? <tr><td colSpan="3" className="text-center py-10 text-stone-500">Belum ada member terdaftar.</td></tr> : approvedMembers.map((m, mIdx) => {
                const isEditing = editingMemberId === m.id;
                return (
                  <tr key={`mem-${m.id}-${mIdx}`} className={`transition-colors ${isEditing ? 'bg-amber-50/30' : 'hover:bg-stone-50/50'}`}>
                    <td className="p-5 flex items-center gap-4">
                      {m.photoUrl ? <img src={m.photoUrl} alt="Pic" className="w-12 h-12 rounded-full object-cover border"/> : <div className="w-12 h-12 rounded-full bg-stone-100 border flex items-center justify-center"><User className="w-6 h-6 text-stone-400"/></div>}
                      <div>
                         {isEditing ? <input type="text" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} className="border p-1 text-sm rounded mb-1 w-full"/> : <p className="font-bold text-stone-800 text-base">{String(m.name)}</p>}
                         <p className="text-xs font-mono text-stone-500">{String(m.id)}</p>
                      </div>
                    </td>
                    <td className="p-5">
                       {isEditing ? (
                         <>
                           <input type="text" value={editForm.phone} onChange={e=>setEditForm({...editForm, phone: e.target.value})} className="border p-1 text-sm rounded mb-1 w-full"/>
                           <input type="text" value={editForm.address} onChange={e=>setEditForm({...editForm, address: e.target.value})} className="border p-1 text-sm rounded w-full"/>
                         </>
                       ) : (
                         <>
                           <p className="font-bold text-stone-700">{String(m.phone)}</p>
                           <p className="text-xs text-stone-500 mt-1 truncate max-w-[200px]">{String(m.address)}</p>
                         </>
                       )}
                    </td>
                    <td className="p-5 text-right">
                       {isEditing ? (
                         <div className="flex gap-2 justify-end">
                            <button onClick={()=>setEditingMemberId(null)} className="px-3 py-1.5 bg-stone-200 text-stone-700 rounded text-xs font-bold">Batal</button>
                            <button onClick={()=>saveEdit(m)} className={`px-3 py-1.5 ${cTheme.bg} text-white rounded text-xs font-bold`}>Simpan</button>
                         </div>
                       ) : (
                         <div className="flex items-center justify-end gap-4">
                           <span className="font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1"><Award className="w-4 h-4"/> {m.points}</span>
                           {canEdit && <button onClick={()=>startEdit(m)} className="p-2 text-stone-400 hover:text-amber-600 transition-colors"><Edit3 className="w-4 h-4"/></button>}
                         </div>
                       )}
                    </td>
                  </tr>
              )})}
            </tbody>
          </table>
        )}

        {tab === 'nonmember' && (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead><tr className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 text-xs uppercase tracking-wider"><th className="p-5">Pelanggan Reguler</th><th className="p-5">KTP</th><th className="p-5">Kontak</th><th className="p-5 text-right">Riwayat Order</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {nonMembers.map((nm, idx) => (
                <tr key={`nonmem-${idx}`} className="hover:bg-stone-50/50">
                  <td className="p-5 font-bold text-stone-800">{String(nm.name)}</td>
                  <td className="p-5 font-mono text-stone-600">{String(nm.identity)}</td>
                  <td className="p-5 font-medium text-stone-700">{String(nm.phone)}</td>
                  <td className="p-5 text-right"><p className="font-bold text-stone-800">{nm.orderCount}x Transaksi</p><p className="text-xs text-stone-500">{formatRupiah(nm.totalSpent)}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'approval' && (
          <div className="p-6 md:p-8 space-y-5">
            {memberApps.length === 0 ? <div className="text-center py-10 text-stone-500">Tidak ada pengajuan member baru.</div> : memberApps.map((app, appIdx) => (
              <div key={`app-${app.id}-${appIdx}`} className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                 <div className="flex items-center gap-5">
                    {app.payload.photoUrl ? <img src={app.payload.photoUrl} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md" alt="foto"/> : <div className="w-16 h-16 rounded-full bg-white shadow-md border flex items-center justify-center"><User className="w-8 h-8 text-stone-300"/></div>}
                    <div>
                      <p className="font-bold text-stone-800 text-lg mb-1">{String(app.requestedBy)}</p>
                      <p className="text-xs text-stone-500 font-mono">{String(app.payload.identity)} &bull; {String(app.payload.phone)}</p>
                    </div>
                 </div>
                 <div className="flex gap-3 w-full md:w-auto">
                   <button onClick={() => handleApproval(app.id, 'reject')} className="flex-1 px-6 py-3 bg-white text-red-600 border border-stone-200 rounded-xl text-sm font-bold shadow-sm hover:bg-red-50 transition-colors">Tolak</button>
                   <button onClick={() => handleApproval(app.id, 'approve')} className={`flex-1 px-6 py-3 ${cTheme.bg} text-white rounded-xl text-sm font-bold shadow-lg hover:brightness-110 transition-all active:scale-95`}>Terima Member</button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 3. KOMPONEN MANAJEMEN HADIAH (PRIZES)
// ============================================================================
export const AdminPrizes = () => {
  const { db, requireApproval, cTheme } = useContext(AppStateContext);
  const [formData, setFormData] = useState({ name: '', points: '', desc: '', image: '' });

  const handleAdd = (e) => { 
    e.preventDefault(); 
    requireApproval('ADD_PRIZE', { id: `PRZ-${Date.now()}`, ...formData, points: parseInt(formData.points) }, 'Hadiah tersimpan.'); 
    setFormData({ name: '', points: '', desc: '', image: '' }); 
  };

  return (
    <div className="space-y-8 animate-fade-in-down w-full">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm">
         <h2 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-stone-100 pb-4"><Gift className="w-6 h-6 text-rose-600"/> Tambah Katalog Hadiah</h2>
         <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div><label className="block text-sm font-bold text-stone-700 mb-2">Nama Hadiah</label><input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400" /></div>
            <div><label className="block text-sm font-bold text-stone-700 mb-2">Harga (Poin)</label><input required type="number" min="1" value={formData.points} onChange={e=>setFormData({...formData, points: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">URL Gambar (Opsional)</label><input type="url" value={formData.image} onChange={e=>setFormData({...formData, image: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400" placeholder="https://..." /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Deskripsi Singkat</label><textarea required rows="2" value={formData.desc} onChange={e=>setFormData({...formData, desc: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400"></textarea></div>
            <button type="submit" className={`sm:col-span-2 py-4 ${cTheme.bg} text-white font-bold text-lg rounded-xl mt-2 shadow-lg active:scale-95 transition-all`}>Masukkan ke Katalog</button>
         </form>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(db.prizes||[]).length === 0 ? <div className="col-span-full text-center py-10 text-stone-500">Belum ada hadiah yang dibuat.</div> : (db.prizes||[]).map((p, idx) => (
           <div key={`prz-${p.id}-${idx}`} className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all">
              <div className="h-40 bg-stone-100 relative">
                 <img src={p.image || 'https://placehold.co/400?text=Prize'} className="w-full h-full object-cover" alt="prize"/>
                 <button onClick={() => requireApproval('DELETE_PRIZE', {id: p.id}, 'Dihapus.', true)} className="absolute top-3 right-3 p-2 bg-white text-red-500 rounded-full hover:bg-red-50 shadow-md transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>
              <div className="p-5 flex flex-col flex-grow">
                 <h4 className="font-bold text-lg text-stone-900 mb-2">{String(p.name)}</h4>
                 <p className="text-sm text-stone-500 mb-5 flex-grow line-clamp-2">{String(p.desc)}</p>
                 <span className="font-bold text-rose-700 flex items-center justify-center gap-2 bg-rose-50 w-full py-2.5 rounded-xl border border-rose-200"><Award className="w-5 h-5"/> {p.points} Poin</span>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 4. KOMPONEN MANAJEMEN PROMO (VOUCHER)
// ============================================================================
export const AdminPromo = () => {
  const { db, requireApproval, cTheme } = useContext(AppStateContext);
  const [formData, setFormData] = useState({ code: '', discountType: 'percentage', discountValue: '', minPurchase: '', validUntil: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    requireApproval('ADD_PROMO', { id: `PRM-${Date.now()}`, code: formData.code.toUpperCase(), discountType: formData.discountType, discountValue: parseInt(formData.discountValue), minPurchase: parseInt(formData.minPurchase), validUntil: formData.validUntil, status: 'Aktif' }, 'Voucher promo berhasil dibuat.');
    setFormData({ code: '', discountType: 'percentage', discountValue: '', minPurchase: '', validUntil: '' });
  };

  return (
    <div className="animate-fade-in-down w-full space-y-8">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm">
         <h2 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-stone-100 pb-4"><Tag className="w-6 h-6 text-rose-500"/> Buat Voucher & Promo Baru</h2>
         <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div><label className="block text-xs font-bold text-stone-600 mb-2">Kode Promo (Misal: LEBARAN)</label><input required type="text" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400 uppercase transition-colors" /></div>
            <div><label className="block text-xs font-bold text-stone-600 mb-2">Jenis Diskon</label><select value={formData.discountType} onChange={e=>setFormData({...formData, discountType: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400 transition-colors"><option value="percentage">Persentase (%)</option><option value="fixed">Nominal Tetap (Rp)</option></select></div>
            <div><label className="block text-xs font-bold text-stone-600 mb-2">Nilai Diskon</label><input required type="number" min="1" value={formData.discountValue} onChange={e=>setFormData({...formData, discountValue: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400 transition-colors" /></div>
            <div><label className="block text-xs font-bold text-stone-600 mb-2">Minimal Belanja (Rp)</label><input required type="number" min="0" value={formData.minPurchase} onChange={e=>setFormData({...formData, minPurchase: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400 transition-colors" /></div>
            <div><label className="block text-xs font-bold text-stone-600 mb-2">Berlaku Sampai Tanggal</label><input required type="date" min={new Date().toISOString().split('T')[0]} value={formData.validUntil} onChange={e=>setFormData({...formData, validUntil: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400 transition-colors" /></div>
            <div className="sm:col-span-2 md:col-span-1 flex items-end"><button type="submit" className={`w-full py-3.5 ${cTheme.bg} text-white font-bold rounded-xl shadow-md active:scale-95 transition-all`}>Simpan Promo</button></div>
         </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(db.promos||[]).length === 0 ? <div className="col-span-full text-center py-10 bg-white border border-dashed border-stone-300 rounded-2xl text-stone-500">Belum ada promo yang dibuat.</div> :
        (db.promos||[]).map((p, idx) => (
           <div key={`prm-${p.id}-${idx}`} className="bg-white border border-stone-200 rounded-3xl shadow-sm p-6 relative hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                 <h4 className="font-bold text-xl text-stone-800 tracking-wide font-mono uppercase">{String(p.code)}</h4>
                 <button onClick={() => requireApproval('DELETE_PROMO', {id: p.id}, 'Promo dihapus.', true)} className="text-stone-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5"/></button>
              </div>
              <p className="text-sm font-bold text-rose-600 mb-3 flex items-center gap-1.5"><Percent className="w-4 h-4"/> Diskon {p.discountType === 'percentage' ? `${p.discountValue}%` : formatRupiah(p.discountValue)}</p>
              <div className="text-xs text-stone-500 space-y-1.5 mb-6">
                 <p>Min. Belanja: <span className="font-medium text-stone-700">{formatRupiah(p.minPurchase)}</span></p>
                 <p>Kadaluarsa: <span className="font-medium text-stone-700">{String(p.validUntil)}</span></p>
              </div>
              <button onClick={() => requireApproval('UPDATE_PROMO_STATUS', {id: p.id, status: p.status === 'Aktif' ? 'Nonaktif' : 'Aktif'}, `Status diubah.`)} className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${p.status === 'Aktif' ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200' : 'bg-stone-100 text-stone-500 hover:bg-stone-200 border border-stone-200'}`}>
                 Status: {String(p.status)}
              </button>
           </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 5. KOMPONEN ANTREAN PERSETUJUAN (APPROVALS)
// ============================================================================
export const AdminApprovals = () => {
  const { db, handleApproval, loggedInUser, cTheme } = useContext(AppStateContext);
  const sysApps = (db.approvals||[]).filter(a => a.actionType !== 'REGISTER_MEMBER');
  
  if (sysApps.length === 0) return (
    <div className="text-center py-20 text-stone-500 bg-white rounded-3xl border border-dashed border-stone-300 animate-fade-in-down">
      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-stone-300"/>
      <h3 className="text-xl font-bold text-stone-800 mb-2">Aman Terkendali</h3>
      <p>Tidak ada antrean persetujuan sistem saat ini.</p>
    </div>
  );

  return (
    <div className="space-y-6 w-full animate-fade-in-down">
      <h2 className="text-xl font-serif font-bold text-stone-800 mb-6 flex items-center gap-3"><Shield className="w-6 h-6 text-rose-600"/> Otorisasi Sistem ({sysApps.length})</h2>
      {sysApps.map((app, aIdx) => {
        const canApprove = ['owner','developer'].includes(loggedInUser.role) || (loggedInUser.role === 'manager' && !(app.requesterRole === 'manager' && app.actionType === 'UPDATE_USER'));
        return (
          <div key={`sys-app-${app.id}-${aIdx}`} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow">
            <div className="overflow-hidden w-full md:w-auto">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="bg-yellow-50 text-yellow-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded border border-yellow-200">Butuh Akses</span>
                <span className="text-[10px] text-stone-400 font-mono">{String(app.id)}</span>
              </div>
              <p className="font-bold text-stone-900 text-lg truncate mb-1">{String(app.actionType).replace('_', ' ')}</p>
              <p className="text-sm text-stone-600 truncate">Diajukan: <span className="font-bold text-stone-800">{String(app.requestedBy)}</span> <span className="bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-2">{String(app.requesterRole)}</span></p>
            </div>
            {canApprove ? (
              <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button onClick={() => handleApproval(app.id, 'reject')} className="flex-1 md:flex-none px-6 py-3 bg-white text-red-600 border border-stone-200 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors">Tolak Paksa</button>
                <button onClick={() => handleApproval(app.id, 'approve')} className={`flex-1 md:flex-none px-6 py-3 ${cTheme.bg} text-white rounded-xl text-sm font-bold hover:brightness-110 shadow-lg active:scale-95 transition-all`}>Berikan Izin</button>
              </div>
            ) : (
              <div className="w-full md:w-auto text-center px-8 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-500 uppercase tracking-widest mt-4 md:mt-0">
                Terkunci (Hak Akses Owner)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};