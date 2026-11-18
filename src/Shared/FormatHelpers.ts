import { AppError } from '@/Shared/Types';

// ---- Format_ErrorMessage (W-15) ----
// Turns any error into one short sentence for the user.
// Every AppError kind gets its own message, so the user knows if it's their connection, the server, or their input.
export function Format_ErrorMessage(error: unknown): string {
  if (!(error instanceof AppError)) return 'Something went wrong. Please try again.';

  switch (error.kind) {
    case 'network':
      return 'No internet connection.';
    case 'timeout':
      return 'The weather service is slow right now. Please try again.';
    case 'http':
      if (error.status === 429) return 'Too many requests. Wait a second and try again.';
      return `The weather service had a problem (error ${error.status}).`;
    case 'parse':
      return "Couldn't read the weather data.";
    case 'notFound':
      return 'No place found with that name.';
    case 'invalidInput':
      return error.message; // Validate_ functions already write a message meant for the user
    case 'cancelled':
      return ''; // never shown: a newer request replaced this one
  }
}
