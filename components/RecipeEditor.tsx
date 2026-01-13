
import React, { useState, useEffect, useMemo } from 'react';
import {
  Recipe, Ingredient, ServiceDetails, SubRecipe,
  Allergen, Product,
  SERVICE_TYPES, AppSettings, ALLERGEN_LIST,
  CUTLERY_DICTIONARY, TEMPERATURE_DICTIONARY, ALLERGEN_ICONS
} from '../types';
import {
  parseQuantity, formatQuantity, convertUnit, calculateIngredientCost
} from '../utils';
import {
  Save, X, Plus, Trash2, Image as ImageIcon,
  Book, Utensils, Thermometer, Info, Database, MessageSquare, ChevronDown, CheckCircle2,
  ChefHat, Users, Camera, DatabaseZap, Check, HelpCircle, AlertCircle, Globe, Lock
} from 'lucide-react';

interface RecipeEditorProps {
  initialRecipe?: Recipe | null;
  productDatabase: Product[];
  settings: AppSettings;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
  onAddProduct: (product: Product) => void;
}

const emptyServiceDetails: ServiceDetails = {
  presentation: '',
  servingTemp: '',
  cutlery: '',
  passTime: '',
  serviceType: 'Servicio a la Americana',
  clientDescription: ''
};

export const RecipeEditor: React.FC<RecipeEditorProps> = ({
  initialRecipe, productDatabase, settings, onSave, onCancel, onAddProduct
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string[]>(
    settings.categories && settings.categories.length > 0 ? [settings.categories[0]] : ['Otros']
  );
  const [yieldQuantity, setYieldQuantity] = useState<number>(1);
  const [yieldUnit, setYieldUnit] = useState('Raciones');
  const [photo, setPhoto] = useState('');
  const [creator, setCreator] = useState(settings.teacherName);
  const [sourceUrl, setSourceUrl] = useState('');
  const [platingInstructions, setPlatingInstructions] = useState('');
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails>(emptyServiceDetails);
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [manualAllergens, setManualAllergens] = useState<Allergen[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<{ idx: number, list: Product[] } | null>(null);

  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [familySearch, setFamilySearch] = useState('');
  const [showFamilyList, setShowFamilyList] = useState(false);

  const existingFamilies = useMemo(() => {
    const families = Array.from(new Set(
      productDatabase.map(p => p.category?.toUpperCase() || 'VARIOS')
    )).sort();
    return families;
  }, [productDatabase]);

  const filteredFamilies = useMemo(() => {
    const search = familySearch.toUpperCase();
    return existingFamilies.filter(f => f.includes(search));
  }, [existingFamilies, familySearch]);

  useEffect(() => {
    if (initialRecipe) {
      setName(initialRecipe.name);
      setCategory(Array.isArray(initialRecipe.category) ? initialRecipe.category : [initialRecipe.category]);
      setYieldQuantity(initialRecipe.yieldQuantity);
      setYieldUnit(initialRecipe.yieldUnit);
      setPhoto(initialRecipe.photo);
      setCreator(initialRecipe.creator || settings.teacherName);
      setSourceUrl(initialRecipe.sourceUrl || '');
      setServiceDetails(initialRecipe.serviceDetails || emptyServiceDetails);
      setPlatingInstructions(initialRecipe.platingInstructions || '');
      setManualAllergens(initialRecipe.manualAllergens || []);
      setIsPublic(!!initialRecipe.isPublic);
      setSubRecipes((initialRecipe.subRecipes || []).map(sr => ({
        ...sr,
        photos: sr.photos || ((sr as any).photo ? [(sr as any).photo] : [])
      })));
    } else {
      setSubRecipes([{ id: Date.now().toString(), name: 'Elaboración Principal', ingredients: [], instructions: '', photos: [] }]);
      setCreator(settings.teacherName);
    }
  }, [initialRecipe, settings.teacherName]);

  const derivedAllergensDetails = useMemo(() => {
    const details = new Map<Allergen, string[]>();
    subRecipes.forEach(sub => {
      sub.ingredients.forEach(ing => {
        ing.allergens?.forEach(a => {
          const list = details.get(a) || [];
          if (!list.includes(ing.name)) list.push(ing.name);
          details.set(a, list);
        });
      });
    });
    return details;
  }, [subRecipes]);

  const derivedAllergens = useMemo(() => Array.from(derivedAllergensDetails.keys()), [derivedAllergensDetails]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find(item => item.type.indexOf('image') !== -1);
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            // Target heuristic: if main photo is empty, put it there. Otherwise, add to active sub-recipe.
            if (!photo && activeTab === 0) {
              setPhoto(base64);
            } else if (subRecipes[activeTab]) {
              const newSubs = [...subRecipes];
              newSubs[activeTab].photos = [...(newSubs[activeTab].photos || []), base64];
              setSubRecipes(newSubs);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab, photo, subRecipes]);

  const updateIngredient = (subIdx: number, ingIdx: number, field: keyof Ingredient, value: string | number | Allergen[]) => {
    const newSubs = [...subRecipes];
    const ing = newSubs[subIdx].ingredients[ingIdx];

    if (field === 'quantity') {
      const qtyStr = value.toString();
      ing.quantity = qtyStr;
      const qtyNum = parseQuantity(qtyStr);
      ing.cost = calculateIngredientCost(qtyNum, ing.pricePerUnit || 0);
    } else if (field === 'unit') {
      const newUnit = value as string;
      const oldUnit = ing.unit;
      const oldQtyNum = parseQuantity(ing.quantity);

      if (oldQtyNum > 0 && oldUnit !== newUnit) {
        // Implement scaling: 1kg -> 1000g
        const newQtyNum = convertUnit(oldQtyNum, oldUnit, newUnit);
        ing.quantity = formatQuantity(newQtyNum);

        // Adjust pricePerUnit relative to the NEW unit to keep total cost consistent
        // We use the same conversion factor for the price (inversely)
        const factor = convertUnit(1, oldUnit, newUnit);
        if (factor > 0) {
          ing.pricePerUnit = (ing.pricePerUnit || 0) / factor;
        }

        ing.cost = calculateIngredientCost(newQtyNum, ing.pricePerUnit || 0);
      }
      ing.unit = newUnit;
    } else if (field === 'allergens') {
      ing.allergens = value as Allergen[];
    } else if (field === 'pricePerUnit') {
      const price = Number(value);
      ing.pricePerUnit = price;
      ing.cost = calculateIngredientCost(ing.quantity, price);
    } else if (field === 'cost') {
      ing.cost = Number(value);
    } else if (field === 'name') {
      (ing as any)[field] = value;
      const lowerVal = (value as string).toLowerCase();
      if (lowerVal.length > 1) {
        const matches = productDatabase.filter(p => p.name.toLowerCase().includes(lowerVal)).slice(0, 5);
        setSuggestions({ idx: ingIdx, list: matches });

        const exactMatch = productDatabase.find(p => p.name.toUpperCase() === (value as string).toUpperCase());
        if (exactMatch) {
          const currentUnit = ing.unit || exactMatch.unit;
          ing.unit = currentUnit;
          ing.allergens = exactMatch.allergens;
          ing.category = exactMatch.category;

          const factor = convertUnit(1, currentUnit, exactMatch.unit);
          ing.pricePerUnit = exactMatch.pricePerUnit * factor;
          ing.cost = calculateIngredientCost(ing.quantity, ing.pricePerUnit);
        }
      } else setSuggestions(null);
    } else {
      (ing as any)[field] = value;
    }
    setSubRecipes(newSubs);
  };

  const handleOpenQuickAdd = (ingName: string) => {
    if (!ingName.trim()) return;
    setQuickAddProduct({
      id: `p_quick_${Date.now()}`,
      name: ingName.toUpperCase(),
      unit: 'kg',
      pricePerUnit: 0,
      allergens: [],
      category: 'ALMACÉN'
    });
    setFamilySearch('ALMACÉN');
    setSuggestions(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '.' || e.key === 'Decimal') {
      e.preventDefault();
      const input = e.currentTarget;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const val = input.value;
      const newVal = val.substring(0, start) + ',' + val.substring(end);

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeInputValueSetter?.call(input, newVal);

      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      setTimeout(() => input.setSelectionRange(start + 1, start + 1), 0);
    }
  };


  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddProduct) return;

    onAddProduct({
      ...quickAddProduct,
      category: familySearch.toUpperCase() || 'VARIOS'
    });

    const newSubs = [...subRecipes];
    newSubs.forEach(sub => {
      sub.ingredients.forEach(ing => {
        if (ing.name.toUpperCase() === quickAddProduct.name.toUpperCase()) {
          const currentQty = parseQuantity(ing.quantity);

          // Sync unit and price
          const oldUnit = ing.unit;
          ing.unit = quickAddProduct.unit;
          ing.pricePerUnit = quickAddProduct.pricePerUnit;
          ing.allergens = quickAddProduct.allergens;
          ing.category = quickAddProduct.category;

          // Scaling logic for quick add too
          const scaledQty = convertUnit(currentQty, oldUnit, ing.unit);
          ing.quantity = formatQuantity(scaledQty);
          ing.cost = calculateIngredientCost(scaledQty, quickAddProduct.pricePerUnit);
        }
      });
    });

    setSubRecipes(newSubs);
    setQuickAddProduct(null);
  };

  const selectProduct = (subIdx: number, ingIdx: number, product: Product) => {
    const newSubs = [...subRecipes];
    const ing = newSubs[subIdx].ingredients[ingIdx];
    const qtyNum = parseQuantity(ing.quantity);

    // Keep existing unit if set, otherwise take from product
    const currentUnit = ing.unit || product.unit;
    const factor = convertUnit(1, currentUnit, product.unit);
    const priceInRecipeUnit = product.pricePerUnit * factor;

    newSubs[subIdx].ingredients[ingIdx] = {
      ...ing,
      name: product.name,
      category: product.category,
      allergens: product.allergens,
      unit: currentUnit,
      pricePerUnit: priceInRecipeUnit,
      cost: calculateIngredientCost(qtyNum, priceInRecipeUnit)
    };
    setSubRecipes(newSubs);
    setSuggestions(null);
  };

  const removeSubRecipePhoto = (subIdx: number, photoIdx: number) => {
    const newSubs = [...subRecipes];
    newSubs[subIdx].photos = newSubs[subIdx].photos.filter((_, i) => i !== photoIdx);
    setSubRecipes(newSubs);
  };

  const handleAddSubRecipePhotos = (e: React.ChangeEvent<HTMLInputElement>, subIdx: number) => {
    const files = e.target.files;
    if (!files) return;

    const newSubs = [...subRecipes];
    const readers = Array.from(files).map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(results => {
      newSubs[subIdx].photos = [...(newSubs[subIdx].photos || []), ...results];
      setSubRecipes(newSubs);
    });
  };

  const handleSave = () => {
    const totalCost = subRecipes.reduce((acc, sub) => acc + sub.ingredients.reduce((sAcc, ing) => sAcc + (ing.cost || 0), 0), 0);
    onSave({
      id: initialRecipe?.id || Date.now().toString(),
      name, category, photo, creator, sourceUrl,
      yieldQuantity, yieldUnit, totalCost,
      subRecipes, platingInstructions, serviceDetails,
      manualAllergens,
      isPublic,
      lastModified: Date.now()
    });
  };

  const selectedServiceType = SERVICE_TYPES.find(s => s.name === serviceDetails.serviceType);

  return (
    <div className="bg-slate-100 min-h-screen pb-20 font-sans relative">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
            <Book className="text-amber-500" /> {initialRecipe ? 'Editar Ficha' : 'Nueva Ficha Técnica'}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPublic ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
          >
            {isPublic ? <><Globe size={14} /> Pública</> : <><Lock size={14} /> Privada</>}
          </button>
          <button onClick={handleSave} className="px-8 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 flex items-center gap-2 shadow-xl font-black uppercase text-xs tracking-widest transition-all">
            <Save size={18} /> Guardar Ficha
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-3">
              <div className="relative aspect-square bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer shadow-inner group transition-all">
                {photo ? <img src={photo} className="w-full h-full object-cover" alt="" /> : <div className="text-center"><ImageIcon size={48} className="text-slate-200 mx-auto" /><p className="text-[10px] font-black uppercase text-slate-300 mt-2">Portada Plato</p></div>}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="text-white" size={32} />
                </div>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setPhoto(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
              </div>
            </div>
            <div className="md:col-span-9 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Nombre del Plato</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xl font-serif font-black uppercase focus:ring-2 focus:ring-slate-200 transition-all" placeholder="Nombre de la receta" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-inner">
                  <label className="block text-[10px] font-black text-amber-700 uppercase mb-2 flex items-center gap-2">
                    <Users size={12} /> Rendimiento (PAX)
                  </label>
                  <input type="number" value={yieldQuantity} onChange={e => setYieldQuantity(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl font-black text-amber-900 outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Unidad de Medida</label>
                  <input type="text" value={yieldUnit} onChange={e => setYieldUnit(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 transition-all" placeholder="Ej: raciones, pax, ud..." />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Responsable / Creador</label>
                  <input type="text" value={creator} onChange={e => setCreator(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 transition-all" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Categorías del Plato</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {settings.categories?.map(c => {
                const isSelected = category.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      if (isSelected) setCategory(category.filter(cat => cat !== c));
                      else setCategory([...category, c]);
                    }}
                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 text-center flex items-center justify-center leading-tight h-12 ${isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105'
                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'
                      }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-500" />
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Matriz de Alérgenos (Real-Time)</label>
              </div>
              <div className="flex gap-4 text-[8px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Presente en ingrediente</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-rose-400 bg-rose-50"></div> Contaminación Cruzada</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-14 gap-2">
              {ALLERGEN_LIST.map(a => {
                const isManual = manualAllergens.includes(a);
                const isDerived = derivedAllergens.includes(a);
                const sourceIngredients = derivedAllergensDetails.get(a) || [];

                return (
                  <div key={a} className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = isManual ? manualAllergens.filter(x => x !== a) : [...manualAllergens, a];
                        setManualAllergens(updated);
                      }}
                      className={`w-full py-3 px-1 rounded-xl text-[8px] font-black border-2 transition-all uppercase flex flex-col items-center justify-center text-center leading-none gap-1 h-20 relative overflow-hidden ${isManual
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-md scale-105 z-10'
                        : isDerived
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-slate-50 border-transparent text-slate-300 hover:border-slate-200 hover:text-slate-400'
                        }`}
                    >
                      {isDerived && (
                        <div className="absolute top-1 right-1">
                          <Check size={10} className="text-indigo-500" />
                        </div>
                      )}
                      <span className="text-lg">{ALLERGEN_ICONS[a] || '⚠️'}</span>
                      <span className="mt-1">{a.split(' ')[0]}</span>
                    </button>

                    {isDerived && sourceIngredients.length > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-slate-900 text-white text-[7px] p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                        <p className="font-black border-b border-white/10 pb-1 mb-1 uppercase tracking-tighter">Presente en:</p>
                        <ul className="space-y-0.5">
                          {sourceIngredients.map((ing, k) => <li key={k} className="truncate">• {ing}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {subRecipes.map((sub, idx) => (
              <button key={idx} type="button" onClick={() => setActiveTab(idx)} className={`px-6 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all border-2 ${activeTab === idx ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' : 'bg-white text-slate-400 border-white hover:border-slate-100'}`}>
                {idx + 1}. {sub.name}
              </button>
            ))}
            <button onClick={() => setSubRecipes([...subRecipes, { id: Date.now().toString(), name: 'Nueva Elaboración', ingredients: [], instructions: '', photos: [] }])} className="p-3 bg-white text-slate-400 rounded-2xl border border-dashed border-slate-200 hover:text-slate-900 hover:border-slate-400 transition-all"><Plus size={18} /></button>
          </div>

          {subRecipes[activeTab] && (
            <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm space-y-8 overflow-visible">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3 w-full max-w-md">
                  <Database className="text-slate-300" size={20} />
                  <input type="text" value={subRecipes[activeTab].name} onChange={e => {
                    const n = [...subRecipes]; n[activeTab].name = e.target.value; setSubRecipes(n);
                  }} className="text-xl font-black uppercase tracking-tight outline-none w-full focus:ring-b-2 focus:ring-slate-900" placeholder="Nombre de la elaboración" />
                </div>
                <button onClick={() => { if (confirm('¿Eliminar esta elaboración?')) { const n = subRecipes.filter((_, i) => i !== activeTab); setSubRecipes(n); setActiveTab(0); } }} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-visible">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Escandallo de Ingredientes</span>
                    <button onClick={() => {
                      const n = [...subRecipes]; n[activeTab].ingredients.push({ id: Math.random().toString(), name: '', quantity: '', unit: 'kg', allergens: [] }); setSubRecipes(n);
                    }} className="text-indigo-600 flex items-center gap-1 font-black hover:text-indigo-800 transition-colors"><Plus size={14} /> Añadir Ingrediente</button>
                  </div>
                  <div className="space-y-2">
                    {subRecipes[activeTab].ingredients.map((ing, iIdx) => {
                      const exactMatch = ing.name && productDatabase.some(p => p.name.toUpperCase() === ing.name.toUpperCase());
                      return (
                        <div key={ing.id} className="grid grid-cols-12 gap-2 relative group items-center">
                          <div className="col-span-6 relative">
                            <input
                              type="text"
                              value={ing.name}
                              onChange={e => updateIngredient(activeTab, iIdx, 'name', e.target.value)}
                              className={`w-full px-4 py-3 text-xs font-black rounded-xl outline-none uppercase placeholder:opacity-30 border transition-all ${ing.name && !exactMatch ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-100' : 'bg-slate-50 border-transparent focus:bg-white focus:border-slate-200'}`}
                              placeholder="Nombre del ingrediente..."
                            />
                            {ing.name && !exactMatch && (
                              <button
                                type="button"
                                onClick={() => handleOpenQuickAdd(ing.name)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all shadow-md flex items-center gap-1"
                              >
                                <DatabaseZap size={14} />
                                <span className="text-[8px] font-black uppercase">Alta</span>
                              </button>
                            )}

                            {suggestions && suggestions.idx === iIdx && (
                              <div className="absolute z-[100] left-0 right-0 top-full mt-1 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                                {suggestions.list.map(p => (
                                  <div key={p.id} onClick={() => selectProduct(activeTab, iIdx, p)} className="px-5 py-4 hover:bg-indigo-50 cursor-pointer text-[10px] font-black uppercase flex justify-between border-b border-slate-50 last:border-0 transition-colors">
                                    <span>{p.name}</span>
                                    <span className="text-slate-300">{p.category}</span>
                                  </div>
                                ))}
                                <div onClick={() => handleOpenQuickAdd(ing.name)} className="px-5 py-4 bg-amber-50 hover:bg-amber-100 cursor-pointer text-[10px] font-black uppercase flex items-center gap-3 text-amber-700 transition-colors border-t border-amber-100">
                                  <DatabaseZap size={16} />
                                  <span>Añadir "{ing.name}" como nuevo producto...</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <input type="text" value={ing.quantity} onKeyDown={handleKeyDown} onChange={e => updateIngredient(activeTab, iIdx, 'quantity', e.target.value)} className="col-span-2 text-right px-2 py-3 bg-white border border-slate-100 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 transition-all" placeholder="0.00" />
                          <select
                            value={ing.unit}
                            onChange={e => updateIngredient(activeTab, iIdx, 'unit', e.target.value)}
                            className="col-span-1 text-[9px] font-black text-slate-400 uppercase bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-slate-900 transition-colors py-1 cursor-pointer appearance-none text-center"
                          >
                            {['kg', 'g', 'litro', 'dl', 'ml', 'unidad', 'unidades', 'manojo', 'cs', 'cp'].map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                          </select>
                          <span className="col-span-2 text-right font-mono font-black text-indigo-600 text-xs flex items-center justify-end">{ing.cost?.toFixed(2)}€</span>
                          <button onClick={() => { const n = [...subRecipes]; n[activeTab].ingredients.splice(iIdx, 1); setSubRecipes(n); }} className="col-span-1 text-slate-200 hover:text-red-500 flex justify-center items-center transition-colors"><Trash2 size={16} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Galería de Imágenes Técnicas</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(subRecipes[activeTab].photos || []).map((photoSrc, pIdx) => (
                      <div key={pIdx} className="relative aspect-square rounded-2xl overflow-hidden shadow-md group border border-slate-100">
                        <img src={photoSrc} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => removeSubRecipePhoto(activeTab, pIdx)} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="relative aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors group shadow-inner">
                      <div className="text-center">
                        <Camera className="text-slate-200 mx-auto transition-transform group-hover:scale-110" size={32} />
                        <p className="text-[8px] font-black text-slate-300 mt-1 uppercase tracking-widest">Añadir Foto</p>
                      </div>
                      <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleAddSubRecipePhotos(e, activeTab)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2"><Utensils size={14} /> Procedimiento</label>
                <textarea value={subRecipes[activeTab].instructions} onChange={e => {
                  const n = [...subRecipes]; n[activeTab].instructions = e.target.value; setSubRecipes(n);
                }} className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm min-h-[220px] leading-relaxed font-medium outline-none focus:ring-2 focus:ring-slate-900 transition-all font-serif" placeholder="Describe paso a paso los procesos técnicos de esta elaboración..." />
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-800 overflow-hidden text-white p-10 space-y-10 relative">
          <div className="absolute top-0 right-0 p-10 opacity-5"><ChefHat size={120} /></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                <MessageSquare size={32} className="text-amber-500" /> Ficha de Servicio (Sala)
              </h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Protocolos de pase, servicio y atención al cliente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="group">
                <label className="block text-[10px] font-black text-amber-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                  <Info size={14} /> Explicación Sugerente del Plato
                </label>
                <textarea value={serviceDetails.clientDescription} onChange={e => setServiceDetails({ ...serviceDetails, clientDescription: e.target.value })} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-5 text-sm min-h-[120px] outline-none italic placeholder:text-slate-600 focus:border-amber-500 transition-all text-slate-200 font-serif" placeholder="Describe cómo se le debe presentar el plato al cliente..." />
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Protocolo de Servicio</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {SERVICE_TYPES.map(s => (
                    <button key={s.id} type="button" onClick={() => setServiceDetails({ ...serviceDetails, serviceType: s.name })} className={`px-3 py-3 text-[9px] font-black rounded-xl border transition-all uppercase flex flex-col items-center gap-1 ${serviceDetails.serviceType === s.name ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-lg scale-105' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                      {s.name.replace('Servicio a la ', '').replace('Servicio de ', '')}
                    </button>
                  ))}
                </div>
                {selectedServiceType && (
                  <div className="mb-4 bg-slate-800/50 border border-amber-500/20 p-4 rounded-xl animate-fadeIn">
                    <p className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-2 mb-1">
                      <HelpCircle size={10} /> Definición del Protocolo
                    </p>
                    <p className="text-[11px] text-slate-400 font-serif italic leading-relaxed">
                      {selectedServiceType.desc}
                    </p>
                  </div>
                )}
                <input type="text" value={serviceDetails.serviceType} onChange={e => setServiceDetails({ ...serviceDetails, serviceType: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-amber-500 font-black uppercase" />
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                  <Thermometer size={14} /> Temperatura de Pase
                </label>
                <div className="flex gap-2 mb-2 overflow-x-auto pb-2 custom-scrollbar">
                  {Object.keys(TEMPERATURE_DICTIONARY).map((key) => (
                    <button key={key} type="button" onClick={() => {
                      const temps = TEMPERATURE_DICTIONARY[key as keyof typeof TEMPERATURE_DICTIONARY];
                      if (temps && temps.length > 0) setServiceDetails({ ...serviceDetails, servingTemp: temps[0].value });
                    }} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white hover:border-amber-500 whitespace-nowrap transition-all">
                      {key}
                    </button>
                  ))}
                </div>
                <input type="text" value={serviceDetails.servingTemp} onChange={e => setServiceDetails({ ...serviceDetails, servingTemp: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-sm font-black text-amber-500 outline-none focus:ring-2 focus:ring-amber-500 uppercase" placeholder="Ej: 60-65 ºC" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                  <Utensils size={14} /> Marcaje y Cubertería (Sugerencias)
                </label>
                <div className="flex gap-2 mb-2 overflow-x-auto pb-2 custom-scrollbar">
                  {Object.entries(CUTLERY_DICTIONARY).map(([key, val]) => (
                    <button key={key} type="button" onClick={() => setServiceDetails({ ...serviceDetails, cutlery: val })} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white hover:border-amber-500 whitespace-nowrap transition-all">
                      {key}
                    </button>
                  ))}
                </div>
                <textarea value={serviceDetails.cutlery} onChange={e => setServiceDetails({ ...serviceDetails, cutlery: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-5 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-amber-500 font-bold uppercase placeholder:text-slate-600" placeholder="Ej: Cubiertos de pescado..." />
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-white/5">
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Instrucciones de Presentación</label>
            <textarea value={platingInstructions} onChange={e => setPlatingInstructions(e.target.value)} className="w-full bg-slate-900 border-2 border-dashed border-slate-700 rounded-[2rem] p-8 text-sm min-h-[150px] outline-none focus:border-amber-500 transition-colors font-serif" placeholder="Describe el paso final antes del pase..." />
          </div>
        </div>
      </div>

      {quickAddProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111322]/90 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] max-w-[540px] w-full overflow-visible border border-white/10 my-8">
            <div className="bg-[#111322] text-white px-10 py-10 flex justify-between items-center rounded-t-[2.5rem]">
              <h2 className="text-[26px] font-black uppercase tracking-tight">Añadir Género</h2>
              <button onClick={() => setQuickAddProduct(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={32} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickProduct} className="p-10 space-y-9 overflow-visible">
              <div className="relative">
                <label className="block text-[10px] font-black text-[#94A3B8] uppercase mb-2 tracking-[0.1em]">Familia / Categoría de Pedido</label>
                <div className="relative">
                  <input
                    required type="text" value={familySearch}
                    onFocus={() => setShowFamilyList(true)}
                    onBlur={() => setTimeout(() => setShowFamilyList(false), 200)}
                    onChange={e => { setFamilySearch(e.target.value.toUpperCase()); setShowFamilyList(true); }}
                    className="w-full px-7 py-5 bg-[#F8FAFC] border-none rounded-2xl font-black uppercase outline-none focus:ring-2 focus:ring-slate-100 text-slate-700 text-lg shadow-sm"
                    placeholder="BUSCAR O CREAR FAMILIA..."
                  />
                  <ChevronDown className={`absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showFamilyList ? 'rotate-180' : ''}`} size={20} />
                </div>
                {showFamilyList && (
                  <div className="absolute z-[110] left-0 right-0 top-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden max-h-48 overflow-y-auto animate-fadeIn custom-scrollbar">
                    {filteredFamilies.length > 0 ? (
                      filteredFamilies.map(f => (
                        <div key={f} onClick={() => { setFamilySearch(f); setShowFamilyList(false); }} className="px-6 py-4 hover:bg-slate-50 cursor-pointer text-[10px] font-black uppercase text-slate-600 border-b border-slate-50 last:border-0 flex justify-between items-center">
                          <span>{f}</span>
                          <CheckCircle2 size={12} className="text-slate-200" />
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-4 text-[10px] font-black text-amber-500 uppercase bg-amber-50">Crear familia: "{familySearch}"</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#94A3B8] uppercase mb-2 tracking-[0.1em]">Nombre del Producto</label>
                <input required type="text" value={quickAddProduct.name} onChange={e => setQuickAddProduct({ ...quickAddProduct, name: e.target.value.toUpperCase() })} className="w-full px-7 py-5 bg-[#F8FAFC] border-none rounded-2xl font-black uppercase outline-none focus:ring-2 focus:ring-slate-100 text-slate-700 text-lg shadow-sm" placeholder="EJ: SOLOMILLO DE TERNERA" />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-[#94A3B8] uppercase mb-2 tracking-[0.1em]">Precio Mercado €</label>
                  <div className="relative">
                    <input required type="number" step="0.0001" value={quickAddProduct.pricePerUnit} onKeyDown={handleKeyDown} onChange={e => setQuickAddProduct({ ...quickAddProduct, pricePerUnit: parseFloat(e.target.value) || 0 })} className="w-full px-7 py-5 bg-[#F8FAFC] border-none rounded-2xl font-black outline-none focus:ring-2 focus:ring-slate-100 text-slate-700 text-lg shadow-sm" />
                    <span className="absolute right-7 top-1/2 -translate-y-1/2 text-[#CBD5E1] font-bold text-xl">€</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#94A3B8] uppercase mb-2 tracking-[0.1em]">Unidad</label>
                  <div className="relative">
                    <select value={quickAddProduct.unit} onChange={e => setQuickAddProduct({ ...quickAddProduct, unit: e.target.value })} className="w-full px-7 py-5 bg-[#F8FAFC] border-none rounded-2xl font-black outline-none appearance-none cursor-pointer text-slate-700 text-lg shadow-sm">
                      <option value="kg">KG</option>
                      <option value="g">G</option>
                      <option value="litro">LITRO</option>
                      <option value="dl">DL</option>
                      <option value="ml">ML</option>
                      <option value="unidad">UNIDAD</option>
                      <option value="unidades">UNIDADES</option>
                      <option value="manojo">MANOJO</option>
                      <option value="cs">CS</option>
                      <option value="cp">CP</option>
                    </select>
                    <ChevronDown className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#94A3B8] uppercase mb-5 tracking-[0.1em]">Alérgenos Declarados (Nombre Completo)</label>
                <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-7 rounded-[2.5rem] border border-slate-50 max-h-60 overflow-y-auto custom-scrollbar shadow-inner">
                  {ALLERGEN_LIST.map(a => {
                    const isSel = quickAddProduct.allergens.includes(a);
                    return (
                      <button key={a} type="button" onClick={() => {
                        const current = quickAddProduct.allergens;
                        const updated = isSel ? current.filter(x => x !== a) : [...current, a];
                        setQuickAddProduct({ ...quickAddProduct, allergens: updated });
                      }} className={`py-3 px-4 rounded-xl text-[9px] font-black border-2 transition-all uppercase flex flex-col items-center justify-center text-center leading-tight gap-1 ${isSel ? 'bg-white border-[#111322] text-[#111322] shadow-md scale-105' : 'bg-white border-transparent text-[#CBD5E1] hover:text-slate-500 hover:border-slate-100'}`}>
                        <span className="text-xl">{ALLERGEN_ICONS[a] || '⚠️'}</span>
                        <span>{a}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full py-6 bg-[#111322] text-white rounded-[1.25rem] font-black uppercase text-base tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] transform">
                  Guardar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
