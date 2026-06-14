import React, { useContext, useState, Suspense } from 'react';
import { AppStateProvider, AppStateContext } from './context/AppContext';

// Komponen Pelanggan
import { CustomerLayout } from './components/customer/CustomerLayout';
import { DashboardView, CatalogView } from './components/customer/HomeCatalog';
import { CartView, CheckoutView, SuccessView } from './components/customer/OrderFlow';
import { MemberAuthView, MemberProfileView } from './components/customer/MemberSystem';

// Lazy Loading Panel Admin (Tidak ikut diunduh pelanggan biasa)
const AdminLogin = React.lazy(() => import('./components/admin/AdminCore').then(m => ({ default: m.AdminLogin })));
const AdminLayout = React.lazy(() => import('./components/admin/AdminCore').then(m => ({ default: m.AdminLayout })));
const AdminStats = React.lazy(() => import('./components/admin/AdminCore').then(m => ({ default: m.AdminStats })));
const AdminInventory = React.lazy(() => import('./components/admin/AdminInventoryOrders').then(m => ({ default: m.AdminInventory })));
const AdminOrderManager = React.lazy(() => import('./components/admin/AdminInventoryOrders').then(m => ({ default: m.AdminOrderManager })));
const AdminCalendar = React.lazy(() => import('./components/admin/AdminExtended').then(m => ({ default: m.AdminCalendar })));
const AdminCustomers = React.lazy(() => import('./components/admin/AdminExtended').then(m => ({ default: m.AdminCustomers })));
const AdminPrizes = React.lazy(() => import('./components/admin/AdminExtended').then(m => ({ default: m.AdminPrizes })));
const AdminPromo = React.lazy(() => import('./components/admin/AdminExtended').then(m => ({ default: m.AdminPromo })));
const AdminApprovals = React.lazy(() => import('./components/admin/AdminExtended').then(m => ({ default: m.AdminApprovals })));
const AdminAccountSettings = React.lazy(() => import('./components/admin/AdminAdvanced').then(m => ({ default: m.AdminAccountSettings })));
const AdminSystemSettings = React.lazy(() => import('./components/admin/AdminAdvanced').then(m => ({ default: m.AdminSystemSettings })));
const AdminLogs = React.lazy(() => import('./components/admin/AdminAdvanced').then(m => ({ default: m.AdminLogs })));
const AdminDeveloperPanel = React.lazy(() => import('./components/admin/AdminAdvanced').then(m => ({ default: m.AdminDeveloperPanel })));

const AdminLoadingFallback = () => (
  <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-stone-400 font-mono">
    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="tracking-widest text-xs uppercase text-amber-400">Memuat Modul Admin...</p>
  </div>
);

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

const AppContent = () => {
  const { view, loggedInUser } = useContext(AppStateContext);

  // Jika masuk mode Admin, panggil router admin
  if (view === 'admin') {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        {loggedInUser ? <AdminRouter /> : <AdminLogin />}
      </Suspense>
    );
  }

  // Tampilan Pelanggan Terbuka Instan
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

export default function App() { 
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  ); 
}