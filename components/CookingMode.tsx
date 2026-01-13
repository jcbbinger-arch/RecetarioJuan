import React, { useState, useMemo } from 'react';
import { Recipe, SubRecipe } from '../types';
import {
    ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock,
    ChefHat, Timer, Users, Info, ListChecks, Play, Pause, RotateCcw
} from 'lucide-react';

interface CookingModeProps {
    recipe: Recipe;
    onBack: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onBack }) => {
    const [activeSubIdx, setActiveSubIdx] = useState(0);
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [completedIngredients, setCompletedIngredients] = useState<Record<string, boolean>>({});
    const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const activeSub = recipe.subRecipes?.[activeSubIdx];
    const steps = useMemo(() => {
        if (!activeSub?.instructions) return [];
        return activeSub.instructions.split('\n').filter(s => s.trim().length > 0);
    }, [activeSub]);

    const toggleIngredient = (id: string) => {
        setCompletedIngredients(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleStep = (idx: number) => {
        const key = `${activeSubIdx}-${idx}`;
        setCompletedSteps(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
            {/* Top Header */}
            <div className="bg-slate-900 border-b border-white/5 p-6 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="space-y-1">
                        <h2 className="text-xl font-black uppercase tracking-tight">{recipe.name}</h2>
                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><ChefHat size={12} /> {activeSub?.name}</span>
                            <span className="flex items-center gap-2"><Users size={12} /> {recipe.yieldQuantity} {recipe.yieldUnit}</span>
                        </div>
                    </div>
                </div>

                {/* Simple Timer (Utility) */}
                <div className="bg-indigo-600/20 border border-indigo-500/30 px-6 py-3 rounded-2xl flex items-center gap-4">
                    <Timer className="text-indigo-400" size={20} />
                    <span className="text-xl font-mono font-black text-indigo-100">00:00</span>
                    <div className="flex gap-2">
                        <button className="p-1 hover:text-indigo-400"><Play size={16} /></button>
                        <button className="p-1 hover:text-indigo-400"><RotateCcw size={16} /></button>
                    </div>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Left Sidebar: Sub-recipes Navigation */}
                <div className="lg:col-span-3 bg-slate-900 border-r border-white/5 p-8 space-y-8 h-[calc(100vh-100px)] overflow-y-auto">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Elaboraciones</p>
                        {recipe.subRecipes?.map((sub, idx) => (
                            <button
                                key={sub.id}
                                onClick={() => { setActiveSubIdx(idx); setCurrentStepIdx(0); }}
                                className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex justify-between items-center group ${activeSubIdx === idx ? 'bg-indigo-600 border-indigo-500 shadow-xl' : 'bg-white/5 border-transparent hover:bg-white/10'
                                    }`}
                            >
                                <span className="text-xs font-black uppercase">{idx + 1}. {sub.name}</span>
                                {activeSubIdx === idx && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-white/5 space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mise en Place</p>
                        <div className="space-y-2">
                            {activeSub?.ingredients.map(ing => (
                                <button
                                    key={ing.id}
                                    onClick={() => toggleIngredient(ing.id)}
                                    className={`w-full p-3 rounded-xl text-left text-[10px] font-bold transition-all flex items-center gap-3 ${completedIngredients[ing.id] ? 'bg-emerald-500/10 text-emerald-400 opacity-50' : 'bg-white/5 text-slate-300'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${completedIngredients[ing.id] ? 'bg-emerald-500 border-emerald-500 text-slate-900' : 'border-slate-700'
                                        }`}>
                                        {completedIngredients[ing.id] && <CheckCircle2 size={10} />}
                                    </div>
                                    <span className={completedIngredients[ing.id] ? 'line-through' : ''}>{ing.quantity} {ing.unit} {ing.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content: Instruction Stepper */}
                <div className="lg:col-span-9 p-12 flex flex-col items-center justify-center relative bg-slate-950">
                    {steps.length > 0 ? (
                        <div className="w-full max-w-4xl space-y-12">
                            <div className="flex justify-between items-center">
                                <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em]">Instrucción {currentStepIdx + 1} de {steps.length}</p>
                                <div className="flex gap-2">
                                    {steps.map((_, i) => (
                                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStepIdx ? 'w-8 bg-indigo-500' :
                                                completedSteps[`${activeSubIdx}-${i}`] ? 'w-4 bg-emerald-500' : 'w-4 bg-white/10'
                                            }`}></div>
                                    ))}
                                </div>
                            </div>

                            <div className="min-h-[400px] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-4xl md:text-6xl font-serif font-serif-black leading-tight first-letter:text-indigo-500 first-letter:text-8xl">
                                    {steps[currentStepIdx]}
                                </h3>
                            </div>

                            <div className="flex justify-between gap-6 pt-12">
                                <button
                                    disabled={currentStepIdx === 0}
                                    onClick={() => setCurrentStepIdx(prev => prev - 1)}
                                    className="flex-1 py-10 bg-white/5 rounded-[3rem] text-slate-400 flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all disabled:opacity-20"
                                >
                                    <ChevronLeft size={48} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Anterior</span>
                                </button>

                                <button
                                    onClick={() => toggleStep(currentStepIdx)}
                                    className={`flex-1 py-10 rounded-[3rem] flex flex-col items-center justify-center gap-4 transition-all ${completedSteps[`${activeSubIdx}-${currentStepIdx}`]
                                            ? 'bg-emerald-500 text-slate-900'
                                            : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20 hover:bg-indigo-500'
                                        }`}
                                >
                                    <CheckCircle2 size={48} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {completedSteps[`${activeSubIdx}-${currentStepIdx}`] ? '¡Hecho!' : 'Marcar Completado'}
                                    </span>
                                </button>

                                <button
                                    disabled={currentStepIdx === steps.length - 1}
                                    onClick={() => setCurrentStepIdx(prev => prev + 1)}
                                    className="flex-1 py-10 bg-white/5 rounded-[3rem] text-slate-400 flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all disabled:opacity-20"
                                >
                                    <ChevronRight size={48} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Siguiente</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-6">
                            <Info size={64} className="mx-auto text-slate-800" />
                            <p className="text-xl font-black text-slate-500 uppercase">No hay instrucciones para esta elaboración</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
