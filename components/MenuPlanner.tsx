
import React, { useState, useEffect } from 'react';
import { Recipe, AppSettings, AppBackup, Product, MenuPlan, DEFAULT_CATEGORIES, DEFAULT_PRODUCT_FAMILIES, SubRecipe } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Dashboard } from './components/Dashboard';
import { RecipeEditor } from './components/RecipeEditor';
import { RecipeView } from './components/RecipeView';
import { SettingsModal } from './components/SettingsModal';
import { MenuPlanner } from './components/MenuPlanner';
import { ProductDatabaseViewer } from './components/ProductDatabaseViewer';
import { LandingPage } from './components/LandingPage';
import { AIBridge } from './components/AIBridge';
import { INITIAL_PRODUCT_DATABASE } from './data/products';

const convertUnit = (qty: number, fromUnit: string, toUnit: string): number => {
  const f = fromUnit.toLowerCase();
  const t = toUnit.toLowerCase();
  if (f === t) return qty;

  // Mass
  if (f === 'g' && t === 'kg') return qty / 1000;
  if (f === 'kg' && t === 'g') return qty * 1000;

  // Volume
  const getMl = (v: number, u: string) => {
    if (u === 'l' || u === 'litro') return v * 1000;
    if (u === 'dl') return v * 100;
    if (u === 'cl') return v * 10;
    return v; // assume ml
  };

  const volumeUnits = ['l', 'litro', 'dl', 'cl', 'ml'];
  if (volumeUnits.includes(f) && volumeUnits.includes(t)) {
    const ml = getMl(qty, f);
    if (t === 'l' || t === 'litro') return ml / 1000;
    if (t === 'dl') return ml / 100;
    if (t === 'cl') return ml / 10;
    return ml;
  }

  return qty;
};

const syncRecipesWithProducts = (recipes: Recipe[], products: Product[]): Recipe[] => {
  return recipes.map(recipe => {
    let recipeHasChanges = false;
    const updatedSubRecipes = (recipe.subRecipes || []).map(sub => {
      let subHasChanges = false;
      const updatedIngredients = sub.ingredients.map(ing => {
        const product = products.find(p => p.name.toUpperCase() === ing.name.toUpperCase());
        if (product) {
          const qtyNum = parseFloat(ing.quantity.replace(',', '.'));
          if (!isNaN(qtyNum)) {
            // Respect the RECIPE'S unit. Calculate price relative to that unit.
            // Formula: PriceInRecipeUnit = PriceInProductUnit * Convert(1, RecipeUnit, ProductUnit)
            const factor = convertUnit(1, ing.unit, product.unit);
            const priceInRecipeUnit = product.pricePerUnit * factor;
            const newCost = qtyNum * priceInRecipeUnit;

            const allergensChanged = JSON.stringify(ing.allergens) !== JSON.stringify(product.allergens);
            if (ing.pricePerUnit !== priceInRecipeUnit || ing.cost !== newCost || allergensChanged) {
              subHasChanges = true;
              return {
                ...ing,
                pricePerUnit: priceInRecipeUnit,
                allergens: product.allergens,
                category: product.category,
                cost: newCost
              };
            }
          }
        }
        return ing;
      });

      if (subHasChanges) {
        recipeHasChanges = true;
        return { ...sub, ingredients: updatedIngredients };
      }
      return sub;
    });

    if (recipeHasChanges) {
      const totalCost = updatedSubRecipes.reduce((acc, sub) =>
        acc + sub.ingredients.reduce((sAcc, ing) => sAcc + (ing.cost || 0), 0), 0
      );
      return { ...recipe, subRecipes: updatedSubRecipes, totalCost };
    }
    return recipe;
  });
};



type ViewState = 'LANDING' | 'DASHBOARD' | 'EDITOR' | 'VIEWER' | 'MENU_PLANNER' | 'PRODUCT_DB' | 'AI_BRIDGE';

const defaultSettings: AppSettings = {
  teacherName: "Juan Codina Barranco",
  instituteName: "IES La Flota",
  teacherLogo: "",
  instituteLogo: "",
  categories: DEFAULT_CATEGORIES
};

interface LegacySubRecipe extends Omit<SubRecipe, 'photos'> {
  photo?: string;
  photos?: string[];
}

interface LegacyRecipe extends Omit<Recipe, 'subRecipes'> {
  subRecipes?: LegacySubRecipe[];
  // Fields from very old versions
  ingredients?: any[];
  instructions?: string;
}

const migrateRecipeIfNeeded = (r: Recipe, teacherName: string): Recipe => {
  const legacy = r as unknown as LegacyRecipe;

  const updatedSubRecipes = (legacy.subRecipes || []).map((sr) => {
    if (sr.photo !== undefined && sr.photos === undefined) {
      return {
        ...sr,
        photos: sr.photo ? [sr.photo] : [],
        photo: undefined
      } as SubRecipe;
    }
    return sr as SubRecipe;
  });

  if (legacy.subRecipes && legacy.subRecipes.length > 0 &&
    updatedSubRecipes === (legacy.subRecipes as unknown as SubRecipe[]) &&
    r.serviceDetails) return r;

  return {
    ...r,
    category: Array.isArray(r.category) ? r.category : [r.category].filter(Boolean) as string[],
    creator: legacy.creator || teacherName,
    subRecipes: updatedSubRecipes.length > 0 ? updatedSubRecipes : [{
      id: 'legacy-1',
      name: 'Elaboración Principal',
      ingredients: legacy.ingredients || [],
      instructions: legacy.instructions || '',
      photos: legacy.photo ? [legacy.photo] : []
    }],
    platingInstructions: legacy.platingInstructions || '',
    serviceDetails: legacy.serviceDetails || {
      presentation: '',
      servingTemp: '',
      cutlery: '',
      passTime: '',
      serviceType: 'Servicio a la Americana',
      clientDescription: ''
    }
  };
};

