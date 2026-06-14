import React, { useState, useMemo, useEffect, useContext } from 'react';
import { 
  ChevronRight, Heart, ShoppingCart, X, ChevronLeft, 
  Grid, Tag, Star, Sparkles, Package, ExternalLink 
} from 'lucide-react';
import { AppStateContext, formatRupiah } from '../../context/AppContext';

// ============================================================================
// KOMPONEN: SKELETON LOADING (EFEK BAYANGAN UNTUK PELANGGAN BARU)
// ============================================================================
const ProductSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col animate-pulse">
    <div className="h-64 bg-stone-200"></div>
    <div className="p-6 flex flex-col flex-grow">
      <div className="h-6 bg-stone-200 rounded-full w-3/4 mb-3"></div>
      <div className="h-4 bg-stone-200 rounded-full w-1/3 mb-5"></div>
      <div className="h-8 bg-stone-200 rounded-full w-1/2 mb-5"></div>
      <div className="h-3 bg-stone-200 rounded-full w-full mb-2"></div>
      <div className="h-3 bg-stone-200 rounded-full w-5/6 mb-6"></div>
      <div className="mt-auto pt-5 border-t border-stone-100 flex justify-between items-center">
         <div className="h-4 bg-stone-200 rounded-full w-1/4"></div>
         <div className="h-10 bg-stone-200 rounded-full w-1/3"></div>
      </div>
    </div>
  </div>
);

const SkeletonGrid = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
    {Array.from({ length: count }).map((_, i) => <ProductSkeleton key={`skel-${i}`} />)}
  </div>
);

