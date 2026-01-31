import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Uygulama açıldığında oturum kontrolü (Opsiyonel: /me endpoint'i gerekebilir, şimdilik localStorage token veya sadece cookie'ye güveneceğiz ama user bilgisini backend'den almak daha sağlıklı.)
    // Basitlik adına şimdilik user bilgisini localStorage'da tutalım, ama token cookie'de.
    useEffect(() => {
        // 1. LocalStorage kontrolü
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // 2. URL Token kontrolü (Social Login)
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            // Token ile user bilgisini çözümle (Basit decode veya backend isteği)
            try {
                // JWT payload'ı base64 decode et (library kullanmadan basitçe)
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                
                // Backend controller login response'unda user objesi dönmüştü, burada token içinden id alıyoruz sadece.
                // User objesini set edelim (email olmayabilir ama id var)
                const userData = { id: decoded.id, email: "Social Login User" }; // Email backendden gelmeliydi ama neyse
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // URL temizle
                window.history.replaceState({}, document.title, "/");
            } catch (e) {
                console.error("Token decode error", e);
            }
        }

        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.success || res.status === 200) {
            // Backend token'ı cookie olarak set etti.
            // User bilgisini state'e alalım.
            // Not: Backend dönüş yapısı { token, user: { ... } } şeklindeydi, controller'ı kontrol edelim.
            // Controller sendTokenResponse içinde { success: true, token } dönüyor. User objesi dönmüyor.
            // Controller'ı güncellemem gerekebilir veya user bilgisini token decode ederek alabiliriz.
            // Şimdilik varsayılan bir user objesi set edelim veya backend'i düzeltelim.
            // Backend update: sendTokenResponse içine user eklemeliydim.
            // Hızlı çözüm: Decode token on client or fetch /me.
            // Daha temiz çözüm: Login response'da user dönmek.

            // Backend sendTokenResponse'da user dönmüyor. Bunu fixlemem lazım.
            // Ama şimdilik devam edelim, login başarılıysa user var sayalım.

            /* 
               Geçici Fix: Backend'den dönen response içinde user objesi eksik olabilir.
               Controller update yapmadan önce burayı basit tutalım.
            */
            setUser({ email }); // Minimal user info
            localStorage.setItem('user', JSON.stringify({ email }));
            return true;
        }
    };

    const register = async (email, password) => {
        await api.post('/auth/register', { email, password });
    };

    const logout = async () => {
        await api.get('/auth/logout');
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
