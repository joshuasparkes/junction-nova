import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {TrainStackParamList} from '../../navigation/types';
import {
  Train,
  PassengerInput,
  PassportInput,
  AddressInput,
  CreateTrainBookingApiResponse,
} from '../../types';
import {
  screenStyles,
  formStyles,
  buttonStyles,
  cardStyles,
  colors,
} from '../../styles/commonStyles';

type TrainBookingScreenRouteProp = RouteProp<
  TrainStackParamList,
  'TrainBooking'
>;
type TrainBookingScreenNavigationProp = StackNavigationProp<
  TrainStackParamList,
  'TrainBooking'
>;

const API_BASE_URL = 'https://content-api.sandbox.junction.dev';
const API_KEY = 'jk_live_01j8r3grxbeve8ta0h1t5qbrvx';

const createDefaultPassenger = (
  index: number,
  searchPassengerDOB: string,
): PassengerInput => {
  const isFirstPassenger = index === 0;

  return {
    dateOfBirth: isFirstPassenger ? searchPassengerDOB : '1996-02-01',
    firstName: isFirstPassenger ? 'John' : `Johnny${index}`,
    lastName: 'Smith',
    gender: 'male',
    email: isFirstPassenger
      ? 'johnsmith01@email.com'
      : `johnsmithy${index}@email.com`,
    phoneNumber: isFirstPassenger ? '+4407770000001' : null,
    passportInformation: {
      documentNumber: isFirstPassenger ? '1543343434' : `154334343${3 + index}`,
      issueCountry: 'GB',
      nationality: 'GB',
      expirationDate: '2025-02-03',
      issueDate: '2025-02-03',
    },
    residentialAddress: {
      addressLines: ['Street Name 7'],
      countryCode: 'GB',
      postalCode: '12345',
      city: 'London',
    },
  };
};

