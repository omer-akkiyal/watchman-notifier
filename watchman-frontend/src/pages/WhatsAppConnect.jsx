import { useState, useEffect } from 'react';
import io from 'socket.io-client'; // Global socket instance kullanmak daha iyi olabilir context ile
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Loader2 } from 'lucide-react';

const API_URL = "http://localhost:10000";
const socket = io(API_URL, { transports: ["websocket", "polling"] });

const WhatsAppConnect = () => {
    const [qr, setQr] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        socket.on('qr', (data) => setQr(data));
        socket.on('connection_status', (data) => {
            setStatus(data);
            if (data === 'connected') setQr(null);
        });

        // Initial check? Backend socket emit ediyor mu? 
        // Backend sadece update eventinde emit ediyor. 
        // Manuel status check endpointine istek atılabilir.

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
                <div className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${status === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-400'
                    }`}>
                    Durum: {status === 'connected' ? 'ONLINE' : 'BAĞLANTI BEKLENİYOR'}
                </div>
            </div>
        </div>
    );
};

export default WhatsAppConnect;
