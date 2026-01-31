import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Register fonksiyonunu buradan alacağız ama direkt API call da yapabiliriz.
import api from '../api/axios'; // AuthContext'teki register void dönüyor, hata yönetimi için direkt api kullanalım veya context update edelim. 
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        if (password.length < 8) {
            setError('Şifre en az 8 karakter olmalıdır.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register', { email, password });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Kayıt sırasında bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Kayıt Başarılı!</h2>
                <p className="text-gray-300">
                    Hesabınızı aktifleştirmek için <span className="font-semibold text-white">{email}</span> adresine gönderdiğimiz doğrulama bağlantısına tıklayın.
                </p>
                <div className="pt-4">
                    <Link to="/login" className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                        Giriş Sayfasına Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Kayıt Ol</h2>
                <p className="text-gray-400">Yeni bir Watchman hesabı oluşturun</p>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                        type="email"
                        placeholder="E-posta Adresi"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                        type="password"
                        placeholder="Şifre (Min 8 karakter)"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                        type="password"
                        placeholder="Şifre Tekrar"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'İşleniyor...' : 'Kayıt Ol'}
                </button>
            </form>

            <p className="text-center text-gray-400 text-sm">
                Zaten hesabınız var mı? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium ml-1">Giriş Yap</Link>
            </p>
        </div>
    );
};

export default Register;