function App() {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('recipes', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', defaultSettings);
  const [productDatabase, setProductDatabase] = useLocalStorage<Product[]>('productDatabase', INITIAL_PRODUCT_DATABASE);
  const [savedMenus, setSavedMenus] = useLocalStorage<MenuPlan[]>('savedMenus', []);

  const [viewState, setViewState] = useState<ViewState>('LANDING');
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    let updated = false;
    let newSettings = { ...settings };

    if (!newSettings.categories || newSettings.categories.length === 0) {
      newSettings.categories = DEFAULT_CATEGORIES;
      updated = true;
    }

    if (!newSettings.productFamilies || newSettings.productFamilies.length === 0) {
      newSettings.productFamilies = DEFAULT_PRODUCT_FAMILIES;
      updated = true;
    }

    if (updated) setSettings(newSettings);
  }, [settings.categories, settings.productFamilies, setSettings]);

  useEffect(() => {
    if (recipes.length > 0) {
      const migrated = recipes.map(r => migrateRecipeIfNeeded(r, settings.teacherName));
      const hasChanges = JSON.stringify(migrated) !== JSON.stringify(recipes);
      if (hasChanges) {
        setRecipes(migrated);
      }
    }
  }, [recipes, settings.teacherName]);

  const handleEnterApp = () => setViewState('DASHBOARD');
  const handleLogout = () => { setViewState('LANDING'); setCurrentRecipe(null); };

  const handleCreateNew = () => { setCurrentRecipe(null); setViewState('EDITOR'); };



  const handleEdit = (recipe: Recipe) => {
    setCurrentRecipe(migrateRecipeIfNeeded(recipe, settings.teacherName));
    setViewState('EDITOR');
  };

  const handleView = (recipe: Recipe) => {
    setCurrentRecipe(migrateRecipeIfNeeded(recipe, settings.teacherName));
    setViewState('VIEWER');
  };

  const handleSave = (recipe: Recipe) => {
    setRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id);
      return exists ? prev.map(r => r.id === recipe.id ? recipe : r) : [recipe, ...prev];
    });
    setViewState('DASHBOARD');
    setCurrentRecipe(null);
  };

  return (
    <>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        recipes={recipes}
        productDatabase={productDatabase}
        onSave={setSettings}
        onRestore={(backup) => {
          setRecipes(backup.recipes);
          setSettings(backup.settings);
          if (backup.productDatabase) setProductDatabase(backup.productDatabase);
          if (backup.savedMenus) setSavedMenus(backup.savedMenus);
          alert('Copia de seguridad restaurada correctamente.');
        }}
      />

      {viewState === 'LANDING' ? (
        <LandingPage settings={settings} onEnter={handleEnterApp} />
      ) : viewState === 'VIEWER' && currentRecipe ? (
        <RecipeView recipe={currentRecipe} onBack={() => setViewState('DASHBOARD')} settings={settings} />
      ) : viewState === 'EDITOR' ? (
        <RecipeEditor
          initialRecipe={currentRecipe}
          productDatabase={productDatabase}
          settings={settings}
          onSave={handleSave}
          onCancel={() => setViewState('DASHBOARD')}
          onAddProduct={(p) => setProductDatabase(prev => [p, ...prev])}
        />
      ) : viewState === 'AI_BRIDGE' ? (
        <AIBridge
          settings={settings}
          onBack={() => setViewState('DASHBOARD')}
          onImport={(recipe) => {
            handleSave(recipe);
            setViewState('DASHBOARD');
          }}
        />
      ) : viewState === 'MENU_PLANNER' ? (
        <MenuPlanner
          recipes={recipes}
          settings={settings}
          onBack={() => setViewState('DASHBOARD')}
          productDatabase={productDatabase}
          savedMenus={savedMenus}
          onSaveMenu={(menu) => {
            setSavedMenus(prev => {
              const idx = prev.findIndex(m => m.id === menu.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = menu;
                return updated;
              }
              return [menu, ...prev];
            });
          }}
          onDeleteMenu={(id) => setSavedMenus(prev => prev.filter(m => m.id !== id))}
        />
      ) : viewState === 'PRODUCT_DB' ? (
        <ProductDatabaseViewer
          products={productDatabase}
          onBack={() => setViewState('DASHBOARD')}
          onAdd={(p) => setProductDatabase([p, ...productDatabase])}
          onEdit={(p) => {
            const updatedProducts = productDatabase.map(old => old.id === p.id ? p : old);
            setProductDatabase(updatedProducts);
            setRecipes(syncRecipesWithProducts(recipes, updatedProducts));
          }}
          onDelete={(id) => setProductDatabase(productDatabase.filter(p => p.id !== id))}
          onImport={(list) => {
            setProductDatabase([...list]);
            setRecipes(syncRecipesWithProducts(recipes, list));
          }}
          settings={settings}
          onSettingsChange={setSettings}
        />
