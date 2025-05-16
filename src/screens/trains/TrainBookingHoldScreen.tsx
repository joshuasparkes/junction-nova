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
import {TrainStackParamList} from '../../navigation/types';
import {TrainOffer, BookingDetails, FulfillmentInformation} from '../../types'; // Assuming these types exist in types.ts
import {
  screenStyles,
  buttonStyles,
  cardStyles,
  colors,
} from '../../styles/commonStyles';

type TrainBookingHoldScreenRouteProp = RouteProp<
  TrainStackParamList,
  'TrainBookingHoldScreen'
>;
type TrainBookingHoldScreenNavigationProp = StackNavigationProp<
  TrainStackParamList,
  'TrainBookingHoldScreen'
>;

const API_BASE_URL = 'https://content-api.sandbox.junction.dev';
const API_KEY = 'jk_live_01j8r3grxbeve8ta0h1t5qbrvx';

const TrainBookingHoldScreen = () => {
  const route = useRoute<TrainBookingHoldScreenRouteProp>();
  const navigation = useNavigation<TrainBookingHoldScreenNavigationProp>();
  const {bookingDetails, fulfillmentInformation, trainOfferDetails} =
    route.params;

  const [isLoading, setIsLoading] = useState(false);

  const handleActualConfirmBooking = async () => {
    setIsLoading(true);

    let confirmationPayload: {fulfillmentChoices: any[]} = {
      fulfillmentChoices: [],
    };

    if (
      fulfillmentInformation &&
      fulfillmentInformation.length > 0 &&
      fulfillmentInformation[0].fulfillmentOptions &&
      fulfillmentInformation[0].fulfillmentOptions.length > 0
    ) {
      confirmationPayload.fulfillmentChoices.push({
        deliveryOption:
          fulfillmentInformation[0].fulfillmentOptions[0].deliveryOption,
        segmentSequence: fulfillmentInformation[0].segmentSequence,
      });
    } else {
      // If no fulfillment info, or API allows empty, send empty.
      // Alternatively, show an error if fulfillment choice is mandatory.
      console.log(
        'No specific fulfillment options found, sending empty choices.',
      );
    }

    try {
      console.log(
        `Confirming booking ID: ${bookingDetails.id} with payload:`,
        JSON.stringify(confirmationPayload, null, 2),
      );
      const confirmBookingResponse = await fetch(
        `${API_BASE_URL}/bookings/${bookingDetails.id}/confirm`,
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
      console.log(
        'Actual Train Confirm booking response text:',
        confirmBookingDataText,
      );

      if (!confirmBookingResponse.ok) {
        Alert.alert(
          'Train Booking Confirmation Failed',
          `Error ${confirmBookingResponse.status}: ${
            confirmBookingDataText || 'Unknown error'
          }`,
        );
        setIsLoading(false);
        return;
      }

      const confirmBookingData = JSON.parse(confirmBookingDataText);
      console.log(
        'Train Booking actually confirmed successfully:',
        confirmBookingData,
      );

      navigation.navigate('BookingSuccess', {
        message: 'Train Booking Confirmed!',
        bookedItemName: `${trainOfferDetails.operator}: ${trainOfferDetails.from} to ${trainOfferDetails.to}`,
        details: [
          `Booking ID: ${bookingDetails.id}`,
          `Final Status: ${
            confirmBookingData.status || bookingDetails.status || 'Confirmed'
          }`,
          `Price: ${bookingDetails.price.amount} ${bookingDetails.price.currency}`,
          // Add more details from confirmBookingData if useful
        ],
      });
    } catch (error: any) {
      console.error('Actual train booking confirmation error:', error);
      Alert.alert(
        'Confirmation Error',
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
        <Text style={screenStyles.loadingText}>Confirming booking...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={screenStyles.scrollViewOuter}
      contentContainerStyle={screenStyles.contentContainer}>
      <Text style={screenStyles.title}>Train Booking on Hold</Text>

      <View style={cardStyles.container}>
        <Text style={styles.detailItem}>Booking ID: {bookingDetails.id}</Text>
        <Text style={styles.detailItem}>Status: {bookingDetails.status}</Text>
      </View>

      <View style={cardStyles.container}>
        <Text style={cardStyles.title}>
          Train: {trainOfferDetails.operator}: {trainOfferDetails.from} to{' '}
          {trainOfferDetails.to}
        </Text>
        <Text style={cardStyles.text}>Class: {trainOfferDetails.class}</Text>
        <Text style={cardStyles.text}>
          Departure: {trainOfferDetails.departureTime} - Arrival:{' '}
          {trainOfferDetails.arrivalTime}
        </Text>
        <Text style={cardStyles.text}>
          Duration: {trainOfferDetails.duration}
        </Text>
        <Text style={cardStyles.price}>
          Total Price: {bookingDetails.price.amount}{' '}
          {bookingDetails.price.currency}
        </Text>
      </View>

      <Text style={styles.infoText}>
        Your booking has been placed and is currently on hold. Please confirm to
        finalize your booking.
      </Text>

      <TouchableOpacity
        style={buttonStyles.primary}
        onPress={handleActualConfirmBooking}
        disabled={isLoading}>
        <Text style={buttonStyles.primaryText}>Confirm Final Booking</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[buttonStyles.primary, styles.cancelButton]}
        onPress={() => navigation.popToTop()} // Or navigate to search
        disabled={isLoading}>
        <Text style={buttonStyles.primaryText}>Cancel / New Search</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  detailItem: {
    ...cardStyles.text,
    fontSize: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: 'white', // Assuming similar to flight screen's colors.white or equivalent
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  cancelButton: {
    backgroundColor: colors.white, // Use a secondary button color
    marginTop: 10,
  },
});

export default TrainBookingHoldScreen;
