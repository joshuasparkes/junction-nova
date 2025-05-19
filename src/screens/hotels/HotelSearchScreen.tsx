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
import {
  screenStyles,
  formStyles,
  buttonStyles,
  cardStyles,
  colors,
} from '../../styles/commonStyles';

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
      <View style={cardStyles.container}>
        <Text style={cardStyles.title}>
          {item.name} - {item.location}
        </Text>
        <Text style={cardStyles.text}>Rating: {item.rating} / 5</Text>
        <Text style={cardStyles.text}>Amenities: {item.amenities}</Text>
        <Text style={cardStyles.price}>{item.pricePerNight} / night</Text>
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
      <View style={screenStyles.container}>
        <Text style={screenStyles.title}>Hotel Results</Text>
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
          style={buttonStyles.primary}
          onPress={handleNewSearch}>
          <Text style={buttonStyles.primaryText}>New Search</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={screenStyles.container}>
      <Text style={screenStyles.title}>Search Hotels</Text>
      <TextInput
        style={formStyles.input}
        placeholder="City, property, or landmark"
        placeholderTextColor={colors.placeholderText}
      />
      <TextInput
        style={formStyles.input}
        placeholder="Check-in date"
        placeholderTextColor={colors.placeholderText}
      />
      <TextInput
        style={formStyles.input}
        placeholder="Check-out date"
        placeholderTextColor={colors.placeholderText}
      />
      <TextInput
        style={formStyles.input}
        placeholder="Number of guests & rooms"
        placeholderTextColor={colors.placeholderText}
      />
      <TouchableOpacity style={buttonStyles.primary} onPress={handleSearch}>
        <Text style={buttonStyles.primaryText}>Search Hotels</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  resultsList: {
    width: '100%',
    marginTop: 10,
  },
  bookButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textDark,
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default HotelSearchScreen;
