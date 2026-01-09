
import React, { useMemo, useState } from 'react';
import { Recipe, AppSettings, Allergen, ALLERGEN_LIST, ALLERGEN_ICONS, SERVICE_TYPES } from '../types';
import { Printer, ArrowLeft, AlertOctagon, Utensils, Thermometer, ChefHat, Users, Clock, UtensilsCrossed, MessageSquare, Info, Camera } from 'lucide-react';

interface RecipeViewProps {
  recipe: Recipe;
  settings: AppSettings;
  onBack: () => void;
}

export const RecipeView: React.FC<RecipeViewProps> = ({ recipe, settings, onBack }) => {
  const [dynamicPax, setDynamicPax] = useState<number>(recipe.yieldQuantity);

  const paxRatio = useMemo(() => {
    return dynamicPax / recipe.yieldQuantity;
  }, [dynamicPax, recipe.yieldQuantity]);

  const allAllergens = useMemo(() => {
    const set = new Set<Allergen>();
    recipe.subRecipes?.forEach(sub => {
      sub.ingredients?.forEach(ing => {
        ing.allergens?.forEach(a => set.add(a));
      });
    });
    return Array.from(set);
  }, [recipe]);

  const scaleQuantity = (qtyStr: string): string => {
    const num = parseFloat(qtyStr.replace(',', '.'));
    if (isNaN(num)) return qtyStr;
    const scaled = num * paxRatio;
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(scaled < 1 ? 3 : 2).replace('.', ',');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:p-0 print:bg-white font-sans text-slate-900">
      <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center no-print">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors uppercase text-[10px] tracking-widest">
          <ArrowLeft size={18} />
          <span>Volver al Panel</span>
        </button>
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Users size={16} className="text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escalar Pax:</span>
            <input
              type="number"
              value={dynamicPax}
              onChange={e => setDynamicPax(Math.max(1, Number(e.target.value)))}
              className="w-10 font-black text-center text-indigo-600 outline-none border-b-2 border-indigo-100 focus:border-indigo-500 bg-transparent"
            />
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg font-black uppercase text-xs tracking-widest">
            <Printer size={18} />
            <span>Imprimir Ficha</span>
          </button>
        </div>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:w-full overflow-hidden print:overflow-visible p-8 print:p-6 border border-slate-200 print:border-none rounded-[1.5rem] print:rounded-none">
        {/* Cabecera compacta */}
        {/* Cabecera Rediseñada */}
        <div className="mb-8 border-b border-slate-900 pb-6 break-inside-avoid">
          <div className="flex justify-between items-start mb-6">
            {/* Left: Institute */}
            <div className="flex flex-col items-start gap-2">
              {settings.instituteLogo ? (
                <img src={settings.instituteLogo} alt="IES Logo" className="h-16 w-auto object-contain" />
              ) : (
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100"><span className="text-[8px] uppercase">Logo</span></div>
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{settings.instituteName}</span>
            </div>

            {/* Right: Teacher */}
            <div className="flex flex-col items-end gap-2">
              {settings.teacherLogo ? (
                <img src={settings.teacherLogo} alt="Teacher Logo" className="h-16 w-auto object-contain" />
              ) : (
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 text-slate-300"><ChefHat size={24} /></div>
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">{settings.teacherName}</span>
            </div>
          </div>

          {/* Center: Recipe Name */}
          <div className="text-center">
            <span className="bg-emerald-50 text-emerald-600 font-black text-[9px] px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest inline-block mb-3">
              {Array.isArray(recipe.category) ? recipe.category.join(' • ') : recipe.category}
            </span>
            <h1 className="text-4xl font-serif font-black text-slate-900 uppercase tracking-tighter leading-none">
              {recipe.name}
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter text-xs border-b-2 border-slate-900 pb-1 flex justify-between items-end">
            <span>DESARROLLO TÉCNICO</span>
            <span className="text-[10px] text-slate-500 font-normal normal-case">Escandallo base: {recipe.yieldQuantity} pax</span>
          </h3>

          {/* Layout 50/50: Foto + Alérgenos Grid 7x2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 mb-8 break-inside-avoid items-start">
            {/* 50% Foto */}
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-slate-100 w-full relative group">
              {recipe.photo ? (
                <img src={recipe.photo} alt={recipe.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-300 gap-2">
                  <Camera size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sin Foto</span>
                </div>
              )}
            </div>

            {/* 50% Alérgenos - Grid 7 columnas */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-2">
                <AlertOctagon size={16} className="text-amber-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matriz de Alérgenos</span>
              </div>
              <div className="grid grid-cols-7 gap-y-6 gap-x-1">
                {ALLERGEN_LIST.map(allergen => {
                  const isPresent = allAllergens.includes(allergen);
                  return (
                    <div key={allergen} className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-sm ${isPresent ? 'border-amber-500 bg-amber-50 text-slate-900 scale-110' : 'border-slate-100 bg-slate-50 opacity-20 filter grayscale text-slate-300'}`}>
                        <span className="text-base leading-none">{ALLERGEN_ICONS[allergen]}</span>
                      </div>
                      <span className={`text-[6px] font-black uppercase text-center leading-none max-w-[40px] ${isPresent ? 'text-slate-900' : 'text-slate-300'}`}>{allergen.split(' ')[0]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {recipe.subRecipes.map((sub, sIdx) => (
            <div key={sub.id} className="grid grid-cols-1 md:grid-cols-12 print:grid print:grid-cols-12 border border-slate-200 rounded-xl overflow-hidden shadow-sm break-inside-avoid bg-white">
              {/* Header */}
              <div className="col-span-12 bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                <span className="bg-slate-900 text-white w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold">{sIdx + 1}</span>
                <h4 className="text-[11px] font-black text-slate-800 uppercase">{sub.name}</h4>
              </div>

              {/* Ingredients Column */}
              <div className="col-span-4 print:col-span-4 p-4 border-r border-slate-100 print:border-r print:border-b-0 bg-slate-50/30">
                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Utensils size={10} /> Ingredientes</h5>
                <table className="w-full text-[10px] text-slate-700">
                  <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                    {sub.ingredients.map((ing, iIdx) => (
                      <tr key={iIdx}>
                        <td className="py-1.5 font-bold uppercase">{ing.name}</td>
                        <td className="py-1.5 text-right font-black text-slate-900 whitespace-nowrap">{scaleQuantity(ing.quantity)} <span className="text-[8px] text-slate-400 font-bold">{ing.unit}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Method Column */}
              <div className="col-span-8 print:col-span-8 p-4">
                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Info size={10} /> Procedimiento</h5>
                <div className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap font-serif">
                  {sub.instructions || "Sin instrucciones detalladas."}
                </div>

                {/* Photos Grid - 3cm approx (113px @ 96dpi, but CSS cm units work for print) */}
                {sub.photos && sub.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
                    {sub.photos.map((p, pIdx) => (
                      <div key={pIdx} className="w-[3cm] h-[3cm] rounded-lg border border-slate-200 overflow-hidden relative shadow-sm">
                        <img src={p} alt={`Paso ${pIdx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 right-0 bg-black/50 text-white text-[8px] px-1">{pIdx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* 3. INSTRUCCIONES DE PRESENTACIÓN (Moved Above Service Block) */}
      <div className="mt-8 mb-8 break-inside-avoid">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ChefHat size={18} className="text-slate-400" /> Instrucciones de Presentación
        </h3>
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] border-dashed">
          <div className="text-sm text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">
            {recipe.platingInstructions || "No se han especificado instrucciones de emplatado."}
          </div>
        </div>
      </div>

      {/* BLOQUE UNIFICADO DE SERVICIO Y PRESENTACIÓN (Now just Service) */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 mt-8 border border-slate-800 shadow-2xl break-inside-avoid relative overflow-hidden print:shadow-none w-full">
        {/* Fondo decorativo */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <ChefHat size={200} />
        </div>

        {/* 1. EXPLICACIÓN COMERCIAL (Top) */}
        <div className="flex items-start gap-6 mb-8 border-b border-white/10 pb-8">
          <div className="bg-amber-500 p-3 rounded-2xl text-slate-900 shrink-0 shadow-lg shadow-amber-900/20">
            <MessageSquare size={28} />
          </div>
          <div className="flex-grow pt-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-3">Explicación Sugerente (Servicio)</p>
            <p className="text-lg font-medium italic leading-relaxed text-slate-100 font-serif opacity-90">
              "{(recipe.serviceDetails?.clientDescription) || 'No definida.'}"
            </p>
          </div>
        </div>

        {/* 2. DATOS TÉCNICOS (Middle) */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Thermometer size={12} /> Temperatura
            </p>
            <span className="text-sm font-black text-amber-500">{(recipe.serviceDetails?.servingTemp) || '--'}</span>
          </div>

          <div className="bg-white/5 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Info size={12} /> Protocolo de Servicio
            </p>
            <span className="text-[10px] font-black uppercase text-slate-200 leading-tight block mb-1">{(recipe.serviceDetails?.serviceType) || 'AMERICANA'}</span>
            <span className="text-[9px] text-slate-400 italic leading-tight block">
              {SERVICE_TYPES.find(s => s.name === recipe.serviceDetails?.serviceType)?.desc || ''}
            </span>
          </div>

          <div className="bg-white/5 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <UtensilsCrossed size={12} /> Cubertería
            </p>
            <span className="text-[10px] font-bold text-slate-300 uppercase leading-snug block">{(recipe.serviceDetails?.cutlery) || 'Estándar'}</span>
          </div>

          <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Users size={12} /> Rendimiento
            </p>
            <span className="text-xl font-black text-amber-500 leading-none">{dynamicPax} <span className="text-xs opacity-70">{recipe.yieldUnit.substring(0, 3)}</span></span>
          </div>
        </div>

      </div>



      {/* Pie de página limpio */}
      <div className="mt-8 text-center text-[9px] text-slate-300 font-black uppercase tracking-[0.4em] print:text-slate-900 border-t border-slate-50 pt-6">
        {settings.instituteName} • {settings.teacherName}
      </div>
    </div>
  );
};
