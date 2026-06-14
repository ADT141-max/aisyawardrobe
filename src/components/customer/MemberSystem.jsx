import React, { useState, useContext } from 'react';
import { 
  User, UserPlus, Upload, Heart, Clock, 
  Gift, Award, LogOut, ShoppingCart 
} from 'lucide-react';
import { AppStateContext, formatRupiah, compressImage, uploadImageToServer } from '../../context/AppContext';

// ============================================================================
// 1. KOMPONEN AUTENTIKASI (LOGIN & DAFTAR MEMBER)
// ============================================================================
export const MemberAuthView = () => {
  const { memberLogin, submitMemberRegistration, cTheme, showToast } = useContext(AppStateContext);
  const [tab, setTab] = useState('login');
  
  const [uname, setUname] = useState(''); 
  const [pwd, setPwd] = useState('');
  
  const [formData, setFormData] = useState({ 
    username: '', password: '', name: '', identity: '', phone: '', 
    birthPlace: '', birthDate: '', gender: 'Perempuan', address: '', 
    email: '', socialMedia: '', photoUrl: null, ktpUrl: null 
  });
  const [isUploading, setIsUploading] = useState({ photoUrl: false, ktpUrl: false });

  const handleLogin = (e) => { 
    e.preventDefault(); 
    if(!memberLogin(uname, pwd)) showToast('Akun tidak ditemukan atau belum disetujui!', 'error'); 
  };
  
  const handleRegister = (e) => { 
    e.preventDefault(); 
    submitMemberRegistration(formData); 
    setTab('login'); 
  };
  
  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(prev => ({ ...prev, [type]: true }));
      showToast(`Mengunggah gambar...`, 'info');
      try {
        const compressed = await compressImage(file);
        const serverUrl = await uploadImageToServer(compressed);
        if (serverUrl) { 
          setFormData(prev => ({ ...prev, [type]: serverUrl })); 
          showToast(`Gambar OK`, 'success'); 
        } else { 
          showToast(`Gagal mengunggah gambar ke server`, 'error'); 
        }
      } catch (error) { 
        showToast(`Gagal mengunggah gambar`, 'error'); 
      } finally { 
        setIsUploading(prev => ({ ...prev, [type]: false })); 
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in-down w-full">
      <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
        <div className="flex border-b border-stone-100 bg-stone-50">
          <button onClick={() => setTab('login')} className={`flex-1 py-5 font-bold text-sm uppercase tracking-wider transition-colors ${tab === 'login' ? `${cTheme.text} bg-white border-b-2 ${cTheme.border}` : 'text-stone-400 hover:text-stone-600'}`}>Masuk</button>
          <button onClick={() => setTab('register')} className={`flex-1 py-5 font-bold text-sm uppercase tracking-wider transition-colors ${tab === 'register' ? `${cTheme.text} bg-white border-b-2 ${cTheme.border}` : 'text-stone-400 hover:text-stone-600'}`}>Daftar</button>
        </div>
        
        <div className="p-8 md:p-10">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6 animate-fade-in-down">
              <div className="text-center mb-8">
                <User className={`w-16 h-16 mx-auto mb-4 ${cTheme.text}`}/>
                <h2 className="text-2xl font-serif font-bold text-stone-800">Login Member</h2>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Username</label>
                <input required type="text" value={uname} onChange={e=>setUname(e.target.value)} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Password</label>
                <input required type="password" value={pwd} onChange={e=>setPwd(e.target.value)} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-500 text-[16px] transition-colors" />
              </div>
              <button type="submit" className={`w-full ${cTheme.bg} text-white py-4 rounded-full font-bold shadow-lg mt-4 text-lg hover:brightness-110 transition-all active:scale-95`}>Masuk</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5 animate-fade-in-down">
               <h2 className="font-bold text-xl text-stone-800 border-b border-stone-100 pb-4">Data Member Baru</h2>
               <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex-1 flex flex-col items-center p-4 border-2 border-dashed border-stone-300 rounded-2xl cursor-pointer hover:bg-stone-50 text-sm font-bold text-stone-600 bg-white transition-colors">
                    <UserPlus className="w-6 h-6 mb-2 text-stone-400" /> 
                    {isUploading.photoUrl ? 'Uploading...' : formData.photoUrl ? 'Foto OK' : 'Foto Diri'}
                    <input required={!formData.photoUrl} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'photoUrl')} />
                  </label>
                  <label className="flex-1 flex flex-col items-center p-4 border-2 border-dashed border-stone-300 rounded-2xl cursor-pointer hover:bg-stone-50 text-sm font-bold text-stone-600 bg-white transition-colors">
                    <Upload className="w-6 h-6 mb-2 text-stone-400" /> 
                    {isUploading.ktpUrl ? 'Uploading...' : formData.ktpUrl ? 'KTP OK' : 'Foto KTP'}
                    <input required={!formData.ktpUrl} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'ktpUrl')} />
                  </label>
               </div>
               <div><label className="block text-xs font-bold text-stone-600 mb-1">Username (Login)</label><input required type="text" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-rose-500 transition-colors" /></div>
               <div><label className="block text-xs font-bold text-stone-600 mb-1">Password</label><input required type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-rose-500 transition-colors" /></div>
               <div><label className="block text-xs font-bold text-stone-600 mb-1">Nama Sesuai KTP</label><input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-rose-500 transition-colors" /></div>
               <div>
                 <label className="block text-xs font-bold text-stone-600 mb-1">NIK & WhatsApp</label>
                 <div className="flex gap-2">
                   <input required type="number" placeholder="NIK" value={formData.identity} onChange={e=>setFormData({...formData, identity: e.target.value})} className="w-1/2 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-rose-500 transition-colors" />
                   <input required type="tel" placeholder="WA" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-1/2 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-rose-500 transition-colors" />
                 </div>
               </div>
               <button type="submit" className={`w-full ${cTheme.bg} text-white py-4 rounded-xl font-bold shadow-lg mt-6 hover:brightness-110 transition-all active:scale-95`}>Daftar Sekarang</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. KOMPONEN PROFIL MEMBER (DASHBOARD PELANGGAN)
