import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await api.get(`/auth/verifyemail/${token}`);
                setStatus('success');
                setMessage('Hesabınız başarıyla doğrulandı!');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.error || 'Doğrulama bağlantısı geçersiz veya süresi dolmuş.');
            }
        };

        if (token) {
            verify();
        }
    }, [token]);

    return (
        <div className="text-center space-y-6">
            {status === 'verifying' && (
                <>
                    <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                    <h2 className="text-xl font-semibold text-white">Doğrulanıyor...</h2>
                </>
            )}

            {status === 'success' && (
                <>
                    <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Başarılı!</h2>
                    <p className="text-gray-300">{message}</p>
                    <div className="pt-4">
                        <Link to="/" className="w-full block bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg transition-colors">
                            Panele Git
                        </Link>
                    </div>
                </>
            )}

            {status === 'error' && (
                <>
                    <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50">
                        <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Hata!</h2>
                    <p className="text-red-200">{message}</p>
                    <div className="pt-4">
                        <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                            Giriş Sayfasına Dön
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
};

export default VerifyEmail;