const TrainBookingScreen = () => {
  const route = useRoute<TrainBookingScreenRouteProp>();
  const navigation = useNavigation<TrainBookingScreenNavigationProp>();
  const {train} = route.params;

  const [passengers, setPassengers] = useState<PassengerInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const passengerDOBsFromSearch = train.passengerDOBs; // Hypothetical prop

    if (train && train.passengerCount > 0) {
      const initialPassengers = Array.from(
        {length: train.passengerCount},
        (_, i) =>
          createDefaultPassenger(
            i,
            passengerDOBsFromSearch?.[i] || '1995-02-01',
          ), // Fallback DOB
      );
      setPassengers(initialPassengers);
    } else {
      setPassengers([
        createDefaultPassenger(0, passengerDOBsFromSearch?.[0] || '1995-02-01'),
      ]);
    }
  }, [train]);

  const handlePassengerInputChange = (
    passengerIndex: number,
    field: keyof PassengerInput,
    value: any,
    nestedField?: keyof PassportInput | keyof AddressInput,
    subNestedField?: keyof AddressInput['addressLines'], // Currently only for addressLines[0]
  ) => {
    setPassengers(prevPassengers => {
      const updatedPassengers = [...prevPassengers];
      // Deep copy the specific passenger object to avoid direct state mutation
      const passengerToUpdate = JSON.parse(
        JSON.stringify(updatedPassengers[passengerIndex]),
      );

      if (field === 'passportInformation' && nestedField) {
        (passengerToUpdate.passportInformation as any)[nestedField] = value;
      } else if (field === 'residentialAddress' && nestedField) {
        if (
          nestedField === 'addressLines' &&
          typeof subNestedField === 'number'
        ) {
          // This example assumes only the first address line is being edited.
          // For multiple address lines, this logic would need to expand.
          (passengerToUpdate.residentialAddress.addressLines as string[])[0] =
            value;
        } else {
          (passengerToUpdate.residentialAddress as any)[nestedField] = value;
        }
      } else {
        (passengerToUpdate as any)[field] = value;
      }
      updatedPassengers[passengerIndex] = passengerToUpdate;
      return updatedPassengers;
    });
  };

  const validateForms = () => {
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (
        !p.firstName ||
        !p.lastName ||
        !p.gender ||
        !p.dateOfBirth ||
        !p.email
      ) {
        Alert.alert(
          'Validation Error',
          `Please fill in all basic details for Passenger ${i + 1}.`,
        );
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(p.email)) {
        Alert.alert(
          'Validation Error',
          `Invalid email for Passenger ${i + 1}.`,
        );
        return false;
      }
      // Add more specific passport/address validation if needed
    }
    return true;
  };

  const handlePlaceBooking = async () => {
    if (!train || !train.id) {
      Alert.alert('Error', 'Train offer ID is missing.');
      return;
    }

    // Check for offer expiration
    if (train.expiresAt) {
      const expiryDate = new Date(train.expiresAt);
      if (expiryDate < new Date()) {
        Alert.alert(
          'Offer Expired',
          'This train offer has expired. Please search again.',
        );
        setIsLoading(false);
        return;
      }
    }

    if (!validateForms()) {
      return;
    }
    setIsLoading(true);

    const bookingPayload = {
      offerId: train.id,
      passengers: passengers.map(p => ({
        dateOfBirth: p.dateOfBirth,
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.gender.toLowerCase(),
        email: p.email,
        phoneNumber: p.phoneNumber,
        passportInformation: {
          documentNumber: p.passportInformation.documentNumber,
          issueCountry: p.passportInformation.issueCountry.toUpperCase(),
          nationality: p.passportInformation.nationality.toUpperCase(),
          expirationDate: p.passportInformation.expirationDate,
          issueDate: p.passportInformation.issueDate,
        },
        residentialAddress: {
          addressLines: p.residentialAddress.addressLines,
          countryCode: p.residentialAddress.countryCode.toUpperCase(),
          postalCode: p.residentialAddress.postalCode,
          city: p.residentialAddress.city,
        },
      })),
    };

    try {
      console.log(
        'Creating Train Booking with payload:',
        JSON.stringify(bookingPayload, null, 2),
      );
      const requestUrl = `${API_BASE_URL}/bookings`;
      const requestOptions = {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      };

      console.log('Request URL:', requestUrl);
      console.log('Request Method:', requestOptions.method);
      console.log(
        'Request Headers:',
        JSON.stringify(requestOptions.headers, null, 2),
      );
      // The body is already logged by the existing 'Creating Train Booking with payload' log.
      // If you want to log it again here, uncomment the next line:
      // console.log('Request Body:', requestOptions.body);

      const response = await fetch(requestUrl, requestOptions);

      const responseText = await response.text();
      console.log('Create Train Booking response text:', responseText);

      if (!response.ok) {
        Alert.alert(
          'Booking Creation Failed',
          `Error ${response.status}: ${
            responseText || 'Unknown error. Check console for details.'
          }`,
        );
        setIsLoading(false);
        return;
      }

      const responseData: CreateTrainBookingApiResponse =
        JSON.parse(responseText);

      if (
        !responseData.booking ||
        !responseData.booking.id ||
        !responseData.fulfillmentInformation
      ) {
        Alert.alert(
          'Booking Creation Error',
          'Invalid response from server. Missing booking ID or fulfillment info.',
        );
        setIsLoading(false);
        return;
      }

      console.log(
        'Train Booking created successfully. Booking ID:',
        responseData.booking.id,
      );

      navigation.navigate('TrainBookingHoldScreen', {
        bookingDetails: responseData.booking,
        fulfillmentInformation: responseData.fulfillmentInformation,
        trainOfferDetails: train,
      });
    } catch (error: any) {
      console.error('Train Booking process error:', error);
      Alert.alert(
        'Booking Error',
        error.message || 'An unexpected error occurred.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={screenStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={screenStyles.loadingText}>Placing Booking...</Text>
      </View>
    );
  }

  if (!train) {
    return (
      <View style={screenStyles.loadingContainer}>
        <Text style={screenStyles.loadingText}>
          Error: Train data not found.
        </Text>
      </View>
    );
  }

  if (passengers.length === 0 && train.passengerCount > 0) {
    // Show loading if passengers haven't been initialized yet by useEffect
    return (
      <View style={screenStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={screenStyles.loadingText}>Loading passenger forms...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={screenStyles.scrollViewOuter}
      contentContainerStyle={[
        screenStyles.contentContainer,
        styles.centeredContent,
      ]}
      keyboardShouldPersistTaps="handled">
      <Text style={screenStyles.title}>Book Train</Text>
      <View style={styles.offerDetailsCard}>
        <Text style={styles.offerTitle}>
          {train.operator}: {train.from} to {train.to}
        </Text>
        <Text style={styles.offerDetail}>
          Departure: {train.departureTime} - Arrival: {train.arrivalTime}
        </Text>
        <Text style={styles.offerDetail}>
          Duration: {train.duration} - Class: {train.class}
        </Text>
        <Text style={styles.offerPrice}>{train.price}</Text>
        <Text style={styles.offerDetail}>
          Passengers: {train.passengerCount}
        </Text>
      </View>

      {passengers.map((passenger, index) => (
        <View key={index} style={cardStyles.container}>
          <Text style={styles.passengerTitle}>Passenger {index + 1}</Text>

          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>First Name</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.firstName}
              onChangeText={text =>
                handlePassengerInputChange(index, 'firstName', text)
              }
              placeholder="John"
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Last Name</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.lastName}
              onChangeText={text =>
                handlePassengerInputChange(index, 'lastName', text)
              }
              placeholder="Smith"
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Gender</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.gender}
              onChangeText={text =>
                handlePassengerInputChange(index, 'gender', text)
              }
              placeholder="male / female / other"
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Date of Birth (YYYY-MM-DD)</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.dateOfBirth}
              onChangeText={text =>
                handlePassengerInputChange(index, 'dateOfBirth', text)
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Email</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.email}
              onChangeText={text =>
                handlePassengerInputChange(index, 'email', text)
              }
              placeholder="john.smith@example.com"
              keyboardType="email-address"
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Phone Number (Optional)</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.phoneNumber || ''}
              onChangeText={text =>
                handlePassengerInputChange(index, 'phoneNumber', text || null)
              }
              placeholder="+1234567890"
              keyboardType="phone-pad"
              placeholderTextColor={colors.placeholderText}
            />
          </View>

          <Text style={styles.subSectionTitle}>Passport Information</Text>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Document Number</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.passportInformation.documentNumber}
              onChangeText={text =>
                handlePassengerInputChange(
                  index,
                  'passportInformation',
                  text,
                  'documentNumber',
                )
              }
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Issue Country (e.g., GB)</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.passportInformation.issueCountry}
              onChangeText={text =>
                handlePassengerInputChange(
                  index,
                  'passportInformation',
                  text,
                  'issueCountry',
                )
              }
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Nationality (e.g., GB)</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.passportInformation.nationality}
              onChangeText={text =>
                handlePassengerInputChange(
                  index,
                  'passportInformation',
                  text,
                  'nationality',
                )
              }
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Expiration Date (YYYY-MM-DD)</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.passportInformation.expirationDate}
              onChangeText={text =>
                handlePassengerInputChange(
                  index,
                  'passportInformation',
                  text,
                  'expirationDate',
                )
              }
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Issue Date (YYYY-MM-DD)</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.passportInformation.issueDate}
              onChangeText={text =>
                handlePassengerInputChange(
                  index,
                  'passportInformation',
                  text,
                  'issueDate',
                )
              }
              placeholderTextColor={colors.placeholderText}
            />
          </View>

          <Text style={styles.subSectionTitle}>Residential Address</Text>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Address Line 1</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.residentialAddress.addressLines[0] || ''}
              onChangeText={text =>
                handlePassengerInputChange(
                  index,
                  'residentialAddress',
                  text,
                  'addressLines',
                  0,
                )
              }
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>City</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.residentialAddress.city}
              onChangeText={text =>
                handlePassengerInputChange(
                  index,
                  'residentialAddress',
                  text,
                  'city',
                )
              }
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Postal Code</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.residentialAddress.postalCode}
              onChangeText={text =>
                handlePassengerInputChange(
                  index,
                  'residentialAddress',
                  text,
                  'postalCode',
                )
              }
              placeholderTextColor={colors.placeholderText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={formStyles.label}>Country Code (e.g., GB)</Text>
            <TextInput
              style={formStyles.input}
              value={passenger.residentialAddress.countryCode}
              onChangeText={text =>
                handlePassengerInputChange(
                  index,
                  'residentialAddress',
                  text,
                  'countryCode',
                )
              }
              placeholderTextColor={colors.placeholderText}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={buttonStyles.primary}
        onPress={handlePlaceBooking}
        disabled={isLoading}>
        <Text style={buttonStyles.primaryText}>Place Booking</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centeredContent: {
    alignItems: 'center',
  },
  offerDetailsCard: {
    backgroundColor: colors.cardBackground || '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text || '#333333',
    marginBottom: 8,
  },
  offerDetail: {
    fontSize: 14,
    color: colors.textLight || '#555555',
    marginBottom: 4,
  },
  offerPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary || '#007AFF',
    marginTop: 8,
    textAlign: 'right',
  },
  passengerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text || '#333333',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#DDDDDD',
    width: '100%',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text || '#444444',
    marginTop: 15,
    marginBottom: 10,
    width: '100%',
  },
  inputGroup: {
    marginBottom: formStyles.input?.marginBottom || 10, // Use margin from commonStyles if available
    width: '100%',
  },
});

export default TrainBookingScreen;
