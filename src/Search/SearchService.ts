import { API_FetchJson } from '@/Shared/HttpClient';

const SEARCH_URL = 'https://geocode.maps.co/search';

// The key comes from the .env file (never written in the code).
// If it is missing, maps.co answers 401 and API_FetchJson turns that into an 'http' AppError.
const API_KEY = process.env.EXPO_PUBLIC_GEOCODE_KEY ?? '';

// Gets the raw list of places matching the text. Parse it with Parse_Places.
// `language` makes maps.co name places in that language ("Sweden", "Stockholm County")
// instead of each country's own language ("Sverige", "Stockholms län").
export function API_SearchPlaces(query: string, signal?: AbortSignal, language: string = 'en'): Promise<unknown> {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&accept-language=${language}&api_key=${API_KEY}`;
  return API_FetchJson(url, signal);
}
