import React, { useState, useContext } from 'react';
import { 
  ShoppingCart, Trash2, ChevronLeft, User, Upload, 
  Calendar as CalendarIcon, Tag, X, MessageCircle, CheckCircle 
} from 'lucide-react';
import { AppStateContext, formatRupiah } from '../../context/AppContext';

// ============================================================================
// 1. KOMPONEN KERANJANG BELANJA (CART)
// ============================================================================
export const CartView = () => {
  const { cart, removeFromCart, updateCartQuantity, setView, getAvailableStock, cTheme } = useContext(AppStateContext);
  
  const subtotalSewa = cart.reduce((sum, item) => sum + ((item.discountPrice > 0 ? item.discountPrice : item.price) * item.quantity), 0);
  const subtotalDeposit = cart.reduce((sum, item) => sum + ((item.deposit||0) * item.quantity), 0);

  if (cart.length === 0) return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-16 text-center max-w-2xl mx-auto mt-10 animate-fade-in-down">
      <ShoppingCart className="w-20 h-20 text-stone-200 mx-auto mb-6" />
      <h2 className="text-2xl font-serif font-bold text-stone-800 mb-4">Keranjang Kosong</h2>
      <button onClick={() => setView('catalog')} className={`px-10 py-4 rounded-full font-bold shadow-lg transition-all ${cTheme.bg} text-white`}>
        Eksplorasi Katalog
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-down w-full">
      <h1 className="text-3xl font-serif font-bold text-stone-800 mb-8">Keranjang Sewa</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow space-y-5">
          {cart.map((item) => {
            const avail = getAvailableStock(item.id, item.size);
            const effPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
            return (
              <div key={item.cartId} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex flex-col sm:flex-row gap-5 relative transition-all hover:shadow-md">
                {item.discountPrice > 0 && <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] px-2 py-1 rounded shadow z-10 font-bold">SALE</div>}
                <img src={item.images?.[0] || item.image} alt={String(item.name)} className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-xl bg-stone-100" />
                <div className="flex-grow flex flex-col justify-center">
                  <h3 className="font-bold font-serif text-lg text-stone-900 mb-1 flex flex-wrap items-center gap-2">
                    {String(item.name)} 
                    <span className="text-xs bg-stone-100 border border-stone-200 text-stone-600 px-2 py-0.5 rounded font-sans whitespace-nowrap">Ukuran: {item.size}</span>
                  </h3>
                  <div className="mb-4">
                    <p className={`${cTheme.text} font-bold text-lg`}>{formatRupiah(effPrice)} <span className="text-xs text-stone-500 font-normal">/ hari</span></p>
                    {item.deposit > 0 && <p className="text-xs text-amber-600 font-bold mt-1">Uang Jaminan: {formatRupiah(item.deposit)}</p>}
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-5">
                    <div className="flex items-center border border-stone-200 rounded-full overflow-hidden h-10 bg-stone-50">
                      <button onClick={() => updateCartQuantity(item.cartId, -1)} className="px-4 h-full hover:bg-stone-200 font-bold text-stone-600 transition-colors">-</button>
                      <span className="w-10 text-center font-bold text-stone-800">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.cartId, 1)} disabled={item.quantity >= avail} className="px-4 h-full hover:bg-stone-200 font-bold text-stone-600 disabled:opacity-30 transition-colors">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.cartId)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>
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
              <div className="flex justify-between text-amber-400"><span>Total Deposit (Akan Dikembalikan)</span><span className="font-bold">{formatRupiah(subtotalDeposit)}</span></div>
            </div>
            <button onClick={() => setView('checkout')} className={`w-full ${cTheme.bg} text-white py-4 rounded-full font-bold shadow-lg hover:brightness-110 transition-all text-lg active:scale-95`}>Lanjut Checkout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. KOMPONEN PROSES PEMBAYARAN (CHECKOUT)
// ============================================================================
export const CheckoutView = () => {
  const { cart, processOrder, setView, cTheme, loggedInMember, showToast, compressImage, uploadImageToServer, db } = useContext(AppStateContext);
  
  const [formData, setFormData] = useState({ 
    name: loggedInMember?.name || '', 
    identity: loggedInMember?.identity || '', 
    phone: loggedInMember?.phone || '', 
    address: loggedInMember?.address || '', 
    startDate: '', 
    endDate: '', 
    ktpUrl: loggedInMember?.ktpUrl || null 
  });
  const [isUploading, setIsUploading] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  const getDuration = () => {
    if(!formData.startDate || !formData.endDate) return 1;
    const start = new Date(formData.startDate); 
    const end = new Date(formData.endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; 
    return diff > 0 ? diff : 1;
  };
  
  const duration = getDuration();
  const subtotalSewa = cart.reduce((sum, item) => sum + ((item.discountPrice > 0 ? item.discountPrice : item.price) * item.quantity), 0) * duration;
  const totalDeposit = cart.reduce((sum, item) => sum + ((item.deposit||0) * item.quantity), 0);
  
  const isDiscount = duration > 7;
  const durationDiscount = isDiscount ? (subtotalSewa * 0.1) : 0;
  
  const isValidPromo = appliedPromo && subtotalSewa >= appliedPromo.minPurchase;
  let promoDiscountAmount = 0;
  if (isValidPromo) { 
    promoDiscountAmount = appliedPromo.discountType === 'percentage' ? (subtotalSewa * (appliedPromo.discountValue / 100)) : appliedPromo.discountValue; 
  }
  
  const totalBiaya = subtotalSewa - durationDiscount - promoDiscountAmount + totalDeposit;

  const handleKtpUpload = async (e) => { 
    const file = e.target.files[0]; 
    if (!file) return; 
    setIsUploading(true);
    const compressed = await compressImage(file); 
    const url = await uploadImageToServer(compressed);
    if(url) { 
      setFormData(p => ({...p, ktpUrl: url})); 
    } else { 
      showToast("Gagal upload KTP ke server gambar.", "error"); 
    }
    setIsUploading(false);
  };

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const foundPromo = (db.promos||[]).find(p => p.code.toUpperCase() === promoInput.toUpperCase() && p.status === 'Aktif');
    if (!foundPromo) return showToast('Kode voucher tidak ditemukan atau tidak aktif.', 'error');
    if (new Date(foundPromo.validUntil) < new Date()) return showToast('Voucher sudah kadaluarsa.', 'error');
    if (subtotalSewa < foundPromo.minPurchase) return showToast(`Minimal belanja untuk voucher ini adalah ${formatRupiah(foundPromo.minPurchase)}`, 'error');
    setAppliedPromo(foundPromo); 
    showToast('Voucher berhasil digunakan!', 'success');
  };
  
  const removePromo = () => { setAppliedPromo(null); setPromoInput(''); };
  
  const handleWASubmit = () => {
    if(!formData.name || !formData.phone || !formData.identity || !formData.address || !formData.startDate || !formData.endDate) { 
        return showToast("Harap isi semua formulir yang wajib (*)", "error"); 
    }
    if(new Date(formData.endDate) < new Date(formData.startDate)) { 
        return showToast("Tanggal akhir tidak valid!", "error"); 
    }
    processOrder({...formData, duration}, isValidPromo ? appliedPromo : null, true); 
  };

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    if(new Date(formData.endDate) < new Date(formData.startDate)) { 
        return showToast("Tanggal akhir tidak valid!", "error"); 
    }
    processOrder({...formData, duration}, isValidPromo ? appliedPromo : null, false); 
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-down w-full">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('cart')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-stone-200 shadow-sm hover:bg-stone-50 transition-colors"><ChevronLeft className="w-6 h-6"/></button>
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
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Upload KTP *</label>
                <label className="flex items-center gap-3 bg-stone-50 border border-stone-200 px-5 py-3.5 rounded-xl cursor-pointer hover:bg-stone-100 text-sm font-bold text-stone-600 transition-colors">
                  <Upload className="w-5 h-5" /> 
                  <span className="truncate">{isUploading ? 'Uploading...' : formData.ktpUrl ? 'KTP Terlampir' : 'Upload File'}</span>
                  <input required={!formData.ktpUrl} type="file" accept="image/*" onChange={handleKtpUpload} className="hidden" />
                </label>
              </div>
              <div className="md:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Alamat Domisili *</label><textarea required rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px] transition-colors"></textarea></div>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-xl text-stone-800 mb-6 border-b border-stone-100 pb-3 flex items-center gap-2"><CalendarIcon className="w-6 h-6 text-stone-400"/> Rencana Sewa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-stone-700 mb-2">Tgl Mulai (Ambil) *</label><input required type="date" min={new Date().toISOString().split('T')[0]} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px] transition-colors" /></div>
              <div><label className="block text-sm font-bold text-stone-700 mb-2">Tgl Akhir (Kembali) *</label><input required type="date" min={formData.startDate || new Date().toISOString().split('T')[0]} value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px] transition-colors" /></div>
            </div>
          </section>
        </form>

        <div className="w-full lg:w-96 flex-shrink-0 space-y-6">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200 w-full">
            <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><Tag className="w-5 h-5 text-stone-400"/> Punya Voucher Promo?</h3>
            {!isValidPromo ? (
              <div className="flex gap-2">
                <input type="text" placeholder="Masukkan kode..." value={promoInput} onChange={(e) => setPromoInput(e.target.value)} className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none text-[16px] focus:bg-white uppercase transition-colors" />
                <button type="button" onClick={handleApplyPromo} className="bg-stone-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-black transition-colors">Terapkan</button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex justify-between items-center animate-fade-in-down">
                 <div><p className="text-xs text-green-600 font-bold uppercase">Promo Digunakan</p><p className="font-mono font-bold text-green-800">{String(appliedPromo.code)}</p></div>
                 <button type="button" onClick={removePromo} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
              </div>
            )}
            {appliedPromo && !isValidPromo && <p className="text-xs text-red-500 mt-2 animate-fade-in-down">Voucher dilepas karena minimal belanja tidak terpenuhi.</p>}
          </div>

          <div className="bg-stone-900 p-8 rounded-3xl shadow-xl text-white sticky top-24">
            <h3 className="font-bold font-serif text-xl mb-6 border-b border-stone-700 pb-4">Tagihan Final</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-stone-400 text-sm"><span>Sewa ({duration} Hari)</span><span className="font-bold text-white">{formatRupiah(subtotalSewa)}</span></div>
              {isDiscount && <div className="flex justify-between text-green-400 text-sm"><span>Diskon (&gt; 7 Hari)</span><span className="font-bold">-{formatRupiah(durationDiscount)}</span></div>}
              {isValidPromo && <div className="flex justify-between text-green-400 text-sm"><span>Promo Voucher</span><span className="font-bold">-{formatRupiah(promoDiscountAmount)}</span></div>}
              <div className="flex justify-between text-amber-500 text-sm border-b border-stone-700 pb-4"><span>Deposit Jaminan</span><span className="font-bold">{formatRupiah(totalDeposit)}</span></div>
              <div className="flex justify-between items-end pt-2"><span className="font-bold text-stone-300">Total Biaya</span><span className={`font-bold text-2xl ${cTheme.text}`}>{formatRupiah(totalBiaya)}</span></div>
            </div>

            {loggedInMember ? (
              <button type="button" onClick={handleWASubmit} className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 shadow-lg active:scale-95 flex justify-center items-center gap-2 mb-3 transition-all"><MessageCircle className="w-6 h-6"/> Pesan via WhatsApp</button>
            ) : (
              <button form="co-form" type="submit" className={`w-full ${cTheme.bg} text-white py-4 rounded-xl font-bold text-lg hover:brightness-110 shadow-lg active:scale-95 mb-3 transition-all`}>Kirim Pesanan</button>
            )}
            
            <div className="text-center text-xs text-stone-500 mt-4">*Uang Deposit akan dikembalikan penuh jika barang kembali tanpa cacat/telat.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. KOMPONEN SUKSES TRANSAKSI
// ============================================================================
export const SuccessView = () => {
  const { setView } = useContext(AppStateContext);
  
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-12 text-center max-w-2xl mx-auto mt-10 animate-fade-in-down">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-green-500" />
      </div>
      <h2 className="text-3xl font-serif font-bold text-stone-900 mb-3">Pesanan Diterima!</h2>
      <p className="text-stone-500 mb-8 text-lg">Terima kasih. Tunggu konfirmasi admin kami atau kunjungi butik pada tanggal yang ditentukan.</p>
      <button onClick={() => setView('dashboard')} className="bg-stone-900 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-black transition-all shadow-lg active:scale-95">
        Kembali ke Beranda
      </button>
    </div>
  );
};