import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useCloudSync<T>(key: string, initialValue: T, userId?: string): [T, (value: T | ((val: T) => T)) => void, boolean] {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [loading, setLoading] = useState(true);

    const scopedKey = userId ? `${key}:${userId}` : key;

    // 1. Initial Load from Supabase
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                // Try scoped key first
                let { data, error } = await supabase
                    .from('store')
                    .select('value')
                    .eq('key', scopedKey)
                    .single();

                // If not found and using a scoped key, try to migrate from global key
                if ((error && error.code === 'PGRST116') && userId) {
                    const { data: globalData } = await supabase
                        .from('store')
                        .select('value')
                        .eq('key', key)
                        .single();

                    if (globalData?.value) {
                        data = globalData;
                        // Auto-migrate to scoped key
                        await supabase.from('store').upsert({ key: scopedKey, value: globalData.value });
                    }
                }

                if (data?.value) {
                    setStoredValue(data.value);
                } else {
                    // Check localStorage as fallback
                    const localItem = window.localStorage.getItem(scopedKey) || window.localStorage.getItem(key);
                    if (localItem) {
                        const localValue = JSON.parse(localItem);
                        setStoredValue(localValue);
                        await supabase.from('store').upsert({ key: scopedKey, value: localValue });
                    }
                }
            } catch (err) {
                console.warn('Cloud load failed, using local fallback:', err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [scopedKey, userId]);

    // 2. Set Value (Update Local and Cloud)
    const setValue = async (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            window.localStorage.setItem(scopedKey, JSON.stringify(valueToStore));

            const { error } = await supabase
                .from('store')
                .upsert({ key: scopedKey, value: valueToStore, updated_at: new Date().toISOString() });

            if (error) console.error(`Error saving cloud key "${scopedKey}":`, error);
        } catch (error) {
            console.warn(`Error setting key “${scopedKey}”:`, error);
        }
    };

    return [storedValue, setValue, loading];
}
