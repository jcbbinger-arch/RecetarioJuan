import React from 'react';
import { Clock, LogOut, Mail, ChefHat } from 'lucide-react';

interface PendingApprovalProps {
    email: string;
    onLogout: () => void;
}

export const PendingApproval: React.FC<PendingApprovalProps> = ({ email, onLogout }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative font-sans">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>

            <div className="max-w-md w-full relative z-10 text-center space-y-8">
                <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl space-y-8">
                    <div className="bg-amber-500/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20 animate-pulse">
                        <Clock size={48} className="text-amber-500" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                            Acceso Pendiente<span className="text-amber-500 not-italic">.</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            Hola <span className="text-white font-bold">{email}</span>. Tu cuenta ha sido registrada correctamente.
                        </p>
                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                            <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                Tu acceso está siendo revisado por el administrador. Te notificaremos pronto para que puedas empezar a crear tus recetas.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 space-y-4">
                        <a
                            href="mailto:managerproapp@gmail.com"
                            className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all text-xs uppercase tracking-widest border border-slate-700/50"
                        >
                            <Mail size={16} /> Contactar Soporte
                        </a>

                        <button
                            onClick={onLogout}
                            className="flex items-center justify-center gap-3 w-full px-6 py-4 text-slate-500 hover:text-rose-400 font-black transition-all text-[10px] uppercase tracking-[0.2em]"
                        >
                            <LogOut size={16} /> Cerrar Sesión
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3 opacity-30">
                    <ChefHat size={16} className="text-white" />
                    <span className="text-white text-[10px] font-black uppercase tracking-[0.4em]">GastroProfesor</span>
                </div>
            </div>
        </div>
    );
};
