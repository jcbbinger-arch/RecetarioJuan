import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Loader2, Sparkles, ChefHat } from 'lucide-react';

interface AuthProps {
    onSession: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onSession }) => {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            alert('Error al iniciar sesión con Google: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="max-w-md w-full relative z-10">
                <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl text-center space-y-8">
                    <div className="relative inline-block">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-6 rounded-3xl shadow-2xl shadow-amber-500/20 transform -rotate-3 mb-6">
                            <ChefHat size={48} className="text-slate-950" />
                        </div>
                        <Sparkles className="absolute -top-2 -right-2 text-amber-500 animate-bounce" size={24} />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                            GastroProfesor<span className="text-amber-500 not-italic">.</span>
                        </h1>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.4em]">Gastronomía Inteligente</p>
                    </div>

                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Bienvenido al recetario maestro. Inicia sesión con tu cuenta de Google para acceder a tus fichas y la comunidad.
                    </p>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-4 px-8 py-5 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-2xl shadow-2xl shadow-white/5 transition-all active:scale-95 uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                                Continuar con Google
                            </>
                        )}
                    </button>

                    <div className="pt-8 border-t border-slate-800/50">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            Manager Pro App • 2026
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                    Soporte: managerproapp@gmail.com
                </p>
            </div>
        </div>
    );
};
