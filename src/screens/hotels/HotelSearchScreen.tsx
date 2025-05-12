import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {HotelStackParamList} from '../../navigation/types';
import {mockHotelsData, Hotel} from '../../data/mockData';

type HotelSearchScreenNavigationProp = StackNavigationProp<
  HotelStackParamList,
  'HotelSearch'
>;

const HotelSearchScreen = () => {
  const navigation = useNavigation<HotelSearchScreenNavigationProp>();
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<Hotel[]>([]);

  const handleSearch = () => {
    setResultsData(mockHotelsData);
    setShowResults(true);
  };

  const handleNewSearch = () => {
    setShowResults(false);
    setResultsData([]);
  };

  const renderResultItem = ({item}: {item: Hotel}) => {
    return (
      <View style={styles.resultItemCard}>
        <Text style={styles.resultItemTitle}>
          {item.name} - {item.location}
        </Text>
        <Text style={styles.resultItemDetail}>Rating: {item.rating} / 5</Text>
        <Text style={styles.resultItemDetail}>Amenities: {item.amenities}</Text>
        <Text style={styles.resultItemPrice}>{item.pricePerNight} / night</Text>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('HotelBooking', {hotel: item})}>
          <Text style={styles.bookButtonText}>Book Hotel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (showResults) {
    return (
      <View style={styles.screenContainer}>
        <Text style={styles.screenTitle}>Hotel Results</Text>
        {resultsData.length > 0 ? (
          <FlatList
            data={resultsData}
            renderItem={renderResultItem}
            keyExtractor={item => item.id}
            style={styles.resultsList}
          />
        ) : (
          <Text style={styles.placeholderText}>
            No results found for Hotels.
          </Text>
        )}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNewSearch}>
          <Text style={styles.primaryButtonText}>New Search</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Search Hotels</Text>
      <TextInput
        style={styles.input}
        placeholder="City, property, or landmark"
        placeholderTextColor="#999999"
      />
      <TextInput
        style={styles.input}
        placeholder="Check-in date"
        placeholderTextColor="#999999"
      />
      <TextInput
        style={styles.input}
        placeholder="Check-out date"
        placeholderTextColor="#999999"
      />
      <TextInput
        style={styles.input}
        placeholder="Number of guests & rooms"
        placeholderTextColor="#999999"
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleSearch}>
        <Text style={styles.primaryButtonText}>Search Hotels</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#022E79',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
  },
  input: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  primaryButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '90%',
  },
  primaryButtonText: {
    color: '#022E79',
    fontSize: 18,
    fontWeight: 'bold',
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
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default HotelSearchScreen;
