
import React, { useState, useEffect } from 'react';
import { Recipe, AppSettings, AppBackup, Product, MenuPlan, DEFAULT_CATEGORIES, DEFAULT_PRODUCT_FAMILIES, SubRecipe } from './types';
import { useCloudSync } from './hooks/useCloudSync';
import { CookingMode } from './components/CookingMode';
import { Dashboard } from './components/Dashboard';
import { RecipeEditor } from './components/RecipeEditor';
import { RecipeView } from './components/RecipeView';
import { SettingsModal } from './components/SettingsModal';
import { MenuPlanner } from './components/MenuPlanner';
import { ProductDatabaseViewer } from './components/ProductDatabaseViewer';
import { LandingPage } from './components/LandingPage';
import { AIBridge } from './components/AIBridge';
import { Auth } from './components/Auth';
import { PendingApproval } from './components/PendingApproval';
import { AdminDashboard } from './components/AdminDashboard';
import { INITIAL_PRODUCT_DATABASE } from './data/products';
import { convertUnit } from './utils';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserProfile } from './types';


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

type ViewState = 'dashboard' | 'editor' | 'planner' | 'products' | 'ai-bridge' | 'view' | 'cooking' | 'admin';

const defaultSettings: AppSettings = {
  teacherName: "Juan Codina Barranco",
  instituteName: "IES La Flota",
  teacherLogo: "",
  instituteLogo: "",
  categories: DEFAULT_CATEGORIES
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [recipes, setRecipes, recipesLoading] = useCloudSync<Recipe[]>('recipes', [], user?.id);
  const [settings, setSettings, settingsLoading] = useCloudSync<AppSettings>('appSettings', defaultSettings, user?.id);
  const [productDatabase, setProductDatabase, productsLoading] = useCloudSync<Product[]>('productDatabase', INITIAL_PRODUCT_DATABASE, user?.id);
  const [savedMenus, setSavedMenus, menusLoading] = useCloudSync<MenuPlan[]>('savedMenus', [], user?.id);

  const [communityRecipes, setCommunityRecipes] = useState<Recipe[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchCommunityRecipes();
  }, [user]);

  const fetchCommunityRecipes = async () => {
    try {
      setCommunityLoading(true);
      const { data, error } = await supabase
        .from('store')
        .select('value')
        .like('key', 'recipes:%');

      if (error) throw error;

      const allRecipes: Recipe[] = [];
      data.forEach(item => {
        if (Array.isArray(item.value)) {
          item.value.forEach((r: Recipe) => {
            if (r.isPublic && r.ownerId !== user?.id) {
              allRecipes.push(r);
            }
          });
        }
      });
      setCommunityRecipes(allRecipes);
    } catch (err) {
      console.error('Error fetching community recipes:', err);
    } finally {
      setCommunityLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchOrCreateProfile(session.user);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchOrCreateProfile(session.user);
      else {
        setProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchOrCreateProfile = async (user: User) => {
    try {
      setAuthLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const isAdmin = user.email === 'managerproapp@gmail.com';
        const newProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          is_approved: isAdmin, // Admin is auto-approved
          role: isAdmin ? 'admin' : 'user',
          created_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile);

        if (insertError) throw insertError;
        setProfile(newProfile);
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const isDataLoading = recipesLoading || settingsLoading || productsLoading || menusLoading || authLoading;

  const [viewState, setViewState] = useState<ViewState>('dashboard');
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

  const handleEnterApp = () => setViewState('dashboard');
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setViewState('dashboard');
    setCurrentRecipe(null);
  };

  const handleCreateNew = () => { setCurrentRecipe(null); setViewState('editor'); };

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

  const migrateRecipeIfNeeded = (r: Recipe): Recipe => {
    const legacy = r as unknown as LegacyRecipe;

    // Migración de photo individual a photos[] en subRecetas
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

    if (legacy.subRecipes && legacy.subRecipes.length > 0 && updatedSubRecipes === (legacy.subRecipes as unknown as SubRecipe[])) return r;

    return {
      ...r,
      category: Array.isArray(r.category) ? r.category : [r.category].filter(Boolean) as string[],
      creator: legacy.creator || settings.teacherName,
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

  const handleEdit = (recipe: Recipe) => {
    setCurrentRecipe(migrateRecipeIfNeeded(recipe));
    setViewState('editor');
  };

  const handleView = (recipe: Recipe) => {
    setCurrentRecipe(migrateRecipeIfNeeded(recipe));
    setViewState('view');
  };

  const handleSave = (recipe: Recipe) => {
    const recipeWithOwner = { ...recipe, ownerId: user?.id };
    setRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id);
      return exists ? prev.map(r => r.id === recipe.id ? recipeWithOwner : r) : [recipeWithOwner, ...prev];
    });
    setViewState('dashboard');
    setCurrentRecipe(null);
  };

  if (!user) {
    return <Auth onSession={(u) => setUser(u)} />;
  }

  if (!profile?.is_approved && profile?.role !== 'admin') {
    return <PendingApproval email={user.email || ''} onLogout={handleLogout} />;
  }

  return (
    <>
      {isDataLoading && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse text-amber-500">Sincronizando con la Nube...</p>
        </div>
      )}

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

      {viewState === 'view' && currentRecipe ? (
        <RecipeView
          recipe={currentRecipe}
          onBack={() => setViewState('dashboard')}
          settings={settings}
          onStartCooking={() => setViewState('cooking')}
        />
      ) : viewState === 'cooking' && currentRecipe ? (
        <CookingMode recipe={currentRecipe} onBack={() => setViewState('view')} />
      ) : viewState === 'editor' ? (
        <RecipeEditor
          initialRecipe={currentRecipe}
          productDatabase={productDatabase}
          settings={settings}
          onSave={handleSave}
          onCancel={() => setViewState('dashboard')}
          onAddProduct={(p) => setProductDatabase(prev => [p, ...prev])}
        />
      ) : viewState === 'ai-bridge' ? (
        <AIBridge
          settings={settings}
          onBack={() => setViewState('dashboard')}
          onImport={(recipe) => {
            handleSave(recipe);
            setViewState('dashboard');
          }}
        />
      ) : viewState === 'planner' ? (
        <MenuPlanner
          recipes={recipes}
          settings={settings}
          onBack={() => setViewState('dashboard')}
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
      ) : viewState === 'products' ? (
        <ProductDatabaseViewer
          products={productDatabase}
          onBack={() => setViewState('dashboard')}
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
      ) : viewState === 'admin' ? (
        <AdminDashboard
          onBack={() => setViewState('dashboard')}
          onViewRecipe={(recipe) => {
            setCurrentRecipe(migrateRecipeIfNeeded(recipe));
            setViewState('view');
          }}
        />
      ) : (
        <Dashboard
          recipes={recipes}
          settings={settings}
          savedMenus={savedMenus}
          productDatabase={productDatabase}
          currentProfile={profile}
          communityRecipes={communityRecipes}
          onNew={handleCreateNew}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={(id) => setRecipes(recipes.filter(r => r.id !== id))}
          onImport={(r) => setRecipes([r, ...recipes])}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMenuPlanner={() => setViewState('planner')}
          onOpenProductDB={() => setViewState('products')}
          onOpenAIBridge={() => setViewState('ai-bridge')}
          onOpenAdmin={() => setViewState('admin')}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default App;
