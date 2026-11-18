import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Calc_IsFavourite, Calc_ToggleFavourite } from '@/Favourites/FavouritesHelpers';
import { Storage_LoadFavourites, Storage_SaveFavourites } from '@/Favourites/FavouritesService';
import { Coordinates, Place } from '@/Shared/Types';

type FavouritesViewModel = {
  favourites: Place[];
  isLoaded: boolean; // false until the saved list has been read from the phone
  Process_ToggleFavourite: (place: Place) => void;
  Process_IsFavourite: (place: Coordinates) => boolean;
};

// ---- Why a Context? ----
// Favourites are used on TWO screens: the star on the home screen and the Favourites tab.
// With a normal hook, each screen would get its OWN copy, and starring a city on home wouldn't show in the tab.
// A Context keeps ONE copy for the whole app: FavouritesProvider holds it (in src/app/_layout.tsx),
// and every screen reads the same one with useFavouritesViewModel().
const FavouritesContext = createContext<FavouritesViewModel | null>(null);

// ---- Main process for favourites ----
export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favourites, setFavourites] = useState<Place[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // ---- Process_Start: read the saved list once, when the app opens ----
  useEffect(() => {
    Storage_LoadFavourites().then((saved) => {
      setFavourites(saved);
      setIsLoaded(true);
    });
  }, []); // [] = run once

  // ---- Process_ToggleFavourite: the star was tapped → add or remove, then save ----
  function Process_ToggleFavourite(place: Place): void {
    // Before the saved list is loaded, saving would overwrite it with an almost empty list.
    if (!isLoaded) return;

    const updated = Calc_ToggleFavourite(favourites, place);
    setFavourites(updated);
    Storage_SaveFavourites(updated);
  }

  // ---- Process_IsFavourite: should the star be filled for this place? ----
  function Process_IsFavourite(place: Coordinates): boolean {
    return Calc_IsFavourite(favourites, place);
  }

  const viewModel: FavouritesViewModel = { favourites, isLoaded, Process_ToggleFavourite, Process_IsFavourite };
  return <FavouritesContext.Provider value={viewModel}>{children}</FavouritesContext.Provider>;
}

// Screens call this to get the shared favourites.
export function useFavouritesViewModel(): FavouritesViewModel {
  const viewModel = useContext(FavouritesContext);
  // Only happens if we forget FavouritesProvider in _layout.tsx: a programming mistake, so fail loudly.
  if (viewModel === null) throw new Error('useFavouritesViewModel must be used inside FavouritesProvider');
  return viewModel;
}
