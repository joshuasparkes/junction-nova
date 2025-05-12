import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {FlightStackParamList} from '../../navigation/types'; // Can use any StackParamList that includes BookingSuccess

type BookingSuccessScreenRouteProp = RouteProp<
  FlightStackParamList,
  'BookingSuccess'
>; // Using Flight's, but structure is same
type BookingSuccessScreenNavigationProp = StackNavigationProp<
  FlightStackParamList,
  'BookingSuccess'
>;

const BookingSuccessScreen = () => {
  const route = useRoute<BookingSuccessScreenRouteProp>();
  const navigation = useNavigation<BookingSuccessScreenNavigationProp>();
  const {message, bookedItemName, details} = route.params;

  return (
    <ScrollView
      style={styles.screenScrollContainer}
      contentContainerStyle={styles.screenContainer}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.screenTitle}>{message}</Text>

      <View style={styles.detailsCard}>
        <Text style={styles.detailItemName}>{bookedItemName}</Text>
        {details?.map((detail, index) => (
          <Text key={index} style={styles.detailText}>
            {detail}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.popToTop()} // Go back to the top of the current stack (e.g., FlightSearchScreen)
      >
        <Text style={styles.primaryButtonText}>Done</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          // This is a bit tricky as we don't know which tab's stack we are in
          // For a better UX, you might pass the tab name or use a global navigation reset
          // For now, we go to the top of the stack and the user can switch tabs
          navigation.popToTop();
          // Consider how to navigate to the initial screen of a *different* tab if needed
          // navigation.getParent()?.navigate('FlightsTab'); // Example if your tabs are named FlightsTab etc.
        }}>
        <Text style={styles.secondaryButtonText}>Book Another Service</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenScrollContainer: {flex: 1, backgroundColor: '#022E79'},
  screenContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 25,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    marginBottom: 30,
    width: '95%',
    alignItems: 'flex-start',
  },
  detailItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: '#444444',
    marginBottom: 5,
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
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#FFA500',
    borderWidth: 2,
    paddingVertical: 12, // Adjusted padding
    paddingHorizontal: 35,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    width: '90%',
  },
  secondaryButtonText: {
    color: '#FFA500',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BookingSuccessScreen;
