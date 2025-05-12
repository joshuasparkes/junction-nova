import React from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
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
  // Moved renderPlaceSuggestionItem logic here
  const renderSuggestionItem = ({item}: {item: Place}) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onSelectPlace(item)}>
      <Text style={styles.suggestionText}>
        {item.name} ({item.iataCode || item.countryCode})
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        value={inputText}
        onChangeText={text => {
          onInputChange(text); // Update parent state
          if (text.length === 0) {
            // Parent handles clearing suggestions/selected place via onInputChange
            // Or add specific onClear prop if preferred
          } else {
            onFetchSuggestions(text); // Trigger fetch in parent
          }
        }}
        // Ensure IATA codes are uppercase if needed by API (already handled in fetchPlaces)
        // autoCapitalize="characters" // Optional: might help if only using IATA
      />
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          renderItem={renderSuggestionItem}
          keyExtractor={item => item.id}
          style={styles.suggestionsList}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

// Styles needed for this component (copied/adapted from FlightSearchScreen)
const styles = StyleSheet.create({
  container: {
    // Add a container if needed, or style directly
    width: '90%',
    marginBottom: 5, // Adjust spacing as needed
  },
  input: {
    // width: '100%', // Take width from container
    backgroundColor: '#FFFFFF',
    color: '#000000',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    marginBottom: 0, // Remove margin if suggestions list handles it
  },
  suggestionsList: {
    // width: '100%', // Take width from container
    maxHeight: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 0,
    // marginBottom handled by container now
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1,
    borderWidth: 1, // Add border to suggestions list to match input
    borderColor: '#DDDDDD',
    borderTopWidth: 0, // Avoid double border with input if marginTop is 0
  },
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
