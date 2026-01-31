import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            <div className="w-full max-w-md p-8 relative z-10 backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>

                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;
