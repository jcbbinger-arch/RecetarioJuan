import React, { useState } from 'react';
import { Recipe, AppSettings, Product, MenuPlan } from '../types';
import {
  ArrowLeft, Plus, Trash2, Calendar, Users, Save,
  ChefHat, Search, BookOpen, Clock, FileText, Download, Check, ShoppingCart, X, Printer
} from 'lucide-react';
import { parseQuantity, normalizeToBasics, formatNormalized } from '../utils';

interface MenuPlannerProps {
  recipes: Recipe[];
  settings: AppSettings;
  onBack: () => void;
  productDatabase: Product[];
  savedMenus: MenuPlan[];
  onSaveMenu: (menu: MenuPlan) => void;
  onDeleteMenu: (id: string) => void;
}

export const MenuPlanner: React.FC<MenuPlannerProps> = ({
  recipes, settings, onBack, productDatabase, savedMenus, onSaveMenu, onDeleteMenu
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [pax, setPax] = useState(1);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const filteredRecipes = recipes.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartNew = () => {
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setPax(1);
    setSelectedRecipeIds([]);
    setEditingMenu(null);
    setIsCreating(true);
  };

  const handleEdit = (menu: MenuPlan) => {
    setEditingMenu(menu);
    setTitle(menu.title);
    setDate(menu.date);
    setPax(menu.pax);
    setSelectedRecipeIds(menu.recipeIds);
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!title.trim() || selectedRecipeIds.length === 0) {
      alert('Por favor, indica un título y selecciona al menos una receta.');
      return;
    }

    const menu: MenuPlan = {
      id: editingMenu?.id || Date.now().toString(),
      title,
      date,
      pax,
      recipeIds: selectedRecipeIds,
      lastModified: Date.now()
    };

    onSaveMenu(menu);
    setIsCreating(false);
  };

  const toggleRecipe = (id: string) => {
    setSelectedRecipeIds(prev =>
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const calculateShoppingList = () => {
    const list: Record<string, { total: number, base: 'g' | 'ml' | 'ud' }> = {};

    selectedRecipeIds.forEach(id => {
      const recipe = recipes.find(r => r.id === id);
      if (!recipe) return;

      const ratio = pax / recipe.yieldQuantity;

      recipe.subRecipes?.forEach(sub => {
        sub.ingredients?.forEach(ing => {
          const qty = parseQuantity(ing.quantity) * ratio;
          const normalized = normalizeToBasics(qty, ing.unit);
          const key = ing.name.toUpperCase();

          if (!list[key]) {
            list[key] = { total: normalized.value, base: normalized.base };
          } else {
            list[key].total += normalized.value;
          }
        });
      });
    });

    return Object.entries(list).sort((a, b) => a[0].localeCompare(b[0]));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
              <Calendar className="text-indigo-500" /> Planificador de Menús
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión de servicios y planificación</p>
          </div>
        </div>
        {!isCreating && (
          <button
            onClick={handleStartNew}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 flex items-center gap-2 shadow-xl font-black uppercase text-xs tracking-widest transition-all"
          >
            <Plus size={18} /> Nuevo Menú
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {isCreating ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulario Izquierda */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Título del Menú / Evento</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-lg font-black uppercase focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="EJ: SERVICIO DE COMIDA..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Fecha</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">PAX (Comensales)</label>
                    <input
                      type="number"
                      value={pax}
                      onChange={e => setPax(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-black outline-none"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all"
                  >
                    Guardar Plan
                  </button>
                </div>
              </div>

              <div className="bg-indigo-900 rounded-[2rem] p-6 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><ChefHat size={80} /></div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-2">Recetas Seleccionadas</h4>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-4">Total: {selectedRecipeIds.length} platos</p>
                <div className="space-y-2">
                  {selectedRecipeIds.map((rid, sIdx) => {
                    const r = recipes.find(x => x.id === rid);
                    return r ? (
                      <div key={rid} className="flex justify-between items-center bg-white/10 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                        <span className="text-[10px] font-black uppercase truncate max-w-[80%]">
                          <span className="text-indigo-400 mr-2">{sIdx + 1}.</span>
                          {r.name}
                        </span>
                        <button onClick={() => toggleRecipe(rid)} className="text-white/40 hover:text-white"><Trash2 size={12} /></button>
                      </div>
                    ) : null;
                  })}
                  {selectedRecipeIds.length === 0 && (
                    <p className="text-white/30 text-[10px] font-bold uppercase py-10 text-center border-2 border-dashed border-white/10 rounded-2xl">Selecciona platos de la lista</p>
                  )}
                </div>
              </div>
            </div>

            {/* Selector Derecha */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Catálogo de Recetas</h3>
                  <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar receta..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRecipes.map(recipe => (
                    <button
                      key={recipe.id}
                      onClick={() => toggleRecipe(recipe.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${selectedRecipeIds.includes(recipe.id)
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-md'
                        : 'border-slate-100 hover:border-slate-300 bg-white'
                        }`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                        {recipe.photo ? <img src={recipe.photo} className="w-full h-full object-cover" alt="" /> : <ChefHat className="w-full h-full p-4 text-slate-200" />}
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-[11px] font-black uppercase text-slate-800 leading-tight mb-1">{recipe.name}</h4>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{recipe.category?.[0] || 'Otros'}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${selectedRecipeIds.includes(recipe.id) ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-transparent'}`}>
                        <Check size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-indigo-400">Total Menús</p>
                  <p className="text-2xl font-black text-indigo-900">{savedMenus.length}</p>
                </div>
              </div>
              <button
                onClick={handleStartNew}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 flex items-center gap-3 shadow-xl shadow-indigo-500/20 font-black uppercase text-[11px] tracking-widest transition-all active:scale-95"
              >
                <Plus size={20} /> Crear Nuevo Servicio
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedMenus.map(menu => (
                <div key={menu.id} className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 p-6 space-y-6 group">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                      <Calendar size={24} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(menu)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><FileText size={18} /></button>
                      <button onClick={() => confirm('¿Eliminar este menú?') && onDeleteMenu(menu.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 leading-none mb-2">{menu.title}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(menu.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Users size={12} /> {menu.pax} PAX</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { handleEdit(menu); setShowShoppingList(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-tight hover:bg-emerald-100 transition-colors"
                      >
                        <ShoppingCart size={12} /> Compras
                      </button>
                    </div>
                    <button onClick={() => handleEdit(menu)} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">Ver Detalles →</button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleStartNew}
                className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-white transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors">
                  <Plus size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-600 transition-colors">Nuevo Plan de Menú</p>
              </button>
            </div>

            {savedMenus.length === 0 && (
              <div className="py-20 text-center">
                <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen size={40} className="text-slate-300" strokeWidth={1} />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No hay menús guardados</p>
                <p className="text-slate-300 text-xs mt-2 italic">Comienza planificando tu primer servicio técnico.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showShoppingList && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowShoppingList(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Lista de Compra</h3>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">{title || 'Menú Seleccionado'}</p>
                </div>
              </div>
              <button onClick={() => setShowShoppingList(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>

            <div className="p-8 overflow-y-auto flex-grow print:p-0">
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-6 flex justify-between items-center group">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información del Pedido</p>
                  <p className="text-lg font-bold text-slate-800">{pax} PAX <span className="text-slate-300 mx-2">|</span> {new Date(date).toLocaleDateString()}</p>
                </div>
                <button onClick={() => window.print()} className="p-4 bg-white text-slate-600 rounded-2xl shadow-sm border border-slate-100 hover:text-slate-900 transition-all active:scale-95 group-hover:shadow-md">
                  <Printer size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {calculateShoppingList().map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 transition-all hover:translate-x-1 group">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-[11px] font-black text-slate-700 uppercase">{name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">{formatNormalized(data.total, data.base)}</span>
                  </div>
                ))}
                {calculateShoppingList().length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-slate-400 font-bold uppercase text-[10px]">No hay ingredientes para calcular</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 flex justify-end gap-3 no-print">
              <button
                onClick={() => setShowShoppingList(false)}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-800 shadow-xl transition-all active:scale-95"
              >
                Cerrar Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
