import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {FlightStackParamList} from '../../navigation/types';

type FlightBookingScreenRouteProp = RouteProp<
  FlightStackParamList,
  'FlightBooking'
>;
type FlightBookingScreenNavigationProp = StackNavigationProp<
  FlightStackParamList,
  'FlightBooking'
>;

const FlightBookingScreen = () => {
  const route = useRoute<FlightBookingScreenRouteProp>();
  const navigation = useNavigation<FlightBookingScreenNavigationProp>();
  const {flight} = route.params;

  const [passengerName, setPassengerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleConfirmBooking = () => {
    if (!passengerName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Validation Error', 'Please fill in all passenger details.');
      return;
    }
    // In a real app, submit booking to a backend
    navigation.navigate('BookingSuccess', {
      message: 'Flight Booking Confirmed!',
      bookedItemName: `${flight.airline} - ${flight.from} to ${flight.to}`,
      details: [
        `Passenger: ${passengerName}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Price: ${flight.price}`,
      ],
    });
  };

  return (
    <ScrollView
      style={styles.screenScrollContainer}
      contentContainerStyle={styles.screenContainer}>
      <Text style={styles.screenTitle}>Book Flight</Text>

      <View style={styles.flightDetailsCard}>
        <Text style={styles.detailTitle}>
          {flight.airline}: {flight.from} to {flight.to}
        </Text>
        <Text style={styles.detailText}>Departure: {flight.departureTime}</Text>
        <Text style={styles.detailText}>Arrival: {flight.arrivalTime}</Text>
        <Text style={styles.detailText}>
          Duration: {flight.duration} ({flight.stops})
        </Text>
        <Text style={styles.detailPrice}>Price: {flight.price}</Text>
      </View>

      <Text style={styles.formLabel}>Passenger Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={passengerName}
        onChangeText={setPassengerName}
        placeholderTextColor="#999999"
      />
      <Text style={styles.formLabel}>Email Address:</Text>
      <TextInput
        style={styles.input}
        placeholder="example@domain.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholderTextColor="#999999"
      />
      <Text style={styles.formLabel}>Phone Number:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., +1 555 123 4567"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholderTextColor="#999999"
      />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleConfirmBooking}>
        <Text style={styles.primaryButtonText}>Confirm Booking</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenScrollContainer: {
    flex: 1,
    backgroundColor: '#022E79',
  },
  screenContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  flightDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: '95%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#444444',
    marginBottom: 4,
  },
  detailPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#022E79',
    marginTop: 8,
    textAlign: 'right',
  },
  formLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 5,
    width: '90%',
    textAlign: 'left',
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
    marginTop: 20,
    width: '90%',
  },
  primaryButtonText: {
    color: '#022E79',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FlightBookingScreen;
