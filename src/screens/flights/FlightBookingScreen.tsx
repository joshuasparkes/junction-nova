import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {FlightStackParamList} from '../../navigation/types';
import {
  screenStyles,
  formStyles,
  buttonStyles,
  cardStyles,
  colors,
} from '../../styles/commonStyles';
import {Flight} from '../../types';

type FlightBookingScreenRouteProp = RouteProp<
  FlightStackParamList,
  'FlightBooking'
>;
type FlightBookingScreenNavigationProp = StackNavigationProp<
  FlightStackParamList,
  'FlightBooking'
>;

const API_BASE = 'http://localhost:3000';

const FlightBookingScreen = () => {
  const route = useRoute<FlightBookingScreenRouteProp>();
  const navigation = useNavigation<FlightBookingScreenNavigationProp>();
  const {flight} = route.params;

  // Default Passenger Data
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Smith');
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('2000-01-01');
  const [email, setEmail] = useState('johnsmith@email.com');
  const [phone, setPhone] = useState('+4407770000001');

  // Default Passport Information
  const [passportDocumentNumber, setPassportDocumentNumber] =
    useState('1543343434');
  const [passportIssueCountry, setPassportIssueCountry] = useState('GB');
  const [passportNationality, setPassportNationality] = useState('GB');
  const [passportExpirationDate, setPassportExpirationDate] =
    useState('2025-02-03');
  const [passportIssueDate, setPassportIssueDate] = useState('2025-02-03');

  // Default Residential Address
  const [addressLine1, setAddressLine1] = useState('Street Name 7');
  const [addressCountryCode, setAddressCountryCode] = useState('GB');
  const [addressPostalCode, setAddressPostalCode] = useState('12345');
  const [addressCity, setAddressCity] = useState('London');

  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const fields = [
      {value: firstName, name: 'First Name'},
      {value: lastName, name: 'Last Name'},
      {value: gender, name: 'Gender'},
      {value: dateOfBirth, name: 'Date of Birth (YYYY-MM-DD)'},
      {value: email, name: 'Email'},
      {value: phone, name: 'Phone Number'},
      {value: passportDocumentNumber, name: 'Passport Document Number'},
      {
        value: passportIssueCountry,
        name: 'Passport Issue Country (2-letter code)',
      },
      {
        value: passportNationality,
        name: 'Passport Nationality (2-letter code)',
      },
      {
        value: passportExpirationDate,
        name: 'Passport Expiration Date (YYYY-MM-DD)',
      },
      {value: passportIssueDate, name: 'Passport Issue Date (YYYY-MM-DD)'},
      {value: addressLine1, name: 'Address Line 1'},
      {value: addressCountryCode, name: 'Address Country Code (2-letter code)'},
      {value: addressPostalCode, name: 'Address Postal Code'},
      {value: addressCity, name: 'Address City'},
    ];

    for (const field of fields) {
      if (!field.value.trim()) {
        Alert.alert('Validation Error', `Please fill in ${field.name}.`);
        return false;
      }
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (
      !dateRegex.test(dateOfBirth) ||
      !dateRegex.test(passportExpirationDate) ||
      !dateRegex.test(passportIssueDate)
    ) {
      Alert.alert(
        'Validation Error',
        'Please ensure all dates are in YYYY-MM-DD format.',
      );
      return false;
    }
    return true;
  };

  const handleConfirmBooking = async () => {
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    const bookingPayload = {
      offerId: flight.id,
      passengers: [
        {
          dateOfBirth: dateOfBirth,
          firstName: firstName,
          lastName: lastName,
          gender: gender.toLowerCase(),
          email,
          phoneNumber: phone,
          passportInformation: {
            documentNumber: passportDocumentNumber,
            issueCountry: passportIssueCountry.toUpperCase(),
            nationality: passportNationality.toUpperCase(),
            expirationDate: passportExpirationDate,
            issueDate: passportIssueDate,
          },
          residentialAddress: {
            addressLines: [addressLine1],
            countryCode: addressCountryCode.toUpperCase(),
            postalCode: addressPostalCode,
            city: addressCity,
          },
        },
      ],
    };

    try {
      const resp = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      const text = await resp.text();
      if (!resp.ok) {
        throw new Error(`Booking failed: ${resp.status} – ${text}`);
      }

      const data = JSON.parse(text);
      navigation.navigate('FlightBookingHoldScreen', {
        bookingId: data.id,
        flightDetails: flight,
        passengerName: `${firstName} ${lastName}`,
        bookingStatus: data.status || 'pending',
        bookingPrice: data.price?.amount
          ? `${data.price.currency} ${data.price.amount}`
          : flight.price,
      });
    } catch (err: any) {
      console.error('Booking error:', err);
      Alert.alert('Booking Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={screenStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={screenStyles.loadingText}>Processing booking...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={screenStyles.scrollViewOuter} // Changed from screenStyles.scrollContainer
      contentContainerStyle={screenStyles.contentContainer}
      keyboardShouldPersistTaps="handled">
      <View style={cardStyles.container}>
        <Text style={cardStyles.title}>
          {flight.airline}: {flight.from} to {flight.to}
        </Text>
        <Text style={cardStyles.text}>Departure: {flight.departureTime}</Text>
        <Text style={cardStyles.text}>Arrival: {flight.arrivalTime}</Text>
        <Text style={cardStyles.text}>
          Duration: {flight.duration} ({flight.stops})
        </Text>
        <Text style={cardStyles.price}>Price: {flight.price}</Text>
      </View>

      <Text style={formStyles.label}>First Name:</Text>
      <TextInput
        style={formStyles.input}
        placeholder="John"
        value={firstName}
        onChangeText={setFirstName}
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>Last Name:</Text>
      <TextInput
        style={formStyles.input}
        placeholder="Smith"
        value={lastName}
        onChangeText={setLastName}
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>Gender:</Text>
      <TextInput
        style={formStyles.input}
        placeholder="male / female / other"
        value={gender}
        onChangeText={setGender}
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>Date of Birth (YYYY-MM-DD):</Text>
      <TextInput
        style={formStyles.input}
        placeholder="2000-01-01"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>Email Address:</Text>
      <TextInput
        style={formStyles.input}
        placeholder="john.smith@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>Phone Number (e.g. +4407770000001):</Text>
      <TextInput
        style={formStyles.input}
        placeholder="+4407770000001"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholderTextColor={colors.placeholderText}
      />

      <Text style={styles.sectionTitle}>Passport Information</Text>
      <Text style={formStyles.label}>Document Number:</Text>
      <TextInput
        style={formStyles.input}
        placeholder="123456789"
        value={passportDocumentNumber}
        onChangeText={setPassportDocumentNumber}
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>Issue Country (e.g., GB):</Text>
      <TextInput
        style={formStyles.input}
        placeholder="GB"
        value={passportIssueCountry}
        onChangeText={setPassportIssueCountry}
        maxLength={2}
        autoCapitalize="characters"
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>Nationality (e.g., GB):</Text>
      <TextInput
        style={formStyles.input}
        placeholder="GB"
        value={passportNationality}
        onChangeText={setPassportNationality}
        maxLength={2}
        autoCapitalize="characters"
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>Expiration Date (YYYY-MM-DD):</Text>
      <TextInput
        style={formStyles.input}
        placeholder="2030-01-01"
        value={passportExpirationDate}
        onChangeText={setPassportExpirationDate}
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>Issue Date (YYYY-MM-DD):</Text>
      <TextInput
        style={formStyles.input}
        placeholder="2020-01-01"
        value={passportIssueDate}
        onChangeText={setPassportIssueDate}
        placeholderTextColor={colors.placeholderText}
      />

      <Text style={styles.sectionTitle}>Residential Address</Text>
      <Text style={formStyles.label}>Address Line 1:</Text>
      <TextInput
        style={formStyles.input}
        placeholder="123 Main Street"
        value={addressLine1}
        onChangeText={setAddressLine1}
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>Country Code (e.g., GB):</Text>
      <TextInput
        style={formStyles.input}
        placeholder="GB"
        value={addressCountryCode}
        onChangeText={setAddressCountryCode}
        maxLength={2}
        autoCapitalize="characters"
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>Postal Code:</Text>
      <TextInput
        style={formStyles.input}
        placeholder="SW1A 1AA"
        value={addressPostalCode}
        onChangeText={setAddressPostalCode}
        placeholderTextColor={colors.placeholderText}
      />
      <Text style={formStyles.label}>City:</Text>
      <TextInput
        style={formStyles.input}
        placeholder="London"
        value={addressCity}
        onChangeText={setAddressCity}
        placeholderTextColor={colors.placeholderText}
      />

      <TouchableOpacity
        style={buttonStyles.primary}
        onPress={handleConfirmBooking}
        disabled={isLoading}>
        <Text style={buttonStyles.primaryText}>Place Booking</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = {
  sectionTitle: {
    ...formStyles.label,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    width: '90%',
    textAlign: 'left',
    color: colors.textDark,
  },
};

export default FlightBookingScreen;
