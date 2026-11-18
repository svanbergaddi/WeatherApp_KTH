import AsyncStorage from '@react-native-async-storage/async-storage';

// Small wrapper around AsyncStorage (the phone's key-value storage).
// Saving is "best effort": if storage fails, the app keeps working without the cache.

export async function Storage_Save(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Storage_Save failed for "${key}"`, error);
  }
}

// Returns null if nothing is saved, or if the saved text is broken.
// The caller states the type it expects (T), because storage only knows text.
export async function Storage_Load<T>(key: string): Promise<T | null> {
  try {
    const text = await AsyncStorage.getItem(key);
    return text === null ? null : (JSON.parse(text) as T);
  } catch (error) {
    console.warn(`Storage_Load failed for "${key}"`, error);
    return null;
  }
}
