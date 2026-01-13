
import React, { useState, useRef } from 'react';
import { Recipe, AppSettings, Product, MenuPlan } from '../types';
import { Plus, Search, Eye, Edit2, Trash2, ChefHat, Settings, Calendar, Database, LogOut, FileJson, Sparkles, Users, Coins, Tag, ShoppingCart, Globe, Lock, Shield } from 'lucide-react';

interface DashboardProps {
  recipes: Recipe[];
  settings: AppSettings;
  savedMenus: MenuPlan[];
  productDatabase: Product[];
  currentProfile: any;
  communityRecipes?: Recipe[];
  onNew: () => void;
  onEdit: (recipe: Recipe) => void;
  onView: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onImport: (recipe: Recipe) => void;
  onOpenSettings: () => void;
  onOpenMenuPlanner: () => void;
  onOpenProductDB: () => void;
  onOpenAIBridge: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  recipes, settings, savedMenus, productDatabase, currentProfile, communityRecipes = [], onNew, onEdit, onView, onDelete, onImport, onOpenSettings, onOpenMenuPlanner, onOpenProductDB, onOpenAIBridge, onOpenAdmin, onLogout
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'personal' | 'community'>('personal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayRecipes = activeView === 'personal' ? recipes : communityRecipes;
  const sortedRecipes = [...displayRecipes].sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));

  const filteredRecipes = sortedRecipes.filter(r =>
  (r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (Array.isArray(r.category) ? r.category.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) : (r.category as string).toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.name) onImport({ ...json, id: Date.now().toString(), lastModified: Date.now() });
      } catch (err) { alert('Archivo no válido.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const stats = [
    { label: 'Recetas', value: recipes.length, icon: <ChefHat size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Menús', value: savedMenus.length, icon: <Calendar size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Categorías', value: settings.categories?.length || 0, icon: <Tag size={18} />, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Ingredientes', value: productDatabase.length, icon: <Database size={18} />, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="bg-[#0f172a] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-amber-500/5 pointer-events-none"></div>
        <div className="bg-slate-950/40 px-6 py-3 border-b border-slate-800/50 backdrop-blur-sm relative z-10">
          <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <div className="flex items-center gap-4">
              {settings.instituteLogo ? <img src={settings.instituteLogo} alt="IES" className="h-6 opacity-80" /> : <Database size={12} className="text-indigo-500" />}
              <span className="hover:text-white transition-colors cursor-default">{settings.instituteName}</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-slate-300">{settings.teacherName}</span>
              <button onClick={onLogout} className="hover:text-rose-400 flex items-center gap-2 transition-all active:scale-95"><LogOut size={12} /> Salir</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-6">
              <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-4 rounded-3xl shadow-2xl shadow-amber-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <ChefHat size={40} className="text-slate-950" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Mis Fichas Técnicas</h1>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Gastronomía • Gestión de Escandallos</p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-md">
                <button onClick={onOpenSettings} className="p-3 hover:bg-slate-700/50 rounded-xl transition-all text-slate-400 hover:text-white group" title="Configuración">
                  <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>
                <button onClick={onOpenProductDB} className="p-3 hover:bg-slate-700/50 rounded-xl transition-all text-slate-400 hover:text-white" title="Inventario Maestro">
                  <Database size={20} />
                </button>
              </div>

              <button onClick={onOpenMenuPlanner} className="flex items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 uppercase text-[10px] tracking-widest leading-none">
                <Calendar size={18} /> Menú del Día
              </button>

              <div className="h-10 w-px bg-slate-700/50 self-center"></div>

              {currentProfile?.role === 'admin' && (
                <button onClick={onOpenAdmin} className="flex items-center gap-3 px-6 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest shadow-2xl">
                  <Shield size={18} /> Panel Maestro
                </button>
              )}

              <button onClick={onOpenAIBridge} className="flex items-center gap-3 px-6 py-4 bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 hover:bg-slate-900 rounded-2xl transition-all text-amber-500 font-black text-[10px] uppercase tracking-widest shadow-2xl">
                <Sparkles size={18} /> Puente IA
              </button>

              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
              <button onClick={handleImportClick} className="flex items-center gap-3 px-6 py-4 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-black rounded-2xl border border-slate-700/50 transition-all uppercase text-[10px] tracking-widest">
                <FileJson size={18} /> Importar
              </button>

              <button onClick={onNew} className="flex items-center gap-4 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-2xl shadow-amber-500/30 transition-all active:scale-95 uppercase text-[11px] tracking-[0.1em]">
                <Plus size={22} strokeWidth={3} /> Nueva Ficha
              </button>
            </div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row gap-8 items-end">
            <div className="max-w-2xl flex-grow relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="¿Qué receta buscas hoy? Filtra por nombre o categoría..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-slate-800/50 border border-slate-700 focus:border-amber-500/50 rounded-2xl text-white placeholder-slate-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-bold text-lg shadow-inner"
              />
            </div>

            <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/50">
              <button
                onClick={() => setActiveView('personal')}
                className={`px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'personal' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Mis Recetas
              </button>
              <button
                onClick={() => setActiveView('community')}
                className={`px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'community' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Explorador Comunidad
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 mb-12 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white hover:border-indigo-100 transition-all duration-500 flex items-center gap-5 group">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                {stat.icon}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 leading-none tabular-nums tracking-tighter">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filteredRecipes.length > 0 ? filteredRecipes.map(recipe => {
            const costPerPortion = recipe.totalCost && recipe.yieldQuantity ? (recipe.totalCost / recipe.yieldQuantity).toFixed(2) : '0.00';
            return (
              <div key={recipe.id} className="bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100/80 overflow-hidden flex flex-col group relative">
                <div className="aspect-square relative overflow-hidden bg-slate-50">
                  {recipe.photo ? (
                    <img src={recipe.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10 bg-gradient-to-br from-slate-100 to-slate-200">
                      <ChefHat size={40} className="text-slate-400" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {(Array.isArray(recipe.category) ? recipe.category : [recipe.category]).slice(0, 2).map((cat, ci) => (
                      <span key={ci} className="bg-slate-900/80 backdrop-blur-md text-white text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-lg border border-white/10">
                        {cat}
                      </span>
                    ))}
                    {recipe.isPublic ? (
                      <span className="bg-indigo-600/90 backdrop-blur-md text-white text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-lg border border-white/10 flex items-center gap-1">
                        <Globe size={8} /> Público
                      </span>
                    ) : (
                      <span className="bg-slate-900/40 backdrop-blur-md text-white/50 text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-lg border border-white/5 flex items-center gap-1">
                        <Lock size={8} /> Privado
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex flex-col gap-1.5">
                    {activeView === 'personal' && (
                      <>
                        <button onClick={() => onEdit(recipe)} className="p-2.5 bg-white text-blue-600 rounded-xl shadow-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"><Edit2 size={13} /></button>
                        <button onClick={() => confirm(`¿Borrar ${recipe.name}?`) && onDelete(recipe.id)} className="p-2.5 bg-white text-rose-500 rounded-xl shadow-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <div className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1.5 rounded-xl shadow-xl uppercase tracking-tighter flex items-center gap-1.5 border border-white/20">
                      <Coins size={10} /> {costPerPortion}€
                    </div>
                  </div>
                </div>

                <div className="p-3 flex-grow flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-[9px] font-black text-slate-800 leading-tight uppercase tracking-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">{recipe.name}</h3>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Users size={7} /> {recipe.yieldQuantity} PAX
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[6px] font-black text-slate-300 uppercase truncate max-w-[50%]">{recipe.creator || settings.teacherName}</p>
                    <button onClick={() => onView(recipe)} className="flex items-center gap-1 text-[7px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest transition-all group/btn">
                      Ver <Eye size={10} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChefHat size={40} className="text-slate-200" strokeWidth={1} />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No se han encontrado recetas</p>
              <button onClick={onNew} className="mt-6 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:text-indigo-800 transition-colors">+ Crear mi primera ficha</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
