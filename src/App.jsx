import React, { useContext, useState } from 'react';
import { Package } from 'lucide-react';

// Import Context Utama
import { AppStateProvider, AppStateContext } from './context/AppContext';

// Import Tampilan Pelanggan (Customer Views)
import { CustomerLayout } from './components/customer/CustomerLayout';
import { DashboardView, CatalogView } from './components/customer/HomeCatalog';
import { CartView, CheckoutView, SuccessView } from './components/customer/OrderFlow';
import { MemberAuthView, MemberProfileView } from './components/customer/MemberSystem';

// Import Tampilan Admin (Admin Views)
import { AdminLogin, AdminLayout, AdminStats } from './components/admin/AdminCore';
import { AdminInventory, AdminOrderManager } from './components/admin/AdminInventoryOrders';
import { AdminCalendar, AdminCustomers, AdminPrizes, AdminPromo, AdminApprovals } from './components/admin/AdminExtended';
import { AdminAccountSettings, AdminSystemSettings, AdminLogs, AdminDeveloperPanel } from './components/admin/AdminAdvanced';

// ============================================================================
// KOMPONEN SPLASH SCREEN LOADING
// ============================================================================
const SplashScreen = () => {
  const { db } = useContext(AppStateContext);
  return (
    <div className="fixed inset-0 bg-stone-900 flex flex-col items-center justify-center z-[9999]">
      <div className="w-24 h-24 bg-gradient-to-tr from-amber-500 to-amber-700 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(212,175,55,0.4)] animate-pulse">
        {db?.brandConfig?.logoUrl ? <img src={db.brandConfig.logoUrl} className="w-14 h-14 object-contain filter brightness-0 invert" alt="Logo" /> : db?.brandConfig?.appIcon ? <span className="text-4xl">{String(db.brandConfig.appIcon)}</span> : <Package className="w-10 h-10 text-white" />}
      </div>
      <h1 style={{ fontFamily: db?.brandConfig?.logoFont || 'Playfair Display' }} className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 font-bold tracking-widest mb-3 animate-fade-in-down drop-shadow-md">
        {String(db?.brandConfig?.appName || 'Aisya Wardrobe')}
      </h1>
      <p className="text-stone-400 text-sm tracking-widest uppercase font-light">Mempersiapkan Koleksi...</p>
      <div className="mt-10 w-56 h-0.5 bg-stone-800 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-600 to-amber-300 w-1/2 animate-[spin_1.5s_linear_infinite]" style={{ animationName: 'loadingBar', animationDuration: '1.5s', animationIterationCount: 'infinite' }}></div>
      </div>
      <style>{`@keyframes loadingBar { 0% { width: 0%; transform: translateX(-100%); } 100% { width: 100%; transform: translateX(200%); } }`}</style>
    </div>
  );
};

// ============================================================================
// ROUTER PENGATUR TAMPILAN ADMIN
// ============================================================================
const AdminRouter = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { loggedInUser } = useContext(AppStateContext);

  const renderAdminTab = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminStats />;
      case 'orders': return <AdminOrderManager />;
      case 'inventory': return <AdminInventory />;
      case 'calendar': return <AdminCalendar />;
      case 'customers': return <AdminCustomers />;
      case 'prizes': return <AdminPrizes />;
      case 'promos': return <AdminPromo />;
      case 'approvals': return <AdminApprovals />;
      case 'account': return <AdminAccountSettings />;
      case 'settings': return (loggedInUser?.role === 'owner' || loggedInUser?.role === 'developer') ? <AdminSystemSettings /> : <AdminStats />;
      case 'logs': return (loggedInUser?.role === 'owner' || loggedInUser?.role === 'developer') ? <AdminLogs /> : <AdminStats />;
      case 'developer': return loggedInUser?.role === 'developer' ? <AdminDeveloperPanel /> : <AdminStats />;
      default: return <AdminStats />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderAdminTab()}
    </AdminLayout>
  );
};

// ============================================================================
// PENGHUBUNG UTAMA (MAIN APP CONTENT)
// ============================================================================
const AppContent = () => {
  const { view, loggedInUser, isDbLoading } = useContext(AppStateContext);

  if (isDbLoading) return <SplashScreen />;
  
  if (view === 'admin') {
    return loggedInUser ? <AdminRouter /> : <AdminLogin />;
  }

  // Tampilan Pelanggan
  return (
    <CustomerLayout>
      {view === 'dashboard' && <DashboardView />}
      {view === 'catalog' && <CatalogView />}
      {view === 'cart' && <CartView />}
      {view === 'checkout' && <CheckoutView />}
      {view === 'success' && <SuccessView />}
      {view === 'member_auth' && <MemberAuthView />}
      {view === 'member_profile' && <MemberProfileView />}
    </CustomerLayout>
  );
};

// ============================================================================
// EXPORT FINAL
// ============================================================================
export default function App() { 
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  ); 
}