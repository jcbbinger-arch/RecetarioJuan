
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, AppBackup, Recipe, Product } from '../types';
import { X, Save, Upload, School, User, Database, Download, Tag, Plus, Trash2, Edit3 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  recipes: Recipe[];
  productDatabase: Product[];
  onSave: (settings: AppSettings) => void;
  onRestore: (backup: AppBackup) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, recipes, productDatabase, onSave, onRestore }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [newCat, setNewCat] = useState('');
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'teacherLogo' | 'instituteLogo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleDownloadBackup = () => {
    const backup: AppBackup = {
      version: 1,
      timestamp: Date.now(),
      settings: localSettings,
      recipes: recipes,
      productDatabase: productDatabase
    };
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchorNode.download = `mis_recetas_backup_${dateStr}.json`;
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    document.body.removeChild(downloadAnchorNode);
    URL.revokeObjectURL(url);
  };

  const addCategory = () => {
    if (newCat.trim()) {
      setLocalSettings({
        ...localSettings,
        categories: [...(localSettings.categories || []), newCat.trim()]
      });
      setNewCat('');
    }
  };

  const updateCategory = (index: number, newName: string) => {
    const updated = [...localSettings.categories];
    updated[index] = newName;
    setLocalSettings({ ...localSettings, categories: updated });
  };

  const removeCategory = (cat: string) => {
    if (confirm(`¿Eliminar la categoría "${cat}"?`)) {
      setLocalSettings({
        ...localSettings,
        categories: localSettings.categories.filter(c => c !== cat)
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">Configuración General</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2 mb-4">
                <School size={18} className="text-amber-500" /> Escuela / Centro
              </div>
              <input type="text" value={localSettings.instituteName} onChange={e => setLocalSettings({...localSettings, instituteName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nombre IES..." />
              <div className="relative aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {localSettings.instituteLogo ? <img src={localSettings.instituteLogo} className="h-full w-full object-contain p-2" /> : <div className="text-gray-400 text-xs text-center"><Upload className="mx-auto mb-1"/>Logo Centro</div>}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'instituteLogo')} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2 mb-4">
                <User size={18} className="text-amber-500" /> Profesor / Responsable
              </div>
              <input type="text" value={localSettings.teacherName} onChange={e => setLocalSettings({...localSettings, teacherName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nombre..." />
              <div className="relative aspect-square w-32 mx-auto bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {localSettings.teacherLogo ? <img src={localSettings.teacherLogo} className="h-full w-full object-cover" /> : <div className="text-gray-400 text-xs text-center"><Upload className="mx-auto mb-1"/>Foto</div>}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'teacherLogo')} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
             <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                <Tag size={18} className="text-indigo-500" /> Gestión de Categorías
             </div>
             <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                   <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} className="flex-grow px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nueva categoría..." />
                   <button onClick={addCategory} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all hover:bg-slate-800"><Plus size={16}/> Añadir</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {localSettings.categories?.map((c, idx) => (
                     <div key={idx} className="bg-slate-50 px-3 py-2 rounded-xl flex items-center gap-2 border border-slate-200 group">
                        <input 
                          type="text" 
                          value={c} 
                          onChange={(e) => updateCategory(idx, e.target.value)} 
                          className="bg-transparent border-none text-xs font-bold text-slate-700 flex-grow focus:ring-0 p-0"
                        />
                        <button onClick={() => removeCategory(c)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
             <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                <Database size={18} className="text-blue-500" /> Datos y Backup
             </div>
             <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs text-blue-800 flex-grow">
                  <p className="font-bold">Copia de Seguridad Integral</p>
                  <p className="opacity-80">Incluye todas las recetas, productos y configuraciones.</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={handleDownloadBackup} className="px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg flex items-center gap-2 text-xs font-medium"><Download size={14}/> Exportar</button>
                   <input type="file" ref={backupInputRef} className="hidden" accept=".json" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const reader = new FileReader();
                       reader.onload = (event) => onRestore(JSON.parse(event.target?.result as string));
                       reader.readAsText(file);
                     }
                   }} />
                   <button onClick={() => backupInputRef.current?.click()} className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-xs font-medium"><Upload size={14}/> Importar</button>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cerrar</button>
          <button onClick={handleSave} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 font-bold">
            <Save size={18} /> Guardar Ajustes
          </button>
        </div>
      </div>
    </div>
  );
};
