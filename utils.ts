
/**
 * Utility functions for the recipe application
 */

/**
 * Parses a numeric quantity string, handling both comma and dot as decimal separators.
 */
export const parseQuantity = (value: string): number => {
    if (!value) return 0;
    const normalized = value.toString().replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formats a quantity for display, using comma as decimal separator.
 */
export const formatQuantity = (value: number): string => {
    if (value === undefined || value === null || isNaN(value) || !isFinite(value)) return '';
    const str = value % 1 === 0 ? value.toString() : value.toFixed(value < 1 ? 3 : 2);
    return str.replace('.', ',');
};

/**
 * Converts a quantity between different units.
 */
export const convertUnit = (qty: number, fromUnit: string, toUnit: string): number => {
    const f = fromUnit?.toLowerCase() || '';
    const t = toUnit?.toLowerCase() || '';
    if (f === t || !f || !t) return qty;

    // Mass
    if ((f === 'g' || f === 'gramos') && (t === 'kg' || t === 'kilogramos')) return qty / 1000;
    if ((f === 'kg' || f === 'kilogramos') && (t === 'g' || t === 'gramos')) return qty * 1000;

    // Volume
    const getMl = (v: number, u: string) => {
        if (u === 'l' || u === 'litro' || u === 'litros') return v * 1000;
        if (u === 'dl' || u === 'decilitro') return v * 100;
        if (u === 'cl' || u === 'centilitro') return v * 10;
        return v; // assume ml
    };

    const volumeUnits = ['l', 'litro', 'litros', 'dl', 'decilitro', 'cl', 'centilitro', 'ml', 'mililitro'];
    if (volumeUnits.includes(f) && volumeUnits.includes(t)) {
        const ml = getMl(qty, f);
        if (t === 'l' || t === 'litro' || t === 'litros') return ml / 1000;
        if (t === 'dl' || t === 'decilitro') return ml / 100;
        if (t === 'cl' || t === 'centilitro') return ml / 10;
        return ml;
    }

    return qty;
};

/**
 * Calculates the cost of an ingredient based on quantity and price.
 */
export const calculateIngredientCost = (quantity: string | number, pricePerUnit: number): number => {
    const qtyNum = typeof quantity === 'string' ? parseQuantity(quantity) : quantity;
    if (isNaN(qtyNum) || !pricePerUnit) return 0;
    return qtyNum * pricePerUnit;
};
