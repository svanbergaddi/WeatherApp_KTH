import { Storage_Load, Storage_Save } from '@/Shared/Storage';
import { Place } from '@/Shared/Types';

const FAVOURITES_KEY = 'favourites';

// Saves the whole list on the phone (W-03). Small list, so saving it all each time is simplest.
export function Storage_SaveFavourites(favourites: Place[]): Promise<void> {
  return Storage_Save(FAVOURITES_KEY, favourites);
}

// Loads the saved list. An empty list if nothing is saved yet, or if the saved text is broken.
export async function Storage_LoadFavourites(): Promise<Place[]> {
  const saved = await Storage_Load<Place[]>(FAVOURITES_KEY);
  return Array.isArray(saved) ? saved : [];
}
