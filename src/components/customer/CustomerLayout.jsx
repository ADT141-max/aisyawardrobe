import React, { useState, useContext } from 'react';
import { 
  Menu, Package, User, ShoppingCart, MoreVertical, 
  Shield, Home, X, ChevronRight, FileText, MessageCircle 
} from 'lucide-react';
import { AppStateContext, getSocialLink } from '../../context/AppContext';

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

export const CustomerLayout = ({ children }) => {
  const { view, setView, cart, db, cTheme, loggedInUser, loggedInMember } = useContext(AppStateContext);
  const [showNav, setShowNav] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-10 flex flex-col">
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-3 h-16 flex items-center justify-between">
          <button onClick={() => setShowNav(true)} className="md:hidden p-2 text-stone-600">
            <Menu className="w-6 h-6"/>
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('dashboard')}>
            {db.brandConfig.logoUrl ? (
              <img src={db.brandConfig.logoUrl} className="h-9 object-contain group-hover:scale-105 transition-transform" alt="Logo"/>
            ) : db.brandConfig.appIcon ? (
              <span className="text-3xl group-hover:scale-105 transition-transform">{String(db.brandConfig.appIcon)}</span>
            ) : (
              <Package className={`w-8 h-8 ${cTheme.text}`} />
            )}
            <span style={{ fontFamily: db.brandConfig.logoFont || 'Playfair Display' }} className="text-2xl font-bold text-stone-900 tracking-wide hidden sm:block">
              {String(db.brandConfig.appName)}
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
            <button onClick={() => setShowAdminMenu(!showAdminMenu)} className="p-2.5 rounded-full transition-colors text-stone-500 hover:text-stone-800 hover:bg-stone-100">
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

      <main className="max-w-6xl mx-auto px-4 py-8 relative flex-grow">
         {children}
         <FloatingWA />
      </main>

      <footer className="bg-stone-900 text-stone-400 py-12 mt-auto border-t-4 border-amber-600">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => setView('dashboard')}>
               {db.brandConfig.logoUrl ? (
                 <img src={db.brandConfig.logoUrl} alt="Logo" className="h-8 object-contain" />
               ) : db.brandConfig.appIcon ? (
                 <span className="text-3xl">{String(db.brandConfig.appIcon)}</span>
               ) : (
                 <Package className={`w-8 h-8 text-amber-500`} />
               )}
               <span style={{ fontFamily: db.brandConfig.logoFont || 'Playfair Display' }} className="text-2xl font-bold text-white tracking-wider">
                 {String(db.brandConfig.appName)}
               </span>
            </div>
            <p className="text-sm leading-relaxed pr-4 font-light text-stone-400">{String(db.brandConfig.companyBio)}</p>
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
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-300"><FileText className="w-4 h-4"/></div> 
                {String(db.brandConfig.companyEmail)}
              </li>
              {(db.brandConfig.socialMedia || []).map((soc, idx) => (
                <li key={`ft-soc-${idx}`} className="flex items-center gap-3">
                  <a href={getSocialLink(soc.type, soc.value)} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-300">
                      <span className="font-bold text-xs uppercase">{String(soc.type).charAt(0)}</span>
                    </div>
                    <span className="font-medium text-stone-300">{String(soc.type)}:</span> <span className="underline decoration-stone-600 underline-offset-4">{String(soc.value)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-12 pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} {String(db.brandConfig.appName)}. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
};