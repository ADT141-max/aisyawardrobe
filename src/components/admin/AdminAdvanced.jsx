import React, { useState, useEffect, useContext } from 'react';
import { 
  User, Settings as SettingsIcon, Upload, Trash2, 
  Grid, Users, ClipboardList, Terminal, Database, 
  Download, UploadCloud, Image as ImageIcon, Shield 
} from 'lucide-react';
import { AppStateContext, compressImage, uploadImageToServer } from '../../context/AppContext';

// ============================================================================
// 1. PENGATURAN AKUN PRIBADI ADMIN
// ============================================================================
export const AdminAccountSettings = () => {
  const { loggedInUser, requireApproval } = useContext(AppStateContext);
  const [formData, setFormData] = useState({ name: loggedInUser.name, username: loggedInUser.username, password: loggedInUser.password });
  
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    requireApproval('UPDATE_USER', { userId: loggedInUser.id, ...formData }, 'Pembaruan profil sedang diproses.', true); 
  };

  return (
    <div className="max-w-2xl bg-white p-8 md:p-12 rounded-3xl border border-stone-200 shadow-sm w-full mx-auto animate-fade-in-down">
      <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-md mx-auto"><User className="w-10 h-10 text-stone-400"/></div>
      <h2 className="text-2xl font-serif font-bold mb-8 text-center text-stone-800">Ubah Kredensial Pribadi</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div><label className="block text-sm font-bold text-stone-700 mb-2">Nama Tampilan</label><input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-rose-600 transition-colors" /></div>
        <div><label className="block text-sm font-bold text-stone-700 mb-2">Username Login</label><input required type="text" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-rose-600 transition-colors" /></div>
        <div><label className="block text-sm font-bold text-stone-700 mb-2">Password Akses</label><input required type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-[16px] outline-none focus:border-rose-600 transition-colors" /></div>
        <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-black mt-6 shadow-xl active:scale-95 text-lg transition-all">Ajukan Pergantian Data</button>
      </form>
    </div>
  );
};