// ============================================================================
// KOMPONEN: MICRO-SLIDESHOW BENTO BOX (BERANDA)
// ============================================================================
export const BentoCategoryBox = ({ categoryName, className }) => {
  const { db, setView } = useContext(AppStateContext);
  const [currentIdx, setCurrentIdx] = useState(0);

  const categoryImages = useMemo(() => {
    const productsInCat = (db.products || []).filter(p => p.category === categoryName && p.status !== 'Maintenance');
    let images = [];
    productsInCat.forEach(p => { if (p.images && p.images.length > 0) images.push(p.images[0]); else if(p.image) images.push(p.image); });
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
         <div key={`bento-img-${idx}`} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 group-hover:scale-110 ease-in-out ${idx === currentIdx ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url(${img})` }}></div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      
      <div className="absolute bottom-6 left-6 right-6">
         <div className="bg-white/20 backdrop-blur-md border border-white/30 p-5 rounded-2xl flex items-center justify-between group-hover:bg-amber-600/90 group-hover:border-amber-500 transition-colors duration-300">
            <div>
               <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-amber-100 transition-colors">Koleksi Terpilih</p>
               <h3 className="text-2xl font-serif font-bold text-white leading-none">{String(categoryName || 'Kategori')}</h3>
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
export const ProductCardItem = ({ product, openDetail }) => {
  const { getAvailableStock, cTheme, loggedInMember, toggleWishlist } = useContext(AppStateContext);
  const avail = getAvailableStock(product.id);
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
              <img key={`pc-img-${idx}`} src={img} alt={`${String(product.name)}`} className="w-full h-full object-cover shrink-0 snap-center lg:group-hover:scale-110 transition-transform duration-700" />
            ))}
          </div>
        ) : (
          <img src={product.images?.[0] || product.image || 'https://placehold.co/400?text=No+Image'} alt={String(product.name)} className="w-full h-full object-cover lg:group-hover:scale-110 transition-transform duration-700" />
        )}
        
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
           <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold text-stone-800 uppercase tracking-wider shadow-sm pointer-events-none">{String(product.category)}</div>
           {isPromo && <div className="bg-red-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse z-10 pointer-events-none">SALE</div>}
        </div>
        
        {avail === 0 && <div className="absolute inset-0 z-10 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center pointer-events-none"><span className="bg-red-600 text-white px-6 py-2.5 rounded-full font-bold uppercase tracking-wider">Stok Habis</span></div>}
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
           <h3 className="font-serif font-bold text-xl text-stone-900 leading-tight group-hover:text-amber-600 transition-colors pr-2">{String(product.name)}</h3>
        </div>
        
        <div className="flex gap-2 items-center mb-4">
          <p className="text-[10px] text-stone-400 font-mono bg-stone-50 px-2 py-1 rounded w-max">{String(product.id)}</p>
        </div>

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
        
        <div className="flex flex-col flex-grow"><p className={`text-sm text-stone-500 font-light flex-grow mb-6 line-clamp-2`}>{String(product.desc)}</p></div>

        <div className="mt-auto pt-5 border-t border-stone-100 flex items-center justify-between">
          <span className="text-sm text-stone-500 font-medium">Sisa: {avail} Pcs</span>
          <button className={`px-5 py-2.5 rounded-full font-bold transition-all active:scale-95 flex items-center gap-2 ${avail > 0 ? `${cTheme.bg} text-white shadow-md hover:shadow-lg` : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>Detail & Sewa</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// VIEWS (DASHBOARD & CATALOG)
// ============================================================================
export const DashboardView = () => {
  const { setView, db, cTheme, getAvailableStock, cart, addToCart, toggleWishlist, loggedInMember, isDbLoading } = useContext(AppStateContext);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');

  const promoProducts = useMemo(() => { return (db.products||[]).filter(p => p.discountPrice > 0 && p.status !== 'Maintenance').slice(0, 4); }, [db.products]);
  const bestSellerIds = useMemo(() => { const counts = {}; (db.orders||[]).filter(o => o.status === 'Selesai').forEach(o => { o.items.forEach(i => { counts[i.id] = (counts[i.id] || 0) + i.quantity; }); }); return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(e=>e[0]); }, [db.orders]);
  const bestSellers = useMemo(() => { return (db.products||[]).filter(p => bestSellerIds.includes(p.id) && p.status !== 'Maintenance').sort((a,b) => bestSellerIds.indexOf(a.id) - bestSellerIds.indexOf(b.id)).slice(0, 4); }, [db.products, bestSellerIds]);
  const latestProducts = useMemo(() => { return (db.products||[]).filter(p => p.status !== 'Maintenance').slice(-4).reverse(); }, [db.products]);
  const displayProducts = bestSellers.length > 0 ? bestSellers : latestProducts;

  const openDetail = (product) => { setSelectedDetail(product); setCurrentImgIdx(0); setSelectedSize(''); };
  const closeDetail = () => setSelectedDetail(null);

  const renderDetailModal = () => {
    if (!selectedDetail) return null;
    const hasDiscount = selectedDetail.discountPrice > 0;
    const sizesObj = selectedDetail.sizes || { 'All Size': selectedDetail.totalStock };
    const availForSelected = selectedSize ? getAvailableStock(selectedDetail.id, selectedSize) : 0;
    const inCartForSelected = selectedSize ? (cart.find(i => i.cartId === `${selectedDetail.id}-${selectedSize}`)?.quantity || 0) : 0;
    const canAddSelected = selectedSize && (availForSelected > inCartForSelected);
    const imagesToUse = selectedDetail.images || (selectedDetail.image ? [selectedDetail.image] : ['https://placehold.co/400?text=No+Image']);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm" onClick={closeDetail}>
           <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-fade-in-down" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-stone-100 relative group flex-shrink-0">
                 <img src={imagesToUse[currentImgIdx]} className="w-full h-full object-cover" alt="Detail" />
                 {imagesToUse.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === 0 ? imagesToUse.length - 1 : prev - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-5 h-5"/></button>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === imagesToUse.length - 1 ? 0 : prev + 1); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-5 h-5"/></button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-stone-900/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                         {imagesToUse.map((_, idx) => <button key={`mdl-img-${idx}`} onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(idx); }} className={`w-2 h-2 rounded-full transition-all ${idx === currentImgIdx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`} /> )}
                      </div>
                    </>
                 )}
                 <button onClick={closeDetail} className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full md:hidden text-stone-800 shadow-sm"><X className="w-5 h-5"/></button>
              </div>

              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-start mb-2"><span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">{String(selectedDetail.category)}</span><button onClick={closeDetail} className="hidden md:block p-2 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-500 transition-colors"><X className="w-5 h-5"/></button></div>
                  <h2 className="text-3xl font-serif font-bold text-stone-900 leading-tight mb-1">{String(selectedDetail.name)}</h2>
                  <p className="text-sm font-mono text-stone-400 mb-6">{String(selectedDetail.id)}</p>
                  
                  <div className="mb-8 bg-stone-50 p-5 rounded-2xl border border-stone-100 relative">
                      {hasDiscount && <span className="absolute -top-3 -right-3 bg-red-600 text-white font-bold px-4 py-1.5 rounded-full shadow-lg transform rotate-12">SALE</span>}
                      {hasDiscount ? (
                        <><p className="text-sm text-stone-400 line-through mb-1">Normal: {formatRupiah(selectedDetail.price)}</p><p className="text-red-600 font-bold text-3xl mb-2">{formatRupiah(selectedDetail.discountPrice)} <span className="text-sm font-light text-stone-500">/ hari</span></p></>
                      ) : (<p className={`${cTheme.text} font-bold text-3xl mb-2`}>{formatRupiah(selectedDetail.price)} <span className="text-sm font-light text-stone-500">/ hari</span></p>)}
                      {selectedDetail.deposit > 0 && <p className="text-xs font-bold text-amber-600 bg-amber-100/50 inline-block px-3 py-1.5 rounded-lg border border-amber-200">+ Deposit Jaminan: {formatRupiah(selectedDetail.deposit)}</p>}
                  </div>

                  <div className="mb-6">
                     <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-3">Pilih Ukuran</h4>
                     <div className="flex flex-wrap gap-3">
                       {Object.entries(sizesObj).map(([sz, qty]) => {
                          const szAvail = getAvailableStock(selectedDetail.id, sz);
                          const isSel = selectedSize === sz;
                          const isOut = szAvail <= 0;
                          return (
                            <button key={`mdl-sz-${sz}`} disabled={isOut} onClick={() => setSelectedSize(sz)} className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${isSel ? cTheme.bg + ' text-white border-transparent shadow-md' : isOut ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'}`}>
                              {sz} {isOut && <span className="block text-[10px] font-normal leading-none mt-1">Habis</span>}
                            </button>
                          )
                       })}
                     </div>
                  </div>

                  <div className="mb-8"><h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-3 border-b border-stone-100 pb-2">Deskripsi Pakaian</h4><p className="text-base text-stone-600 leading-relaxed font-light whitespace-pre-line">{String(selectedDetail.desc)}</p></div>
                  {selectedDetail.productLink && (<a href={selectedDetail.productLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-5 py-3 rounded-xl mb-8 w-full transition-colors"><ExternalLink className="w-4 h-4"/> Lihat Referensi Eksternal / Video</a>)}

                  <div className="mt-auto pt-6 border-t border-stone-100 space-y-4">
                      {selectedSize && (
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-stone-500 font-medium">Stok Ukuran {selectedSize}:</span>
                            <span className={`font-bold px-4 py-1.5 rounded-lg text-sm ${availForSelected > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{availForSelected} Pcs Tersedia</span>
                        </div>
                      )}
                      <div className="flex gap-3">
                          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(selectedDetail.id); }} className={`p-4 rounded-xl border border-stone-200 flex items-center justify-center transition-colors ${loggedInMember?.wishlist?.includes(selectedDetail.id) ? 'bg-rose-50 border-rose-200' : 'hover:bg-stone-50'}`}>
                              <Heart className={`w-6 h-6 ${loggedInMember?.wishlist?.includes(selectedDetail.id) ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(selectedDetail, selectedSize); closeDetail(); }} disabled={!canAddSelected} className={`flex-1 py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-lg shadow-lg ${canAddSelected ? `${cTheme.bg} text-white hover:brightness-110` : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>
                              <ShoppingCart className="w-5 h-5" /> Sewa Ukuran {selectedSize || '...'}
                          </button>
                      </div>
                  </div>
              </div>
           </div>
        </div>
    );
  };

  const bentoCats = db.brandConfig?.bentoCategories || ['Kebaya', 'Gaun', 'Jas'];

  return (
    <div className="space-y-12 md:space-y-16 animate-fade-in-down w-full flex-grow">
      {/* HEADER BANNER - Tampil Instan! */}
      <div className={`relative ${cTheme.bg} rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[400px] flex items-center`}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
        <div className="relative z-10 px-8 md:px-16 py-12 max-w-3xl">
          <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-widest mb-6">Pusat Sewa Pakaian Eksklusif</span>
          <h1 style={{ fontFamily: db.brandConfig.logoFont || 'Playfair Display' }} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-lg">{String(db.brandConfig.appName)}</h1>
          <p className="text-lg md:text-xl text-stone-200 mb-10 font-light max-w-xl leading-relaxed">{String(db.brandConfig.slogan)}</p>
          <div className="flex flex-wrap gap-4"><button onClick={() => setView('catalog')} className="bg-white text-stone-900 px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform shadow-xl flex items-center gap-2">Jelajahi Katalog <ChevronRight className="w-5 h-5"/></button></div>
        </div>
      </div>

      <div className="relative">
         <div className="flex justify-between items-end mb-8"><div><h2 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3"><Grid className="w-8 h-8 text-amber-500"/> Kategori Unggulan</h2><p className="text-stone-500 mt-2">Pilihan utama pelanggan untuk berbagai momen.</p></div></div>
         <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-6 h-[500px]"><BentoCategoryBox categoryName={bentoCats[0]} className="col-span-2 row-span-2" /><BentoCategoryBox categoryName={bentoCats[1]} className="col-span-1 row-span-1" /><BentoCategoryBox categoryName={bentoCats[2]} className="col-span-1 row-span-1" /></div>
         <div className="md:hidden flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x snap-mandatory"><BentoCategoryBox categoryName={bentoCats[0]} className="w-[85vw] h-[350px] shrink-0 snap-center" /><BentoCategoryBox categoryName={bentoCats[1]} className="w-[85vw] h-[350px] shrink-0 snap-center" /><BentoCategoryBox categoryName={bentoCats[2]} className="w-[85vw] h-[350px] shrink-0 snap-center" /></div>
      </div>

      {/* SKELETON EFFECT JIKA DATABASE SEDANG DIMUAT */}
      {isDbLoading && (!db.products || db.products.length === 0) ? (
        <div className="relative pt-10">
           <div className="mb-6"><h2 className="text-2xl font-serif font-bold text-stone-300">Menyiapkan Koleksi...</h2></div>
           <SkeletonGrid count={4} />
        </div>
      ) : (
        <>
          {promoProducts.length > 0 && (
            <div className="relative">
               <div className="flex justify-between items-end mb-8"><div><h2 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3"><Tag className="w-8 h-8 text-red-600"/> Penawaran Spesial</h2><p className="text-stone-500 mt-2">Dapatkan gaun dan setelan impianmu dengan harga khusus.</p></div><button onClick={() => setView('catalog')} className="hidden sm:flex text-rose-600 font-bold items-center hover:text-rose-800 transition-colors">Lihat Semua <ChevronRight className="w-4 h-4 ml-1"/></button></div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{promoProducts.map((p, idx) => <ProductCardItem key={`promo-${p.id}-${idx}`} product={p} openDetail={openDetail} />)}</div>
               <button onClick={() => setView('catalog')} className="w-full mt-6 sm:hidden border-2 border-stone-200 text-stone-700 font-bold py-3 rounded-xl hover:bg-stone-50">Lihat Semua Promo</button>
            </div>
          )}

          {displayProducts.length > 0 && (
            <div>
               <div className="flex justify-between items-end mb-8">
                  <div><h2 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">{bestSellers.length > 0 ? <><Star className="w-8 h-8 text-yellow-500 fill-yellow-500"/> Paling Diminati</> : <><Sparkles className="w-8 h-8 text-amber-500"/> Koleksi Terbaru</>}</h2><p className="text-stone-500 mt-2">Pilihan favorit para pelanggan untuk tampil memukau.</p></div>
                  <button onClick={() => setView('catalog')} className="hidden sm:flex text-rose-600 font-bold items-center hover:text-rose-800 transition-colors">Katalog Lengkap <ChevronRight className="w-4 h-4 ml-1"/></button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{displayProducts.map((p, idx) => <ProductCardItem key={`disp-${p.id}-${idx}`} product={p} openDetail={openDetail} />)}</div>
               <button onClick={() => setView('catalog')} className="w-full mt-6 sm:hidden border-2 border-stone-200 text-stone-700 font-bold py-3 rounded-xl hover:bg-stone-50">Lihat Semua Koleksi</button>
            </div>
          )}
        </>
      )}

      {renderDetailModal()}
    </div>
  );
};

export const CatalogView = () => {
  const { db, getAvailableStock, cTheme, loggedInMember, toggleWishlist, cart, addToCart, isDbLoading } = useContext(AppStateContext);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => { setPage(1); }, [activeCategory, searchQuery]);

  const safeCategories = (db.categories||[]).filter(c => typeof c === 'string');
  const filteredProducts = (db.products||[]).filter(p => p.status !== 'Maintenance' && (activeCategory === 'Semua' || p.category === activeCategory) && (String(p.name).toLowerCase().includes(searchQuery.toLowerCase()) || String(p.id).toLowerCase().includes(searchQuery.toLowerCase())));
  const paginatedProducts = filteredProducts.slice(0, page * ITEMS_PER_PAGE);

  const openDetail = (product) => { setSelectedDetail(product); setCurrentImgIdx(0); setSelectedSize(''); };
  const closeDetail = () => setSelectedDetail(null);

  const renderDetailModal = () => {
    // ... (Logika Modal sama seperti di atas, tidak diubah untuk menghemat ruang, biarkan tetap ada)
    if (!selectedDetail) return null;
    const hasDiscount = selectedDetail.discountPrice > 0;
    const sizesObj = selectedDetail.sizes || { 'All Size': selectedDetail.totalStock };
    const availForSelected = selectedSize ? getAvailableStock(selectedDetail.id, selectedSize) : 0;
    const inCartForSelected = selectedSize ? (cart.find(i => i.cartId === `${selectedDetail.id}-${selectedSize}`)?.quantity || 0) : 0;
    const canAddSelected = selectedSize && (availForSelected > inCartForSelected);
    const imagesToUse = selectedDetail.images || (selectedDetail.image ? [selectedDetail.image] : ['https://placehold.co/400?text=No+Image']);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm" onClick={closeDetail}>
           <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-fade-in-down" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-stone-100 relative group flex-shrink-0">
                 <img src={imagesToUse[currentImgIdx]} className="w-full h-full object-cover" alt="Detail" />
                 {imagesToUse.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === 0 ? imagesToUse.length - 1 : prev - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-5 h-5"/></button>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === imagesToUse.length - 1 ? 0 : prev + 1); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-5 h-5"/></button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-stone-900/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                         {imagesToUse.map((_, idx) => <button key={`mdl2-img-${idx}`} onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(idx); }} className={`w-2 h-2 rounded-full transition-all ${idx === currentImgIdx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`} /> )}
                      </div>
                    </>
                 )}
                 <button onClick={closeDetail} className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full md:hidden text-stone-800 shadow-sm"><X className="w-5 h-5"/></button>
              </div>

              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-start mb-2"><span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">{String(selectedDetail.category)}</span><button onClick={closeDetail} className="hidden md:block p-2 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-500 transition-colors"><X className="w-5 h-5"/></button></div>
                  <h2 className="text-3xl font-serif font-bold text-stone-900 leading-tight mb-1">{String(selectedDetail.name)}</h2>
                  <p className="text-sm font-mono text-stone-400 mb-6">{String(selectedDetail.id)}</p>
                  
                  <div className="mb-8 bg-stone-50 p-5 rounded-2xl border border-stone-100 relative">
                      {hasDiscount && <span className="absolute -top-3 -right-3 bg-red-600 text-white font-bold px-4 py-1.5 rounded-full shadow-lg transform rotate-12">SALE</span>}
                      {hasDiscount ? (
                        <><p className="text-sm text-stone-400 line-through mb-1">Normal: {formatRupiah(selectedDetail.price)}</p><p className="text-red-600 font-bold text-3xl mb-2">{formatRupiah(selectedDetail.discountPrice)} <span className="text-sm font-light text-stone-500">/ hari</span></p></>
                      ) : (<p className={`${cTheme.text} font-bold text-3xl mb-2`}>{formatRupiah(selectedDetail.price)} <span className="text-sm font-light text-stone-500">/ hari</span></p>)}
                      {selectedDetail.deposit > 0 && <p className="text-xs font-bold text-amber-600 bg-amber-100/50 inline-block px-3 py-1.5 rounded-lg border border-amber-200">+ Deposit Jaminan: {formatRupiah(selectedDetail.deposit)}</p>}
                  </div>

                  <div className="mb-6">
                     <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-3">Pilih Ukuran</h4>
                     <div className="flex flex-wrap gap-3">
                       {Object.entries(sizesObj).map(([sz, qty]) => {
                          const szAvail = getAvailableStock(selectedDetail.id, sz);
                          const isSel = selectedSize === sz;
                          const isOut = szAvail <= 0;
                          return (
                            <button key={`mdl2-sz-${sz}`} disabled={isOut} onClick={() => setSelectedSize(sz)} className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${isSel ? cTheme.bg + ' text-white border-transparent shadow-md' : isOut ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'}`}>
                              {sz} {isOut && <span className="block text-[10px] font-normal leading-none mt-1">Habis</span>}
                            </button>
                          )
                       })}
                     </div>
                  </div>

                  <div className="mb-8"><h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-3 border-b border-stone-100 pb-2">Deskripsi Pakaian</h4><p className="text-base text-stone-600 leading-relaxed font-light whitespace-pre-line">{String(selectedDetail.desc)}</p></div>
                  {selectedDetail.productLink && (<a href={selectedDetail.productLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-5 py-3 rounded-xl mb-8 w-full transition-colors"><ExternalLink className="w-4 h-4"/> Lihat Referensi Eksternal / Video</a>)}

                  <div className="mt-auto pt-6 border-t border-stone-100 space-y-4">
                      {selectedSize && (
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-stone-500 font-medium">Stok Ukuran {selectedSize}:</span>
                            <span className={`font-bold px-4 py-1.5 rounded-lg text-sm ${availForSelected > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{availForSelected} Pcs Tersedia</span>
                        </div>
                      )}
                      <div className="flex gap-3">
                          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(selectedDetail.id); }} className={`p-4 rounded-xl border border-stone-200 flex items-center justify-center transition-colors ${loggedInMember?.wishlist?.includes(selectedDetail.id) ? 'bg-rose-50 border-rose-200' : 'hover:bg-stone-50'}`}>
                              <Heart className={`w-6 h-6 ${loggedInMember?.wishlist?.includes(selectedDetail.id) ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(selectedDetail, selectedSize); closeDetail(); }} disabled={!canAddSelected} className={`flex-1 py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-lg shadow-lg ${canAddSelected ? `${cTheme.bg} text-white hover:brightness-110` : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>
                              <ShoppingCart className="w-5 h-5" /> Sewa Ukuran {selectedSize || '...'}
                          </button>
                      </div>
                  </div>
              </div>
           </div>
        </div>
    );
  };

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
          {safeCategories.map((cat, idx) => (
            <button key={`btn-cat-${idx}`} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${activeCategory === cat ? `${cTheme.bg} text-white shadow-md` : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}>{String(cat)}</button>
          ))}
        </div>

        {isDbLoading && (!db.products || db.products.length === 0) ? (
            <SkeletonGrid count={8} />
        ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
                <Package className="w-16 h-16 mx-auto mb-4 text-stone-300"/><h3 className="text-xl font-bold text-stone-800 mb-2">Katalog Kosong</h3><p className="text-stone-500">Saat ini belum ada produk yang cocok dengan pencarianmu.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProducts.map((p, idx) => <ProductCardItem key={`cat-pg-${p.id}-${idx}`} product={p} openDetail={openDetail} />)}
            </div>
        )}

        {!isDbLoading && filteredProducts.length > page * ITEMS_PER_PAGE && (
            <div className="flex justify-center mt-10">
               <button onClick={() => setPage(p => p + 1)} className="px-8 py-3.5 bg-stone-900 text-white font-bold rounded-full hover:bg-black shadow-lg active:scale-95 transition-all">Muat Lebih Banyak Koleksi</button>
            </div>
        )}
      </div>
      {renderDetailModal()}
    </>
  );
};