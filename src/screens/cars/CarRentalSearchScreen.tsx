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
import {CarRentalStackParamList} from '../../navigation/types';
import {mockCarRentalsData, CarRental} from '../../data/mockData';
import {
  screenStyles,
  formStyles,
  buttonStyles,
  cardStyles,
  colors,
} from '../../styles/commonStyles';

type CarRentalSearchScreenNavigationProp = StackNavigationProp<
  CarRentalStackParamList,
  'CarRentalSearch'
>;

const CarRentalSearchScreen = () => {
  const navigation = useNavigation<CarRentalSearchScreenNavigationProp>();
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<CarRental[]>([]);

  const handleSearch = () => {
    setResultsData(mockCarRentalsData);
    setShowResults(true);
  };

  const handleNewSearch = () => {
    setShowResults(false);
    setResultsData([]);
  };

  const renderResultItem = ({item}: {item: CarRental}) => {
    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.title}>
          {item.company} - {item.type}
        </Text>
        <Text style={cardStyles.text}>Pick-up: {item.pickupLocation}</Text>
        <Text style={cardStyles.text}>Features: {item.features}</Text>
        <Text style={cardStyles.price}>{item.pricePerDay} / day</Text>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('CarRentalBooking', {car: item})}>
          <Text style={styles.bookButtonText}>Book Car</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (showResults) {
    return (
      <View style={screenStyles.container}>
        <Text style={screenStyles.title}>Car Rental Results</Text>
        {resultsData.length > 0 ? (
          <FlatList
            data={resultsData}
            renderItem={renderResultItem}
            keyExtractor={item => item.id}
            style={styles.resultsList}
          />
        ) : (
          <Text style={styles.placeholderText}>
            No results found for Car Rentals.
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
      <Text style={screenStyles.title}>Search Car Rentals</Text>
      <TextInput
        style={formStyles.input}
        placeholder="Pick-up location"
        placeholderTextColor={colors.placeholderText}
      />
      <TextInput
        style={formStyles.input}
        placeholder="Drop-off location (if different)"
        placeholderTextColor={colors.placeholderText}
      />
      <TextInput
        style={formStyles.input}
        placeholder="Pick-up date & time"
        placeholderTextColor={colors.placeholderText}
      />
      <TextInput
        style={formStyles.input}
        placeholder="Drop-off date & time"
        placeholderTextColor={colors.placeholderText}
      />
      <TextInput
        style={formStyles.input}
        placeholder="Driver's age"
        placeholderTextColor={colors.placeholderText}
      />
      <TouchableOpacity style={buttonStyles.primary} onPress={handleSearch}>
        <Text style={buttonStyles.primaryText}>Search Cars</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  resultsList: {width: '100%', marginTop: 10},
  bookButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  bookButtonText: {color: colors.white, fontSize: 16, fontWeight: 'bold'},
  placeholderText: {
    fontSize: 16,
    color: colors.textDark,
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default CarRentalSearchScreen;
