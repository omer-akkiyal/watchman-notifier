import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { LayoutDashboard, Settings, Bell, LogOut, CheckCircle, Loader2, Key, Plus, Trash2 } from 'lucide-react';

const API_URL = "https://watchman-notifier.onrender.com";
const socket = io(API_URL, { transports: ["websocket", "polling"] });

// --- 🔐 AUTH PAGE (Giriş & Kayıt Ekranı) ---
const AuthPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      onLogin(res.data.user);
    } catch (err) {
      alert("Giriş başarısız! Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-4xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-green-500/20 p-4 rounded-2xl text-green-500"><Key size={32}/></div>
        </div>
        <h2 className="text-3xl font-bold text-center text-white mb-8 tracking-tight">Giriş Yap</h2>
        <div className="space-y-4">
          <input type="email" placeholder="Email Adresi" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 ring-green-500/50" 
            onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Şifre" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 ring-green-500/50" 
            onChange={e => setPassword(e.target.value)} />
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex justify-center items-center">
            {loading ? <Loader2 className="animate-spin" size={20}/> : "Devam Et"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 📱 WHATSAPP PAGE (QR & Bağlantı Yönetimi) ---
const WhatsAppPage = () => {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    socket.on('qr', (data) => setQr(data));
    socket.on('connection_status', (data) => {
      setStatus(data);
      if (data === 'connected') setQr(null);
    });
    return () => { socket.off('qr'); socket.off('connection_status'); };
  }, []);

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-4xl text-center shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-8 tracking-tight">WhatsApp Bağlantısı</h3>
        <div className="bg-white p-6 rounded-3xl inline-block shadow-inner mb-8 transition-all duration-500">
          {status === 'connected' ? (
            <div className="text-green-600 p-10 flex flex-col items-center animate-pulse">
              <CheckCircle size={100} />
              <p className="mt-4 font-black uppercase text-sm tracking-widest">Bağlantı Aktif</p>
            </div>
          ) : qr ? (
            <div className="flex flex-col items-center">
               <QRCodeSVG value={qr} size={220} />
               <p className="text-[10px] mt-4 text-slate-500 font-medium italic">Bağlı Cihazlar menüsünden okutun</p>
            </div>
          ) : (
            <div className="p-10 text-slate-400 flex flex-col items-center">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="text-xs font-medium tracking-wide">QR Kod Bekleniyor...</p>
            </div>
          )}
        </div>
        <div className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
          status === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-400'
        }`}>
          Durum: {status === 'connected' ? 'ONLINE' : 'BAĞLANTI BEKLENİYOR'}
        </div>
      </div>
    </div>
  );
};

// --- 🏠 DASHBOARD (Bekçi Yönetimi) ---
const Dashboard = ({ user }) => {
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', target: '' });
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/watchmen/${user.id}`).then(res => setRules(res.data));
    axios.get(`${API_URL}/api/groups`).then(res => setGroups(res.data)).catch(() => {});
  }, [user.id]);

  const handleCreate = async () => {
    const res = await axios.post(`${API_URL}/api/watchmen`, { userId: user.id, ruleName: newRule.name, targetId: newRule.target });
    setRules([...rules, res.data]);
    setShowModal(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-bold text-white tracking-tight">Bekçilerim</h2>
        <button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-900/20">
          <Plus size={18}/> Yeni Bekçi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map(rule => (
          <div key={rule._id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-green-500/50 transition-all group">
            <div className="flex justify-between mb-4">
              <div className="bg-slate-800 p-2 rounded-lg text-green-500"><Bell size={20}/></div>
              <button className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
            </div>
            <h4 className="text-white font-bold text-lg mb-1">{rule.ruleName}</h4>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-4">Webhook Aktif</p>
            <div className="bg-black/40 p-3 rounded-xl text-[10px] font-mono text-green-400 border border-slate-800 break-all select-all">
              {`${API_URL}/webhook/v1/${rule.webhookToken}`}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-4xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Yeni Bekçi Kur</h3>
            <input placeholder="Kural Adı (örn: Argus Push)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4 text-white outline-none focus:ring-1 ring-green-500" 
              onChange={e => setNewRule({...newRule, name: e.target.value})} />
            <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mb-8 text-white outline-none focus:ring-1 ring-green-500" 
              onChange={e => setNewRule({...newRule, target: e.target.value})}>
              <option value="">Hedef WhatsApp Grubu Seç</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <div className="flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors">İptal</button>
              <button onClick={handleCreate} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-500 transition-colors">Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 🚀 LANDING PAGE (Sitenin Vitrini) ---
const LandingPage = () => (
  <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
    <h1 className="text-7xl font-black mb-6 bg-linear-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent italic tracking-tighter">WATCHMAN</h1>
    <p className="text-xl text-slate-400 max-w-2xl mb-10 font-medium">GitHub olaylarını saniyeler içinde WhatsApp gruplarına taşıyın. Bekçinizi kurun, arkanıza yaslanın.</p>
    <div className="flex gap-4">
      <Link to="/login" className="bg-green-600 hover:bg-green-500 px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-green-900/20">Hemen Başla</Link>
    </div>
  </div>
);

// --- 🏛️ MAIN APP COMPONENT ---
function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="bg-slate-950 min-h-screen flex text-slate-200 font-sans">
        {isLoggedIn && (
          <aside className="w-72 bg-slate-900/50 border-r border-slate-800 p-8 flex flex-col sticky top-0 h-screen">
            <div className="flex items-center gap-3 mb-12">
              <div className="bg-green-500 p-2 rounded-xl text-slate-950 shadow-lg shadow-green-500/20"><Bell size={20}/></div>
              <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">WATCHMAN</h1>
            </div>
            <nav className="space-y-4 flex-1">
              <Link to="/dashboard" className="flex items-center gap-4 text-slate-400 hover:text-green-400 p-2 transition-all font-medium"><LayoutDashboard size={20}/> Dashboard</Link>
              <Link to="/whatsapp" className="flex items-center gap-4 text-slate-400 hover:text-green-400 p-2 transition-all font-medium"><Settings size={20}/> WhatsApp</Link>
            </nav>
            <button onClick={handleLogout} className="flex items-center gap-4 text-red-400 mt-auto hover:bg-red-400/10 p-4 rounded-2xl transition-all font-bold">
              <LogOut size={20}/> Çıkış Yap
            </button>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          <Routes>
            <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/login" element={<AuthPage onLogin={(u) => { setUser(u); setIsLoggedIn(true); localStorage.setItem('user', JSON.stringify(u)); }} />} />
            <Route path="/dashboard" element={isLoggedIn ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/whatsapp" element={isLoggedIn ? <WhatsAppPage /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;