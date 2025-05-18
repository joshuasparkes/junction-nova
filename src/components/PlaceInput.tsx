import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Place} from '../types'; // Import Place from the shared types file

interface PlaceInputProps {
  placeholder: string;
  inputText: string;
  suggestions: Place[];
  onInputChange: (text: string) => void;
  onFetchSuggestions: (text: string) => void;
  onSelectPlace: (place: Place) => void;
  // Optional: Add onClear if needed, handled by onInputChange('') for now
}

const PlaceInput: React.FC<PlaceInputProps> = ({
  placeholder,
  inputText,
  suggestions,
  onInputChange,
  onFetchSuggestions,
  onSelectPlace,
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        value={inputText}
        onChangeText={text => {
          onInputChange(text);
          if (text.length === 0) {
            // Parent handles clearing suggestions
          } else {
            onFetchSuggestions(text);
          }
        }}
        // Ensure IATA codes are uppercase if needed by API (already handled in fetchPlaces)
        // autoCapitalize="characters" // Optional: might help if only using IATA
      />
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}>
            {suggestions.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => onSelectPlace(item)}>
                <Text style={styles.suggestionText}>
                  {item.name} ({item.iataCode || item.countryCode || item.type})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Styles needed for this component (copied/adapted from FlightSearchScreen)
const styles = StyleSheet.create({
  container: {
    width: '90%',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 1,
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderTopWidth: 0,
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 150,
    zIndex: 100,
  },
  suggestionsList: {},
  suggestionItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333333',
  },
});

export default PlaceInput;
