import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {ApiPlace} from '../types';

interface PlaceInputProps {
  placeholder: string;
  inputText: string;
  suggestions: ApiPlace[];
  onInputChange: (text: string) => void;
  onFetchSuggestions: (text: string) => void;
  onSelectPlace: (place: ApiPlace) => void; // Changed to ApiPlace
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
            onFetchSuggestions(text); // Trigger fetch in parent
          }
        }}
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
                <Text style={styles.suggestionTextName}>{item.name}</Text>
                <Text style={styles.suggestionTextType}>
                  {/* Display type, fallback to iataCode or countryCode if type is 'unknown' or generic */}
                  Type:{' '}
                  {item.type !== 'unknown'
                    ? item.type
                    : item.iataCode ||
                      item.stationCode ||
                      item.countryCode ||
                      'N/A'}
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
    width: '100%',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
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
    paddingVertical: 10, // Adjusted padding
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  suggestionTextName: {
    // Style for the place name
    fontSize: 15, // Slightly smaller if two lines
    fontWeight: 'bold',
    color: '#333333',
  },
  suggestionTextType: {
    // Style for the place type
    fontSize: 13,
    color: '#666666',
  },
});

export default PlaceInput;