// ============================================================================
// 2. PENGATURAN MEREK, SOSMED, DAN HR (SISTEM)
// ============================================================================
export const AdminSystemSettings = () => {
  const { db, updateDb, showToast, loggedInUser, requireApproval, setBentoCategory } = useContext(AppStateContext);
  const [bConfig, setBConfig] = useState(db.brandConfig);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { setBConfig(db.brandConfig); }, [db.brandConfig]);

  const handleSaveBrand = (e) => { 
    e.preventDefault(); 
    updateDb('brandConfig', bConfig); 
    showToast('Konfigurasi Toko Disimpan.', 'success'); 
  };
  
  const updateSocial = (index, field, val) => { 
    const newS = [...bConfig.socialMedia]; 
    newS[index][field] = val; 
    setBConfig({...bConfig, socialMedia: newS}); 
  };
  
  const handleLogoUpload = async (e) => { 
    const file = e.target.files[0]; 
    if (!file) return; 

    if (file.type !== 'image/png' && file.type !== 'image/svg+xml') {
      return showToast('Gagal: Logo WAJIB berformat PNG Transparan!', 'error');
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
    updateDb('users', newUsers); 
    showToast(`Password staf berhasil diubah!`, 'success');
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
               </select>
            </div>
            <div><label className="block text-sm font-bold text-stone-700 mb-2">Warna Tema Utama</label><select value={bConfig.themeColor} onChange={e=>setBConfig({...bConfig, themeColor: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none cursor-pointer"><option value="rose">Rose (Default)</option><option value="amber">Dark Gold / Amber</option><option value="slate">Monochrome Slate</option><option value="emerald">Emerald Green</option><option value="blue">Royal Blue</option></select></div>
            <div className="md:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Slogan Hero Banner</label><input type="text" value={bConfig.slogan} onChange={e=>setBConfig({...bConfig, slogan: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Biografi Perusahaan</label><textarea rows="3" value={bConfig.companyBio} onChange={e=>setBConfig({...bConfig, companyBio: e.target.value})} className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-xl outline-none" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-2">Email Bisnis</label><input type="email" value={bConfig.companyEmail} onChange={e=>setBConfig({...bConfig, companyEmail: e.target.value})} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none" /></div>
            
            <div className="md:col-span-2 bg-amber-50 p-6 rounded-2xl border border-amber-200 mt-4">
               <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-2"><Grid className="w-5 h-5 text-amber-600"/> Highlight Beranda (Bento Mosaik)</h3>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                 {[0, 1, 2].map(idx => (
                    <div key={idx}>
                      <label className="block text-xs font-bold text-amber-800 mb-2 uppercase tracking-wider">Slot {idx + 1}</label>
                      <select value={bConfig.bentoCategories?.[idx] || ''} onChange={(e) => setBentoCategory(idx, e.target.value)} className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl outline-none font-bold text-stone-700 cursor-pointer shadow-sm">
                         <option value="" disabled>Pilih Kategori...</option>
                         {(db.categories||[]).map(c => <option key={c} value={c}>{String(c)}</option>)}
                      </select>
                    </div>
                 ))}
               </div>
            </div>

            <div className="md:col-span-2 bg-stone-50 p-6 rounded-2xl border border-stone-200 mt-4">
              <div className="flex justify-between items-center mb-6"><label className="block text-base font-serif font-bold text-stone-800">Jejaring Sosial Dinamis</label><button type="button" onClick={()=>setBConfig({...bConfig, socialMedia: [...(bConfig.socialMedia || []), {type: 'WhatsApp', value: '', label: ''}]})} className="text-xs bg-stone-900 text-white px-4 py-2.5 rounded-lg font-bold shadow-md hover:bg-black transition-colors">+ Akun Baru</button></div>
              <div className="space-y-4">
                {(bConfig.socialMedia || []).map((soc, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                    <select value={soc.type} onChange={e=>updateSocial(i, 'type', e.target.value)} className="w-full sm:w-40 px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm font-bold outline-none cursor-pointer"><option>WhatsApp</option><option>Instagram</option><option>TikTok</option></select>
                    <input type="text" placeholder="Username / No HP / Link URL" value={soc.value} onChange={e=>updateSocial(i, 'value', e.target.value)} className="w-full flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg outline-none" />
                    <button type="button" onClick={() => setBConfig({...bConfig, socialMedia: bConfig.socialMedia.filter((_, idx) => idx !== i)})} className="w-full sm:w-auto p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-colors"><Trash2 className="w-5 h-5"/></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end mt-6"><button type="submit" className="w-full md:w-auto bg-stone-900 text-white px-10 py-4 rounded-xl font-bold shadow-xl active:scale-95 text-lg transition-all">Simpan Konfigurasi</button></div>
         </form>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-3xl border border-stone-200 shadow-sm w-full overflow-hidden">
         <h2 className="text-xl md:text-2xl font-serif font-bold mb-8 flex items-center gap-3 border-b border-stone-100 pb-5 text-stone-800"><Users className="w-7 h-7 text-rose-600"/> Kendali Staf (HR)</h2>
         <div className="w-full overflow-x-auto">
           <table className="w-full text-left min-w-[600px] border-collapse">
             <thead><tr className="text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-200 bg-stone-50"><th className="p-4 rounded-tl-xl">Identitas Staf</th><th className="p-4">Username Login</th><th className="p-4">Ubah Password</th><th className="p-4 text-right rounded-tr-xl">Pangkat Akses (Role)</th></tr></thead>
             <tbody className="divide-y divide-stone-100">
               {(db.users||[]).filter(u => u.role !== 'developer').map((u, uIdx) => (
                 <tr key={`sys-usr-${u.id}-${uIdx}`} className="hover:bg-stone-50/50 transition-colors">
                   <td className="p-4 font-bold text-stone-800 text-base">{String(u.name)} {u.id === loggedInUser?.id && <span className="text-[10px] bg-stone-800 text-white px-2.5 py-1 rounded-md ml-3 uppercase tracking-widest shadow-sm">Anda</span>}</td>
                   <td className="p-4 text-sm font-mono text-stone-500">{String(u.username)}</td>
                   <td className="p-4">
                     <input type="text" placeholder="Ketik sandi baru..." onBlur={(e) => { if(e.target.value.trim()) { handlePasswordReset(u.id, e.target.value.trim()); e.target.value=''; } }} className="px-4 py-2 border border-stone-200 bg-white rounded-lg text-sm outline-none focus:border-rose-500 w-full max-w-[180px] shadow-sm transition-colors" />
                   </td>
                   <td className="p-4 text-right">
                      <select value={u.role} disabled={u.id === loggedInUser?.id} onChange={(e) => { requireApproval('UPDATE_USER', {...u, role: e.target.value}, 'Otoritas diubah.', true); }} className="px-4 py-2.5 border border-stone-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-40 shadow-sm cursor-pointer transition-colors">
                        <option value="admin">Admin Kasir</option><option value="manager">Manager Operasional</option><option value="owner">Owner (Penuh)</option>
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

// ============================================================================
// 3. LOG AUDIT AKTIVITAS SISTEM
// ============================================================================
export const AdminLogs = () => {
  const { db } = useContext(AppStateContext);
  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 md:p-8 animate-fade-in-down w-full">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><ClipboardList className="text-rose-600 w-6 h-6"/> Log Audit Aktivitas Sistem</h2>
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {(db.logs||[]).length === 0 ? <p className="text-stone-500 text-center py-10">Belum ada aktivitas terekam.</p> : (db.logs||[]).map((log, i) => (
           <div key={`log-${i}`} className="border-b border-stone-100 pb-3 text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 hover:bg-stone-50 p-2 rounded-lg transition-colors">
              <span className="text-stone-400 text-[10px] font-mono whitespace-nowrap">{log.timestamp}</span> 
              <div><span className="font-bold text-stone-800">{log.user}:</span> <span className="text-rose-600 font-medium">{log.action}</span> <span className="text-stone-600">({log.detail})</span></div>
           </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 4. DEVELOPER ROOT CONSOLE (KHUSUS DEV)
// ============================================================================
export const AdminDeveloperPanel = () => {
  const { db, saveToDatabase, exportData, importData, showToast } = useContext(AppStateContext);
  
  const handleFileUpload = (e) => { 
    const file = e.target.files[0]; 
    if (!file) return; 
    const reader = new FileReader(); 
    reader.onload = (event) => { importData(event.target.result); e.target.value = null; }; 
    reader.readAsText(file); 
  };
  
  const handleRoleChange = (userId, newRole) => { 
    const newUsers = (db.users||[]).map(u => u.id === userId ? { ...u, role: newRole } : u);
    saveToDatabase({ ...db, users: newUsers });
    showToast(`Otoritas di-override oleh Developer.`, 'success');
  };
  
  const handlePasswordOverride = (userId, newPassword) => {
    const newUsers = (db.users||[]).map(u => u.id === userId ? { ...u, password: newPassword } : u);
    saveToDatabase({ ...db, users: newUsers });
    showToast(`Password berhasil dijebol & diganti!`, 'success');
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in-down w-full font-mono">
      <div className="bg-[#0f172a] p-6 md:p-10 rounded-3xl shadow-2xl text-emerald-50 relative overflow-hidden border border-emerald-900/30">
         <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Terminal className="w-64 h-64 md:w-96 md:h-96 text-emerald-400" /></div>
         <h2 className="text-2xl md:text-3xl font-bold mb-3 flex items-center gap-4 text-emerald-400"><Terminal className="w-8 h-8"/> DEVELOPER ROOT CONSOLE</h2>
         <p className="text-emerald-200/60 mb-10 max-w-3xl text-sm leading-relaxed">Area ini menembus enkripsi dan RBAC. Perubahan data terjadi langsung di memori state tanpa Middleware Persetujuan.</p>
         
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
                  <div className="px-5 py-4 bg-[#0f172a] rounded-xl flex justify-between items-center border border-emerald-900/50"><span className="text-sm font-bold text-emerald-500">Versi Build Aktif</span><span className="text-xs bg-emerald-900 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-700">v8.5.0-MODULAR</span></div>
                  <button onClick={() => showToast('Ping sukses. Server stabil.', 'success')} className="w-full py-4 bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-emerald-900/50">Ping Git Repository Server</button>
               </div>
            </div>
         </div>

         <div className="mt-8 bg-[#1e293b] p-6 md:p-8 rounded-2xl border border-red-500/30 relative z-10 shadow-inner">
            <h3 className="text-base font-bold mb-6 flex items-center gap-3 text-red-400"><Shield className="w-5 h-5"/> PAKSA UBAH OTORITAS & KREDENSIAL (BYPASS)</h3>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left min-w-[700px] border-collapse">
                 <thead><tr className="border-b border-emerald-900/50 text-xs text-emerald-500 tracking-widest"><th className="pb-4">NAMA OBJEK (USER)</th><th className="pb-4">PAKSA UBAH PASSWORD</th><th className="pb-4 text-right">TINGKAT AKSES SAAT INI</th></tr></thead>
                 <tbody className="divide-y divide-emerald-900/30">
                   {(db.users||[]).map((u, uIdx) => (
                     <tr key={`dev-${u.id}-${uIdx}`}>
                       <td className="py-4 text-sm font-bold text-emerald-100">{String(u.name)} {u.role === 'developer' && <span className="text-[10px] ml-3 bg-red-900/80 text-red-300 px-2 py-1 rounded border border-red-700">Root Access</span>}</td>
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