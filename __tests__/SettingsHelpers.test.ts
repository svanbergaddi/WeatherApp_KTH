import { DEFAULT_SETTINGS, Parse_Settings } from '@/Settings/SettingsHelpers';

describe('Parse_Settings', () => {
  test('valid saved settings are kept as they are', () => {
    expect(Parse_Settings({ refreshMinutes: 15, themeChoice: 'night' })).toEqual({ refreshMinutes: 15, themeChoice: 'night' });
  });

  test('nothing saved yet (first start): the defaults', () => {
    expect(Parse_Settings(null)).toEqual(DEFAULT_SETTINGS);
  });

  test('one broken field gets its default, the other is kept', () => {
    expect(Parse_Settings({ refreshMinutes: 7, themeChoice: 'light' })).toEqual({ refreshMinutes: 30, themeChoice: 'light' });
    expect(Parse_Settings({ refreshMinutes: 60, themeChoice: 'purple' })).toEqual({ refreshMinutes: 60, themeChoice: 'auto' });
  });

  test('a field missing (saved by an older version) gets its default', () => {
    expect(Parse_Settings({ refreshMinutes: 0 })).toEqual({ refreshMinutes: 0, themeChoice: 'auto' });
  });

  test('wrong types are not accepted: "15" as text is not 15', () => {
    expect(Parse_Settings({ refreshMinutes: '15', themeChoice: 3 })).toEqual(DEFAULT_SETTINGS);
  });

  test('not an object at all: the defaults', () => {
    expect(Parse_Settings('hello')).toEqual(DEFAULT_SETTINGS);
    expect(Parse_Settings([])).toEqual(DEFAULT_SETTINGS);
  });
});
