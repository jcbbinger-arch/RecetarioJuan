
export type Allergen =
  | 'Gluten' | 'Crustáceos' | 'Huevos' | 'Pescado' | 'Cacahuetes'
  | 'Soja' | 'Lácteos' | 'Frutos de cáscara' | 'Apio' | 'Mostaza'
  | 'Sésamo' | 'Sulfitos' | 'Altramuces' | 'Moluscos';

export const ALLERGEN_ICONS: Record<string, string> = {
  "Gluten": "🌾",
  "Crustáceos": "🦞",
  "Huevos": "🥚",
  "Pescado": "🐟",
  "Cacahuetes": "🥜",
  "Soja": "🫘",
  "Lácteos": "🥛",
  "Frutos de cáscara": "🌰",
  "Apio": "🥬",
  "Mostaza": "🍯",
  "Sésamo": "🌱",
  "Sulfitos": "🍷",
  "Altramuces": "🌸",
  "Moluscos": "🐙"
};

export const ALLERGEN_LIST: Allergen[] = [
  'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacahuetes',
  'Soja', 'Lácteos', 'Frutos de cáscara', 'Apio', 'Mostaza',
  'Sésamo', 'Sulfitos', 'Altramuces', 'Moluscos'
];

export interface Product {
  id: string;
  name: string;
  allergens: Allergen[];
  category?: string;
  unit: string;
  pricePerUnit: number;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category?: string;
  allergens: Allergen[];
  pricePerUnit?: number;
  cost?: number;
}

export interface SubRecipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string;
  photos: string[];
}

export interface ServiceDetails {
  presentation: string;
  servingTemp: string;
  cutlery: string;
  passTime: string;
  serviceType: string;
  clientDescription: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string[];
  photo: string;
  creator: string;
  sourceUrl?: string;
  yieldQuantity: number;
  yieldUnit: string;
  subRecipes: SubRecipe[];
  platingInstructions: string;
  serviceDetails: ServiceDetails;
  lastModified: number;
  totalCost?: number;
  manualAllergens?: Allergen[];
  isPublic?: boolean;
  ownerId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  is_approved: boolean;
  role: 'admin' | 'user';
  created_at: string;
}

export interface MenuPlan {
  id: string;
  title: string;
  date: string;
  pax: number;
  recipeIds: string[];
  lastModified: number;
}

export interface AppSettings {
  teacherName: string;
  instituteName: string;
  teacherLogo: string;
  instituteLogo: string;
  categories: string[];
  productFamilies?: string[];
}

export interface AppBackup {
  version: number;
  timestamp: number;
  settings: AppSettings;
  recipes: Recipe[];
  productDatabase: Product[];
  savedMenus?: MenuPlan[];
}

export const DEFAULT_CATEGORIES = [
  "Pescados", "Mariscos", "Pastas y Arroces", "Guarniciones",
  "Salsas", "Postres", "Panadería", "Bebidas", "Otros"
];

export const DEFAULT_PRODUCT_FAMILIES = [
  "CARNES", "PESCADOS", "MARISCOS", "VERDURAS", "FRUTAS", "LÁCTEOS", "HUEVOS", "CEREALES Y GRANOS",
  "LEGUMBRES", "ESPECIAS", "SALSAS", "CONGELADOS", "ALMACÉN", "VARIOS"
];

export const SERVICE_TYPES = [
  { id: "americana", name: "Servicio a la Americana", desc: "Práctico, rápido, plato montado en cocina. El camarero sirve por la derecha." },
  { id: "inglesa", name: "Servicio a la Inglesa", desc: "El camarero sirve los alimentos desde una fuente al plato del comensal, por la izquierda, usando pinzas." },
  { id: "francesa", name: "Servicio a la Francesa", desc: "El camarero presenta la fuente por la izquierda y el comensal se sirve a sí mismo." },
  { id: "gueridon", name: "Servicio al Gueridón (o a la Rusa)", desc: "Teatral, preparación final o trinchado en mesa auxiliar (gueridón) a la vista del cliente." },
  { id: "milieu", name: "Servicio de Plat de Milieu", desc: "Platos servidos en el centro de la mesa (similar a familiar/compartir)." },
  { id: "buffet", name: "Servicio de Buffet", desc: "Autoservicio, alimentos expuestos en mesas o mostradores donde el cliente elige." },
  { id: "callejera", name: "Comida Callejera por Países", desc: "Servicio temático interactivo. Mesas por país con cocineros que sirven al momento. El comensal recoge y come donde quiera." }
];

export const CUTLERY_DICTIONARY = {
  "Carne roja (asado, filete)": "Cuchillo trinchero de sierra + tenedor trinchero (Para carnes muy tiernas, puede usarse cuchillo de mesa liso)",
  "Aves (pollo, pavo)": "Cuchillo y tenedor de mesa (Si está deshuesado, puede comerse solo con tenedor)",
  "Pescado": "Cuchillo y tenedor de pescado (paleta) (Cuchillo sin filo, para deslizar y separar espinas)",
  "Mariscos con cáscara": "Tenacillas, pinzas, tenedor de mariscos (A veces se incluye cuchillo corto para langosta)",
  "Pasta larga (espagueti)": "Tenedor + cuchara (opcional para enrollar) (En servicio formal, solo se usa tenedor)",
  "Ensalada": "Tenedor de ensalada (más ancho y con un borde cortante) (Si la ensalada se sirve de primer plato, se usan cubiertos más pequeños)",
  "Quesos": "Cuchillo de queso (hoja perforada o espátula) + tenedor pequeño (Depende del tipo de queso: duro, blando, cremoso)"
};

export const TEMPERATURE_DICTIONARY = {
  "Carne roja (vaca, cordero)": [
    { label: "Servicio", value: "55–65°C / 131–149°F (Jugosa al centro, reposada)" }
  ],
  "Carne de ave (pollo, pavo)": [
    { label: "Servicio", value: "70–75°C / 158–167°F (Bien cocida, sin rosados)" }
  ],
  "Pescado": [
    { label: "Servicio", value: "50–55°C / 122–131°F (Cocción justa, se deshace si se pasa)" }
  ],
  "Mariscos (gambas, langosta)": [
    { label: "Servicio", value: "60–65°C / 140–149°F (Cambian de textura si se sobrecocinan)" }
  ],
  "Pasta": [
    { label: "Muy caliente", value: "65–70°C / 149–158°F (Recién escurrida, no debe enfriarse)" }
  ],
  "Sopas / Cremas calientes": [
    { label: "Servicio", value: "70–80°C / 158–176°F (Humeante pero no hirviendo)" }
  ],
  "Guisos / Estofados": [
    { label: "Servicio", value: "70–75°C / 158–167°F (Saben mejor muy calientes)" }
  ],
  "Arroz caliente": [
    { label: "Servicio", value: "60–65°C / 140–149°F (No debe estar reseco)" }
  ],
  "Ensaladas templadas": [
    { label: "Ambiente/Tibio", value: "15–25°C (Si lleva proteína caliente, puede servirse templada)" }
  ],
  "Quesos de mesa": [
    { label: "Ambiente", value: "18–22°C (Para apreciar aroma y textura)" }
  ],
  "Sushi / Pescado crudo": [
    { label: "Frío", value: "2–5°C (Nunca templado o caliente)" }
  ]
};
