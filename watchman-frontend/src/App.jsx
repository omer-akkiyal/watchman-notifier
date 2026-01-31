import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { LayoutDashboard, Settings, Bell, LogOut, Github, QrCode, CheckCircle, XCircle } from 'lucide-react';

const RENDER_BACKEND_URL = "https://watchman-notifier.onrender.com"; 
const socket = io(RENDER_BACKEND_URL);

const WhatsAppConnect = () => {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    socket.on('qr', (data) => {
      setQr(data); 
    });

    socket.on('connection_status', (data) => {
      setStatus(data);
      if (data === 'connected') setQr(null); 
    });

    return () => {
      socket.off('qr');
      socket.off('connection_status');
    };
  }, []);

  return (
    <div className="p-8 flex flex-col items-center">
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-[40px] shadow-2xl max-w-sm w-full text-center">
        <h3 className="text-2xl font-bold mb-6 text-white">WhatsApp Bağlantısı</h3>
        
        <div className="bg-white p-4 rounded-3xl mb-6 mx-auto w-64 h-64 flex items-center justify-center">
          {status === 'connected' ? (
            <div className="text-green-600 flex flex-col items-center">
              <CheckCircle size={80} />
              <p className="mt-4 font-bold">Bağlantı Aktif</p>
            </div>
          ) : qr ? (

            <div className="text-slate-900 flex flex-col items-center">
               <QrCode size={150} />
               <p className="text-[10px] mt-2 text-slate-500 italic text-center">QR Kodu Terminalden veya Buradan Okutun</p>
            </div>
          ) : (
            <div className="animate-pulse flex flex-col items-center text-slate-300">
              <div className="w-40 h-40 bg-slate-200 rounded-lg"></div>
              <p className="mt-4 text-xs">QR Kod Bekleniyor...</p>
            </div>
          )}
        </div>

        <div className={`text-xs py-2 px-4 rounded-full inline-block ${status === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          Durum: {status === 'connected' ? 'Bağlı' : 'Bağlı Değil'}
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => (
  <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-6 h-screen sticky top-0">
    <div className="flex items-center gap-2 mb-10">
      <div className="bg-green-500 p-2 rounded-lg"><Bell className="text-slate-900" size={20} /></div>
      <h1 className="text-xl font-bold text-white tracking-tighter">WATCHMAN</h1>
    </div>
    <nav className="space-y-2 flex-1">
      <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-green-500 transition"><LayoutDashboard size={20} /> <span className="text-sm font-medium">Dashboard</span></Link>
      <Link to="/whatsapp" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-green-500 transition"><Settings size={20} /> <span className="text-sm font-medium">WhatsApp</span></Link>
    </nav>
  </aside>
);

function App() {
  return (
    <Router>
      <div className="bg-slate-950 min-h-screen flex text-slate-200">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<div className="p-8 text-2xl font-bold">Dashboard Çok Yakında!</div>} />
            <Route path="/whatsapp" element={<WhatsAppConnect />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;