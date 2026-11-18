import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { QUICK_PICK_CITIES } from '@/Search/QuickPickCities';
import { useSearchViewModel } from '@/Search/SearchViewModel';
import { useAppTheme } from '@/Shared/Theme';

type Props = {
  search: ReturnType<typeof useSearchViewModel>;
  placeholder?: string;
};

// The search field + suggestions (W-21), the quick-pick cities (W-22) and the hidden coordinate input (W-13).
// Used on Home and on Compare: only what happens with the picked place differs, and that's in the ViewModel.
export function SearchBox({ search, placeholder = 'Search for a place' }: Props) {
  const theme = useAppTheme();
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [latitudeText, setLatitudeText] = useState('');
  const [longitudeText, setLongitudeText] = useState('');

  const inputStyle = [styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }];

  return (
    <View style={styles.container}>
      <View>
        <TextInput
          style={inputStyle}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          value={search.query}
          onChangeText={search.Process_TypeQuery}
          onSubmitEditing={search.Process_SubmitQuery}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search for a place"
        />
        {search.isSearching && <ActivityIndicator style={styles.spinner} color={theme.accent} />}
      </View>

      {search.message !== null && <Text style={{ color: theme.danger }}>{search.message}</Text>}

      {/* Suggestions: one row per place, closest first. */}
      {search.suggestions.length > 0 && (
        <View style={[styles.suggestions, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {search.suggestions.map((place, i) => (
            <Pressable
              key={`${place.latitude},${place.longitude}`}
              onPress={() => search.Process_SelectPlace(place)}
              style={[styles.suggestion, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}
              accessibilityRole="button"
            >
              <Text style={{ color: theme.text }}>{place.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Quick picks: a row you can scroll sideways, so it takes little space. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
        {QUICK_PICK_CITIES.map((city) => (
          <Pressable
            key={city.name}
            onPress={() => search.Process_SelectPlace(city)}
            style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.card }]}
            accessibilityRole="button"
          >
            <Text style={{ color: theme.text }}>{city.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Coordinates: hidden until asked for. */}
      <Text style={[styles.link, { color: theme.accent }]} onPress={() => setShowCoordinates(!showCoordinates)} accessibilityRole="button">
        {showCoordinates ? 'Hide coordinates' : 'Use coordinates instead'}
      </Text>
      {showCoordinates && (
        <View style={styles.coordinates}>
          <TextInput style={[inputStyle, styles.coordinateInput]} placeholder="Latitude" placeholderTextColor={theme.textMuted}
            value={latitudeText} onChangeText={setLatitudeText} keyboardType="numbers-and-punctuation" />
          <TextInput style={[inputStyle, styles.coordinateInput]} placeholder="Longitude" placeholderTextColor={theme.textMuted}
            value={longitudeText} onChangeText={setLongitudeText} keyboardType="numbers-and-punctuation" />
          <Pressable onPress={() => search.Process_SearchCoordinates(latitudeText, longitudeText)}
            style={[styles.goButton, { backgroundColor: theme.accent }]} accessibilityRole="button">
            <Text style={{ color: theme.card, fontWeight: '600' }}>Go</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  spinner: { position: 'absolute', right: 12, top: 14 },
  suggestions: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  suggestion: { paddingHorizontal: 14, paddingVertical: 12 },
  chips: { gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  link: { fontSize: 14 },
  coordinates: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  coordinateInput: { flex: 1 },
  goButton: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
});