// ============================================================================
export const MemberProfileView = () => {
  const { db, loggedInMember, memberLogout, cTheme, redeemPrize, addToCart } = useContext(AppStateContext);
  const [tab, setTab] = useState('wishlist');
  
  if (!loggedInMember) return null;
  
  const myOrders = (db.orders||[]).filter(o => o.memberId === loggedInMember.id);
  const myWishlist = (db.products||[]).filter(p => (loggedInMember.wishlist||[]).includes(p.id));

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-down flex flex-col lg:flex-row gap-8 w-full">
      {/* Kolom Kiri: Profil & Poin */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 text-center sticky top-24">
          {loggedInMember.photoUrl ? (
            <img src={loggedInMember.photoUrl} alt="Pic" className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-stone-100 shadow-md" />
          ) : (
            <div className="w-32 h-32 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md">
              <User className="w-12 h-12 text-stone-300"/>
            </div>
          )}
          <h2 className="text-2xl font-serif font-bold text-stone-900">{String(loggedInMember.name)}</h2>
          <p className="text-sm font-mono text-stone-500 bg-stone-50 px-3 py-1 rounded-full border border-stone-200 mt-2">{String(loggedInMember.id)}</p>
          
          <div className="w-full mt-8 bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-2xl p-6 shadow-inner">
            <p className="text-xs font-bold text-rose-800 uppercase tracking-widest mb-2">Total Poin Reward</p>
            <div className="text-4xl font-bold text-rose-600 flex items-center justify-center gap-3">
              <Award className="w-8 h-8"/> {loggedInMember.points}
            </div>
          </div>
          
          <button onClick={memberLogout} className="w-full mt-8 py-3.5 bg-stone-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-black shadow-lg transition-colors active:scale-95">
            <LogOut className="w-5 h-5"/> Keluar Akun
          </button>
        </div>
      </div>

      {/* Kolom Kanan: Konten Utama */}
      <div className="flex-grow bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto no-scrollbar">
           <button onClick={() => setTab('wishlist')} className={`flex-1 min-w-[120px] py-5 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${tab === 'wishlist' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white` : 'text-stone-500 hover:bg-stone-100'}`}><Heart className="w-4 h-4"/> Wishlist</button>
           <button onClick={() => setTab('history')} className={`flex-1 min-w-[120px] py-5 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${tab === 'history' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white` : 'text-stone-500 hover:bg-stone-100'}`}><Clock className="w-4 h-4"/> Riwayat</button>
           <button onClick={() => setTab('rewards')} className={`flex-1 min-w-[120px] py-5 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${tab === 'rewards' ? `${cTheme.text} border-b-2 ${cTheme.border} bg-white` : 'text-stone-500 hover:bg-stone-100'}`}><Gift className="w-4 h-4"/> Hadiah</button>
        </div>
        
        <div className="p-6 md:p-8 min-h-[400px]">
          {/* TAB 1: WISHLIST */}
          {tab === 'wishlist' && (
            <div className="space-y-6 animate-fade-in-down">
              <h3 className="font-bold text-xl text-stone-800 mb-6">Lemari Impian (Wishlist)</h3>
              {myWishlist.length === 0 ? (
                <div className="text-center py-16 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                  <Heart className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                  <p className="text-stone-500">Belum ada barang yang disimpan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {myWishlist.map(p => (
                    <div key={p.id} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm relative hover:shadow-md transition-shadow">
                      {p.discountPrice > 0 && <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded z-10">SALE</span>}
                      <img src={p.images?.[0] || 'https://placehold.co/400?text=No+Image'} className="w-full h-40 object-cover rounded-xl mb-4 bg-stone-100" alt={String(p.name)}/>
                      <h4 className="font-bold text-stone-800 truncate">{String(p.name)}</h4>
                      <p className={`${cTheme.text} font-bold mt-1 mb-4`}>{formatRupiah(p.discountPrice > 0 ? p.discountPrice : p.price)}</p>
                      <button onClick={() => addToCart(p, Object.keys(p.sizes||{})[0] || 'All Size')} className={`w-full py-2.5 rounded-xl font-bold text-white transition-all hover:brightness-110 active:scale-95 ${cTheme.bg}`}>Sewa Sekarang</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTORY */}
          {tab === 'history' && (
            <div className="space-y-6 animate-fade-in-down">
              <h3 className="font-bold text-xl text-stone-800 mb-6">Riwayat Transaksi</h3>
              {myOrders.length === 0 ? (
                <div className="text-center py-16 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                  <Clock className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                  <p className="text-stone-500">Belum ada riwayat transaksi.</p>
                </div>
              ) : 
                myOrders.map(o => (
                  <div key={o.id} className="border border-stone-200 p-6 rounded-2xl bg-stone-50 hover:bg-white transition-colors shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-stone-200">
                       <span className="font-mono text-stone-600 font-bold">{String(o.id)}</span>
                       <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border ${
                          o.status === 'Selesai' ? 'bg-green-50 text-green-700 border-green-200' :
                          o.status === 'Dibatalkan' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-stone-600 border-stone-300'
                       }`}>{String(o.status)}</span>
                    </div>
                    {o.items.map((i, idx) => (
                      <div key={idx} className="text-sm font-medium text-stone-800 mb-2 flex justify-between">
                        <span>{i.quantity}x {String(i.name)} <span className="text-stone-400 font-normal ml-1">(Ukuran: {i.size})</span></span>
                      </div>
                    ))}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end mt-6 pt-4 border-t border-stone-200 gap-4">
                       <div>
                         <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Total Biaya</p>
                         <p className="font-bold text-stone-900 text-xl">{formatRupiah(o.total)}</p>
                       </div>
                       {o.earnedPoints > 0 && (
                         <p className="text-sm font-bold text-rose-600 bg-rose-100 px-4 py-2 rounded-xl flex items-center justify-center gap-2">
                           <Award className="w-4 h-4"/> + {o.earnedPoints} Poin
                         </p>
                       )}
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* TAB 3: REWARDS */}
          {tab === 'rewards' && (
            <div className="animate-fade-in-down">
              <h3 className="font-bold text-xl text-stone-800 mb-6">Tukar Poin Hadiah</h3>
              {(db.prizes||[]).length === 0 ? (
                <div className="text-center py-16 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                  <Gift className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                  <p className="text-stone-500">Katalog hadiah belum tersedia.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {(db.prizes||[]).map(p => {
                    const canRedeem = loggedInMember.points >= p.points;
                    return (
                      <div key={p.id} className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow">
                        <div className="h-40 bg-stone-100"><img src={p.image || 'https://placehold.co/400'} className="w-full h-full object-cover" alt="prize"/></div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h4 className="font-bold text-stone-800 text-lg mb-2">{String(p.name)}</h4>
                          <p className="text-sm text-stone-500 mb-6 flex-grow">{String(p.desc)}</p>
                          <div className="flex items-center justify-between border-t border-stone-100 pt-4 mt-auto">
                             <span className="font-bold text-rose-600 flex items-center gap-1 text-lg"><Award className="w-5 h-5"/> {p.points}</span>
                             <button onClick={() => redeemPrize(p)} disabled={!canRedeem} className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${canRedeem ? `${cTheme.bg} text-white hover:brightness-110 active:scale-95` : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>
                                Tukar
                             </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};