import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LayoutDashboard, Settings, Bell, LogOut, Loader } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import WhatsAppConnect from './pages/WhatsAppConnect';
import AuthLayout from './layouts/AuthLayout';

// Ana Uygulama Düzeni (Dashboard vb. için)
const MainLayout = ({ children }) => {
  const { logout, user } = useAuth();

  return (
    <div className="bg-slate-950 min-h-screen flex text-slate-200 font-sans">
      <aside className="w-72 bg-slate-900/50 border-r border-slate-800 p-8 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-green-500 p-2 rounded-xl text-slate-950 shadow-lg shadow-green-500/20"><Bell size={20} /></div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">WATCHMAN</h1>
        </div>
        <div className="mb-6 px-2">
          <p className="text-xs text-slate-500">Giriş Yapıldı:</p>
          <p className="text-sm font-bold text-white truncate" title={user?.email}>
            {user?.name ? `${user.name}` : user?.email}
          </p>
          {user?.name && <p className="text-xs text-slate-400 truncate">{user?.email}</p>}
        </div>
        <nav className="space-y-4 flex-1">
          <Link to="/" className="flex items-center gap-4 text-slate-400 hover:text-green-400 p-2 transition-all font-medium"><LayoutDashboard size={20} /> Dashboard</Link>
          <Link to="/whatsapp" className="flex items-center gap-4 text-slate-400 hover:text-green-400 p-2 transition-all font-medium"><Settings size={20} /> WhatsApp</Link>
        </nav>
        <button onClick={logout} className="flex items-center gap-4 text-red-400 mt-auto hover:bg-red-400/10 p-4 rounded-2xl transition-all font-bold">
          <LogOut size={20} /> Çıkış Yap
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        {children}
      </main>
    </div>
  );
};

// Korumalı Route Bileşeni
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader className="animate-spin text-green-500" size={32} /></div>;

  if (!user) return <Navigate to="/login" />;

  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes (Auth Layout) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
          </Route>

          {/* Protected Routes (Main Layout is inside ProtectedRoute) */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/whatsapp" element={<ProtectedRoute><WhatsAppConnect /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;