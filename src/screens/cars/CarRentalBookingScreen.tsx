import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {CarRentalStackParamList} from '../../navigation/types';

type CarRentalBookingScreenRouteProp = RouteProp<
  CarRentalStackParamList,
  'CarRentalBooking'
>;
type CarRentalBookingScreenNavigationProp = StackNavigationProp<
  CarRentalStackParamList,
  'CarRentalBooking'
>;

const CarRentalBookingScreen = () => {
  const route = useRoute<CarRentalBookingScreenRouteProp>();
  const navigation = useNavigation<CarRentalBookingScreenNavigationProp>();
  const {car} = route.params;

  const [driverName, setDriverName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const handleConfirmBooking = () => {
    if (
      !driverName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !licenseNumber.trim()
    ) {
      Alert.alert(
        'Validation Error',
        'Please fill in all driver and booking details.',
      );
      return;
    }
    navigation.navigate('BookingSuccess', {
      message: 'Car Rental Confirmed!',
      bookedItemName: `${car.company} - ${car.type}`,
      details: [
        `Driver Name: ${driverName}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `License No: ${licenseNumber}`,
        `Pick-up: ${car.pickupLocation}`,
        `Price: ${car.pricePerDay} / day`,
      ],
    });
  };

  return (
    <ScrollView
      style={styles.screenScrollContainer}
      contentContainerStyle={styles.screenContainer}>
      <Text style={styles.screenTitle}>Book Car Rental</Text>

      <View style={styles.itemDetailsCard}>
        <Text style={styles.detailTitle}>
          {car.company} - {car.type}
        </Text>
        <Text style={styles.detailText}>Pick-up: {car.pickupLocation}</Text>
        <Text style={styles.detailText}>Features: {car.features}</Text>
        <Text style={styles.detailPrice}>Price: {car.pricePerDay} / day</Text>
      </View>

      <Text style={styles.formLabel}>Driver's Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={driverName}
        onChangeText={setDriverName}
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
      <Text style={styles.formLabel}>Driving License Number:</Text>
      <TextInput
        style={styles.input}
        placeholder="License Number"
        value={licenseNumber}
        onChangeText={setLicenseNumber}
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
  screenScrollContainer: {flex: 1, backgroundColor: '#022E79'},
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
  itemDetailsCard: {
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
  detailText: {fontSize: 15, color: '#444444', marginBottom: 4},
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
  primaryButtonText: {color: '#022E79', fontSize: 18, fontWeight: 'bold'},
});

export default CarRentalBookingScreen;
