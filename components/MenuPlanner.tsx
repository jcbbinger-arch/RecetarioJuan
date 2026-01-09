
import React, { useState, useMemo } from 'react';
import { Recipe, AppSettings, ALLERGEN_LIST, Allergen, Product, MenuPlan } from '../types';
import { Plus, Trash2, ArrowLeft, Printer, Search, ArrowUp, ArrowDown, Calendar, FileText, Utensils, AlertOctagon, Users, ShoppingCart, BookOpen, ChevronRight, ChefHat, Info, Thermometer, User, DollarSign, Save, History, Clock, CheckCircle2 } from 'lucide-react';

const ALLERGEN_CONFIG: Record<Allergen, { color: string, short: string, icon: string }> = {
  'Gluten': { color: 'bg-yellow-100 text-yellow-800', short: 'GLU', icon: '🌾' },
  'Crustáceos': { color: 'bg-red-100 text-red-800', short: 'CRU', icon: '🦀' },
  'Huevos': { color: 'bg-orange-100 text-orange-800', short: 'HUE', icon: '🥚' },
  'Pescado': { color: 'bg-blue-100 text-blue-800', short: 'PES', icon: '🐟' },
  'Cacahuetes': { color: 'bg-amber-100 text-amber-800', short: 'CAC', icon: '🥜' },
  'Soja': { color: 'bg-purple-100 text-purple-800', short: 'SOJA', icon: '🌱' },
  'Lácteos': { color: 'bg-sky-100 text-sky-800', short: 'LAC', icon: '🥛' },
  'Frutos de cáscara': { color: 'bg-emerald-100 text-emerald-800', short: 'FRA', icon: '🌰' },
  'Apio': { color: 'bg-green-100 text-green-800', short: 'API', icon: '🥬' },
  'Mostaza': { color: 'bg-yellow-200 text-yellow-900', short: 'MUS', icon: '🌭' },
  'Sésamo': { color: 'bg-stone-100 text-stone-800', short: 'SES', icon: '🥯' },
  'Sulfitos': { color: 'bg-gray-200 text-gray-800', short: 'SUL', icon: '🍷' },
  'Altramuces': { color: 'bg-pink-100 text-pink-800', short: 'ALT', icon: '🏵️' },
  'Moluscos': { color: 'bg-indigo-100 text-indigo-800', short: 'MOL', icon: '🐙' }
};

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
  const [activeTab, setActiveTab] = useState<'planning' | 'service_order' | 'allergen_matrix' | 'purchase_order' | 'kitchen_fichas' | 'history'>('planning');
  const [currentMenuId, setCurrentMenuId] = useState<string | null>(null);
  const [menuTitle, setMenuTitle] = useState('MENÚ DEL DÍA');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [menuPax, setMenuPax] = useState<number>(30);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const filteredRecipes = recipes.filter(r => 
    !selectedRecipes.find(sr => sr.id === r.id) &&
    (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const menuEconomics = useMemo(() => {
    let totalCost = 0;
    selectedRecipes.forEach(recipe => {
      const costPerPortion = (recipe.totalCost || 0) / (recipe.yieldQuantity || 1);
      totalCost += costPerPortion * menuPax;
    });
    return {
      total: totalCost,
      perPax: selectedRecipes.length > 0 ? totalCost / menuPax : 0
    };
  }, [selectedRecipes, menuPax]);

  const purchaseOrderData = useMemo(() => {
    const families: Record<string, Record<string, { name: string, quantity: number, unit: string, cost: number }>> = {};
    selectedRecipes.forEach(recipe => {
      const ratio = menuPax / recipe.yieldQuantity;
      recipe.subRecipes.forEach(sub => {
        sub.ingredients.forEach(ing => {
          const product = productDatabase.find(p => p.name === ing.name);
          const family = product?.category || 'OTROS';
          const qtyNum = parseFloat(ing.quantity.replace(',', '.'));
          const finalQty = isNaN(qtyNum) ? 0 : qtyNum * ratio;
          const finalCost = (ing.pricePerUnit || 0) * finalQty;
          if (!families[family]) families[family] = {};
          if (!families[family][ing.name]) {
            families[family][ing.name] = { name: ing.name, quantity: finalQty, unit: ing.unit, cost: finalCost };
          } else {
            families[family][ing.name].quantity += finalQty;
            families[family][ing.name].cost += finalCost;
          }
        });
      });
    });
    return Object.entries(families).sort(([a], [b]) => a.localeCompare(b));
  }, [selectedRecipes, menuPax, productDatabase]);

  const handleSavePlan = (asNew: boolean = false) => {
    if (selectedRecipes.length === 0) return;
    setSaveStatus('saving');
    const newId = (asNew || !currentMenuId) ? `menu_${Date.now()}` : currentMenuId;
    const plan: MenuPlan = {
      id: newId,
      title: menuTitle,
      date: eventDate,
      pax: menuPax,
      recipeIds: selectedRecipes.map(r => r.id),
      lastModified: Date.now()
    };
    onSaveMenu(plan);
    if (asNew || !currentMenuId) setCurrentMenuId(newId);
    
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  const handleLoadPlan = (plan: MenuPlan) => {
    setMenuTitle(plan.title);
    setEventDate(plan.date);
    setMenuPax(plan.pax);
    setCurrentMenuId(plan.id);
    
    const matchedRecipes = plan.recipeIds
      .map(id => recipes.find(r => r.id === id))
      .filter(r => !!r) as Recipe[];
    
    setSelectedRecipes(matchedRecipes);
    setActiveTab('planning');
  };

  const handleReset = () => {
    if (confirm("¿Limpiar planificación actual?")) {
      setSelectedRecipes([]);
      setMenuTitle('MENÚ DEL DÍA');
      setCurrentMenuId(null);
      setMenuPax(30);
    }
  };

  const addToMenu = (recipe: Recipe) => setSelectedRecipes([...selectedRecipes, recipe]);
  const removeFromMenu = (index: number) => {
    const newMenu = [...selectedRecipes];
    newMenu.splice(index, 1);
    setSelectedRecipes(newMenu);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newMenu = [...selectedRecipes];
    const item = newMenu[index];
    newMenu.splice(index, 1);
    newMenu.splice(direction === 'up' ? index - 1 : index + 1, 0, item);
    setSelectedRecipes(newMenu);
  };

  const getRecipeAllergens = (r: Recipe): Allergen[] => {
    const set = new Set<Allergen>();
    r.subRecipes.forEach(sub => sub.ingredients.forEach(ing => ing.allergens.forEach(a => set.add(a))));
    return Array.from(set);
  };

  const scaleQuantity = (qtyStr: string, recipeYield: number): string => {
    const num = parseFloat(qtyStr.replace(',', '.'));
    if (isNaN(num)) return qtyStr;
    const scaled = num * (menuPax / recipeYield);
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(3);
  };

  const PrintHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
       <div className="w-1/4">
          {settings.instituteLogo ? <img src={settings.instituteLogo} className="h-16 object-contain" alt="IES" /> : <span className="font-bold">{settings.instituteName}</span>}
       </div>
       <div className="w-2/4 text-center">
          <h1 className="text-2xl font-black uppercase mb-1 tracking-tighter">{title}</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest">{subtitle}</p>
       </div>
       <div className="w-1/4 text-right">
          <p className="text-xs font-black">{settings.teacherName}</p>
          <p className="text-[10px] font-bold text-slate-500">{new Date().toLocaleDateString()}</p>
       </div>
    </div>
  );

  if (activeTab === 'history') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                 <button onClick={() => setActiveTab('planning')} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-slate-600">
                    <ArrowLeft size={24} />
                 </button>
                 <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Histórico de Menús</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Planificaciones Guardadas</p>
                 </div>
              </div>
              <button onClick={() => setActiveTab('planning')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">
                <Plus size={16}/> Nueva Planificación
              </button>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {savedMenus.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-300">
                   <Clock size={48} className="mx-auto text-slate-200 mb-4" />
                   <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">No hay menús guardados todavía</p>
                </div>
              ) : (
                savedMenus.map(plan => (
                  <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-indigo-400 transition-all group shadow-sm">
                     <div className="flex items-center gap-5">
                        <div className="bg-slate-100 p-4 rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                           <Calendar size={28} />
                        </div>
                        <div>
                           <h3 className="font-black text-slate-800 uppercase text-lg leading-none mb-2">{plan.title}</h3>
                           <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Clock size={12}/> {plan.date}</span>
                              <span className="flex items-center gap-1"><Users size={12}/> {plan.pax} PAX</span>
                              <span className="bg-slate-50 px-2 py-0.5 rounded">{plan.recipeIds.length} PLATOS</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => handleLoadPlan(plan)} className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">
                           Cargar Menú
                        </button>
                        <button onClick={() => confirm(`¿Borrar el menú ${plan.title}?`) && onDeleteMenu(plan.id)} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                           <Trash2 size={20} />
                        </button>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'planning') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-slate-600" /></button>
              <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Planificador de Menús</h1>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
               <button onClick={() => setActiveTab('history')} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-xs uppercase tracking-widest transition-all shadow-sm"><History size={16}/> Histórico</button>
               <button onClick={() => setActiveTab('kitchen_fichas')} disabled={selectedRecipes.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-900 rounded-xl hover:bg-amber-600 disabled:opacity-50 font-bold text-xs uppercase tracking-widest transition-all shadow-md"><BookOpen size={16}/> Fichas Cocina</button>
               <button onClick={() => setActiveTab('purchase_order')} disabled={selectedRecipes.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-bold text-xs uppercase tracking-widest transition-all shadow-md"><ShoppingCart size={16}/> Pedido Familias</button>
               <button onClick={() => setActiveTab('service_order')} disabled={selectedRecipes.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 font-bold text-xs uppercase tracking-widest transition-all shadow-md"><FileText size={16}/> Orden Servicio</button>
               <button onClick={() => setActiveTab('allergen_matrix')} disabled={selectedRecipes.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 font-bold text-xs uppercase tracking-widest transition-all shadow-md"><AlertOctagon size={16}/> Matriz Alérgenos</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-[75vh]">
               <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Filtrar catálogo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 shadow-inner font-bold text-sm" />
                 </div>
               </div>
               <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {filteredRecipes.map(recipe => (
                    <div key={recipe.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shadow-inner">{recipe.photo && <img src={recipe.photo} className="w-full h-full object-cover" alt="" />}</div>
                          <div>
                             <h4 className="font-black text-slate-800 text-sm uppercase leading-none mb-1">{recipe.name}</h4>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{recipe.category}</p>
                          </div>
                       </div>
                       <button onClick={() => addToMenu(recipe)} className="p-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Plus size={20} /></button>
                    </div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden h-[75vh]">
               <div className="p-8 border-b border-indigo-50 bg-indigo-50/30">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><Utensils size={24}/></div>
                      <div>
                        <h3 className="font-black text-indigo-900 uppercase tracking-widest">Servicio Programado</h3>
                        <p className="text-xs text-indigo-400 font-bold uppercase">Gestión de volúmenes y costes</p>
                      </div>
                    </div>
                    {selectedRecipes.length > 0 && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSavePlan()} 
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                          {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? <><CheckCircle2 size={14}/> Guardado</> : <><Save size={14}/> Guardar</>}
                        </button>
                        <button onClick={handleReset} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Resetear"><Trash2 size={20}/></button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-indigo-700 uppercase mb-2 tracking-widest">Nombre del Menú / Evento</label>
                      <input type="text" value={menuTitle} onChange={e => setMenuTitle(e.target.value)} className="w-full px-5 py-3 border border-indigo-100 rounded-2xl text-sm font-black shadow-sm outline-none focus:ring-2 focus:ring-indigo-600" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-indigo-700 uppercase mb-2 tracking-widest">Raciones (Pax)</label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                        <input type="number" value={menuPax} onChange={e => setMenuPax(Math.max(1, Number(e.target.value)))} className="w-full pl-12 pr-4 py-3 border border-indigo-100 rounded-2xl text-sm font-black shadow-sm outline-none focus:ring-2 focus:ring-indigo-600" />
                      </div>
                    </div>
                  </div>
               </div>
               
               <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50/30 custom-scrollbar">
                  {selectedRecipes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-3xl">
                       <Calendar size={64} className="mb-4 opacity-10"/>
                       <p className="font-bold uppercase tracking-widest text-[10px]">Añade platos para planificar el servicio</p>
                    </div>
                  ) : (
                    <>
                      {selectedRecipes.map((recipe, idx) => (
                          <div key={`${recipe.id}_${idx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 animate-fadeIn group">
                             <span className="font-black text-slate-200 text-xl w-8 text-center">{idx + 1}</span>
                             <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">{recipe.photo && <img src={recipe.photo} className="w-full h-full object-cover" alt="" />}</div>
                             <div className="flex-grow">
                                <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight truncate">{recipe.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold italic">Escalado: {menuPax} raciones</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => moveItem(idx, 'up')} className="p-1 text-slate-300 hover:text-slate-900" disabled={idx === 0}><ArrowUp size={16}/></button>
                                  <button onClick={() => moveItem(idx, 'down')} className="p-1 text-slate-300 hover:text-slate-900" disabled={idx === selectedRecipes.length -1}><ArrowDown size={16}/></button>
                                </div>
                                <button onClick={() => removeFromMenu(idx)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                             </div>
                          </div>
                      ))}
                      <div className="p-8 border-t border-slate-100 mt-6 bg-slate-50/50 rounded-2xl text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Coste Total Estimado</p>
                         <p className="text-3xl font-black text-indigo-600">{menuEconomics.total.toFixed(2)}€</p>
                      </div>
                    </>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'kitchen_fichas') {
    return (
      <div className="min-h-screen bg-gray-100 print:bg-white p-4 md:p-10">
        <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center no-print">
          <button onClick={() => setActiveTab('planning')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold uppercase text-[10px] tracking-widest">
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-700 transition-all shadow-lg font-black uppercase text-xs tracking-widest">
            <Printer size={20} />
            <span>Imprimir Fichas Escaladas</span>
          </button>
        </div>

        {selectedRecipes.map((recipe, rIdx) => (
          <div key={recipe.id} className="bg-white shadow-2xl print:shadow-none mb-10 overflow-hidden rounded-3xl print:rounded-none page-break border border-slate-200 print:border-none max-w-[210mm] mx-auto">
             <div className="bg-slate-900 text-white p-10">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-amber-400 font-black uppercase tracking-[0.2em] text-[10px] mb-3">{recipe.category}</p>
                      <h2 className="text-4xl font-serif font-black uppercase leading-none tracking-tighter">{recipe.name}</h2>
                      <p className="text-slate-400 text-xs mt-4 uppercase font-black tracking-widest">VOLUMEN DE PASE: {menuPax} {recipe.yieldUnit}</p>
                   </div>
                   <div className="text-right flex flex-col items-end">
                      <div className="bg-white/10 p-2 rounded-xl mb-3 border border-white/5"><Utensils size={32} className="text-white"/></div>
                      <p className="text-3xl font-black text-amber-500">{menuPax} PAX</p>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-100 divide-x divide-slate-100">
                <div className="p-6 flex items-center gap-4">
                   <Info size={20} className="text-indigo-400"/>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Servicio Sala</p>
                      <p className="text-xs font-black uppercase text-slate-800">{recipe.serviceDetails.serviceType}</p>
                   </div>
                </div>
                <div className="p-6 flex items-center gap-4">
                   <Thermometer size={20} className="text-rose-400"/>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Temp. Pase</p>
                      <p className="text-xs font-black uppercase text-slate-800">{recipe.serviceDetails.servingTemp || 'N/A'}</p>
                   </div>
                </div>
                <div className="p-6 flex items-center gap-4">
                   <User size={20} className="text-amber-400"/>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Responsable</p>
                      <p className="text-xs font-black uppercase text-slate-800">{recipe.creator || settings.teacherName}</p>
                   </div>
                </div>
             </div>

             <div className="p-10 space-y-12">
                {recipe.subRecipes.map((sub, sIdx) => (
                  <div key={sIdx} className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 break-inside-avoid shadow-inner">
                    <div className="flex flex-col md:flex-row gap-10">
                       <div className="md:w-5/12">
                          <h4 className="font-black text-slate-900 uppercase border-b-2 border-slate-900 pb-3 mb-6 text-sm flex items-center gap-3">
                             <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">{sIdx+1}</span>
                             {sub.name}
                          </h4>
                          <table className="w-full text-xs">
                             <thead className="text-slate-400 uppercase font-black border-b border-slate-200">
                                <tr>
                                   <th className="py-2 text-left tracking-widest">Género</th>
                                   <th className="py-2 text-right tracking-widest">Peso/Vol</th>
                                   <th className="py-2 pl-2 tracking-widest">Ud.</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                {sub.ingredients.map((ing, iIdx) => (
                                  <tr key={iIdx}>
                                     <td className="py-2.5 font-bold text-slate-800 uppercase text-[11px] leading-tight">{ing.name}</td>
                                     <td className="py-2.5 text-right font-mono font-black text-indigo-600 text-[11px]">{scaleQuantity(ing.quantity, recipe.yieldQuantity)}</td>
                                     <td className="py-2.5 pl-2 text-slate-400 uppercase font-black text-[9px]">{ing.unit}</td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                       <div className="md:w-7/12 border-l border-slate-200 md:pl-10">
                          <h5 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em] flex items-center gap-2">Técnicas de Elaboración</h5>
                          <div className="text-xs leading-relaxed whitespace-pre-wrap text-slate-700 font-serif text-justify">{sub.instructions || "Paso técnico no definido."}</div>
                       </div>
                    </div>
                  </div>
                ))}

                <div className="bg-slate-900 text-white p-8 rounded-2xl">
                   <h4 className="text-[10px] font-black uppercase text-amber-400 mb-3 tracking-[0.2em] flex items-center gap-2">Puesta en Plato y Acabado</h4>
                   <p className="text-xs text-slate-300 font-medium leading-relaxed italic">{recipe.platingInstructions || "Ver manual de emplatado estándar."}</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'purchase_order') {
    return (
      <div className="min-h-screen bg-gray-100 print:bg-white p-4 md:p-10">
         <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none p-12 print:p-0 rounded-3xl overflow-hidden">
            <div className="flex justify-between items-center mb-8 print:hidden">
               <button onClick={() => setActiveTab('planning')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors uppercase text-[10px] tracking-widest"><ArrowLeft size={20}/> Volver</button>
               <button onClick={() => window.print()} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest"><Printer size={20}/> Generar Pedido</button>
            </div>

            <PrintHeader title="HOJA DE PEDIDO POR FAMILIAS" subtitle={`EVENTO: ${menuTitle} | VOLUMEN: ${menuPax} PAX | FECHA: ${eventDate}`} />

            <div className="mb-10 flex justify-end">
               <div className="border-4 border-slate-900 p-6 rounded-2xl text-right bg-slate-50">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Presupuesto Estimado Pedido</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{menuEconomics.total.toFixed(2)}€</p>
               </div>
            </div>

            <div className="space-y-12">
               {purchaseOrderData.map(([family, items]) => (
                 <div key={family} className="break-inside-avoid border-t-2 border-slate-200 pt-6">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-[0.1em] mb-6 flex items-center gap-3">
                       <span className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-black">{family}</span>
                       FAMILIA DE PRODUCTO
                    </h3>
                    <table className="w-full text-left text-xs">
                       <thead className="border-b-2 border-slate-900">
                          <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                             <th className="py-3">Género / Materia Prima</th>
                             <th className="py-3 text-right">Cantidad Solicitada</th>
                             <th className="py-3 pl-6">Unidad</th>
                             <th className="py-3 text-right">Coste Est.</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {Object.values(items).map((item: any) => (
                            <tr key={item.name} className="hover:bg-slate-50/50">
                               <td className="py-3.5 font-black text-slate-800 uppercase tracking-tight">{item.name}</td>
                               <td className="py-3.5 text-right font-mono font-black text-emerald-600 text-sm">{item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(3)}</td>
                               <td className="py-3.5 pl-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">{item.unit}</td>
                               <td className="py-3.5 text-right font-mono text-slate-400 font-bold">{item.cost.toFixed(2)}€</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               ))}
            </div>

            <div className="mt-16 pt-10 border-t border-slate-100 text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em] print:text-black">
               Este pedido es una proyección basada en escandallos técnicos para {menuPax} comensales. Verifique existencias antes de tramitar.
            </div>
         </div>
      </div>
    );
  }

  if (activeTab === 'allergen_matrix') {
    return (
      <div className="min-h-screen bg-gray-100 print:bg-white p-4 md:p-10">
         <div className="max-w-[297mm] mx-auto bg-white shadow-2xl print:shadow-none p-12 print:p-0 rounded-3xl overflow-hidden">
            <div className="flex justify-between items-center mb-8 print:hidden">
               <button onClick={() => setActiveTab('planning')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 uppercase text-[10px] tracking-widest"><ArrowLeft size={20}/> Volver</button>
               <button onClick={() => window.print()} className="flex items-center gap-2 bg-rose-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all uppercase text-xs tracking-widest"><Printer size={20}/> Imprimir Matriz</button>
            </div>

            <PrintHeader title="DECLARACIÓN DE ALÉRGENOS POR SERVICIO" subtitle={`SERVICIO: ${menuTitle} | FECHA: ${eventDate} | VOLUMEN: ${menuPax} PAX`} />

            <div className="overflow-x-auto border border-slate-900 rounded-lg">
               <table className="w-full border-collapse border-hidden text-[9px] table-fixed">
                  <thead>
                     <tr className="bg-slate-50">
                        <th className="border border-slate-900 p-4 text-left uppercase font-black text-slate-900 w-1/4 text-sm tracking-tighter">Relación de Platos</th>
                        {ALLERGEN_LIST.map(allergen => (
                          <th key={allergen} className="border border-slate-900 p-1 text-center font-black uppercase text-[8px]">
                             <div className="flex flex-col items-center justify-end h-36 pb-3">
                                <span className="text-xl mb-3">{ALLERGEN_CONFIG[allergen].icon}</span>
                                <span className="[writing-mode:vertical-lr] rotate-180 transform font-black tracking-tighter text-slate-800">
                                   {allergen.toUpperCase()}
                                </span>
                             </div>
                          </th>
                        ))}
                     </tr>
                  </thead>
                  <tbody>
                     {selectedRecipes.map((recipe, idx) => {
                       const allergens = getRecipeAllergens(recipe);
                       return (
                         <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="border border-slate-900 p-4 font-black uppercase text-slate-800 leading-tight text-xs tracking-tight bg-slate-50/30">{recipe.name}</td>
                            {ALLERGEN_LIST.map(allergen => {
                              const hasAllergen = allergens.includes(allergen);
                              return (
                                <td key={allergen} className={`border border-slate-900 p-1 text-center ${hasAllergen ? 'bg-rose-50' : ''}`}>
                                  {hasAllergen && <span className="text-xl font-black text-rose-600">X</span>}
                                </td>
                              );
                            })}
                         </tr>
                       );
                     })}
                  </tbody>
               </table>
            </div>
            <div className="mt-10 p-6 border-2 border-slate-900 rounded-2xl bg-slate-50 text-[10px] leading-relaxed italic text-slate-600 font-medium">
               <strong>IMPORTANTE:</strong> Información facilitada en cumplimiento del Reglamento (UE) nº 1169/2011 sobre la información alimentaria facilitada al consumidor. 
               Dada la naturaleza de la elaboración manual en nuestras cocinas, no se puede garantizar la ausencia total de trazas por contaminación cruzada. 
               Por favor, informe al personal sobre cualquier alergia grave antes de consumir.
            </div>
         </div>
      </div>
    );
  }

  return null;
};
