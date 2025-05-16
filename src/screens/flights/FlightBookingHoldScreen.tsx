import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {FlightStackParamList} from '../../navigation/types'; // Adjust path
import {Flight} from '../../types'; // Adjust path
import {
  screenStyles,
  buttonStyles,
  cardStyles,
  colors,
  formStyles, // If needed for any layout
} from '../../styles/commonStyles'; // Adjust path

type BookingHoldScreenRouteProp = RouteProp<
  FlightStackParamList,
  'FlightBookingHoldScreen'
>;
type BookingHoldScreenNavigationProp = StackNavigationProp<
  FlightStackParamList,
  'FlightBookingHoldScreen'
>;

const API_BASE_URL = 'https://content-api.sandbox.junction.dev';
const API_KEY = 'jk_live_01j8r3grxbeve8ta0h1t5qbrvx'; // Ensure this is correct

const FlightBookingHoldScreen = () => {
  const route = useRoute<BookingHoldScreenRouteProp>();
  const navigation = useNavigation<BookingHoldScreenNavigationProp>();
  const {bookingId, flightDetails, passengerName, bookingStatus, bookingPrice} = route.params;

  const [isLoading, setIsLoading] = useState(false);

  const handleActualConfirmBooking = async () => {
    setIsLoading(true);

    // OPTION A: Attempt with a default/minimal fulfillment choice
    // This assumes 'electronic-ticket' for the first segment.
    // This is a GUESS and might need to be adjusted based on what the API
    // actually returns if you were to fetch fulfillmentInformation first.
    const confirmationPayload = {
      fulfillmentChoices: [
        {
          deliveryOption: 'electronic-ticket', // Common default
          segmentSequence: 1, // Assuming at least one segment
        },
        // If there are more segments, you'd need to add them.
        // This part is highly dependent on the actual structure of fulfillmentInformation
        // which we currently don't have when calling this.
      ],
    };
    // If API allows empty fulfillmentChoices or has defaults, you could try:
    // const confirmationPayload = { fulfillmentChoices: [] };
    // OR even just an empty object if the API documentation suggests it:
    // const confirmationPayload = {};


    try {
      console.log(`Confirming booking ID: ${bookingId} with payload:`, JSON.stringify(confirmationPayload, null, 2));
      const confirmBookingResponse = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/confirm`,
        {
          method: 'POST',
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(confirmationPayload),
        },
      );

      const confirmBookingDataText = await confirmBookingResponse.text();
      console.log('Actual Confirm booking response text:', confirmBookingDataText);

      if (!confirmBookingResponse.ok) {
        Alert.alert(
          'Booking Confirmation Failed',
          `Error ${confirmBookingResponse.status}: ${confirmBookingDataText || 'Unknown error'}`,
        );
        setIsLoading(false);
        return;
      }

      const confirmBookingData = JSON.parse(confirmBookingDataText);
      console.log('Booking actually confirmed successfully:', confirmBookingData);

      navigation.navigate('BookingSuccess', {
        message: 'Flight Booking Confirmed!',
        bookedItemName: `${flightDetails.airline} - ${flightDetails.from} to ${flightDetails.to}`,
        details: [
          `Booking ID: ${bookingId}`,
          `Final Status: ${confirmBookingData.paymentStatus || bookingStatus || 'Confirmed'}`, // Use paymentStatus if available
          `Passenger: ${passengerName}`,
          `Price: ${bookingPrice}`,
          // Add more details from confirmBookingData if useful
        ],
      });
    } catch (error: any) {
      console.error('Actual booking confirmation error:', error);
      Alert.alert('Confirmation Error', error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={screenStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={screenStyles.loadingText}>Confirming booking...</Text>
      </View>
    );
  }

  return (
    <ScrollView
    style={screenStyles.scrollViewOuter} // Changed from screenStyles.scrollContainer
    contentContainerStyle={screenStyles.contentContainer}>
      <Text style={screenStyles.title}>Booking on Hold</Text>

      <View style={cardStyles.container}>
        <Text style={styles.detailItem}>Booking ID: {bookingId}</Text>
        <Text style={styles.detailItem}>Status: {bookingStatus}</Text>
      </View>

      <View style={cardStyles.container}>
        <Text style={cardStyles.title}>
          Flight: {flightDetails.airline}: {flightDetails.from} to {flightDetails.to}
        </Text>
        <Text style={cardStyles.text}>Passenger: {passengerName}</Text>
        <Text style={cardStyles.price}>Total Price: {bookingPrice}</Text>
      </View>
      
      <Text style={styles.infoText}>
        Your booking has been placed and is currently on hold. Please confirm to finalize your booking.
      </Text>

      <TouchableOpacity
        style={buttonStyles.primary}
        onPress={handleActualConfirmBooking}
        disabled={isLoading}>
        <Text style={buttonStyles.primaryText}>Confirm Final Booking</Text>
      </TouchableOpacity>
       <TouchableOpacity
        style={[buttonStyles.primary, styles.cancelButton]} // Example for a cancel button
        onPress={() => navigation.popToTop()} // Or navigate to search
        disabled={isLoading}>
        <Text style={buttonStyles.primaryText}>Cancel / New Search</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    detailItem: {
        ...cardStyles.text, // Base on existing card text style
        fontSize: 16,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 15,
        color: colors.white,
        textAlign: 'center',
        marginVertical: 20,
        paddingHorizontal: 10,
    },
    cancelButton: { // Example style for a cancel button
        backgroundColor: colors.textMedium, // A different color
        marginTop: 10,
    }
});

export default FlightBookingHoldScreen;