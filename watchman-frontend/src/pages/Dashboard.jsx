import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Trash2, Plus } from 'lucide-react';

const Dashboard = ({ user }) => {
    const [rules, setRules] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newRule, setNewRule] = useState({ name: '', target: '' });
    const [groups, setGroups] = useState([]);
    const API_URL = "http://localhost:10000"; // Global config'den gelmeli ama şimdilik hardcode

    const fetchRules = () => {
        // user.id context'ten veya prop'tan gelmeli. 
        // AuthContext kullanıyorsak user._id olabilir. Backend login response'u user.id döndürüyor.
        if (user?.id || user?._id) {
            axios.get(`${API_URL}/api/watchmen/${user.id || user._id}`).then(res => setRules(res.data));
        }
    };

    useEffect(() => {
        if (user) {
            fetchRules();
            axios.get(`${API_URL}/api/groups`).then(res => setGroups(res.data)).catch(() => { });
        }
    }, [user]);

    const handleCreate = async () => {
        if (!newRule.name || !newRule.target) return alert("Lütfen tüm alanları doldur!");
        await axios.post(`${API_URL}/api/watchmen`, {
            userId: user.id || user._id,
            ruleName: newRule.name,
            targetId: newRule.target
        });
        fetchRules();
        setShowModal(false);
    };

    const deleteRule = async (id) => {
        if (window.confirm("Bu bekçiyi silmek istediğine emin misin?")) {
            try {
                await axios.delete(`${API_URL}/api/watchmen/${id}`);
                setRules(rules.filter(r => r._id !== id));
            } catch (err) {
                console.error("Silme hatası:", err);
                alert("Bekçi silinirken bir hata oluştu.");
            }
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-bold text-white tracking-tight">Bekçilerim</h2>
                <button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-900/20">
                    <Plus size={18} /> Yeni Bekçi
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map(rule => (
                    <div key={rule._id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-green-500/50 transition-all group relative">
                        <div className="flex justify-between mb-4">
                            <div className="bg-slate-800 p-2 rounded-lg text-green-500"><Bell size={20} /></div>
                            <button onClick={() => deleteRule(rule._id)} className="text-slate-600 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                            </button>
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
                            onChange={e => setNewRule({ ...newRule, name: e.target.value })} />
                        <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mb-8 text-white outline-none focus:ring-1 ring-green-500"
                            onChange={e => setNewRule({ ...newRule, target: e.target.value })}>
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

export default Dashboard;
