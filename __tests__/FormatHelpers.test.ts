import { Format_ErrorMessage } from '@/Shared/FormatHelpers';
import { AppError } from '@/Shared/Types';

describe('Format_ErrorMessage', () => {
  test('every error kind gets its own message', () => {
    expect(Format_ErrorMessage(new AppError('network', 'x'))).toBe('No internet connection.');
    expect(Format_ErrorMessage(new AppError('timeout', 'x'))).toContain('slow');
    expect(Format_ErrorMessage(new AppError('parse', 'x'))).toBe("Couldn't read the weather data.");
    expect(Format_ErrorMessage(new AppError('notFound', 'x'))).toBe('No place found with that name.');
  });

  test('http: 429 says wait, other statuses show the number', () => {
    expect(Format_ErrorMessage(new AppError('http', 'x', 429))).toContain('Too many requests');
    expect(Format_ErrorMessage(new AppError('http', 'x', 500))).toContain('500');
  });

  test('invalidInput shows the message from the Validate_ function as it is', () => {
    const error = new AppError('invalidInput', 'Latitude must be between -90 and 90.');
    expect(Format_ErrorMessage(error)).toBe('Latitude must be between -90 and 90.');
  });

  test('cancelled is never shown', () => {
    expect(Format_ErrorMessage(new AppError('cancelled', 'x'))).toBe('');
  });

  test('an unexpected error (not an AppError) still gives a friendly message, never a crash', () => {
    expect(Format_ErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
    expect(Format_ErrorMessage('just a string')).toBe('Something went wrong. Please try again.');
    expect(Format_ErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
  });
});
