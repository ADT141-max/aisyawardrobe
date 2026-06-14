import React, { useState, useMemo, useEffect, useContext } from 'react';
import { 
  ChevronRight, Heart, ShoppingCart, X, ChevronLeft, 
  Grid, Tag, Star, Sparkles, Package, ExternalLink, Search 
} from 'lucide-react';
import { AppStateContext, formatRupiah } from '../../context/AppContext';

// ============================================================================
// KOMPONEN: SKELETON LOADING
// ============================================================================
const ProductSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col animate-pulse w-full">
    <div className="h-40 md:h-64 bg-stone-200 w-full"></div>
    <div className="p-4 md:p-6 flex flex-col flex-grow w-full">
      <div className="h-5 md:h-6 bg-stone-200 rounded-full w-3/4 mb-3"></div>
      <div className="h-3 md:h-4 bg-stone-200 rounded-full w-1/3 mb-4 md:mb-5"></div>
      <div className="h-6 md:h-8 bg-stone-200 rounded-full w-1/2 mb-4 md:mb-5"></div>
      <div className="h-2 md:h-3 bg-stone-200 rounded-full w-full mb-2"></div>
      <div className="h-2 md:h-3 bg-stone-200 rounded-full w-5/6 mb-4 md:mb-6"></div>
      <div className="mt-auto pt-4 md:pt-5 border-t border-stone-100 flex justify-between items-center w-full">
         <div className="h-3 md:h-4 bg-stone-200 rounded-full w-1/4"></div>
         <div className="h-8 md:h-10 bg-stone-200 rounded-full w-1/3"></div>
      </div>
    </div>
  </div>
);

