import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { LayoutDashboard, Settings, Bell, LogOut, CheckCircle, Loader2, Key } from 'lucide-react';

const socket = io("https://watchman-notifier.onrender.com", {
  transports: ["websocket", "polling"],
  withCredentials: true
});

// --- 🔐 AUTH PAGE ---
const AuthPage = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-4xl shadow-2xl">
      <div className="flex justify-center mb-6">
        <div className="bg-green-500/20 p-4 rounded-2xl text-green-500"><Key size={32}/></div>
      </div>
      <h2 className="text-3xl font-bold text-center text-white mb-8">Watchman'e Katıl</h2>
      <div className="space-y-4">
        <input type="email" placeholder="Email Adresi" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 ring-green-500/50" />
        <input type="password" placeholder="Şifre" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 ring-green-500/50" />
        <button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95">Giriş Yap</button>
        <p className="text-center text-slate-500 text-sm mt-4">Henüz hesabın yok mu? <span className="text-green-500 cursor-pointer">Kayıt Ol</span></p>
      </div>
    </div>
  </div>
);

// --- 📱 WHATSAPP PAGE ---
const WhatsAppPage = () => {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    socket.on('qr', (data) => setQr(data));
    socket.on('connection_status', (data) => setStatus(data));
    return () => { socket.off('qr'); socket.off('connection_status'); };
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-12">
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] text-center shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-8">WhatsApp Bağlantısı</h3>
        <div className="bg-white p-6 rounded-3xl inline-block shadow-inner mb-8">
          {status === 'connected' ? (
            <div className="text-green-600 p-10"><CheckCircle size={120} /><p className="mt-4 font-bold">BAĞLANDI</p></div>
          ) : qr ? (
            <QRCodeSVG value={qr} size={220} />
          ) : (
            <div className="p-10 text-slate-400"><Loader2 className="animate-spin mb-4 mx-auto" size={48}/><p>QR Bekleniyor...</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 🏠 DASHBOARD PAGE ---
const DashboardHome = () => (
  <div className="p-8">
    <div className="flex justify-between items-center mb-10">
      <h2 className="text-3xl font-bold text-white tracking-tight">Bekçilerim</h2>
      <button className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-500 transition-all">+ Yeni Kural</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {/* Örnek Kart */}
       <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group hover:border-green-500/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-slate-800 p-2 rounded-lg text-slate-400 group-hover:text-green-500 transition-colors"><Bell size={20}/></div>
            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-bold">AKTİF</span>
          </div>
          <h4 className="text-white font-bold text-lg mb-1">Argus Repo</h4>
          <p className="text-slate-500 text-xs mb-4">Target: WhatsApp Group</p>
          <div className="bg-black/50 p-2 rounded-lg text-[10px] font-mono text-green-400 break-all select-all border border-slate-800">
            https://watchman-notifier.onrender.com/webhook/v1/5c0b0f45...
          </div>
       </div>
    </div>
  </div>
);

// --- 🏛️ MAIN LAYOUT ---
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Şimdilik manuel true

  if (!isLoggedIn) return <AuthPage />;

  return (
    <Router>
      <div className="flex bg-slate-950 min-h-screen text-slate-200">
        <aside className="w-72 bg-slate-900/50 border-r border-slate-800 p-8 flex flex-col sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-green-500 p-2 rounded-xl"><Bell size={20} className="text-slate-950"/></div>
            <h1 className="text-2xl font-black text-white tracking-tighter italic">WATCHMAN</h1>
          </div>
          <nav className="space-y-4 flex-1">
            <Link to="/dashboard" className="flex items-center gap-4 text-slate-400 hover:text-white p-2 transition-all"><LayoutDashboard size={20}/> Dashboard</Link>
            <Link to="/whatsapp" className="flex items-center gap-4 text-slate-400 hover:text-white p-2 transition-all"><Settings size={20}/> WhatsApp</Link>
          </nav>
          <button className="flex items-center gap-4 text-red-400 mt-auto hover:bg-red-400/10 p-2 rounded-xl transition-all"><LogOut size={20}/> Çıkış</button>
        </aside>
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/whatsapp" element={<WhatsAppPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;