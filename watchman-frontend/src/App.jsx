import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { LayoutDashboard, Settings, Bell, LogOut, CheckCircle, Loader2, Key, Github, Plus, Trash2 } from 'lucide-react';

const API_URL = "https://watchman-notifier.onrender.com";
const socket = io(API_URL, { transports: ["websocket", "polling"] });

const LandingPage = () => (
  <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
    <h1 className="text-7xl font-black mb-6 bg-linear-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent italic">WATCHMAN</h1>
    <p className="text-xl text-slate-400 max-w-2xl mb-10 font-medium">GitHub olaylarını saniyeler içinde WhatsApp gruplarına taşıyın. Bekçinizi kurun, arkanıza yaslanın.</p>
    <div className="flex gap-4">
      <Link to="/login" className="bg-green-600 hover:bg-green-500 px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-green-900/20">Hemen Başla</Link>
    </div>
  </div>
);

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
        <h2 className="text-3xl font-bold text-white">Bekçilerim</h2>
        <button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
          <Plus size={18}/> Yeni Bekçi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map(rule => (
          <div key={rule._id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-green-500/50 transition-all group">
            <div className="flex justify-between mb-4">
              <div className="bg-slate-800 p-2 rounded-lg text-green-500"><Bell size={20}/></div>
              <button className="text-slate-600 hover:text-red-500"><Trash2 size={18}/></button>
            </div>
            <h4 className="text-white font-bold text-lg mb-1">{rule.ruleName}</h4>
            <p className="text-slate-500 text-xs mb-4">Webhook Aktif</p>
            <div className="bg-black/40 p-3 rounded-xl text-[10px] font-mono text-green-400 border border-slate-800 break-all select-all">
              {`${API_URL}/webhook/v1/${rule.webhookToken}`}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-4xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Yeni Bekçi Kur</h3>
            <input placeholder="Kural Adı (örn: Argus Push)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4 text-white outline-none focus:ring-1 ring-green-500" 
              onChange={e => setNewRule({...newRule, name: e.target.value})} />
            <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mb-8 text-white outline-none" 
              onChange={e => setNewRule({...newRule, target: e.target.value})}>
              <option value="">Hedef WhatsApp Grubu Seç</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <div className="flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold">İptal</button>
              <button onClick={handleCreate} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
      <div className="bg-slate-950 min-h-screen flex text-slate-200">
        {isLoggedIn && (
          <aside className="w-72 bg-slate-900/50 border-r border-slate-800 p-8 flex flex-col sticky top-0 h-screen">
            <div className="flex items-center gap-3 mb-12">
              <div className="bg-green-500 p-2 rounded-xl text-slate-950"><Bell size={20}/></div>
              <h1 className="text-2xl font-black text-white italic tracking-tighter">WATCHMAN</h1>
            </div>
            <nav className="space-y-4 flex-1">
              <Link to="/dashboard" className="flex items-center gap-4 text-slate-400 hover:text-white p-2 transition-all"><LayoutDashboard size={20}/> Dashboard</Link>
              <Link to="/whatsapp" className="flex items-center gap-4 text-slate-400 hover:text-white p-2 transition-all"><Settings size={20}/> WhatsApp</Link>
            </nav>
            <button onClick={handleLogout} className="flex items-center gap-4 text-red-400 mt-auto hover:bg-red-400/10 p-3 rounded-2xl transition-all">
              <LogOut size={20}/> Çıkış Yap
            </button>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto">
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