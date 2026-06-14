import React, { useState, useEffect, useContext } from 'react';
import { 
  Settings as SettingsIcon, X, Plus, Search, Upload, 
  Edit3, Trash2, CheckCircle, Package, Award, FileText, 
  ChevronDown, Printer, Image as ImageIcon 
} from 'lucide-react';
import { AppStateContext, formatRupiah } from '../../context/AppContext';

// ============================================================================
// 1. KOMPONEN MANAJEMEN INVENTARIS (KATALOG & MAINTENANCE)
// ============================================================================
export const AdminInventory = () => {
  const { db, requireApproval, getAvailableStock, cTheme, showToast, compressImage, uploadImageToServer } = useContext(AppStateContext);
  const [invTab, setInvTab] = useState('katalog'); 
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const safeCategories = (db.categories||[]).filter(c => typeof c === 'string');
  const [formData, setFormData] = useState({ name: '', price: '', category: safeCategories[0] || '', desc: '', image: null, totalStock: 1 });
  const [editData, setEditData] = useState({ price: '', totalStock: '', deposit: '', productLink: '', images: [] });

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  useEffect(() => { setPage(1); }, [invTab, activeCategory, searchQuery]);

  const handleImageUpload = async (e, isEdit = false) => { 
    const files = Array.from(e.target.files); 
    if (!files.length) return; 
    showToast('Mengkompresi & Mengunggah gambar...', 'info');
    try {
      const uploadPromises = files.map(async (f) => {
        const compressed = await compressImage(f); 
        const url = await uploadImageToServer(compressed);
        if(!url) throw new Error("Gagal ImgBB"); return url;
      });
      const validUrls = await Promise.all(uploadPromises);
      if (isEdit) { 
        setEditData(prev => ({ ...prev, images: [...(prev.images || []), ...validUrls] })); 
      } else { 
        setFormData(prev => ({ ...prev, image: validUrls[0] })); 
      }
      showToast('Gambar berhasil diunggah!', 'success');
    } catch (error) { 
      showToast('Gagal mengunggah gambar.', 'error'); 
    }
  };

  const removeImage = (idx, isEdit = false) => {
    if (isEdit) { setEditData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) })); }
  };

  const generateId = (cat) => { 
    const prefix = cat ? String(cat).substring(0,2).toUpperCase() : 'XX'; 
    const existing = (db.products||[]).filter(p => String(p.id).startsWith(prefix));
    let maxCount = 1000;
    existing.forEach(p => { 
      const num = parseInt(String(p.id).split('-')[1]); 
      if(!isNaN(num) && num > maxCount) maxCount = num; 
    });
    return `${prefix}-${maxCount + 1}`; 
  };
  
  const handleAddProduct = (e) => { 
    e.preventDefault(); 
    if (formData.totalStock <= 0) { showToast("Stok fisik harus lebih dari 0!", "error"); return; }
    requireApproval('ADD_PRODUCT', { id: generateId(formData.category), ...formData, price: parseInt(formData.price), deposit: parseInt(formData.deposit||0), totalStock: parseInt(formData.totalStock), status: 'Tersedia' }, 'Produk disimpan.'); 
    setShowAddForm(false); 
    setFormData({ name: '', price: '', deposit:'', category: safeCategories[0] || '', desc: '', image: null, totalStock: 1 }); 
  };

  const handleAddCategory = (e) => { 
    e.preventDefault(); 
    if (newCategoryName.trim() && !safeCategories.includes(newCategoryName.trim())) { 
      requireApproval('ADD_CATEGORY', newCategoryName.trim(), 'Kategori dibuat.'); 
      setNewCategoryName(''); 
    } 
  };
  
  const handleSaveEdit = (p) => { 
    if(editData.price && editData.totalStock) { 
      requireApproval('EDIT_PRODUCT', {...p, price: parseInt(editData.price), deposit: parseInt(editData.deposit||0), totalStock: parseInt(editData.totalStock), productLink: editData.productLink, images: editData.images}, 'Perubahan disimpan.'); 
      setEditingId(null); 
    } 
  };

  const filteredProducts = (db.products||[]).filter(p => p.status !== 'Maintenance' && (activeCategory === 'Semua' || p.category === activeCategory) && (String(p.name).toLowerCase().includes(searchQuery.toLowerCase()) || String(p.id).toLowerCase().includes(searchQuery.toLowerCase())));
  const maintenanceProducts = (db.products||[]).filter(p => p.status === 'Maintenance');
  const paginatedProducts = filteredProducts.slice(0, page * ITEMS_PER_PAGE);

  return (
    <div className="animate-fade-in-down w-full">
      <div className="w-full overflow-x-auto mb-6 pb-2">
        <div className="flex bg-white border border-stone-200 p-1.5 rounded-2xl w-max shadow-sm">
          <button onClick={() => setInvTab('katalog')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${invTab === 'katalog' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>Katalog Aktif</button>
          <button onClick={() => setInvTab('maintenance')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${invTab === 'maintenance' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>
            Masuk Maintenance {maintenanceProducts.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{maintenanceProducts.length}</span>}
          </button>
        </div>
      </div>

      {invTab === 'katalog' && (
        <>
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm mb-6">
             <h3 className="font-bold text-stone-800 mb-5 flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-stone-400"/> Pengaturan Kategori</h3>
             <div className="flex flex-wrap items-center gap-3 mb-6">
                <button onClick={() => setActiveCategory('Semua')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeCategory === 'Semua' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>Semua Filter</button>
                {safeCategories.map((cat, idx) => (
                   <div key={`inv-cat-${idx}`} className={`flex items-center rounded-full border transition-all ${activeCategory === cat ? `${cTheme.bg} text-white border-transparent shadow-md` : 'bg-white border-stone-200 text-stone-700 shadow-sm'}`}>
                     <button onClick={() => setActiveCategory(cat)} className="px-5 py-2.5 text-sm font-medium">{String(cat)}</button>
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
             <button onClick={() => setShowAddForm(!showAddForm)} disabled={safeCategories.length === 0} className={`text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 shadow-lg active:scale-95 transition-all ${safeCategories.length === 0 ? 'bg-stone-300 cursor-not-allowed' : cTheme.bg}`}>
               <Plus className="w-5 h-5"/> {showAddForm ? 'Tutup Formulir' : 'Tambah Produk'}
             </button>
          </div>

          {showAddForm && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm mb-8 animate-fade-in-down">
               <h3 className="font-bold text-xl text-stone-800 mb-6 border-b pb-3">Formulir Produk Baru</h3>
               <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-bold text-stone-700 mb-2">Nama Baju / Produk</label><input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400" /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-sm font-bold text-stone-700 mb-2">Harga Sewa / Hari</label><input required type="number" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400" /></div>
                     <div><label className="block text-sm font-bold text-amber-700 mb-2">Deposit (Jaminan)</label><input type="number" value={formData.deposit} onChange={e=>setFormData({...formData, deposit: e.target.value})} className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-[16px] outline-none focus:border-amber-400" /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Pilih Kategori</label>
                    <select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400 cursor-pointer">
                      {safeCategories.map((c, i) => <option key={`opt-${i}`} value={c}>{String(c)}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-bold text-stone-700 mb-2">Jumlah Fisik Barang</label><input required type="number" min="1" value={formData.totalStock} onChange={e=>setFormData({...formData, totalStock: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400" /></div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-stone-700 mb-2">Upload Foto Barang</label>
                    <label className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500 bg-white transition-colors">
                      <Upload className="w-5 h-5 mr-2 text-gray-400" /> {formData.image ? 'Gambar Dipilih' : 'Klik untuk Upload Gambar'}
                      <input required={!formData.image} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                    </label>
                  </div>
                  <div className="sm:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Deskripsi Detail</label><textarea required rows="3" value={formData.desc} onChange={e=>setFormData({...formData, desc: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400"></textarea></div>
                  <div className="sm:col-span-2 mt-4"><button type="submit" className={`w-full py-4 ${cTheme.bg} text-white font-bold text-lg rounded-xl shadow-lg active:scale-95 transition-transform`}>Simpan ke Katalog</button></div>
               </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedProducts.map((p, pIdx) => {
              const avail = getAvailableStock(p.id);
              const isExpanded = expandedId === p.id;
              const isEditing = editingId === p.id;

              return (
                <div key={`invp-${p.id}-${pIdx}`} className="bg-white border border-stone-100 rounded-3xl shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-shadow relative">
                   <div className="p-5 flex gap-5 cursor-pointer hover:bg-stone-50 transition-colors" onClick={() => {setExpandedId(isExpanded ? null : p.id); setEditingId(null);}}>
                      <img src={p.images?.[0] || p.image || 'https://placehold.co/400?text=No+Image'} alt={String(p.name)} className="w-20 h-20 rounded-2xl object-cover border border-stone-100 shadow-sm" />
                      <div className="flex-1 overflow-hidden">
                         <h4 className="font-bold text-stone-800 text-base leading-tight mb-1 truncate">{String(p.name)}</h4>
                         <p className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded w-max mb-2">{String(p.id)} &bull; {String(p.category)}</p>
                         <div className="flex justify-between items-center">
                            <p className="text-sm font-bold text-stone-900">{formatRupiah(p.price)}</p>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-md border ${avail>0?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>Sisa: {avail}/{p.totalStock}</span>
                         </div>
                      </div>
                   </div>
                   
                   {isExpanded && (
                     <div className="p-5 bg-stone-50 border-t border-stone-200 flex-1 flex flex-col animate-fade-in-down">
                        <p className="text-sm text-stone-600 mb-5 flex-grow leading-relaxed">{String(p.desc)}</p>
                        <div className="bg-white p-3 rounded-lg border border-stone-100 mb-5 text-sm font-bold text-amber-700 shadow-sm">Uang Jaminan: {formatRupiah(p.deposit)}</div>
                        
                        {isEditing ? (
                          <div className="space-y-4 mb-5 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm animate-fade-in-down">
                             <div><label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ubah Harga</label><input type="number" value={editData.price} onChange={e=>setEditData({...editData, price: e.target.value})} className="w-full mt-2 px-4 py-2 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400" /></div>
                             <div><label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ubah Deposit</label><input type="number" value={editData.deposit} onChange={e=>setEditData({...editData, deposit: e.target.value})} className="w-full mt-2 px-4 py-2 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400" /></div>
                             <div><label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ubah Stok Fisik</label><input type="number" value={editData.totalStock} onChange={e=>setEditData({...editData, totalStock: e.target.value})} className="w-full mt-2 px-4 py-2 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400" /></div>
                             <div><label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ubah Link Eksternal</label><input type="url" value={editData.productLink} onChange={e=>setEditData({...editData, productLink: e.target.value})} className="w-full mt-2 px-4 py-2 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-stone-400" /></div>
                             
                             <div>
                               <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Album Foto Produk</label>
                               <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
                                  {editData.images?.map((img, idx) => (
                                    <div key={`edit-img-${idx}`} className="relative shrink-0">
                                      <img src={img} className="w-12 h-12 object-cover rounded-lg border border-stone-200 shadow-sm" alt="img" />
                                      <button type="button" onClick={() => removeImage(idx, true)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"><X className="w-3 h-3"/></button>
                                    </div>
                                  ))}
                                  <label className="w-12 h-12 shrink-0 flex items-center justify-center border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:bg-stone-50 text-stone-400 bg-white transition-colors">
                                    <Plus className="w-4 h-4" />
                                    <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                                  </label>
                               </div>
                             </div>

                             <div className="flex gap-3 pt-3">
                               <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-bold hover:bg-stone-200 transition-colors">Batal</button>
                               <button onClick={() => handleSaveEdit(p)} className={`flex-1 py-2.5 ${cTheme.bg} text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all`}>Simpan</button>
                             </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap sm:flex-nowrap gap-3 mt-auto">
                            <button onClick={() => requireApproval('UPDATE_PRODUCT_STATUS', {id: p.id, status: 'Maintenance'}, 'Pakaian masuk ruang perawatan.')} className="w-full sm:flex-1 py-3 bg-yellow-50 text-yellow-700 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 hover:bg-yellow-100 border border-yellow-200 transition-colors"><Edit3 className="w-4 h-4"/> Perawatan</button>
                            <button onClick={() => requireApproval('DELETE_PRODUCT', {id: p.id}, 'Katalog dihapus.', true)} className="flex-1 py-3 bg-white text-red-600 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 hover:bg-red-50 border border-stone-200 shadow-sm transition-colors"><Trash2 className="w-4 h-4"/> Hapus</button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditData({price: p.price, totalStock: p.totalStock, deposit: p.deposit, productLink: p.productLink||'', images: p.images || (p.image ? [p.image] : [])}); }} className="flex-1 py-3 bg-stone-900 text-white rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 hover:bg-black shadow-md transition-colors"><Edit3 className="w-4 h-4"/> Edit</button>
                          </div>
                        )}
                     </div>
                   )}
                </div>
              );
            })}
          </div>
          {filteredProducts.length > page * ITEMS_PER_PAGE && (
             <div className="flex justify-center mt-6">
                <button onClick={() => setPage(p => p + 1)} className="px-6 py-2.5 bg-stone-100 text-stone-600 font-bold rounded-full hover:bg-stone-200 transition-colors shadow-sm text-sm active:scale-95">Muat Lebih Banyak Inventaris</button>
             </div>
          )}
        </>
      )}

      {invTab === 'maintenance' && (
        <div className="bg-white p-6 md:p-10 rounded-3xl border border-stone-200 shadow-sm animate-fade-in-down">
           <h3 className="font-bold text-xl text-stone-800 mb-2 flex items-center gap-3"><SettingsIcon className="w-6 h-6 text-yellow-500"/> Gudang Perawatan</h3>
           <p className="text-stone-500 mb-8">Pakaian yang dikembalikan dari pelanggan ada di sini. Disembunyikan dari katalog publik secara otomatis.</p>
           {maintenanceProducts.length === 0 ? (
             <div className="text-center py-16 bg-stone-50 border border-dashed border-stone-300 rounded-3xl text-stone-500">
               <CheckCircle className="w-12 h-12 mx-auto mb-4 text-stone-300"/>Semua barang dalam kondisi baik.
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {maintenanceProducts.map((p, pIdx) => (
                 <div key={`maint-prod-${p.id}-${pIdx}`} className="border border-stone-200 rounded-3xl p-5 flex flex-col hover:shadow-md transition-shadow bg-stone-50">
                    <img src={p.images?.[0] || p.image || 'https://placehold.co/400?text=No+Image'} className="w-full h-40 object-cover rounded-2xl mb-4 shadow-sm" alt="Item"/>
                    <h4 className="font-bold text-stone-800 text-lg mb-1">{String(p.name)}</h4>
                    <p className="text-xs font-mono text-stone-500 mb-5">{String(p.id)}</p>
                    <button onClick={() => requireApproval('UPDATE_PRODUCT_STATUS', {id: p.id, status: 'Tersedia'}, 'Pakaian siap disewakan kembali.')} className="mt-auto w-full py-3 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                      <CheckCircle className="w-5 h-5"/> Selesai Diperbaiki
                    </button>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. KOMPONEN MANAJEMEN PESANAN (ORDER MANAGER)
// ============================================================================
export const AdminOrderManager = () => {
  const { db, requireApproval, printInvoice, updateOrderStatus } = useContext(AppStateContext);
  const [tab, setTab] = useState('aktif');
  const [expandedId, setExpandedId] = useState(null);
  const [dendaModal, setDendaModal] = useState({ isOpen: false, order: null, amount: 0, newStatus: '' });

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  useEffect(() => { setPage(1); }, [tab]);

  const displayedOrders = tab === 'aktif' 
    ? (db.orders||[]).filter(o => ['Menunggu Konfirmasi', 'Siap Diambil', 'Sedang Disewa'].includes(o.status)) 
    : (db.orders||[]).filter(o => ['Selesai', 'Dibatalkan'].includes(o.status));
    
  const paginatedOrders = displayedOrders.slice(0, page * ITEMS_PER_PAGE);

  const handleStatusChange = (order, newStatus) => {
    if (order.status === newStatus) return;
    if (newStatus === 'Selesai') { 
      setDendaModal({ isOpen: true, order, amount: 0, newStatus }); 
      return; 
    }
    if (newStatus === 'Dibatalkan') { 
      requireApproval('CANCEL_ORDER', { orderId: order.id, newStatus: newStatus, itemIds: order.items.map(i => i.id) }, `Pesanan Dibatalkan & barang masuk Maintenance.`); 
      return; 
    }
    updateOrderStatus(order.id, newStatus);
  };

  const confirmSelesai = () => {
    const denda = parseInt(dendaModal.amount) || 0;
    let refund = (dendaModal.order.totalDeposit || 0) - denda; 
    if (refund < 0) refund = 0;
    
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
        {paginatedOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-300 text-stone-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-stone-300"/>Tidak ada pesanan di kategori ini.
          </div>
        ) : paginatedOrders.map((order, ordIdx) => (
          <div key={`mng-ord-${order.id}-${ordIdx}`} className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5 md:p-6 flex justify-between items-center cursor-pointer hover:bg-stone-50 gap-4 transition-colors" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${order.memberId ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-stone-100 border-stone-200 text-stone-500'}`}>
                  {order.memberId ? <Award className="w-6 h-6"/> : <FileText className="w-6 h-6"/>}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-stone-800 flex flex-wrap items-center gap-2">
                    {String(order.customer.name)} 
                    {order.memberId && <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm">Member</span>}
                  </h4>
                  <p className="text-sm text-stone-500 font-mono mt-1">{String(order.id)} &bull; <span className="font-sans">Tgl Sewa: {String(order.startDate)}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-xs font-bold px-4 py-2 rounded-full bg-stone-100 border border-stone-200 uppercase tracking-wide hidden sm:block">{String(order.status)}</span>
                <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            {expandedId === order.id && (
              <div className="p-6 bg-stone-50 border-t border-stone-200 animate-fade-in-down">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                    <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Biodata Pelanggan</h5>
                    <p className="font-bold text-stone-800 mb-1">{String(order.customer.name)}</p>
                    <p className="text-sm text-stone-600 mb-1">{String(order.customer.phone)}</p>
                    <p className="text-sm text-stone-600 font-mono mb-3">NIK: {String(order.customer.identity)}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                    <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Durasi & Waktu</h5>
                    <p className="text-sm text-stone-600 mb-2">Mulai: <span className="font-bold text-stone-800">{String(order.startDate)}</span></p>
                    <p className="text-sm text-stone-600 mb-4">Selesai: <span className="font-bold text-stone-800">{String(order.endDate)}</span></p>
                    <span className="text-xs font-bold text-rose-800 bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg uppercase tracking-wider">Durasi: {order.duration} Hari</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between">
                    <div>
                       <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Tindakan Admin</h5>
                       <select value={order.status} onChange={(e) => handleStatusChange(order, e.target.value)} className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none bg-stone-50 cursor-pointer transition-colors">
                         <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                         <option value="Siap Diambil">Siap Diambil</option>
                         <option value="Sedang Disewa">Sedang Disewa</option>
                         <option value="Selesai">Pesanan Selesai</option>
                         <option value="Dibatalkan">Batalkan Pesanan</option>
                       </select>
                    </div>
                    <button onClick={() => printInvoice(order)} className="mt-4 w-full bg-stone-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors active:scale-95"><Printer className="w-4 h-4"/> Cetak Struk/Nota</button>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-stone-100">
                    <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Daftar Pakaian</h5>
                    <div className="space-y-3">
                      {order.items.map((item, iIdx) => {
                        const effPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
                        return (
                        <div key={`mng-item-${item.id}-${iIdx}`} className="flex items-center justify-between text-sm">
                           <div className="flex items-center gap-3">
                              <img src={item.image || item.images?.[0] || 'https://placehold.co/400'} className="w-12 h-12 rounded-lg object-cover border" alt="img"/>
                              <span className="font-bold text-stone-800">{item.quantity}x {String(item.name)} <span className="text-stone-400 font-normal ml-1">({item.size})</span></span>
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

        {displayedOrders.length > page * ITEMS_PER_PAGE && (
            <div className="text-center mt-6">
                <button onClick={() => setPage(p => p + 1)} className="px-6 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition-colors shadow-sm active:scale-95">
                   Muat Lebih Banyak Pesanan
                </button>
            </div>
        )}
      </div>

      {dendaModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-down">
            <h3 className="font-bold font-serif text-xl mb-2 text-stone-900">Konfirmasi Pengembalian</h3>
            <p className="text-sm text-stone-500 mb-6">Pesanan ini memiliki total Uang Deposit sebesar <span className="font-bold text-amber-600">{formatRupiah(dendaModal.order?.totalDeposit || 0)}</span>. Apakah ada denda kerusakan atau keterlambatan?</p>
            <div className="mb-6">
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Potongan Denda (Rp)</label>
              <input type="number" min="0" value={dendaModal.amount} onChange={e => setDendaModal({...dendaModal, amount: e.target.value})} className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-xl outline-none text-lg font-bold text-red-600 focus:border-red-400 transition-colors" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setDendaModal({ isOpen: false, order: null, amount: 0, newStatus: '' })} className="flex-1 py-3.5 bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-colors">Batal</button>
              <button onClick={confirmSelesai} className="flex-1 py-3.5 bg-stone-900 text-white font-bold rounded-xl hover:bg-black shadow-lg transition-colors">Selesai & Proses</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};