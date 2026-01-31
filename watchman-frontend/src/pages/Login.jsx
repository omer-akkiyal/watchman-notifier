import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Github, Chrome } from 'lucide-react'; // Chrome icon for Google

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Giriş yapılamadı.');
        }
    };

    const handleSocialLogin = (provider) => {
        window.location.href = `http://localhost:10000/api/auth/${provider}`;
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Giriş Yap</h2>
                <p className="text-gray-400">Watchman hesabınıza erişin</p>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
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
                        placeholder="Şifre"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Şifremi Unuttum?</Link>
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5">
                    Giriş Yap
                </button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-gray-500 backdrop-blur-xl">veya</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => handleSocialLogin('google')}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2.5 text-white transition-all hover:scale-105"
                >
                    <Chrome className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium">Google</span>
                </button>
                <button
                    onClick={() => handleSocialLogin('github')}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2.5 text-white transition-all hover:scale-105"
                >
                    <Github className="w-5 h-5" />
                    <span className="text-sm font-medium">GitHub</span>
                </button>
            </div>

            <p className="text-center text-gray-400 text-sm">
                Hesabınız yok mu? <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium ml-1">Kayıt Ol</Link>
            </p>
        </div>
    );
};

export default Login;