const SkeletonGrid = ({ count = 4 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 w-full">
    {Array.from({ length: count }).map((_, i) => <ProductSkeleton key={`skel-${i}`} />)}
  </div>
);

// ============================================================================
// KOMPONEN: MICRO-SLIDESHOW BENTO BOX
// ============================================================================
export const BentoCategoryBox = ({ categoryName, className }) => {
  const { db, setView } = useContext(AppStateContext);
  const [currentIdx, setCurrentIdx] = useState(0);

  const categoryImages = useMemo(() => {
    const productsInCat = (db?.products || []).filter(p => p && p?.category === categoryName && p?.status !== 'Maintenance');
    let images = [];
    productsInCat.forEach(p => { if (p?.images && p.images.length > 0) images.push(p.images[0]); else if(p?.image) images.push(p.image); });
    return images.length > 0 ? images.slice(0, 5) : ['https://images.unsplash.com/photo-1550639524-a6f58345a278?q=80&w=800&auto=format&fit=crop']; 
  }, [db?.products, categoryName]);

  useEffect(() => {
    if (categoryImages.length <= 1) return;
    const interval = setInterval(() => { setCurrentIdx(prev => (prev + 1) % categoryImages.length); }, 3500);
    return () => clearInterval(interval);
  }, [categoryImages.length]);

  return (
    <div onClick={() => setView('catalog')} className={`relative overflow-hidden rounded-2xl md:rounded-3xl cursor-pointer group shadow-sm hover:shadow-xl transition-all duration-500 ${className}`}>
      {categoryImages.map((img, idx) => (
         <div key={`bento-img-${idx}`} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 group-hover:scale-110 ease-in-out ${idx === currentIdx ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url(${img})` }}></div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      
      <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
         <div className="bg-white/20 backdrop-blur-md border border-white/30 p-3 md:p-5 rounded-xl md:rounded-2xl flex items-center justify-between group-hover:bg-amber-600/90 group-hover:border-amber-500 transition-colors duration-300 w-full">
            <div className="overflow-hidden">
               <p className="text-white/80 text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5 md:mb-1 group-hover:text-amber-100 transition-colors truncate">Koleksi Terpilih</p>
               <h3 className="text-lg md:text-2xl font-serif font-bold text-white leading-none truncate pr-2">{String(categoryName || 'Kategori')}</h3>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white text-stone-900 flex shrink-0 items-center justify-center transform translate-x-2 md:translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
               <ChevronRight className="w-4 h-4 md:w-5 md:h-5"/>
            </div>
         </div>
      </div>
    </div>
  );
};

// ============================================================================
// KOMPONEN CARD PRODUK (RESPONSIF 2 KOLOM DI HP)
// ============================================================================
export const ProductCardItem = ({ product, openDetail }) => {
  const { getAvailableStock, cTheme, loggedInMember, toggleWishlist } = useContext(AppStateContext);
  
  if (!product) return null;

  const avail = product?.id ? getAvailableStock(product.id) : 0;
  const isWished = product?.id ? loggedInMember?.wishlist?.includes(product.id) : false;
  const isPromo = (product?.discountPrice || 0) > 0;
  const effPrice = isPromo ? product.discountPrice : (product?.price || 0);

  return (
    <div onClick={() => openDetail(product)} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group relative cursor-pointer w-full">
      <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} className="absolute top-2 left-2 md:top-4 md:left-4 z-20 p-1.5 md:p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:scale-110 transition-transform">
        <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isWished ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
      </button>

      <div className="h-44 sm:h-56 md:h-64 overflow-hidden relative bg-stone-100 w-full">
        {product?.images?.length > 1 ? (
          <div className="flex overflow-x-auto snap-x snap-mandatory h-full w-full no-scrollbar" onClick={e => e.stopPropagation()}>
            {product.images.map((img, idx) => (
              <img key={`pc-img-${idx}`} src={img} alt="Product" className="w-full h-full object-cover shrink-0 snap-center lg:group-hover:scale-110 transition-transform duration-700" />
            ))}
          </div>
        ) : (
          <img src={product?.images?.[0] || product?.image || 'https://placehold.co/400'} alt="Product" className="w-full h-full object-cover lg:group-hover:scale-110 transition-transform duration-700" />
        )}
        
        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col items-end gap-1 md:gap-2 max-w-[70%]">
           <div className="bg-white/90 backdrop-blur px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-bold text-stone-800 uppercase tracking-wider shadow-sm pointer-events-none truncate w-full text-right">{String(product?.category || 'Umum')}</div>
           {isPromo && <div className="bg-red-600 text-white px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse z-10 pointer-events-none">SALE</div>}
        </div>
        
        {avail === 0 && <div className="absolute inset-0 z-10 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center pointer-events-none"><span className="bg-red-600 text-white px-4 md:px-6 py-1.5 md:py-2.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider">Habis</span></div>}
      </div>
      
      <div className="p-3 md:p-6 flex flex-col flex-grow w-full">
        <div className="flex justify-between items-start mb-1 w-full overflow-hidden">
           <h3 className="font-serif font-bold text-sm md:text-xl text-stone-900 leading-tight group-hover:text-amber-600 transition-colors truncate w-full">{String(product?.name || '')}</h3>
        </div>
        
        <div className="flex gap-2 items-center mb-2 md:mb-4 w-full overflow-hidden">
          <p className="text-[8px] md:text-[10px] text-stone-400 font-mono bg-stone-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded truncate max-w-full">{String(product?.id || '')}</p>
        </div>

        <div className="mb-2 md:mb-4 w-full">
          {isPromo ? (
            <div className="flex flex-col w-full">
               <span className="text-[10px] md:text-xs text-stone-400 line-through truncate w-full">Rp {product?.price?.toLocaleString('id-ID')}</span>
               <p className="text-red-600 font-bold text-base md:text-xl truncate w-full">Rp {effPrice.toLocaleString('id-ID')} <span className="text-[10px] md:text-sm font-light text-stone-500">/ hr</span></p>
            </div>
          ) : (
            <p className={`${cTheme?.text || 'text-rose-600'} font-bold text-base md:text-xl truncate w-full`}>Rp {effPrice.toLocaleString('id-ID')} <span className="text-[10px] md:text-sm font-light text-stone-500">/ hr</span></p>
          )}
          {(product?.deposit || 0) > 0 && <p className="text-[8px] md:text-xs font-bold text-amber-600 bg-amber-50 inline-block px-1.5 md:px-2 py-0.5 md:py-1 rounded mt-1 md:mt-2 truncate max-w-full">+ Dep: Rp {product.deposit.toLocaleString('id-ID')}</p>}
        </div>
        
        <div className="flex flex-col flex-grow hidden md:flex w-full overflow-hidden"><p className={`text-sm text-stone-500 font-light flex-grow mb-6 line-clamp-2`}>{String(product?.desc || '')}</p></div>

        <div className="mt-auto pt-3 md:pt-5 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-0 w-full">
          <span className="text-[10px] md:text-sm text-stone-500 font-medium truncate w-full sm:w-auto">Sisa: {avail}</span>
          <button className={`w-full sm:w-auto px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-full text-xs md:text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1 md:gap-2 ${avail > 0 ? `${cTheme?.bg || 'bg-rose-600'} text-white shadow-md hover:shadow-lg` : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>Sewa</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// VIEWS: DASHBOARD (BERANDA UTAMA)
// ============================================================================
export const DashboardView = () => {
  const { setView, db, cTheme, getAvailableStock, cart, addToCart, toggleWishlist, loggedInMember, isDbLoading } = useContext(AppStateContext);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');

  const promoProducts = useMemo(() => { return (db?.products||[]).filter(p => p && p?.discountPrice > 0 && p?.status !== 'Maintenance').slice(0, 4); }, [db?.products]);
  const bestSellerIds = useMemo(() => { const counts = {}; (db?.orders||[]).filter(o => o && o?.status === 'Selesai').forEach(o => { (o?.items||[]).forEach(i => { if(i?.id) counts[i.id] = (counts[i.id] || 0) + (i?.quantity||1); }); }); return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(e=>e[0]); }, [db?.orders]);
  const bestSellers = useMemo(() => { return (db?.products||[]).filter(p => p && bestSellerIds.includes(p.id) && p?.status !== 'Maintenance').sort((a,b) => bestSellerIds.indexOf(a.id) - bestSellerIds.indexOf(b.id)).slice(0, 4); }, [db?.products, bestSellerIds]);
  const latestProducts = useMemo(() => { return (db?.products||[]).filter(p => p && p?.status !== 'Maintenance').slice(-4).reverse(); }, [db?.products]);
  const displayProducts = bestSellers.length > 0 ? bestSellers : latestProducts;

  const openDetail = (product) => { setSelectedDetail(product); setCurrentImgIdx(0); setSelectedSize(''); };
  const closeDetail = () => setSelectedDetail(null);

  const renderDetailModal = () => {
    if (!selectedDetail) return null;
    const hasDiscount = (selectedDetail?.discountPrice || 0) > 0;
    const sizesObj = selectedDetail?.sizes || { 'All Size': selectedDetail?.totalStock || 1 };
    const availForSelected = selectedSize ? getAvailableStock(selectedDetail.id, selectedSize) : 0;
    const inCartForSelected = selectedSize ? (cart.find(i => i?.cartId === `${selectedDetail.id}-${selectedSize}`)?.quantity || 0) : 0;
    const canAddSelected = selectedSize && (availForSelected > inCartForSelected);
    const imagesToUse = selectedDetail?.images || (selectedDetail?.image ? [selectedDetail.image] : ['https://placehold.co/400?text=No+Image']);

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-stone-900/70 backdrop-blur-sm" onClick={closeDetail}>
           <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-5xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-fade-in-up md:animate-fade-in-down" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-1/2 h-64 sm:h-80 md:h-auto bg-stone-100 relative group flex-shrink-0">
                 <img src={imagesToUse[currentImgIdx]} className="w-full h-full object-cover" alt="Detail" />
                 {imagesToUse.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === 0 ? imagesToUse.length - 1 : prev - 1); }} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg md:opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5"/></button>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === imagesToUse.length - 1 ? 0 : prev + 1); }} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg md:opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-4 h-4 md:w-5 md:h-5"/></button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 bg-stone-900/30 px-2 md:px-3 py-1 md:py-1.5 rounded-full backdrop-blur-sm">
                         {imagesToUse.map((_, idx) => <button key={`mdl-img-${idx}`} onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(idx); }} className={`h-1.5 md:h-2 rounded-full transition-all ${idx === currentImgIdx ? 'bg-white w-3 md:w-4' : 'bg-white/50 hover:bg-white/80 w-1.5 md:w-2'}`} /> )}
                      </div>
                    </>
                 )}
                 <button onClick={closeDetail} className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full md:hidden text-stone-800 shadow-sm"><X className="w-5 h-5"/></button>
              </div>

              <div className="w-full md:w-1/2 p-5 sm:p-6 md:p-10 flex flex-col overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-start mb-2 w-full"><span className="bg-stone-100 text-stone-600 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 md:mb-3 inline-block truncate max-w-[80%]">{String(selectedDetail?.category || '')}</span><button onClick={closeDetail} className="hidden md:block p-2 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-500 transition-colors shrink-0"><X className="w-5 h-5"/></button></div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 leading-tight mb-1 w-full">{String(selectedDetail?.name || '')}</h2>
                  <p className="text-xs md:text-sm font-mono text-stone-400 mb-4 md:mb-6 w-full truncate">{String(selectedDetail?.id || '')}</p>
                  
                  <div className="mb-6 md:mb-8 bg-stone-50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-stone-100 relative w-full">
                      {hasDiscount && <span className="absolute -top-3 -right-2 md:-right-3 bg-red-600 text-white font-bold px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm shadow-lg transform rotate-12">SALE</span>}
                      {hasDiscount ? (
                        <><p className="text-xs md:text-sm text-stone-400 line-through mb-1 truncate w-full">Normal: {formatRupiah(selectedDetail?.price || 0)}</p><p className="text-red-600 font-bold text-2xl md:text-3xl mb-1 md:mb-2 truncate w-full">{formatRupiah(selectedDetail?.discountPrice || 0)} <span className="text-xs md:text-sm font-light text-stone-500">/ hari</span></p></>
                      ) : (<p className={`${cTheme?.text || 'text-rose-600'} font-bold text-2xl md:text-3xl mb-1 md:mb-2 truncate w-full`}>{formatRupiah(selectedDetail?.price || 0)} <span className="text-xs md:text-sm font-light text-stone-500">/ hari</span></p>)}
                      {(selectedDetail?.deposit || 0) > 0 && <p className="text-[10px] md:text-xs font-bold text-amber-600 bg-amber-100/50 inline-block px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-amber-200 max-w-full truncate">+ Deposit Jaminan: {formatRupiah(selectedDetail.deposit)}</p>}
                  </div>

                  <div className="mb-5 md:mb-6 w-full">
                     <h4 className="text-xs md:text-sm font-bold text-stone-800 uppercase tracking-wider mb-2 md:mb-3">Pilih Ukuran</h4>
                     <div className="flex flex-wrap gap-2 md:gap-3 w-full">
                       {Object.entries(sizesObj).map(([sz, qty]) => {
                          const szAvail = getAvailableStock(selectedDetail.id, sz);
                          const isSel = selectedSize === sz;
                          const isOut = szAvail <= 0;
                          return (
                            <button key={`mdl-sz-${sz}`} disabled={isOut} onClick={() => setSelectedSize(sz)} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold border transition-all ${isSel ? (cTheme?.bg || 'bg-rose-600') + ' text-white border-transparent shadow-md' : isOut ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'}`}>
                              {sz} {isOut && <span className="block text-[8px] md:text-[10px] font-normal leading-none mt-1">Habis</span>}
                            </button>
                          )
                       })}
                     </div>
                  </div>

                  <div className="mb-6 md:mb-8 w-full"><h4 className="text-xs md:text-sm font-bold text-stone-800 tracking-wider mb-2 md:mb-3 border-b border-stone-100 pb-2">Deskripsi Pakaian</h4><p className="text-sm md:text-base text-stone-600 leading-relaxed font-light whitespace-pre-line w-full break-words">{String(selectedDetail?.desc || '')}</p></div>
                  {selectedDetail?.productLink && (<a href={selectedDetail.productLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-xs md:text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 md:px-5 py-2.5 md:py-3 rounded-lg md:rounded-xl mb-6 md:mb-8 w-full transition-colors truncate"><ExternalLink className="w-3 h-3 md:w-4 md:h-4 shrink-0"/> <span className="truncate">Lihat Referensi Video/Gambar</span></a>)}

                  <div className="mt-auto pt-4 md:pt-6 border-t border-stone-100 space-y-3 md:space-y-4 w-full">
                      {selectedSize && (
                        <div className="flex items-center justify-between mb-1 md:mb-2 w-full">
                            <span className="text-xs md:text-sm text-stone-500 font-medium">Stok Ukuran {selectedSize}:</span>
                            <span className={`font-bold px-3 md:px-4 py-1 md:py-1.5 rounded-md md:rounded-lg text-[10px] md:text-sm whitespace-nowrap ${availForSelected > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{availForSelected} Pcs Tersedia</span>
                        </div>
                      )}
                      <div className="flex gap-2 md:gap-3 w-full">
                          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(selectedDetail.id); }} className={`p-3 md:p-4 rounded-lg md:rounded-xl border border-stone-200 flex items-center justify-center transition-colors shrink-0 ${loggedInMember?.wishlist?.includes(selectedDetail.id) ? 'bg-rose-50 border-rose-200' : 'hover:bg-stone-50'}`}>
                              <Heart className={`w-5 h-5 md:w-6 md:h-6 ${loggedInMember?.wishlist?.includes(selectedDetail.id) ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(selectedDetail, selectedSize); closeDetail(); }} disabled={!canAddSelected} className={`flex-1 py-3 md:py-4 rounded-lg md:rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-sm md:text-lg shadow-lg truncate ${canAddSelected ? `${cTheme?.bg || 'bg-rose-600'} text-white hover:brightness-110` : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>
                              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 shrink-0" /> <span className="truncate">Sewa {selectedSize || ''}</span>
                          </button>
                      </div>
                  </div>
              </div>
           </div>
        </div>
    );
  };

  const bentoCats = db?.brandConfig?.bentoCategories || ['Kebaya', 'Gaun', 'Jas'];

  return (
    /* TAMBAHAN KUNCI overflow-x-hidden PADA WRAPPER UTAMA AGAR TIDAK BOCOR KE SAMPING */
    <div className="space-y-6 md:space-y-12 lg:space-y-16 animate-fade-in-down w-full max-w-full overflow-x-hidden flex-grow box-border pb-10">
      
      {/* BANNER UTAMA */}
      <div className={`relative ${cTheme?.bg || 'bg-rose-900'} rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl md:shadow-2xl min-h-[250px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-[500px] flex items-center w-full`}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
        <div className="relative z-10 px-5 md:px-12 lg:px-16 py-8 md:py-16 w-full max-w-2xl lg:max-w-3xl">
          <span className="inline-block py-1 md:py-1.5 px-3 md:px-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[8px] md:text-xs font-bold uppercase tracking-widest mb-3 md:mb-6">Pusat Sewa Pakaian Eksklusif</span>
          <h1 style={{ fontFamily: db?.brandConfig?.logoFont || 'Playfair Display' }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-6 leading-tight text-white drop-shadow-lg w-full truncate">{String(db?.brandConfig?.appName || 'Aisya Wardrobe')}</h1>
          <p className="text-xs sm:text-base md:text-lg lg:text-xl text-stone-200 mb-5 md:mb-10 font-light w-full max-w-lg lg:max-w-xl leading-relaxed line-clamp-3">{String(db?.brandConfig?.slogan || 'Penyewaan Gaun Premium')}</p>
          <div className="flex flex-wrap gap-3 md:gap-4"><button onClick={() => setView('catalog')} className="bg-white text-stone-900 px-5 md:px-8 py-2.5 md:py-4 rounded-full text-xs md:text-base font-bold hover:scale-105 transition-transform shadow-xl flex items-center gap-2">Jelajahi Katalog <ChevronRight className="w-4 h-4 md:w-5 md:h-5"/></button></div>
        </div>
      </div>

      {/* BENTO GRID KATEGORI */}
      <div className="relative w-full max-w-full">
         <div className="flex justify-between items-end mb-4 md:mb-8 w-full"><div><h2 className="text-xl md:text-3xl font-serif font-bold text-stone-900 flex items-center gap-2 md:gap-3"><Grid className="w-5 h-5 md:w-8 md:h-8 text-amber-500"/> Kategori Unggulan</h2><p className="text-[10px] md:text-base text-stone-500 mt-1 md:mt-2">Pilihan utama untuk berbagai momen.</p></div></div>
         
         {/* Tampilan Desktop/Tablet */}
         <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-4 md:gap-6 h-[400px] lg:h-[500px] w-full">
           <BentoCategoryBox categoryName={bentoCats[0]} className="col-span-2 row-span-2 w-full h-full" />
           <BentoCategoryBox categoryName={bentoCats[1]} className="col-span-1 row-span-1 w-full h-full" />
           <BentoCategoryBox categoryName={bentoCats[2]} className="col-span-1 row-span-1 w-full h-full" />
         </div>
         
         {/* Tampilan HP - KUNCI OVERFLOW BOCOR ADA DI SINI */}
         <div className="md:hidden flex overflow-x-auto gap-3 pb-4 w-full no-scrollbar snap-x snap-mandatory box-border">
           <BentoCategoryBox categoryName={bentoCats[0]} className="w-[80vw] max-w-[300px] h-[220px] shrink-0 snap-center" />
           <BentoCategoryBox categoryName={bentoCats[1]} className="w-[80vw] max-w-[300px] h-[220px] shrink-0 snap-center" />
           <BentoCategoryBox categoryName={bentoCats[2]} className="w-[80vw] max-w-[300px] h-[220px] shrink-0 snap-center" />
         </div>
      </div>

      {isDbLoading && (!db?.products || db.products.length === 0) ? (
        <div className="relative pt-4 md:pt-10 w-full">
           <div className="mb-4 md:mb-6"><h2 className="text-lg md:text-2xl font-serif font-bold text-stone-300">Menyiapkan Koleksi...</h2></div>
           <SkeletonGrid count={4} />
        </div>
      ) : (
        <div className="w-full space-y-8 md:space-y-12">
          {promoProducts.length > 0 && (
            <div className="relative w-full">
               <div className="flex justify-between items-end mb-4 md:mb-8 w-full"><div><h2 className="text-xl md:text-3xl font-serif font-bold text-stone-900 flex items-center gap-2 md:gap-3"><Tag className="w-5 h-5 md:w-8 md:h-8 text-red-600"/> Harga Spesial</h2><p className="text-[10px] md:text-base text-stone-500 mt-1 md:mt-2">Penawaran gaun impianmu.</p></div><button onClick={() => setView('catalog')} className="hidden sm:flex text-rose-600 text-sm md:text-base font-bold items-center hover:text-rose-800 transition-colors shrink-0">Lihat Semua <ChevronRight className="w-4 h-4 ml-1"/></button></div>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 w-full">{promoProducts.map((p, idx) => <ProductCardItem key={`promo-${p?.id || idx}`} product={p} openDetail={openDetail} />)}</div>
               <button onClick={() => setView('catalog')} className="w-full mt-4 md:mt-6 sm:hidden border border-stone-200 text-stone-700 text-xs font-bold py-2.5 rounded-lg hover:bg-stone-50">Semua Promo</button>
            </div>
          )}

          {displayProducts.length > 0 && (
            <div className="w-full">
               <div className="flex justify-between items-end mb-4 md:mb-8 w-full">
                  <div><h2 className="text-xl md:text-3xl font-serif font-bold text-stone-900 flex items-center gap-2 md:gap-3">{bestSellers.length > 0 ? <><Star className="w-5 h-5 md:w-8 md:h-8 text-yellow-500 fill-yellow-500"/> Paling Diminati</> : <><Sparkles className="w-5 h-5 md:w-8 md:h-8 text-amber-500"/> Koleksi Terbaru</>}</h2><p className="text-[10px] md:text-base text-stone-500 mt-1 md:mt-2">Pilihan favorit para pelanggan.</p></div>
                  <button onClick={() => setView('catalog')} className="hidden sm:flex text-rose-600 text-sm md:text-base font-bold items-center hover:text-rose-800 transition-colors shrink-0">Katalog Lengkap <ChevronRight className="w-4 h-4 ml-1"/></button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 w-full">{displayProducts.map((p, idx) => <ProductCardItem key={`disp-${p?.id || idx}`} product={p} openDetail={openDetail} />)}</div>
               <button onClick={() => setView('catalog')} className="w-full mt-4 md:mt-6 sm:hidden border border-stone-200 text-stone-700 text-xs font-bold py-2.5 rounded-lg hover:bg-stone-50">Katalog Lengkap</button>
            </div>
          )}
        </div>
      )}

      {renderDetailModal()}
    </div>
  );
};

// ============================================================================
// VIEWS: KATALOG EKSKLUSIF (PENCARIAN & FILTER)
// ============================================================================
export const CatalogView = () => {
  const { db, getAvailableStock, cTheme, loggedInMember, toggleWishlist, cart, addToCart, isDbLoading } = useContext(AppStateContext);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const safeCategories = (db?.categories||[]).filter(c => c && typeof c === 'string');
  
  const filteredProducts = (db?.products||[]).filter(p => 
      p && p?.status !== 'Maintenance' && 
      (activeCategory === 'Semua' || p?.category === activeCategory) && 
      (String(p?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || String(p?.id || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const paginatedProducts = filteredProducts.slice(0, page * ITEMS_PER_PAGE);

  const openDetail = (product) => { setSelectedDetail(product); setCurrentImgIdx(0); setSelectedSize(''); };
  const closeDetail = () => setSelectedDetail(null);

  const renderDetailModal = () => {
    // Memanggil Modal yang sama dengan Dashboard untuk efisiensi
    if (!selectedDetail) return null;
    const hasDiscount = (selectedDetail?.discountPrice || 0) > 0;
    const sizesObj = selectedDetail?.sizes || { 'All Size': selectedDetail?.totalStock || 1 };
    const availForSelected = selectedSize ? getAvailableStock(selectedDetail.id, selectedSize) : 0;
    const inCartForSelected = selectedSize ? (cart.find(i => i?.cartId === `${selectedDetail.id}-${selectedSize}`)?.quantity || 0) : 0;
    const canAddSelected = selectedSize && (availForSelected > inCartForSelected);
    const imagesToUse = selectedDetail?.images || (selectedDetail?.image ? [selectedDetail.image] : ['https://placehold.co/400?text=No+Image']);

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-stone-900/70 backdrop-blur-sm" onClick={closeDetail}>
           <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-5xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-fade-in-up md:animate-fade-in-down" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-1/2 h-64 sm:h-80 md:h-auto bg-stone-100 relative group flex-shrink-0">
                 <img src={imagesToUse[currentImgIdx]} className="w-full h-full object-cover" alt="Detail" />
                 {imagesToUse.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === 0 ? imagesToUse.length - 1 : prev - 1); }} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg md:opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5"/></button>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(prev => prev === imagesToUse.length - 1 ? 0 : prev + 1); }} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/70 hover:bg-white rounded-full text-stone-800 shadow-lg md:opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-4 h-4 md:w-5 md:h-5"/></button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 bg-stone-900/30 px-2 md:px-3 py-1 md:py-1.5 rounded-full backdrop-blur-sm">
                         {imagesToUse.map((_, idx) => <button key={`mdl2-img-${idx}`} onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(idx); }} className={`h-1.5 md:h-2 rounded-full transition-all ${idx === currentImgIdx ? 'bg-white w-3 md:w-4' : 'bg-white/50 hover:bg-white/80 w-1.5 md:w-2'}`} /> )}
                      </div>
                    </>
                 )}
                 <button onClick={closeDetail} className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full md:hidden text-stone-800 shadow-sm"><X className="w-5 h-5"/></button>
              </div>

              <div className="w-full md:w-1/2 p-5 sm:p-6 md:p-10 flex flex-col overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-start mb-2 w-full"><span className="bg-stone-100 text-stone-600 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 md:mb-3 inline-block truncate max-w-[80%]">{String(selectedDetail?.category || '')}</span><button onClick={closeDetail} className="hidden md:block p-2 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-500 transition-colors shrink-0"><X className="w-5 h-5"/></button></div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 leading-tight mb-1 w-full">{String(selectedDetail?.name || '')}</h2>
                  <p className="text-xs md:text-sm font-mono text-stone-400 mb-4 md:mb-6 w-full truncate">{String(selectedDetail?.id || '')}</p>
                  
                  <div className="mb-6 md:mb-8 bg-stone-50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-stone-100 relative w-full">
                      {hasDiscount && <span className="absolute -top-3 -right-2 md:-right-3 bg-red-600 text-white font-bold px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm shadow-lg transform rotate-12">SALE</span>}
                      {hasDiscount ? (
                        <><p className="text-xs md:text-sm text-stone-400 line-through mb-1 truncate w-full">Normal: {formatRupiah(selectedDetail?.price || 0)}</p><p className="text-red-600 font-bold text-2xl md:text-3xl mb-1 md:mb-2 truncate w-full">{formatRupiah(selectedDetail?.discountPrice || 0)} <span className="text-xs md:text-sm font-light text-stone-500">/ hari</span></p></>
                      ) : (<p className={`${cTheme?.text || 'text-rose-600'} font-bold text-2xl md:text-3xl mb-1 md:mb-2 truncate w-full`}>{formatRupiah(selectedDetail?.price || 0)} <span className="text-xs md:text-sm font-light text-stone-500">/ hari</span></p>)}
                      {(selectedDetail?.deposit || 0) > 0 && <p className="text-[10px] md:text-xs font-bold text-amber-600 bg-amber-100/50 inline-block px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-amber-200 max-w-full truncate">+ Deposit Jaminan: {formatRupiah(selectedDetail.deposit)}</p>}
                  </div>

                  <div className="mb-5 md:mb-6 w-full">
                     <h4 className="text-xs md:text-sm font-bold text-stone-800 uppercase tracking-wider mb-2 md:mb-3">Pilih Ukuran</h4>
                     <div className="flex flex-wrap gap-2 md:gap-3 w-full">
                       {Object.entries(sizesObj).map(([sz, qty]) => {
                          const szAvail = getAvailableStock(selectedDetail.id, sz);
                          const isSel = selectedSize === sz;
                          const isOut = szAvail <= 0;
                          return (
                            <button key={`mdl2-sz-${sz}`} disabled={isOut} onClick={() => setSelectedSize(sz)} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold border transition-all ${isSel ? (cTheme?.bg || 'bg-rose-600') + ' text-white border-transparent shadow-md' : isOut ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'}`}>
                              {sz} {isOut && <span className="block text-[8px] md:text-[10px] font-normal leading-none mt-1">Habis</span>}
                            </button>
                          )
                       })}
                     </div>
                  </div>

                  <div className="mb-6 md:mb-8 w-full"><h4 className="text-xs md:text-sm font-bold text-stone-800 tracking-wider mb-2 md:mb-3 border-b border-stone-100 pb-2">Deskripsi Pakaian</h4><p className="text-sm md:text-base text-stone-600 leading-relaxed font-light whitespace-pre-line w-full break-words">{String(selectedDetail?.desc || '')}</p></div>
                  {selectedDetail?.productLink && (<a href={selectedDetail.productLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-xs md:text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 md:px-5 py-2.5 md:py-3 rounded-lg md:rounded-xl mb-6 md:mb-8 w-full transition-colors truncate"><ExternalLink className="w-3 h-3 md:w-4 md:h-4 shrink-0"/> <span className="truncate">Lihat Referensi Video/Gambar</span></a>)}

                  <div className="mt-auto pt-4 md:pt-6 border-t border-stone-100 space-y-3 md:space-y-4 w-full">
                      {selectedSize && (
                        <div className="flex items-center justify-between mb-1 md:mb-2 w-full">
                            <span className="text-xs md:text-sm text-stone-500 font-medium">Stok Ukuran {selectedSize}:</span>
                            <span className={`font-bold px-3 md:px-4 py-1 md:py-1.5 rounded-md md:rounded-lg text-[10px] md:text-sm whitespace-nowrap ${availForSelected > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{availForSelected} Pcs Tersedia</span>
                        </div>
                      )}
                      <div className="flex gap-2 md:gap-3 w-full">
                          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(selectedDetail.id); }} className={`p-3 md:p-4 rounded-lg md:rounded-xl border border-stone-200 flex items-center justify-center transition-colors shrink-0 ${loggedInMember?.wishlist?.includes(selectedDetail.id) ? 'bg-rose-50 border-rose-200' : 'hover:bg-stone-50'}`}>
                              <Heart className={`w-5 h-5 md:w-6 md:h-6 ${loggedInMember?.wishlist?.includes(selectedDetail.id) ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(selectedDetail, selectedSize); closeDetail(); }} disabled={!canAddSelected} className={`flex-1 py-3 md:py-4 rounded-lg md:rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-sm md:text-lg shadow-lg truncate ${canAddSelected ? `${cTheme?.bg || 'bg-rose-600'} text-white hover:brightness-110` : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>
                              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 shrink-0" /> <span className="truncate">Sewa {selectedSize || ''}</span>
                          </button>
                      </div>
                  </div>
              </div>
           </div>
        </div>
    );
  };

  return (
    <div className="animate-fade-in-down w-full max-w-full overflow-x-hidden flex-grow box-border pb-10">
      <div className="text-center mb-6 md:mb-12 pt-2 md:pt-4 w-full">
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-stone-800 mb-2 md:mb-4 tracking-wide w-full truncate">Katalog Eksklusif</h1>
        <p className="text-stone-500 font-light text-xs md:text-lg px-2 w-full truncate">Pilihan pakaian terbaik untuk momen istimewa Anda.</p>
      </div>

      <div className="relative mb-5 md:mb-8 w-full max-w-3xl mx-auto">
        <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-stone-400" />
        <input 
          type="text" 
          className="w-full pl-10 md:pl-14 pr-4 md:pr-6 py-3 md:py-4 border border-stone-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm md:text-[16px] shadow-sm transition-all" 
          placeholder="Cari nama pakaian..." 
          value={searchQuery} 
          onChange={(e) => { 
            setSearchQuery(e.target.value); 
            setPage(1); 
          }} 
        />
      </div>
      
      <div className="flex overflow-x-auto pb-4 mb-6 md:mb-8 gap-2 md:gap-3 w-full no-scrollbar justify-start md:justify-center">
        <button 
          onClick={() => { setActiveCategory('Semua'); setPage(1); }} 
          className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${activeCategory === 'Semua' ? 'bg-stone-900 text-white shadow-md' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
        >
          Semua
        </button>
        
        {safeCategories.map((cat, idx) => (
          <button 
            key={`btn-cat-${idx}`} 
            onClick={() => { setActiveCategory(cat); setPage(1); }} 
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${activeCategory === cat ? `${cTheme?.bg || 'bg-rose-600'} text-white shadow-md` : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
          >
            {String(cat)}
          </button>
        ))}
      </div>

      {isDbLoading && (!db?.products || db.products.length === 0) ? (
          <SkeletonGrid count={8} />
      ) : paginatedProducts.length === 0 ? (
          <div className="text-center py-16 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-dashed border-stone-200 w-full">
              <Package className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-stone-300"/><h3 className="text-lg md:text-xl font-bold text-stone-800 mb-1 md:mb-2">Katalog Kosong</h3><p className="text-xs md:text-sm text-stone-500">Belum ada produk yang cocok dengan pencarianmu.</p>
          </div>
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 w-full">
              {paginatedProducts.map((p, idx) => <ProductCardItem key={`cat-pg-${p?.id || idx}`} product={p} openDetail={openDetail} />)}
          </div>
      )}

      {!isDbLoading && filteredProducts.length > page * ITEMS_PER_PAGE && (
          <div className="flex justify-center mt-8 md:mt-10 w-full">
             <button onClick={() => setPage(p => p + 1)} className="w-full md:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-stone-900 text-white text-sm md:text-base font-bold rounded-lg md:rounded-full hover:bg-black shadow-lg active:scale-95 transition-all">Muat Lebih Banyak</button>
          </div>
      )}
    </div>
  );
};