import React from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {FlightStackParamList} from '../navigation/types'; // Adjust path as needed
import {Flight} from '../types'; // Import Flight type
import {
  colors,
  buttonStyles,
  cardStyles,
  screenStyles,
} from '../styles/commonStyles';

interface FlightResultsListProps {
  results: Flight[];
  onNewSearch: () => void;
  onSelectFlight: (flight: Flight) => void;
}
type FlightResultsNavigationProp = StackNavigationProp<
  FlightStackParamList,
  'FlightResults' // Assuming 'FlightResults' is the screen name where this might be used, adjust if needed
>;

const FlightResultsList: React.FC<FlightResultsListProps> = ({
  results,
  onNewSearch,
  onSelectFlight,
}) => {
  // const navigation = useNavigation<FlightResultsNavigationProp>();

  const renderResultItem = ({item}: {item: Flight}) => {
    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.title}>
          {item.airline}: {item.from} to {item.to}
        </Text>
        <Text style={cardStyles.text}>
          Departure: {item.departureTime} - Arrival: {item.arrivalTime}
        </Text>
        <Text style={cardStyles.text}>
          Duration: {item.duration} ({item.stops})
        </Text>
        <Text style={cardStyles.price}>{item.price}</Text>
        <TouchableOpacity
          style={[buttonStyles.primary, styles.bookButton]}
          onPress={() => onSelectFlight(item)}>
          <Text style={buttonStyles.primaryText}>Book Flight</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={screenStyles.container}>
      <Text style={screenStyles.title}>Flight Results</Text>
      {results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            screenStyles.flatListContent,
            styles.listContent,
          ]}
        />
      ) : (
        <Text style={styles.placeholderText}>
          No results found for Flights.
        </Text>
      )}
      <TouchableOpacity style={buttonStyles.primary} onPress={onNewSearch}>
        <Text style={buttonStyles.primaryText}>New Search</Text>
      </TouchableOpacity>
    </View>
  );
};

// Only keep styles that aren't in commonStyles
const styles = StyleSheet.create({
  bookButton: {
    marginTop: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textDark,
    textAlign: 'center',
    marginVertical: 20,
  },
  listContent: {
    width: '100%',
  },
});

export default FlightResultsList;
