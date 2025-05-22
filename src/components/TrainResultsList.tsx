import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {TrainStackParamList} from '../navigation/types'; // Adjust path if necessary
import {Train} from '../types'; // Import Train type

interface TrainResultsListProps {
  results: Train[];
  onNewSearch: () => void;
}

// Navigation prop type for booking
type TrainResultsNavigationProp = StackNavigationProp<
  TrainStackParamList,
  any // Or specific screen if 'TrainBooking' is always the target from here
>;

const TrainResultsList: React.FC<TrainResultsListProps> = ({
  results,
  onNewSearch,
}) => {
  console.log(
    `TrainResultsList received ${results.length} results. First result:`,
    results.length > 0 ? JSON.stringify(results[0]) : 'No results received',
  );
  const navigation = useNavigation<TrainResultsNavigationProp>();

  const renderResultItem = ({item}: {item: Train}) => {
    return (
      <View style={styles.resultItemCard}>
        <Text style={styles.resultItemTitle}>
          {item.operator}: {item.from} to {item.to}
        </Text>
        <Text style={styles.resultItemDetail}>
          Departure: {item.departureTime} - Arrival: {item.arrivalTime}
        </Text>
        <Text style={styles.resultItemDetail}>
          Duration: {item.duration} - Class: {item.class}
        </Text>
        <Text style={styles.resultItemPrice}>{item.price}</Text>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('TrainBooking', {train: item})}>
          <Text style={styles.bookButtonText}>Book Train</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.resultsContainer}>
      <Text style={styles.screenTitle}>Train Results</Text>
      {results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={item => item.id}
          style={styles.resultsList}
        />
      ) : (
        <Text style={styles.placeholderText}>No results found for Trains.</Text>
      )}
      <TouchableOpacity style={styles.primaryButton} onPress={onNewSearch}>
        <Text style={styles.primaryButtonText}>New Search</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  resultsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f7', // Temporary: light red background for debugging
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000', // Assuming parent background is dark
    marginBottom: 20,
  },
  resultsList: {
    width: '100%',
    marginTop: 10,
  },
  resultItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  resultItemDetail: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 3,
  },
  resultItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#022E79',
    marginTop: 8,
    textAlign: 'right',
    marginBottom: 10,
  },
  bookButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderText: {
    fontSize: 16,
    color: '#FFFFFF', // Assuming parent background is dark
    textAlign: 'center',
    marginVertical: 20,
  },
  primaryButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '90%',
  },
  primaryButtonText: {
    color: '#022E79',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TrainResultsList;
